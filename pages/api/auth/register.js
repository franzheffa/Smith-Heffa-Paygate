import { prisma } from '../../../lib/prisma';
import { hashPassword, randomToken, sessionExpiresAt, setSessionCookie, sha256, getClientIp } from '../../../lib/auth';

function sanitizeUser(user) {
  return { id: user.id, email: user.email, name: user.name || null, createdAt: user.createdAt };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const name = String(req.body?.name || '').trim() || null;
  const password = String(req.body?.password || '');

  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Invalid email' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const existingAccount = await prisma.authAccount.findUnique({ where: { email } });
    if (existingAccount) return res.status(409).json({ error: 'Account already exists' });

    const passwordHash = await hashPassword(password);
    const existingUser = await prisma.user.findUnique({ where: { email } });

    let account;
    if (existingUser) {
      account = await prisma.authAccount.create({
        data: {
          userId: existingUser.id,
          email,
          passwordHash
        },
        include: { user: true }
      });
    } else {
      account = await prisma.authAccount.create({
        data: {
          email,
          passwordHash,
          user: {
            create: {
              email,
              name
            }
          }
        },
        include: { user: true }
      });
    }

    const raw = randomToken(32);
    // Nettoie les sessions orphelines avant d'en créer une nouvelle
    await prisma.authSession.updateMany({
      where: { accountId: account.id, expiresAt: { lt: new Date() } },
      data: { revokedAt: new Date() }
    });
    await prisma.authSession.create({
      data: {
        accountId: account.id,
        tokenHash: sha256(raw),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
        ipAddress: getClientIp(req),
        expiresAt: sessionExpiresAt()
      }
    });
    setSessionCookie(res, raw);

    return res.status(201).json({ ok: true, user: sanitizeUser(account.user), security: { twoFactorEnabled: account.twoFactorEnabled } });
  } catch (error) {
    return res.status(500).json({ error: 'Register failed', message: error?.message || 'Unknown error' });
  }
}
