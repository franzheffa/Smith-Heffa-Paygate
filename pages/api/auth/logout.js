/**
 * POST /api/auth/logout
 * Révoque la session + supprime le cookie
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { prisma } from '../../../lib/prisma';
import { getSessionToken, sha256, clearSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  const raw = getSessionToken(req);
  if (raw) {
    try {
      await prisma.authSession.updateMany({
        where: { tokenHash: sha256(raw) },
        data: { revokedAt: new Date() }
      });
    } catch {}
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
