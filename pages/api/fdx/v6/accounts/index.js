import { prisma } from '../../../../../lib/prisma';
import { recordAuditEvent } from '../../../../../lib/audit';
import { fdxAccount } from '../../../../../lib/fdx-data';
import { getAuthenticatedSession, getInteractionId } from '../../../../../lib/fdx-api';
import { getClientIp } from '../../../../../lib/auth';

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

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.account.user.id },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  const account = fdxAccount(session.account.user, transactions);

  await recordAuditEvent({
    userId: session.account.user.id,
    category: 'FDX_API',
    action: 'searchForAccounts',
    actorType: 'CUSTOMER',
    resourceType: 'ACCOUNT',
    resourceId: account.accountId,
    requestId,
    ipAddress: getClientIp(req),
    userAgent: req.headers['user-agent'],
    payload: { resultType: 'full', count: 1 }
  });

  return res.status(200).json({
    accounts: [
      {
        accountCategory: account.accountCategory,
        accountId: account.accountId,
        nickname: account.nickname,
        status: account.status,
        balanceAsOf: account.balanceAsOf,
        currentBalance: account.currentBalance,
        openingDayBalance: account.openingDayBalance,
        accountNumberDisplay: account.accountNumberDisplay
      }
    ]
  });
}
