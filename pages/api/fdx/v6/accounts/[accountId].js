import { prisma } from '../../../../../lib/prisma';
import { recordAuditEvent } from '../../../../../lib/audit';
import { getClientIp } from '../../../../../lib/auth';
import { fdxAccount } from '../../../../../lib/fdx-data';
import { getAuthenticatedSession, getInteractionId } from '../../../../../lib/fdx-api';

export default async function handler(req, res) {
  const requestId = getInteractionId(req, res);

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ code: '405', message: 'Method not allowed' });
  }

  const session = await getAuthenticatedSession(req);
  if (!session) {
    return res.status(401).json({ code: '401', message: 'Authentication required' });
  }

  const accountId = `acct-${session.account.user.id}`;
  if (String(req.query.accountId || '') !== accountId) {
    return res.status(404).json({ code: '404', message: 'Account not found' });
  }

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.account.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const account = fdxAccount(session.account.user, transactions);

  await recordAuditEvent({
    userId: session.account.user.id,
    category: 'FDX_API',
    action: 'getAccount',
    actorType: 'CUSTOMER',
    resourceType: 'ACCOUNT',
    resourceId: account.accountId,
    requestId,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    payload: { transactionsAttached: account.transactions.length }
  });

  return res.status(200).json(account);
}
