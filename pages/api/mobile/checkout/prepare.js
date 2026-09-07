import { duffelFetch, requireDuffelConfig } from '../../../../lib/duffel';
import { handleMobileReadCors } from '../../../../lib/mobile-api';
import { calculateAirlinePricing } from '../../../../lib/airline-pricing';
import { requireFirebasePrincipal } from '../../../../lib/firebase-id-token';
import { deterministicOperationId, requireIdempotencyKey } from '../../../../lib/payment-domain';

function checkoutId({ offerId, rail, ownerUid, idempotencyKey }) {
  return deterministicOperationId({
    namespace: 'mobile-readonly-v2',
    ownerUid,
    resourceId: offerId,
    rail,
    idempotencyKey,
  });
}

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res, 'POST')) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const principal = await requireFirebasePrincipal(req, res);
  if (!principal) return;
  let idempotencyKey;
  try {
    idempotencyKey = requireIdempotencyKey(req.headers['idempotency-key']);
  } catch {
    return res.status(400).json({ ok: false, code: 'INVALID_IDEMPOTENCY_KEY', error: 'A valid idempotency key is required.' });
  }

  const config = requireDuffelConfig();
  if (!config.ready) return res.status(503).json({ ok: false, error: 'Duffel not configured', missing: config.missing });

  const offerId = String(req.body?.offerId || '').trim();
  const preferredPaymentRail = String(req.body?.preferredPaymentRail || '').trim();
  if (!offerId || !preferredPaymentRail) return res.status(400).json({ ok: false, code: 'VALIDATION_ERROR', error: 'Offer and payment rail are required.' });

  const response = await duffelFetch(`/air/offers/${encodeURIComponent(offerId)}`, { reqHeaders: req.headers });
  const offer = response.data?.data;
  if (!response.ok || !offer) return res.status(409).json({ ok: false, code: 'OFFER_NO_LONGER_AVAILABLE', error: 'This offer is no longer available. Search again.' });

  const expiresAt = new Date(offer.expires_at);
  if (!offer.expires_at || Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
    return res.status(409).json({ ok: false, code: 'OFFER_EXPIRED', error: 'This offer has expired. Search again.' });
  }

  let pricing;
  try {
    pricing = calculateAirlinePricing({
      providerFare: offer.total_amount,
      currency: offer.total_currency,
      ticketCount: Array.isArray(offer.passengers) ? offer.passengers.length : 1,
      paymentRail: preferredPaymentRail,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PRICING_ERROR';
    return res.status(409).json({ ok: false, code, error: 'This offer cannot be priced safely for the selected currency.' });
  }

  return res.status(200).json({
    ok: true,
    checkoutId: checkoutId({ offerId, rail: preferredPaymentRail, ownerUid: principal.uid, idempotencyKey }),
    status: 'CHECKOUT_CREATED',
    paymentExecution: 'DISABLED',
    bookingExecution: 'DISABLED',
    rail: preferredPaymentRail,
    amount: pricing.total,
    currency: pricing.currency,
    expiresAt: offer.expires_at,
    pricing: {
      ...pricing,
      offerId,
      offerExpiresAt: offer.expires_at,
      createdAt: new Date().toISOString(),
      expiresAt: offer.expires_at,
    },
    clientAction: 'REVIEW_ONLY',
  });
}
