/**
 * POST /api/auth/logout
 * Révoque la session + supprime le cookie
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { prisma } from '../../../lib/prisma';
import { getSessionToken, sha256, clearSessionCookie, getClientIp } from '../../../lib/auth';
import { recordAuditEvent } from '../../../lib/audit';

export default async function handler(req, res) {
  const raw = getSessionToken(req);
  if (raw) {
    try {
      const sessions = await prisma.authSession.findMany({
        where: { tokenHash: sha256(raw) },
        include: { account: { include: { user: true } } }
      });
      await prisma.authSession.updateMany({
        where: { tokenHash: sha256(raw) },
        data: { revokedAt: new Date() }
      });
      if (sessions[0]?.account?.user?.id) {
        await recordAuditEvent({
          userId: sessions[0].account.user.id,
          category: 'AUTH',
          action: 'logout',
          actorType: 'CUSTOMER',
          resourceType: 'USER',
          resourceId: sessions[0].account.user.id,
          ipAddress: getClientIp(req),
          userAgent: req.headers['user-agent'],
          payload: {}
        });
      }
    } catch {}
  }
  clearSessionCookie(res);
  return res.status(200).json({ ok: true });
}
