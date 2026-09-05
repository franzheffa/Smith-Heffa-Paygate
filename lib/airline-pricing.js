export const PRICING_VERSION = 'SH_PRICING_2026_09_V2';

const ZERO_DECIMAL_CURRENCIES = new Set(['XAF']);
const FIXED_TICKETING_FEE_MINOR = {
  USD: 1743,
  EUR: 1500,
  XAF: 10000,
};
const PAWAPAY_RAILS = new Set(['PawaPay']);

function parseMinorUnits(amount, currency) {
  const normalized = String(amount || '').trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('INVALID_PROVIDER_FARE');
  const [whole, fraction = ''] = normalized.split('.');
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) {
    if (fraction && Number(fraction) !== 0) throw new Error('INVALID_ZERO_DECIMAL_FARE');
    return BigInt(whole);
  }
  return BigInt(whole) * 100n + BigInt((fraction + '00').slice(0, 2));
}

function formatMinorUnits(minor, currency) {
  const value = BigInt(minor);
  if (ZERO_DECIMAL_CURRENCIES.has(currency)) return value.toString();
  const whole = value / 100n;
  const fraction = (value % 100n).toString().padStart(2, '0');
  return `${whole}.${fraction}`;
}

export function calculateAirlinePricing({ providerFare, currency, ticketCount, paymentRail }) {
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  const normalizedRail = String(paymentRail || '').trim();
  const count = Number(ticketCount);
  if (!Number.isInteger(count) || count < 1 || count > 9) throw new Error('INVALID_TICKET_COUNT');
  if (normalizedCurrency === 'CAD') throw new Error('FX_TEMPORARILY_UNAVAILABLE');
  if (!Object.hasOwn(FIXED_TICKETING_FEE_MINOR, normalizedCurrency)) throw new Error('PRICING_CURRENCY_UNSUPPORTED');

  const providerFareMinor = parseMinorUnits(providerFare, normalizedCurrency);
  const fixedFeeMinor = BigInt(FIXED_TICKETING_FEE_MINOR[normalizedCurrency]) * BigInt(count);
  const subtotalMinor = providerFareMinor + fixedFeeMinor;
  // 150 bps is applied once to the processed subtotal, then rounded half-up.
  const railFeeMinor = PAWAPAY_RAILS.has(normalizedRail) ? ((subtotalMinor * 150n) + 5000n) / 10000n : 0n;
  const totalMinor = subtotalMinor + railFeeMinor;

  return {
    pricingVersion: PRICING_VERSION,
    currency: normalizedCurrency,
    ticketCount: count,
    paymentRail: normalizedRail,
    providerFare: formatMinorUnits(providerFareMinor, normalizedCurrency),
    fixedTicketingFee: formatMinorUnits(fixedFeeMinor, normalizedCurrency),
    railFee: formatMinorUnits(railFeeMinor, normalizedCurrency),
    total: formatMinorUnits(totalMinor, normalizedCurrency),
    railFeeBasisPoints: PAWAPAY_RAILS.has(normalizedRail) ? 150 : 0,
  };
}
