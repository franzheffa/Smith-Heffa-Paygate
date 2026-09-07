import { handleMobileReadCors } from '../../../lib/mobile-api';
import { requireFirebasePrincipal } from '../../../lib/firebase-id-token';
import { listOwnerActivity } from '../../../lib/mobile-checkout-store';
import { allowRequest } from '../../../lib/rate-limit';

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res, 'GET')) return;
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  if (!allowRequest(req, 'mobile-activity', { limit: 60 })) return res.status(429).json({ ok: false, code: 'RATE_LIMITED' });
  const principal = await requireFirebasePrincipal(req, res);
  if (!principal) return;
  const activity = await listOwnerActivity(principal.uid);
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({ ok: true, activity });
}
