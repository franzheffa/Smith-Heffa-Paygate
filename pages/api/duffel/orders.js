import crypto from 'crypto';
import { prisma } from '../../../lib/prisma';
import { getSessionToken, sha256 } from '../../../lib/auth';
import { duffelEnvironment, duffelFetch, duffelLiveBookingEnabled, requireDuffelConfig } from '../../../lib/duffel';

function bookingError(res, status, code, message, extra = {}) {
  return res.status(status).json({ ok: false, code, error: message, ...extra });
}

function stablePassengerSet(passengers) {
  return passengers.map((passenger) => ({
    id: String(passenger?.id || '').trim(),
    type: String(passenger?.type || '').trim(),
    given_name: String(passenger?.given_name || '').trim(),
    family_name: String(passenger?.family_name || '').trim(),
    born_on: String(passenger?.born_on || '').trim(),
    gender: String(passenger?.gender || '').trim(),
  }));
}

function validPassengers(passengers) {
  return passengers.length > 0
    && passengers.length <= 9
    && passengers.every((passenger) => (
      passenger.id
      && passenger.type === 'adult'
      && passenger.given_name
      && passenger.family_name
      && /^\d{4}-\d{2}-\d{2}$/.test(passenger.born_on)
      && ['m', 'f'].includes(passenger.gender)
    ));
}

async function getAuthenticatedUser(req) {
  const token = getSessionToken(req);
  if (!token) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: sha256(token) },
    include: { account: true },
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) return null;
  return session.account.userId;
}

