import { prisma } from '../../../../../lib/prisma';
import { getAuthenticatedSession, getInteractionId } from '../../../../../lib/fdx-api';

export default async function handler(req, res) {
  getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  const session = await getAuthenticatedSession(req);
  if (!session) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  const events = await prisma.fdxAuditEvent.findMany({
    where: { userId: session.account.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return res.status(200).json({
    events: events.map((event) => ({
      id: event.id,
      category: event.category,
      action: event.action,
      actorType: event.actorType,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      requestId: event.requestId,
      payload: event.payload,
      signature: event.signature,
      createdAt: event.createdAt.toISOString()
    }))
  });
}
