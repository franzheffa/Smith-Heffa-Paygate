import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CAPABILITY_STATUSES, PAYMENT_RAILS, paymentCapabilities } from '../lib/payment-capabilities.js';
import {
  assertPaymentTransition,
  assertResourceOwner,
  deterministicOperationId,
  requireIdempotencyKey,
  safeOperationalEvent,
} from '../lib/payment-domain.js';
import { requireFirebasePrincipal, verifyIdToken } from '../lib/firebase-id-token.js';

const capabilities = paymentCapabilities({ country: 'CM', currency: 'XAF', platform: 'WEB' });
assert.equal(capabilities.environment, 'non-production');
assert.equal(capabilities.liveExecutionEnabled, false);
assert.deepEqual(capabilities.rails.map((item) => item.rail), PAYMENT_RAILS);
assert.equal(capabilities.rails.length, 14);
assert.ok(capabilities.rails.every((item) => item.available === false));
assert.ok(capabilities.rails.every((item) => CAPABILITY_STATUSES.includes(item.status)));
assert.equal(capabilities.rails.find((item) => item.rail === 'Interac').status, 'CONFIGURATION_MISSING');
assert.equal(paymentCapabilities({ currency: 'XAF' }).rails.find((item) => item.rail === 'Stripe').status, 'CONFIGURATION_MISSING');

assert.deepEqual(assertPaymentTransition('CHECKOUT_CREATED', 'PRICE_VALIDATED'), { from: 'CHECKOUT_CREATED', to: 'PRICE_VALIDATED' });
assert.throws(() => assertPaymentTransition('CHECKOUT_CREATED', 'PAYMENT_CONFIRMED'), /ILLEGAL_PAYMENT_TRANSITION/);
assert.equal(requireIdempotencyKey('checkout:0123456789abcdef'), 'checkout:0123456789abcdef');
assert.throws(() => requireIdempotencyKey('short'), /INVALID_IDEMPOTENCY_KEY/);
assert.equal(assertResourceOwner('user-1', 'user-1'), true);
assert.throws(() => assertResourceOwner('user-1', 'user-2'), /RESOURCE_NOT_FOUND_OR_FORBIDDEN/);
const operation = {
  namespace: 'checkout-v1',
  ownerUid: 'user-1',
  resourceId: 'offer-1',
  rail: 'Stripe',
  idempotencyKey: 'checkout:0123456789abcdef',
};
assert.equal(deterministicOperationId(operation), deterministicOperationId(operation));
assert.notEqual(
  deterministicOperationId(operation),
  deterministicOperationId({ ...operation, idempotencyKey: 'checkout:fedcba9876543210' }),
);
assert.deepEqual(Object.keys(safeOperationalEvent({ token: 'never-returned', requestId: 'r1' })).sort(), [
  'checkoutId', 'eventType', 'paymentAttemptId', 'provider', 'requestId', 'status',
]);

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const now = 1_800_000_000;
function token(payloadOverrides = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    aud: 'smith-heffa-paygate-mobile',
    iss: 'https://securetoken.google.com/smith-heffa-paygate-mobile',
    sub: 'firebase-user-1',
    iat: now - 10,
    exp: now + 3600,
    auth_time: now - 20,
    email: 'not-returned@example.invalid',
    email_verified: true,
    firebase: { sign_in_provider: 'google.com' },
    ...payloadOverrides,
  })).toString('base64url');
  const signature = crypto.sign('RSA-SHA256', Buffer.from(`${header}.${payload}`), privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

const principal = await verifyIdToken(token(), {
  certificates: { 'test-key': publicKey.export({ type: 'spki', format: 'pem' }) },
  nowSeconds: now,
});
assert.deepEqual(principal, { uid: 'firebase-user-1', emailPresent: true, emailVerified: true, provider: 'google.com' });

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const missingResponse = responseRecorder();
assert.equal(await requireFirebasePrincipal({ headers: {} }, missingResponse), null);
assert.equal(missingResponse.statusCode, 401);
const invalidResponse = responseRecorder();
assert.equal(
  await requireFirebasePrincipal({ headers: { authorization: 'Bearer invalid' } }, invalidResponse, {
    certificates: { 'test-key': publicKey.export({ type: 'spki', format: 'pem' }) },
    nowSeconds: now,
  }),
  null,
);
assert.equal(invalidResponse.statusCode, 401);
const validResponse = responseRecorder();
assert.deepEqual(
  await requireFirebasePrincipal({ headers: { authorization: `Bearer ${token()}` } }, validResponse, {
    certificates: { 'test-key': publicKey.export({ type: 'spki', format: 'pem' }) },
    nowSeconds: now,
  }),
  principal,
);
await assert.rejects(() => verifyIdToken(token({ exp: now - 1 }), {
  certificates: { 'test-key': publicKey.export({ type: 'spki', format: 'pem' }) },
  nowSeconds: now,
}), /EXPIRED_FIREBASE_TOKEN/);
await assert.rejects(() => verifyIdToken(`${token()}tampered`, {
  certificates: { 'test-key': publicKey.export({ type: 'spki', format: 'pem' }) },
  nowSeconds: now,
}), /INVALID_FIREBASE_SIGNATURE/);

console.log('payment, capability, idempotency and Firebase identity contracts passed');
