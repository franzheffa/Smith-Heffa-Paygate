import assert from 'node:assert/strict';
import { calculateAirlinePricing } from '../lib/airline-pricing.js';

function priced(input) {
  return calculateAirlinePricing(input);
}

assert.deepEqual(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'Stripe' }), {
  pricingVersion: 'SH_PRICING_2026_09_V1', currency: 'EUR', ticketCount: 1, paymentRail: 'Stripe', providerFare: '500.00', fixedTicketingFee: '15.00', railFee: '0.00', total: '515.00', railFeeBasisPoints: 0,
});
assert.equal(priced({ providerFare: '1000.00', currency: 'EUR', ticketCount: 2, paymentRail: 'Apple Pay' }).total, '1030.00');
assert.equal(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'PawaPay' }).railFee, '7.72');
assert.equal(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'PawaPay' }).total, '522.72');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).fixedTicketingFee, '10000');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).railFee, '4650');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).total, '314650');
assert.throws(() => priced({ providerFare: '500.00', currency: 'CAD', ticketCount: 1, paymentRail: 'Stripe' }), /PRICING_CURRENCY_UNSUPPORTED/);

console.log('airline pricing checks passed');
