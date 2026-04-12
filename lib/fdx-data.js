function centsToAmount(value) {
  if (!Number.isFinite(value)) return 0;
  if (Math.abs(value) >= 1000) return Number((value / 100).toFixed(2));
  return Number(value.toFixed(2));
}

function transactionDirection(type) {
  const normalized = String(type || '').toUpperCase();
  if (['PAYOUT', 'PAYMENT', 'WITHDRAWAL', 'TRANSFER_OUT', 'DEBIT'].includes(normalized)) {
    return 'DEBIT';
  }
  return 'CREDIT';
}

function fdxTransaction(transaction, accountId) {
  const amount = centsToAmount(Number(transaction.amount || 0));
  const direction = transactionDirection(transaction.type);

  return {
    transactionId: transaction.id,
    accountId,
    postedTimestamp: transaction.createdAt.toISOString(),
    description: `${transaction.type} ${transaction.status}`.trim(),
    memo: transaction.traceabilityId,
    status: transaction.status === 'SUCCESS' ? 'POSTED' : 'PENDING',
    debitCreditMemo: direction,
    transactionType: String(transaction.type || 'OTHER').toUpperCase(),
    amount,
    fiAttributes: [
      { name: 'traceabilityId', value: transaction.traceabilityId },
      { name: 'internalStatus', value: transaction.status }
    ]
  };
}

function fdxAccount(user, transactions) {
  const accountId = `acct-${user.id}`;
  const currentBalance = Number(user.balance || 0);

  return {
    accountCategory: 'DEPOSIT_ACCOUNT',
    accountId,
    nickname: `${user.name || user.email} Main Ledger`,
    status: 'OPEN',
    balanceAsOf: new Date().toISOString(),
    currentBalance,
    openingDayBalance: currentBalance,
    currency: 'USD',
    accountNumberDisplay: `SH-${user.id.slice(-6).toUpperCase()}`,
    transactions: transactions.map((transaction) => fdxTransaction(transaction, accountId))
  };
}

module.exports = {
  fdxAccount,
  fdxTransaction
};
