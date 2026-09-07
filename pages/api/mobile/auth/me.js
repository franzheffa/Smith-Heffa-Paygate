import { handleMobileReadCors } from '../../../../lib/mobile-api';
import { requireFirebasePrincipal } from '../../../../lib/firebase-id-token';

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res, 'GET')) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }
  const principal = await requireFirebasePrincipal(req, res);
  if (!principal) return;
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json({
    ok: true,
    principal: {
      authenticated: true,
      emailPresent: principal.emailPresent,
      emailVerified: principal.emailVerified,
      provider: principal.provider,
    },
  });
}
