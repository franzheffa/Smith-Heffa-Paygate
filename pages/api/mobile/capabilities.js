import { requirePawapayConfig } from '../../../lib/pawapay';
import { handleMobileReadCors } from '../../../lib/mobile-api';

function configured(name) {
  return Boolean(String(process.env[name] || '').trim());
}

export default function handler(req, res) {
  if (handleMobileReadCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const stripe = configured('STRIPE_SECRET_KEY') && configured('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  const pawapay = requirePawapayConfig().ready;
  const rails = [
    { rail: 'Stripe', configured: stripe, available: false, status: stripe ? 'PARTIAL' : 'NOT_CONFIGURED', settlementType: 'provider_confirmation' },
    { rail: 'Apple Pay', configured: stripe, available: false, status: stripe ? 'PARTIAL' : 'NOT_CONFIGURED', requiresDeviceCapability: true, settlementType: 'provider_confirmation' },
    { rail: 'Pix', configured: stripe, available: false, status: stripe ? 'PARTIAL' : 'NOT_CONFIGURED', settlementType: 'asynchronous' },
    { rail: 'PayPal', configured: stripe, available: false, status: stripe ? 'PARTIAL' : 'NOT_CONFIGURED', requiresRedirect: true, settlementType: 'provider_confirmation' },
    { rail: 'PawaPay', configured: pawapay, available: false, status: pawapay ? 'PARTIAL' : 'NOT_CONFIGURED', requiresMobileNumber: true, settlementType: 'asynchronous' },
    { rail: 'Orange Money', configured: pawapay, available: false, status: pawapay ? 'PARTIAL' : 'NOT_CONFIGURED', requiresMobileNumber: true, settlementType: 'asynchronous' },
    { rail: 'MTN Mobile Money', configured: pawapay, available: false, status: pawapay ? 'PARTIAL' : 'NOT_CONFIGURED', requiresMobileNumber: true, settlementType: 'asynchronous' },
    { rail: 'M-Pesa', configured: pawapay, available: false, status: pawapay ? 'PARTIAL' : 'NOT_CONFIGURED', requiresMobileNumber: true, settlementType: 'asynchronous' },
    { rail: 'SEPA', configured: false, available: false, status: 'NOT_CONFIGURED', settlementType: 'asynchronous' },
    { rail: 'Interac', configured: false, available: false, status: 'UNAVAILABLE', settlementType: 'provider_confirmation' },
    { rail: 'SWIFT', configured: false, available: false, status: 'NOT_CONFIGURED', settlementType: 'asynchronous' },
  ];

  return res.status(200).json({ ok: true, rails });
}
