import { prisma } from '../../../../../lib/prisma';
import { getAuthenticatedUser, getInteractionId, serializeConsent } from '../../../../../lib/fdx-api';

export default async function handler(req, res) {
  getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  const consentId = String(req.query.consentId || '');
  const consent = await prisma.fdxConsentGrant.findUnique({ where: { id: consentId } });

  if (!consent) {
    return res.status(404).json({ code: '404', message: 'Consent grant not found' });
  }
  if (consent.userId && consent.userId !== user.id) {
    return res.status(403).json({ code: '403', message: 'Forbidden' });
  }

  return res.status(200).json(serializeConsent(consent));
}
