import { prisma } from '../../../../../lib/prisma';
import { recordAuditEvent } from '../../../../../lib/audit';
import { getClientIp } from '../../../../../lib/auth';
import { createConsentGrant, getAuthenticatedUser, getInteractionId, serializeConsent } from '../../../../../lib/fdx-api';

export default async function handler(req, res) {
  const requestId = getInteractionId(req, res);

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  if (req.method === 'GET') {
    const consents = await prisma.fdxConsentGrant.findMany({
      where: { userId: user.id },
      orderBy: { createdTime: 'desc' }
    });

    await recordAuditEvent({
      userId: user.id,
      category: 'FDX_CONSENT',
      action: 'listConsents',
      actorType: 'CUSTOMER',
      resourceType: 'CONSENT',
      requestId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      payload: { count: consents.length }
    });

    return res.status(200).json({
      consents: consents.map(serializeConsent)
    });
  }

  if (req.method === 'POST') {
    const consent = await createConsentGrant({ userId: user.id, body: req.body || {} });
    await recordAuditEvent({
      userId: user.id,
      category: 'FDX_CONSENT',
      action: 'createConsentGrant',
      actorType: 'CUSTOMER',
      resourceType: 'CONSENT',
      resourceId: consent.id,
      requestId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      payload: { durationType: consent.durationType, durationPeriod: consent.durationPeriod, lookbackPeriod: consent.lookbackPeriod }
    });
    return res.status(201).json(serializeConsent(consent));
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ code: '405', message: 'Method not allowed' });
}
