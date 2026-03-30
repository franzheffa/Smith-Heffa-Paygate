import { prisma } from '../../../../lib/prisma';
import { buildOtpauthUri, generateTotpSecret, getSessionToken, sha256 } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = getSessionToken(req);
  if (!raw) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { account: true }
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: 'Session invalid' });
    }

    const secret = generateTotpSecret();
    const updated = await prisma.authAccount.update({
      where: { id: session.account.id },
      data: { twoFactorSecret: secret, twoFactorEnabled: false }
    });

    return res.status(200).json({
      ok: true,
      method: 'totp',
      secret,
      otpauthUrl: buildOtpauthUri(updated.email, secret),
      next: 'Call /api/auth/2fa/enable with otp to finalize'
    });
  } catch (error) {
    return res.status(500).json({ error: '2FA setup failed', message: error?.message || 'Unknown error' });
  }
}
