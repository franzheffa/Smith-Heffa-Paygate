import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedSession } from '../../../../lib/fdx-api';

function mapLedgerItem(transaction) {
  const type = String(transaction.type || '').toUpperCase();
  const status = String(transaction.status || '').toUpperCase();

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
      message: 'Persisté dans le ledger Prisma',
      createdAt: transaction.createdAt.toISOString()
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
    message: 'Persisté dans le ledger Prisma',
    createdAt: transaction.createdAt.toISOString()
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

  return res.status(200).json({
    ok: true,
    items: transactions.map(mapLedgerItem)
  });
}