function bookingAttemptId({ userId, offerId, amount, currency, attemptScope, mode }) {
  const material = {
    // Keep the original test key stable so a deployment cannot duplicate an old test hold.
    scope: mode === 'test' ? 'DUFFEL_TEST_HOLD_V1' : 'DUFFEL_LIVE_HOLD_V1',
    userId,
    offerId,
    amount,
    currency,
    attemptScope,
  };
  if (mode === 'live') material.mode = mode;
  return crypto.createHash('sha256').update(JSON.stringify(material)).digest('hex');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const config = requireDuffelConfig();
  if (!config.ready) {
    return res.status(503).json({ ok: false, error: 'Duffel not configured', missing: config.missing });
  }

  const mode = duffelEnvironment();
  if (mode !== 'test' && mode !== 'live') {
    return bookingError(res, 409, 'DUFFEL_MODE_INVALID', 'Flight order creation requires an explicit Duffel mode.');
  }
  if (mode === 'live' && !duffelLiveBookingEnabled()) {
    return bookingError(res, 409, 'LIVE_BOOKING_DISABLED', 'Live flight booking is disabled by the server kill switch.');
  }
  const actionPrefix = mode === 'test' ? 'DUFFEL_TEST_BOOKING' : 'DUFFEL_LIVE_HOLD_BOOKING';
  const processingAction = `${actionPrefix}_PROCESSING`;
  const failedAction = `${actionPrefix}_FAILED`;
  const createdAction = `${actionPrefix}_CREATED`;

  const userId = await getAuthenticatedUser(req);
  if (!userId) {
    return bookingError(res, 401, 'AUTHENTICATION_REQUIRED', 'Sign in before preparing a flight booking.');
  }

  const body = req.body || {};
  const selectedOfferId = String(body.selected_offer_id || '').trim();
  const passengers = stablePassengerSet(Array.isArray(body.passengers) ? body.passengers : []);
  const expectedAmount = String(body.expected_amount || '').trim();
  const expectedCurrency = String(body.expected_currency || '').trim().toUpperCase();
  const paygateCheckoutId = String(body.paygate_checkout_id || '').trim();
  const confirmed = body.confirm_hold_booking === true || body.confirm_test_booking === true;

  if (!selectedOfferId) {
    return bookingError(res, 400, 'OFFER_NO_LONGER_AVAILABLE', 'Select a flight offer before continuing.');
  }

  if (!validPassengers(passengers)) {
    return bookingError(res, 400, 'PASSENGER_VALIDATION_FAILED', 'Each adult passenger needs a name, date of birth, and gender.');
  }

  if (!paygateCheckoutId) {
    return bookingError(res, 409, 'PAYMENT_NOT_READY', 'Prepare a Smith-Heffa checkout intent before confirming a test booking.');
  }

  if (!confirmed) {
    return bookingError(res, 409, 'BOOKING_CONFIRMATION_REQUIRED', 'Explicit confirmation is required before creating a hold order.');
  }

  const offerResponse = await duffelFetch(`/air/offers/${encodeURIComponent(selectedOfferId)}`, {
    reqHeaders: req.headers,
  });

  if (!offerResponse.ok || !offerResponse.data?.data) {
    return bookingError(res, 409, 'OFFER_NO_LONGER_AVAILABLE', 'This flight offer is no longer available. Search again.');
  }

  const offer = offerResponse.data.data;
  if (String(offer.id || '').trim() !== selectedOfferId) {
    return bookingError(res, 409, 'OFFER_ID_MISMATCH', 'The returned flight offer does not match the selected offer. Search again.');
  }

  const expiresAt = new Date(offer.expires_at);
  if (!offer.expires_at || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return bookingError(res, 409, 'OFFER_EXPIRED', 'This flight offer has expired. Search again.');
  }

  const latestAmount = String(offer.total_amount || '').trim();
  const latestCurrency = String(offer.total_currency || '').trim().toUpperCase();
  if (!latestAmount || !latestCurrency || latestCurrency !== expectedCurrency) {
    return bookingError(res, 409, 'CURRENCY_CHANGED', 'Flight currency has changed. Please review the updated fare before confirming.', {
      offer: { id: offer.id, total_amount: latestAmount, total_currency: latestCurrency, expires_at: offer.expires_at },
    });
  }
  if (latestAmount !== expectedAmount) {
    return bookingError(res, 409, 'PRICE_CHANGED', 'Flight price has changed. Please review the updated fare before confirming.', {
      offer: { id: offer.id, total_amount: latestAmount, total_currency: latestCurrency, expires_at: offer.expires_at },
    });
  }

  if (offer.payment_requirements?.requires_instant_payment !== false) {
    return bookingError(res, 409, 'PAYMENT_NOT_READY', 'This offer requires immediate payment and cannot be created through the current test-only hold flow.');
  }

  const attemptId = bookingAttemptId({
    userId,
    offerId: selectedOfferId,
    amount: latestAmount,
    currency: latestCurrency,
    attemptScope: paygateCheckoutId,
    mode,
  });

  try {
    await prisma.fdxAuditEvent.create({
      data: {
        id: attemptId,
        userId,
        category: 'TRAVEL',
        action: processingAction,
        actorType: 'CUSTOMER',
        resourceType: 'DUFFEL_OFFER',
        resourceId: selectedOfferId,
        requestId: attemptId,
        ipAddress: req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || null,
        userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
        payload: {
          amount: latestAmount,
          currency: latestCurrency,
          passengerCount: passengers.length,
          paygateCheckoutId,
          expiresAt: offer.expires_at,
        },
      },
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      // This conditional update is the durable compare-and-transition lock for failed retries.
      const retry = await prisma.fdxAuditEvent.updateMany({
        where: { id: attemptId, action: failedAction },
        data: { action: processingAction },
      }).catch(() => null);

      if (retry?.count !== 1) {
        const previousAttempt = await prisma.fdxAuditEvent.findUnique({ where: { id: attemptId } }).catch(() => null);
        const code = previousAttempt?.action === createdAction
          ? 'BOOKING_ALREADY_CREATED'
          : 'BOOKING_ALREADY_PROCESSING';
        return bookingError(res, 409, code, 'This booking attempt has already been processed. Start a new search before retrying.');
      }
    }
    if (error?.code !== 'P2002') {
      return bookingError(res, 503, 'UNKNOWN_PROVIDER_ERROR', 'Booking protection is temporarily unavailable. Please try again.');
    }
  }

  const payload = {
    data: {
      type: 'hold',
      selected_offers: [selectedOfferId],
      passengers,
      client_reference: `shp-${attemptId.slice(0, 32)}`,
      metadata: { paygate_checkout_id: paygateCheckoutId },
    },
  };

  try {
    const response = await duffelFetch('/air/orders', {
      method: 'POST',
      body: payload,
      reqHeaders: req.headers,
    });

    if (!response.ok) {
      await prisma.fdxAuditEvent.update({
        where: { id: attemptId },
        data: { action: failedAction },
      });
      return bookingError(res, response.status, 'DUFFEL_ORDER_FAILED', 'Duffel could not create this test hold order. Search again.');
    }

    const order = response.data?.data || {};
    await prisma.fdxAuditEvent.update({
      where: { id: attemptId },
      data: {
        action: createdAction,
        resourceType: 'DUFFEL_ORDER',
        resourceId: String(order.id || selectedOfferId),
        payload: {
          amount: latestAmount,
          currency: latestCurrency,
          passengerCount: passengers.length,
          paygateCheckoutId,
          orderId: String(order.id || ''),
          bookingReference: String(order.booking_reference || ''),
          liveMode: Boolean(order.live_mode),
        },
      },
    });

    return res.status(response.status).json({
      ok: true,
      bookingType: `${mode}_hold_order`,
      requestedOrderType: 'hold',
      order: {
        id: order.id || null,
        booking_reference: order.booking_reference || null,
        payment_status: order.payment_status || null,
        live_mode: order.live_mode ?? null,
        itinerary: offer.slices?.map((slice) => ({
          origin: slice.origin?.iata_code || null,
          destination: slice.destination?.iata_code || null,
          duration: slice.duration || null,
        })) || [],
      },
    });
  } catch (error) {
    await prisma.fdxAuditEvent.update({
      where: { id: attemptId },
      data: { action: failedAction },
    }).catch(() => null);
    return bookingError(res, 502, 'UNKNOWN_PROVIDER_ERROR', 'Duffel booking validation failed. Please search again.');
  }
}
