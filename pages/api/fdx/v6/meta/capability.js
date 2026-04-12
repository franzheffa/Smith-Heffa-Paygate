import { appUrl, getInteractionId } from '../../../../../lib/fdx-api';

function operation(id, href, action, alsoSupported = []) {
  return {
    id,
    version: '1.0.0',
    fdxVersions: ['6.5.0'],
    availability: {
      status: 'ALIVE',
      description: 'Implemented by Smith-Heffa-Paygate'
    },
    alsoSupported,
    link: {
      href,
      action,
      types: ['application/json']
    }
  };
}

export default function handler(req, res) {
  getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  const base = `${appUrl()}/api/fdx/v6`;

  return res.status(200).json({
    fdxVersions: ['6.5.0'],
    allowedConnections: Number(process.env.FDX_ALLOWED_CONNECTIONS || 25),
    activeConnections: 0,
    messageFormat: 'JSON',
    operations: [
      operation('getAvailability', `${base}/meta/availability`, 'GET'),
      operation('getCapability', `${base}/meta/capability`, 'GET'),
      operation('getCertificationMetrics', `${base}/meta/certification-metrics`, 'GET'),
      operation('getConsentGrant', `${base}/consents/{consentId}`, 'GET', ['getConsentRevocation', 'revokeConsentGrant'])
    ],
    jwksUrl: {
      href: `${appUrl()}/api/interac/jwks`,
      action: 'GET',
      types: ['application/json']
    }
  });
}
