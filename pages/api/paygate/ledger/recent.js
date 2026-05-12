import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedSession } from '../../../../lib/fdx-api';

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

function buildLedgerHistory(auditEvents = []) {
  return auditEvents.map((event) => {
    const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {};
    const action = String(event.action || '').toUpperCase();
    const providerStatus = payload.status || payload.eventType || action;
    let status = normalizeLedgerStatus(providerStatus);

    if (action === 'PIX_INTENT_CREATED') status = 'PENDING';
    if (action === 'PIX_STATUS_SYNC') status = normalizeLedgerStatus(payload.status || 'PROCESSING');
    if (action === 'PIX_WEBHOOK_SUCCEEDED') status = 'PAID';
    if (action === 'PIX_WEBHOOK_FAILED') status = 'FAILED';
    if (action === 'PIX_WEBHOOK_CANCELED') status = 'EXPIRED';

    return {
      status,
      at: event.createdAt.toISOString(),
      message:
        payload.message
        || payload.eventType
        || payload.status
        || action
    };
  });
}

function buildTrackerMessage(transaction, history = []) {
  const status = normalizeLedgerStatus(transaction.status);
  const lastHistory = history[history.length - 1];

  if (status === 'PAID') return 'Paiement confirmé et persisté dans le ledger Prisma.';
  if (status === 'FAILED') return lastHistory?.message || 'Paiement échoué côté provider.';
  if (status === 'EXPIRED') return 'Paiement expiré ou annulé côté provider.';
  if (status === 'REQUIRES_ACTION') return 'Action client encore requise pour finaliser le paiement.';
  if (status === 'PROCESSING') return 'Paiement en cours de confirmation provider/webhook.';
  return 'Persisté dans le ledger Prisma';
}

function mapLedgerItem(transaction, auditEvents = []) {
  const type = String(transaction.type || '').toUpperCase();
  const status = normalizeLedgerStatus(transaction.status);
  const history = buildLedgerHistory(auditEvents);

  if (type === 'PIX_BR') {
    return {
      id: `ledger-${transaction.traceabilityId}`,
      railLabel: 'Pix Brasil',
      selectedRail: 'PIX_BR',
      operation: 'PAYMENT',
      country: 'BR',
      countryLabel: 'BR - Brésil',
      countryFlag: '/images/flags/br.svg',
      provider: 'stripe',
      providerLabel: 'Stripe Pix',
      amount: transaction.amount,
      currency: transaction.currency,
      status,
      externalId: transaction.traceabilityId,
      message: buildTrackerMessage(transaction, history),
      createdAt: transaction.createdAt.toISOString(),
      history
    };
  }

  if (type === 'CAMPOST') {
    return {
      id: `ledger-${transaction.traceabilityId}`,
      railLabel: 'Campost',
      selectedRail: 'CAMPOST',
      operation: 'PAYMENT',
      country: 'CM',
      countryLabel: 'CM - Cameroun',
      countryFlag: '/images/flags/cmr.svg',
      provider: 'campost',
      providerLabel: 'Campost Local Rail',
      amount: transaction.amount,
      currency: transaction.currency,
      status,
      externalId: transaction.traceabilityId,
      message: buildTrackerMessage(transaction, history),
      createdAt: transaction.createdAt.toISOString(),
      history
    };
  }

  return {
    id: `ledger-${transaction.traceabilityId}`,
    railLabel: transaction.type || 'Transaction',
    selectedRail: transaction.type || 'PAYGATE',
    operation: 'PAYMENT',
    country: '',
    countryLabel: '',
    countryFlag: '',
    provider: '',
    providerLabel: '',
    amount: transaction.amount,
    currency: transaction.currency,
    status,
    externalId: transaction.traceabilityId,
    message: buildTrackerMessage(transaction, history),
    createdAt: transaction.createdAt.toISOString(),
    history
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const session = await getAuthenticatedSession(req);
  if (!session?.account?.user?.id) {
    return res.status(401).json({ ok: false, error: 'Not authenticated' });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.account.user.id },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  const traceabilityIds = transactions
    .map((transaction) => transaction.traceabilityId)
    .filter(Boolean);

  const auditEvents = traceabilityIds.length
    ? await prisma.fdxAuditEvent.findMany({
        where: {
          userId: session.account.user.id,
          category: 'PAYGATE',
          resourceType: 'TRANSACTION',
          resourceId: { in: traceabilityIds }
        },
        orderBy: { createdAt: 'asc' }
      })
    : [];

  const auditByResourceId = auditEvents.reduce((acc, event) => {
    const key = String(event.resourceId || '').trim();
    if (!key) return acc;
    if (!acc[key]) acc[key] = [];
    acc[key].push(event);
    return acc;
  }, {});

  return res.status(200).json({
    ok: true,
    items: transactions.map((transaction) => mapLedgerItem(transaction, auditByResourceId[transaction.traceabilityId] || []))
  });
}
