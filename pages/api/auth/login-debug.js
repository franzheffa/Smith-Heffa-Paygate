const { prisma } = require('../../../lib/prisma');

module.exports = async function handler(req, res) {
  try {
    const account = await prisma.authAccount.findUnique({
      where: { email: 'franz@buttertech.io' },
      select: { id: true, email: true, userId: true, passwordHash: true },
    });
    return res.status(200).json({
      ok: true,
      found: !!account,
      hasHash: !!(account?.passwordHash),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message });
  }
};
