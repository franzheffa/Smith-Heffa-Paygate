import { duffelFetch, requireDuffelConfig } from '../../../../lib/duffel';
import { handleMobileReadCors } from '../../../../lib/mobile-api';
import { calculateAirlinePricing } from '../../../../lib/airline-pricing';
import { requireFirebasePrincipal } from '../../../../lib/firebase-id-token';
import { deterministicOperationId, requireIdempotencyKey } from '../../../../lib/payment-domain';
import { paymentCapabilities } from '../../../../lib/payment-capabilities';
import { publicCheckout, saveQuotedCheckout } from '../../../../lib/mobile-checkout-store';
import { allowRequest } from '../../../../lib/rate-limit';

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
  if (!allowRequest(req, 'mobile-checkout-prepare', { limit: 20 })) return res.status(429).json({ ok: false, code: 'RATE_LIMITED' });
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
    const currency = String(offer.total_currency || '').toUpperCase();
    pricing = calculateAirlinePricing({
      providerFare: offer.total_amount,
      currency,
      ticketCount: Array.isArray(offer.passengers) ? offer.passengers.length : 1,
      paymentRail: preferredPaymentRail,
      fxRate: currency === 'USD' ? undefined : process.env[`FX_USD_TO_${currency}`],
      fxSource: process.env.FX_RATE_SOURCE,
      fxTimestamp: process.env.FX_RATE_TIMESTAMP,
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : 'PRICING_ERROR';
    return res.status(409).json({ ok: false, code, error: 'This offer cannot be priced safely for the selected currency.' });
  }

  const id = checkoutId({ offerId, rail: preferredPaymentRail, ownerUid: principal.uid, idempotencyKey });
  const stored = await saveQuotedCheckout({ id, ownerUid: principal.uid, offerId, rail: preferredPaymentRail, pricing, idempotencyKey });
  const railCapability = paymentCapabilities({ currency: pricing.currency, platform: req.body?.platform }).rails.find((item) => item.rail === preferredPaymentRail);

  return res.status(200).json({
    ok: true,
    checkoutId: stored.id,
    status: stored.state,
    paymentExecution: railCapability?.available ? 'AUTHORIZED' : 'DISABLED',
    bookingExecution: 'AWAITING_PAYMENT_CONFIRMATION',
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
    capability: railCapability || null,
    activity: publicCheckout(stored),
    clientAction: railCapability?.available ? 'CONFIRM_PAYMENT_METHOD' : 'PROVIDER_UNAVAILABLE',
  });
}
