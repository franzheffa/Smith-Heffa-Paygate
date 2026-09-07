import assert from 'node:assert/strict';
import { calculateAirlinePricing } from '../lib/airline-pricing.js';

const usd = calculateAirlinePricing({ providerFare: '100.00', currency: 'USD', ticketCount: 1, paymentRail: 'Stripe' });
assert.equal(usd.pricingVersion, 'SH_PRICING_2026_09_V3');
assert.equal(usd.fixedTicketingFee, '17.59');
assert.equal(usd.platformTransactionFee, '2.35');
assert.equal(usd.providerFee, '0.00');
assert.equal(usd.total, '119.94');

const twoTickets = calculateAirlinePricing({ providerFare: '100.00', currency: 'USD', ticketCount: 2, paymentRail: 'Apple Pay' });
assert.equal(twoTickets.fixedTicketingFee, '35.18');
assert.equal(twoTickets.platformTransactionFee, '2.70');
assert.equal(twoTickets.total, '137.88');

const eur = calculateAirlinePricing({
  providerFare: '100.00', currency: 'EUR', ticketCount: 1, paymentRail: 'Stripe',
  fxRate: '0.92', fxSource: 'ECB_REFERENCE', fxTimestamp: '2026-09-07T00:00:00.000Z',
});
assert.equal(eur.fixedTicketingFee, '16.18');
assert.equal(eur.platformTransactionFee, '2.32');
assert.equal(eur.total, '118.50');

const xaf = calculateAirlinePricing({
  providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay',
  fxRate: '600', fxSource: 'TREASURY_APPROVED', fxTimestamp: '2026-09-07T00:00:00.000Z',
});
assert.equal(xaf.fixedTicketingFee, '10554');
assert.equal(xaf.platformTransactionFee, '6211');
assert.equal(xaf.total, '316765');

assert.throws(() => calculateAirlinePricing({ providerFare: '500.00', currency: 'CAD', ticketCount: 1, paymentRail: 'Interac' }), /FX_TEMPORARILY_UNAVAILABLE/);
assert.throws(() => calculateAirlinePricing({ providerFare: '10.001', currency: 'USD', ticketCount: 1, paymentRail: 'Stripe' }), /INVALID_PROVIDER_FARE/);

console.log('airline pricing V3 checks passed');
