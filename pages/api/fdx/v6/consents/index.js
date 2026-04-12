import { prisma } from '../../../../../lib/prisma';
import { createConsentGrant, getAuthenticatedUser, getInteractionId, serializeConsent } from '../../../../../lib/fdx-api';

export default async function handler(req, res) {
  getInteractionId(req, res);

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  if (req.method === 'GET') {
    const consents = await prisma.fdxConsentGrant.findMany({
      where: { userId: user.id },
      orderBy: { createdTime: 'desc' }
    });

    return res.status(200).json({
      consents: consents.map(serializeConsent)
    });
  }

  if (req.method === 'POST') {
    const consent = await createConsentGrant({ userId: user.id, body: req.body || {} });
    return res.status(201).json(serializeConsent(consent));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ code: '405', message: 'Method not allowed' });
}
