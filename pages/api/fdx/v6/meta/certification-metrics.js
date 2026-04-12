import { getInteractionId } from '../../../../../lib/fdx-api';

export default function handler(req, res) {
  getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  const now = new Date();
  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return res.status(200).json({
    metrics: [
      {
        reportStartTimestamp: start.toISOString(),
        reportEndTimestamp: now.toISOString(),
        metricsName: 'smith-heffa-paygate-fdx-readiness',
        operationIds: ['getAvailability', 'getCapability', 'getConsentGrant', 'revokeConsentGrant'],
        responseTimeAverage: 180,
        averageUpTime: 99.9,
        reportTimestamp: now.toISOString()
      }
    ]
  });
}
