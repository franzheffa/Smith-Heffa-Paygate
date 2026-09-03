import { getServerSession } from 'next-auth/next';
import { prisma } from '../../../lib/prisma';
import { authOptions } from './[...nextauth]';
import {
  getClientIp,
  randomToken,
  sessionExpiresAt,
  setSessionCookie,
  sha256,
} from '../../../lib/auth';
import { recordAuditEvent } from '../../../lib/audit';

const OAUTH_PLACEHOLDER_HASH = 'oauth_google_account';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

async function ensureLocalAccount({ email, name }) {
  const existingAccount = await prisma.authAccount.findUnique({
    where: { email },
    include: { user: true },
  });

  if (existingAccount) return existingAccount;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    return prisma.authAccount.create({
      data: { userId: existingUser.id, email, passwordHash: OAUTH_PLACEHOLDER_HASH },
      include: { user: true },
    });
  }

  return prisma.authAccount.create({
    data: {
      email,
      passwordHash: OAUTH_PLACEHOLDER_HASH,
      user: { create: { email, name: String(name || '').trim() || null } },
    },
    include: { user: true },
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const email = normalizeEmail(session?.user?.email);

    if (!session || session.provider !== 'google' || !email) {
      return res.redirect(303, '/auth/login?error=google_session_missing');
    }

    const account = await ensureLocalAccount({ email, name: session.user?.name });
    const rawToken = randomToken(32);

    await prisma.authSession.updateMany({
      where: { accountId: account.id, expiresAt: { lt: new Date() } },
      data: { revokedAt: new Date() },
    });
    await prisma.authSession.create({
      data: {
        accountId: account.id,
        tokenHash: sha256(rawToken),
        userAgent: String(req.headers['user-agent'] || '').slice(0, 500),
        ipAddress: getClientIp(req) || null,
        expiresAt: sessionExpiresAt(),
      },
    });
    setSessionCookie(res, rawToken);

    await recordAuditEvent({
      userId: account.user.id,
      category: 'AUTH',
      action: 'google_login',
      actorType: 'CUSTOMER',
      resourceType: 'USER',
      resourceId: account.user.id,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      payload: { email, provider: 'google' },
    });

    return res.redirect(303, '/dashboard');
  } catch (error) {
    console.error('[auth/google-complete] Exception:', error?.message || error);
    return res.redirect(303, '/auth/login?error=google_finalize_failed');
  }
}
