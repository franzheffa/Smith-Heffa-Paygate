export const PRICING_VERSION = 'SH_PRICING_2026_09_V3';

const USD_TICKET_FEE_MINOR = 1759n;
const PLATFORM_TRANSACTION_FEE_BPS = 200n;
const CURRENCY_MINOR_DIGITS = Object.freeze({
  BIF: 0, CLP: 0, DJF: 0, EUR: 2, GBP: 2, JPY: 0, KMF: 0,
  KRW: 0, MGA: 0, PYG: 0, RWF: 0, UGX: 0, USD: 2, VND: 0,
  VUV: 0, XAF: 0, XOF: 0,
});

function minorDigits(currency) {
  return CURRENCY_MINOR_DIGITS[currency] ?? 2;
}

function pow10(value) {
  return 10n ** BigInt(value);
}

function roundHalfUp(numerator, denominator) {
  if (denominator <= 0n || numerator < 0n) throw new Error('INVALID_MONEY_RATIO');
  return (numerator + denominator / 2n) / denominator;
}

function parseDecimalRatio(value, code) {
  const normalized = String(value || '').trim();
  if (!/^\d+(?:\.\d{1,8})?$/.test(normalized) || Number(normalized) <= 0) throw new Error(code);
  const [whole, fraction = ''] = normalized.split('.');
  const denominator = pow10(fraction.length);
  return {
    numerator: BigInt(whole) * denominator + BigInt(fraction || '0'),
    denominator,
    normalized,
  };
}

export function parseMinorUnits(amount, currency) {
  const normalized = String(amount || '').trim();
  const digits = minorDigits(currency);
  const pattern = digits === 0 ? /^\d+(?:\.0+)?$/ : new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`);
  if (!pattern.test(normalized)) throw new Error('INVALID_PROVIDER_FARE');
  const [whole, fraction = ''] = normalized.split('.');
  return BigInt(whole) * pow10(digits) + BigInt((fraction + '0'.repeat(digits)).slice(0, digits) || '0');
}

export function formatMinorUnits(minor, currency) {
  const value = BigInt(minor);
  const digits = minorDigits(currency);
  if (digits === 0) return value.toString();
  const divisor = pow10(digits);
  return `${value / divisor}.${(value % divisor).toString().padStart(digits, '0')}`;
}

function resolveTicketFee({ currency, fxRate, fxSource, fxTimestamp }) {
  if (currency === 'USD') {
    return { feeMinor: USD_TICKET_FEE_MINOR, fxRate: '1', fxSource: 'USD_CANONICAL', fxTimestamp: null };
  }

  const rate = parseDecimalRatio(fxRate, 'FX_TEMPORARILY_UNAVAILABLE');
  const source = String(fxSource || '').trim();
  const timestamp = new Date(String(fxTimestamp || ''));
  if (!source || Number.isNaN(timestamp.getTime())) throw new Error('FX_TEMPORARILY_UNAVAILABLE');

  const feeMinor = roundHalfUp(
    USD_TICKET_FEE_MINOR * rate.numerator * pow10(minorDigits(currency)),
    100n * rate.denominator,
  );
  return { feeMinor, fxRate: rate.normalized, fxSource: source, fxTimestamp: timestamp.toISOString() };
}

export function calculateAirlinePricing({ providerFare, currency, ticketCount, paymentRail, fxRate, fxSource, fxTimestamp }) {
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  const normalizedRail = String(paymentRail || '').trim();
  const count = Number(ticketCount);
  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) throw new Error('PRICING_CURRENCY_UNSUPPORTED');
  if (!Number.isInteger(count) || count < 1 || count > 9) throw new Error('INVALID_TICKET_COUNT');

  const providerFareMinor = parseMinorUnits(providerFare, normalizedCurrency);
  const converted = resolveTicketFee({ currency: normalizedCurrency, fxRate, fxSource, fxTimestamp });
  const fixedFeeMinor = converted.feeMinor * BigInt(count);
  const transactionBaseMinor = providerFareMinor + fixedFeeMinor;
  const platformTransactionFeeMinor = roundHalfUp(transactionBaseMinor * PLATFORM_TRANSACTION_FEE_BPS, 10000n);
  const providerFeeMinor = 0n;
  const totalMinor = transactionBaseMinor + platformTransactionFeeMinor + providerFeeMinor;

  return {
    pricingVersion: PRICING_VERSION,
    currency: normalizedCurrency,
    ticketCount: count,
    paymentRail: normalizedRail,
    providerFare: formatMinorUnits(providerFareMinor, normalizedCurrency),
    fixedTicketingFee: formatMinorUnits(fixedFeeMinor, normalizedCurrency),
    platformTransactionFee: formatMinorUnits(platformTransactionFeeMinor, normalizedCurrency),
    providerFee: formatMinorUnits(providerFeeMinor, normalizedCurrency),
    total: formatMinorUnits(totalMinor, normalizedCurrency),
    platformTransactionFeeBasisPoints: Number(PLATFORM_TRANSACTION_FEE_BPS),
    canonicalTicketFeeUsd: '17.59',
    fxRate: converted.fxRate,
    fxSource: converted.fxSource,
    fxTimestamp: converted.fxTimestamp,
    minorUnits: {
      providerFare: providerFareMinor.toString(),
      fixedTicketingFee: fixedFeeMinor.toString(),
      platformTransactionFee: platformTransactionFeeMinor.toString(),
      providerFee: providerFeeMinor.toString(),
      total: totalMinor.toString(),
    },
  };
}
