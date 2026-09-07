import crypto from 'crypto';

export const PAYMENT_STATES = Object.freeze([
  'CHECKOUT_CREATED',
  'PRICE_VALIDATED',
  'PAYMENT_METHOD_SELECTED',
  'PAYMENT_INITIALIZING',
  'PAYMENT_REQUIRES_ACTION',
  'PAYMENT_PENDING',
  'PAYMENT_CONFIRMED',
  'PAYMENT_FAILED',
  'PAYMENT_EXPIRED',
  'BOOKING_PENDING',
  'BOOKING_CONFIRMED',
  'BOOKING_FAILED',
  'PAYMENT_CONFIRMED_BUT_BOOKING_FAILED',
  'REFUND_PENDING',
  'REFUNDED',
  'REFUND_FAILED',
]);

const TRANSITIONS = Object.freeze({
  CHECKOUT_CREATED: ['PRICE_VALIDATED', 'PAYMENT_EXPIRED'],
  PRICE_VALIDATED: ['PAYMENT_METHOD_SELECTED', 'PAYMENT_EXPIRED'],
  PAYMENT_METHOD_SELECTED: ['PAYMENT_INITIALIZING', 'PAYMENT_EXPIRED'],
  PAYMENT_INITIALIZING: ['PAYMENT_REQUIRES_ACTION', 'PAYMENT_PENDING', 'PAYMENT_FAILED'],
  PAYMENT_REQUIRES_ACTION: ['PAYMENT_PENDING', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED'],
  PAYMENT_PENDING: ['PAYMENT_CONFIRMED', 'PAYMENT_FAILED', 'PAYMENT_EXPIRED'],
  PAYMENT_CONFIRMED: ['BOOKING_PENDING', 'REFUND_PENDING'],
  BOOKING_PENDING: ['BOOKING_CONFIRMED', 'BOOKING_FAILED', 'PAYMENT_CONFIRMED_BUT_BOOKING_FAILED'],
  BOOKING_FAILED: ['REFUND_PENDING'],
  PAYMENT_CONFIRMED_BUT_BOOKING_FAILED: ['REFUND_PENDING'],
  REFUND_PENDING: ['REFUNDED', 'REFUND_FAILED'],
  PAYMENT_FAILED: [],
  PAYMENT_EXPIRED: [],
  BOOKING_CONFIRMED: [],
  REFUNDED: [],
  REFUND_FAILED: ['REFUND_PENDING'],
});

export function assertPaymentTransition(from, to) {
  if (!PAYMENT_STATES.includes(from) || !PAYMENT_STATES.includes(to)) {
    throw new Error('UNKNOWN_PAYMENT_STATE');
  }
  if (!(TRANSITIONS[from] || []).includes(to)) throw new Error('ILLEGAL_PAYMENT_TRANSITION');
  return { from, to };
}

export function requireIdempotencyKey(value) {
  const key = String(value || '').trim();
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(key)) throw new Error('INVALID_IDEMPOTENCY_KEY');
  return key;
}

export function assertResourceOwner(authenticatedUid, ownerUid) {
  const principal = String(authenticatedUid || '').trim();
  const owner = String(ownerUid || '').trim();
  if (!principal || !owner || principal !== owner) {
    throw new Error('RESOURCE_NOT_FOUND_OR_FORBIDDEN');
  }
  return true;
}

export function deterministicOperationId({ namespace, ownerUid, resourceId, rail, idempotencyKey }) {
  const key = requireIdempotencyKey(idempotencyKey);
  return crypto
    .createHash('sha256')
    .update(`${namespace}:${ownerUid}:${resourceId}:${rail}:${key}`)
    .digest('hex')
    .slice(0, 32);
}

export function safeOperationalEvent(input = {}) {
  return {
    requestId: String(input.requestId || ''),
    checkoutId: String(input.checkoutId || ''),
    paymentAttemptId: String(input.paymentAttemptId || ''),
    provider: String(input.provider || ''),
    eventType: String(input.eventType || ''),
    status: String(input.status || ''),
  };
}
