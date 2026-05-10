const { prisma } = require('../prisma');
const { getSessionToken, sha256, getClientIp } = require('../auth');

async function getLedgerSession(req) {
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

  return session;
}

function normalizeLedgerStatus(status = '') {
  const value = String(status || '').trim().toUpperCase();

  if (['SUCCEEDED', 'COMPLETED', 'PAID', 'SUCCESS'].includes(value)) return 'PAID';
  if (['CANCELED', 'CANCELLED', 'EXPIRED'].includes(value)) return 'EXPIRED';
  if (['FAILED', 'REJECTED', 'REQUIRES_PAYMENT_METHOD'].includes(value)) return 'FAILED';
  if (['REQUIRES_ACTION', 'REQUIRES_CONFIRMATION', 'OTP_REQUIRED'].includes(value)) return 'REQUIRES_ACTION';
  if (['PROCESSING', 'ENQUEUED', 'IN_RECONCILIATION', 'DELAYED'].includes(value)) return 'PROCESSING';
  if (['ACCEPTED', 'INITIATED', 'PENDING', 'ROUTED'].includes(value)) return 'PENDING';
  return value || 'UNKNOWN';
}

function scaleAmount(amount, currency = '') {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return 0;
  return ['BRL', 'USD', 'EUR', 'CAD'].includes(String(currency || '').toUpperCase())
    ? numeric / 100
    : numeric;
}

async function upsertPaymentLedger(req, input = {}) {
  const traceabilityId = String(input.traceabilityId || input.providerIntentId || input.reference || '').trim();
  if (!traceabilityId) return { transaction: null, userId: null, skipped: 'missing_traceability_id' };

  const session = await getLedgerSession(req);
  const userId = session?.account?.user?.id || null;
  const status = normalizeLedgerStatus(input.status);
  const amount = scaleAmount(input.amount, input.currency);
  const currency = String(input.currency || '').toUpperCase() || 'USD';
  const type = String(input.type || input.rail || 'PAYGATE').toUpperCase();

  const existing = await prisma.transaction.findUnique({
    where: { traceabilityId }
  });

  let transaction = null;
  if (existing) {
    transaction = await prisma.transaction.update({
      where: { traceabilityId },
      data: {
        amount,
        currency,
        status,
        type
      }
    });
  } else if (userId) {
    transaction = await prisma.transaction.create({
      data: {
        amount,
        currency,
        status,
        type,
        traceabilityId,
        userId
      }
    });
  }

  return { transaction, userId, skipped: transaction ? null : 'missing_user_session' };
}

async function appendPaymentAudit(req, input = {}) {
  const session = await getLedgerSession(req);
  const userId = session?.account?.user?.id || null;

  return prisma.fdxAuditEvent.create({
    data: {
      userId,
      category: 'PAYGATE',
      action: String(input.action || 'UNKNOWN').toUpperCase(),
      actorType: 'SYSTEM',
      resourceType: 'TRANSACTION',
      resourceId: String(input.resourceId || input.traceabilityId || input.providerIntentId || '').trim() || null,
      requestId: String(input.requestId || input.providerIntentId || '').trim() || null,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || null,
      payload: input.payload || {}
    }
  });
}

module.exports = {
  appendPaymentAudit,
  normalizeLedgerStatus,
  upsertPaymentLedger
};
