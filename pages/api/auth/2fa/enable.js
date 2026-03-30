import { prisma } from '../../../../lib/prisma';
import { getSessionToken, sha256, verifyTotp } from '../../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const raw = getSessionToken(req);
  const otp = String(req.body?.otp || '');
  if (!raw) return res.status(401).json({ error: 'Not authenticated' });
  if (!otp) return res.status(400).json({ error: 'Missing otp' });

  try {
    const session = await prisma.authSession.findUnique({
      where: { tokenHash: sha256(raw) },
      include: { account: true }
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return res.status(401).json({ error: 'Session invalid' });
    }
    if (!session.account.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not initialized. Call /api/auth/2fa/setup first.' });
    }
    if (!verifyTotp(otp, session.account.twoFactorSecret)) {
      return res.status(401).json({ error: 'Invalid otp' });
    }

    await prisma.authAccount.update({
      where: { id: session.account.id },
      data: { twoFactorEnabled: true }
    });

    return res.status(200).json({ ok: true, twoFactorEnabled: true });
  } catch (error) {
    return res.status(500).json({ error: '2FA enable failed', message: error?.message || 'Unknown error' });
  }
}
