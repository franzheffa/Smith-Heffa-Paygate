import { handleMobileReadCors } from '../../../lib/mobile-api';
import { paymentCapabilities } from '../../../lib/payment-capabilities';

export default function handler(req, res) {
  if (handleMobileReadCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const payload = paymentCapabilities({
    country: req.query.country,
    currency: req.query.currency,
    platform: req.query.platform,
    productType: req.query.productType,
    deviceCapable: req.query.deviceCapable === 'true'
      ? true
      : req.query.deviceCapable === 'false'
        ? false
        : null,
  });
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ ok: true, ...payload });
}
