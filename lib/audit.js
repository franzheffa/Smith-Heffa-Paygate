const crypto = require('crypto');
const { prisma } = require('./prisma');

function signingSecret() {
  return (
    process.env.FDX_AUDIT_SIGNING_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    ''
  );
}

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function signPayload(event) {
  const secret = signingSecret();
  if (!secret) return null;
  return crypto.createHmac('sha256', secret).update(stableStringify(event)).digest('hex');
}

async function recordAuditEvent(input) {
  const payload = input.payload || {};
  const eventToSign = {
    category: input.category,
    action: input.action,
    actorType: input.actorType || 'SYSTEM',
    resourceType: input.resourceType || 'UNKNOWN',
    resourceId: input.resourceId || null,
    requestId: input.requestId || null,
    payload
  };

  return prisma.fdxAuditEvent.create({
    data: {
      userId: input.userId || null,
      category: input.category,
      action: input.action,
      actorType: input.actorType || 'SYSTEM',
      resourceType: input.resourceType || 'UNKNOWN',
      resourceId: input.resourceId || null,
      requestId: input.requestId || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent ? String(input.userAgent).slice(0, 500) : null,
      payload,
      signature: signPayload(eventToSign)
    }
  });
}

module.exports = {
  recordAuditEvent
};
