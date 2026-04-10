/**
 * POST /api/auth/cleanup-session
 * Nettoie les sessions expirées en DB — appelé au login
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const deleted = await prisma.session.deleteMany({
      where: { expires: { lt: new Date() } }
    });
    return res.status(200).json({ cleaned: deleted.count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
