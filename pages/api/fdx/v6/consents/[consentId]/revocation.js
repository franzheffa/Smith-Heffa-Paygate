import { prisma } from '../../../../../../lib/prisma';
import { recordAuditEvent } from '../../../../../../lib/audit';
import { getClientIp } from '../../../../../../lib/auth';
import { getAuthenticatedUser, getInteractionId, serializeRevocation } from '../../../../../../lib/fdx-api';

function normalize(value, fallback) {
  return value == null || value === '' ? fallback : String(value);
}

export default async function handler(req, res) {
  const requestId = getInteractionId(req, res);

  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  const consentId = String(req.query.consentId || '');
  const consent = await prisma.fdxConsentGrant.findUnique({
    where: { id: consentId },
    include: { revocations: { orderBy: { createdAt: 'desc' } } }
  });

  if (!consent) {
    return res.status(404).json({ code: '404', message: 'Consent grant not found' });
  }
  if (consent.userId && consent.userId !== user.id) {
    return res.status(403).json({ code: '403', message: 'Forbidden' });
  }

  if (req.method === 'GET') {
    await recordAuditEvent({
      userId: user.id,
      category: 'FDX_CONSENT',
      action: 'getConsentRevocation',
      actorType: 'CUSTOMER',
      resourceType: 'CONSENT',
      resourceId: consent.id,
      requestId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      payload: { count: consent.revocations.length }
    });
    return res.status(200).json({
      revocations: consent.revocations.map(serializeRevocation)
    });
  }

  if (req.method === 'PUT') {
    if (consent.status === 'REVOKED') {
      return res.status(409).json({ code: '409', message: 'Consent already revoked' });
    }

    const body = req.body || {};
    const reason = normalize(body.reason, 'BUSINESS_RULE');
    const initiator = normalize(body.initiator, 'DATA_ACCESS_PLATFORM');

    await prisma.$transaction([
      prisma.fdxConsentGrant.update({
        where: { id: consentId },
        data: { status: 'REVOKED' }
      }),
      prisma.fdxConsentRevocation.create({
        data: {
          consentId,
          status: 'REVOKED',
          reason,
          initiator
        }
      })
    ]);

    await recordAuditEvent({
      userId: user.id,
      category: 'FDX_CONSENT',
      action: 'revokeConsentGrant',
      actorType: 'CUSTOMER',
      resourceType: 'CONSENT',
      resourceId: consent.id,
      requestId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'],
      payload: { reason, initiator }
    });

    return res.status(204).end();
  }

  res.setHeader('Allow', 'GET, PUT');
  return res.status(405).json({ code: '405', message: 'Method not allowed' });
}
