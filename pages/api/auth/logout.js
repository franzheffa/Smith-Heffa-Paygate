import { prisma } from '../../../lib/prisma';
import { clearSessionCookie, getSessionToken, sha256 } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = getSessionToken(req);
  clearSessionCookie(res);
  if (!raw) return res.status(200).json({ ok: true });

  try {
    await prisma.authSession.updateMany({
      where: { tokenHash: sha256(raw), revokedAt: null },
      data: { revokedAt: new Date() }
    });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: 'Logout failed', message: error?.message || 'Unknown error' });
  }
}
