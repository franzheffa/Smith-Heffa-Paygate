import { prisma } from '../../../lib/prisma';
import {
  verifyPassword,
  randomToken,
  sessionExpiresAt,
  setSessionCookie,
  sha256,
  getClientIp,
  verifyTotp
} from '../../../lib/auth';

function sanitizeUser(user) {
  return { id: user.id, email: user.email, name: user.name || null, createdAt: user.createdAt };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const otp = String(req.body?.otp || '');

  if (!email || !password) return res.status(400).json({ error: 'Missing credentials' });

  try {
    const account = await prisma.authAccount.findUnique({
      where: { email },
      include: { user: true }
    });
    if (!account) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await verifyPassword(password, account.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    if (account.twoFactorEnabled) {
      if (!otp) return res.status(401).json({ error: '2FA required', require2fa: true });
      if (!verifyTotp(otp, account.twoFactorSecret)) return res.status(401).json({ error: 'Invalid 2FA code', require2fa: true });
    }

    const raw = randomToken(32);
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

    return res.status(200).json({ ok: true, user: sanitizeUser(account.user), security: { twoFactorEnabled: account.twoFactorEnabled } });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed', message: error?.message || 'Unknown error' });
  }
}
