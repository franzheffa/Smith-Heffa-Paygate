import { getInteractionId } from '../../../../../lib/fdx-api';

export default function handler(req, res) {
  getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  return res.status(200).json({
    availability: [
      {
        status: 'ALIVE',
        description: 'Smith-Heffa Paygate FDX provider readiness endpoints are operational.',
        operationId: 'getCapability'
      },
      {
        status: 'ALIVE',
        description: 'Consent grant retrieval and revocation endpoints are operational.',
        operationId: 'getConsentGrant'
      }
    ]
  });
}
