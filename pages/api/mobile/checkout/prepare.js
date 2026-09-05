import crypto from 'crypto';
import { duffelFetch, requireDuffelConfig } from '../../../../lib/duffel';
import { handleMobileReadCors } from '../../../../lib/mobile-api';

function checkoutId({ offerId, rail }) {
  return crypto.createHash('sha256').update(`mobile-readonly-v1:${offerId}:${rail}`).digest('hex').slice(0, 32);
}

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res, 'POST')) return;
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
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

  return res.status(200).json({
    ok: true,
    checkoutId: checkoutId({ offerId, rail: preferredPaymentRail }),
    status: 'CHECKOUT_CREATED',
    paymentExecution: 'DISABLED',
    bookingExecution: 'DISABLED',
    rail: preferredPaymentRail,
    amount: offer.total_amount,
    currency: offer.total_currency,
    expiresAt: offer.expires_at,
    clientAction: 'REVIEW_ONLY',
  });
}
