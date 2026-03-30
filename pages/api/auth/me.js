import { prisma } from '../../../lib/prisma';
import { getSessionToken, sha256 } from '../../../lib/auth';

function sanitizeUser(user) {
  return { id: user.id, email: user.email, name: user.name || null, createdAt: user.createdAt };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const raw = getSessionToken(req);
  if (!raw) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: sha256(raw) },
      include: {
        account: {
          include: {
            user: true
          }
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: 'Session invalid' });
    }

    return res.status(200).json({
      ok: true,
      user: sanitizeUser(session.account.user),
      security: {
        twoFactorEnabled: session.account.twoFactorEnabled
      }
    });
  } catch (error) {
    return res.status(500).json({ error: 'Session check failed', message: error?.message || 'Unknown error' });
  }
}
