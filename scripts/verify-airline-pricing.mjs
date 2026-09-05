import assert from 'node:assert/strict';
import { calculateAirlinePricing } from '../lib/airline-pricing.js';

function priced(input) {
  return calculateAirlinePricing(input);
}

assert.deepEqual(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'Stripe' }), {
  pricingVersion: 'SH_PRICING_2026_09_V2', currency: 'EUR', ticketCount: 1, paymentRail: 'Stripe', providerFare: '500.00', fixedTicketingFee: '15.00', railFee: '0.00', total: '515.00', railFeeBasisPoints: 0,
});
assert.equal(priced({ providerFare: '1000.00', currency: 'EUR', ticketCount: 2, paymentRail: 'Apple Pay' }).total, '1030.00');
assert.equal(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'PawaPay' }).railFee, '7.73');
assert.equal(priced({ providerFare: '500.00', currency: 'EUR', ticketCount: 1, paymentRail: 'PawaPay' }).total, '522.73');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).fixedTicketingFee, '10000');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).railFee, '4650');
assert.equal(priced({ providerFare: '300000', currency: 'XAF', ticketCount: 1, paymentRail: 'PawaPay' }).total, '314650');
assert.equal(priced({ providerFare: '1599.75', currency: 'USD', ticketCount: 1, paymentRail: 'Stripe' }).total, '1617.18');
assert.equal(priced({ providerFare: '1599.75', currency: 'USD', ticketCount: 2, paymentRail: 'Apple Pay' }).fixedTicketingFee, '34.86');
assert.equal(priced({ providerFare: '1599.75', currency: 'USD', ticketCount: 1, paymentRail: 'PawaPay' }).railFee, '24.26');
assert.equal(priced({ providerFare: '1599.75', currency: 'USD', ticketCount: 1, paymentRail: 'PawaPay' }).total, '1641.44');
assert.throws(() => priced({ providerFare: '500.00', currency: 'CAD', ticketCount: 1, paymentRail: 'Stripe' }), /FX_TEMPORARILY_UNAVAILABLE/);

for (const currency of ['USD', 'EUR', 'XAF']) {
  for (const ticketCount of [1, 2, 3, 9]) {
    for (const paymentRail of ['Stripe', 'Apple Pay', 'PawaPay']) {
      const fare = currency === 'XAF' ? '123456' : '1234.56';
      const result = priced({ providerFare: fare, currency, ticketCount, paymentRail });
      assert.match(result.total, currency === 'XAF' ? /^\d+$/ : /^\d+\.\d{2}$/);
      assert.equal(result.railFeeBasisPoints, paymentRail === 'PawaPay' ? 150 : 0);
      assert.ok(BigInt(result.total.replace('.', '')) >= BigInt(result.providerFare.replace('.', '')));
    }
  }
}

console.log('airline pricing checks passed');
