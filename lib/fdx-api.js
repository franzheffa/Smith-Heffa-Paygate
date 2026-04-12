const crypto = require('crypto');
const { prisma } = require('./prisma');
const { getSessionToken, sha256 } = require('./auth');

function envValue(name, fallback = null) {
  const raw = process.env[name];
  return raw == null || raw === '' ? fallback : raw;
}

function appUrl() {
  return envValue('NEXT_PUBLIC_APP_URL', 'https://smith-heffa-paygate.vercel.app');
}

function getInteractionId(req, res) {
  const incoming = req.headers['x-fapi-interaction-id'];
  const value = incoming || crypto.randomUUID();
  res.setHeader('x-fapi-interaction-id', value);
  return value;
}

async function getAuthenticatedUser(req) {
  const raw = getSessionToken(req);
  if (!raw) return null;

  const session = await prisma.authSession.findUnique({
    where: { tokenHash: sha256(raw) },
    include: {
      account: {
        include: {
          user: true
        }
      }
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  return session.account.user;
}

function providerParties() {
  return [
    {
      name: envValue('FDX_DATA_RECIPIENT_NAME', 'Smith-Heffa Paygate'),
      type: 'DATA_RECIPIENT',
      homeUri: appUrl(),
      logoUri: `${appUrl()}/images/secops-color.svg`,
      registry: envValue('FDX_DATA_RECIPIENT_REGISTRY', 'FDX'),
      registeredEntityName: envValue('FDX_DATA_RECIPIENT_ENTITY_NAME', 'BUTTERTECH INC'),
      registeredEntityId: envValue('FDX_DATA_RECIPIENT_ENTITY_ID', 'SMITH-HEFFA-PAYGATE')
    },
    {
      name: envValue('FDX_DATA_PROVIDER_NAME', 'Smith-Heffa Paygate Provider'),
      type: 'DATA_PROVIDER',
      homeUri: appUrl(),
      logoUri: `${appUrl()}/images/secops-horizontal.svg`,
      registry: envValue('FDX_DATA_PROVIDER_REGISTRY', 'FDX'),
      registeredEntityName: envValue('FDX_DATA_PROVIDER_ENTITY_NAME', 'BUTTERTECH INC'),
      registeredEntityId: envValue('FDX_DATA_PROVIDER_ENTITY_ID', 'BUTTERTECH-INC')
    }
  ];
}

function normalizeResources(resources) {
  if (!Array.isArray(resources) || !resources.length) {
    return [
      {
        resourceType: 'ACCOUNT',
        resourceId: 'paygate-default-account',
        dataClusters: ['ACCOUNT_DETAILED', 'TRANSACTIONS']
      }
    ];
  }

  return resources.map((resource, index) => ({
    resourceType: String(resource.resourceType || 'ACCOUNT').toUpperCase(),
    resourceId: String(resource.resourceId || `resource-${index + 1}`),
    dataClusters: Array.isArray(resource.dataClusters) && resource.dataClusters.length
      ? resource.dataClusters.map((value) => String(value))
      : ['ACCOUNT_DETAILED']
  }));
}

function consentExpiration(durationType, durationPeriod) {
  if (durationType === 'ONE_TIME') {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
  if (durationType === 'TIME_BOUND' && Number.isFinite(durationPeriod)) {
    return new Date(Date.now() + durationPeriod * 24 * 60 * 60 * 1000);
  }
  return null;
}

function serializeConsent(consent) {
  return {
    id: consent.id,
    status: consent.status,
    parties: consent.parties,
    createdTime: consent.createdTime.toISOString(),
    expirationTime: consent.expirationTime ? consent.expirationTime.toISOString() : null,
    updatedTime: consent.updatedTime ? consent.updatedTime.toISOString() : undefined,
    durationType: consent.durationType,
    durationPeriod: consent.durationPeriod,
    lookbackPeriod: consent.lookbackPeriod,
    resources: consent.resources
  };
}

function serializeRevocation(revocation) {
  return {
    status: revocation.status,
    reason: revocation.reason,
    initiator: revocation.initiator,
    createdTime: revocation.createdAt.toISOString(),
    updatedTime: revocation.updatedAt.toISOString()
  };
}

async function createConsentGrant({ userId, body }) {
  const durationType = String(body.durationType || 'TIME_BOUND').toUpperCase();
  const durationPeriod = body.durationPeriod == null ? 365 : Number(body.durationPeriod);
  const lookbackPeriod = body.lookbackPeriod == null ? 90 : Number(body.lookbackPeriod);
  const resources = normalizeResources(body.resources);

  const consent = await prisma.fdxConsentGrant.create({
    data: {
      id: crypto.randomBytes(8).toString('hex'),
      userId,
      status: 'ACTIVE',
      durationType,
      durationPeriod: Number.isFinite(durationPeriod) ? durationPeriod : null,
      lookbackPeriod: Number.isFinite(lookbackPeriod) ? lookbackPeriod : null,
      expirationTime: consentExpiration(durationType, durationPeriod),
      parties: providerParties(),
      resources
    }
  });

  return consent;
}

module.exports = {
  appUrl,
  createConsentGrant,
  getAuthenticatedUser,
  getInteractionId,
  providerParties,
  serializeConsent,
  serializeRevocation
};
