import { requirePawapayConfig } from './pawapay.js';

export const PAYMENT_RAILS = Object.freeze([
  'Stripe',
  'Apple Pay',
  'PayPal',
  'Pix',
  'PawaPay',
  'Orange Money',
  'MTN MoMo',
  'M-Pesa',
  'Campost',
  'SEPA',
  'SWIFT',
  'Interac',
]);

export const CAPABILITY_STATUSES = Object.freeze([
  'AVAILABLE',
  'REQUIRES_SETUP',
  'COMING_SOON',
  'UNAVAILABLE_FOR_COUNTRY',
  'UNAVAILABLE_FOR_CURRENCY',
  'DEVICE_UNAVAILABLE',
  'AUTH_REQUIRED',
  'PROVIDER_UNAVAILABLE',
  'TEMPORARILY_UNAVAILABLE',
]);

const CURRENCY_BY_RAIL = Object.freeze({
  Stripe: ['USD', 'EUR'],
  'Apple Pay': ['USD', 'EUR'],
  PayPal: ['USD', 'EUR'],
  Pix: ['BRL'],
  PawaPay: ['XAF'],
  'Orange Money': ['XAF'],
  'MTN MoMo': ['XAF'],
  'M-Pesa': ['KES', 'TZS'],
  Campost: ['XAF'],
  SEPA: ['EUR'],
  SWIFT: ['USD', 'EUR'],
  Interac: ['CAD'],
});

const COUNTRY_BY_RAIL = Object.freeze({
  Pix: ['BR'],
  PawaPay: ['CM'],
  'Orange Money': ['CM'],
  'MTN MoMo': ['CM'],
  'M-Pesa': ['KE', 'TZ'],
  Campost: ['CM'],
  SEPA: ['EU'],
  Interac: ['CA'],
});

function configured(name) {
  return Boolean(String(process.env[name] || '').trim());
}

function flag(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

function normalized(value) {
  return String(value || '').trim().toUpperCase();
}

function configuration() {
  const stripe = configured('STRIPE_SECRET_KEY') && configured('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  const paypal = configured('PAYPAL_CLIENT_ID') && configured('PAYPAL_CLIENT_SECRET');
  const pawapay = requirePawapayConfig().ready;
  return {
    Stripe: stripe,
    'Apple Pay': stripe && configured('APPLE_PAY_MERCHANT_ID'),
    PayPal: paypal,
    Pix: stripe,
    PawaPay: pawapay,
    'Orange Money': pawapay,
    'MTN MoMo': pawapay,
    'M-Pesa': pawapay,
    Campost: configured('CAMPOST_API_BASE_URL') && configured('CAMPOST_API_TOKEN'),
    SEPA: configured('SEPA_CREDITOR_IBAN'),
    SWIFT: configured('SWIFT_BIC') && configured('SWIFT_ACCOUNT'),
    Interac: configured('INTERAC_CLIENT_ID') && configured('INTERAC_PRIVATE_KEY'),
  };
}

function family(rail) {
  if (['PawaPay', 'Orange Money', 'MTN MoMo', 'M-Pesa'].includes(rail)) return 'MOBILE_MONEY';
  if (['SEPA', 'SWIFT', 'Interac', 'Campost'].includes(rail)) return 'BANK_TRANSFER';
  if (rail === 'Apple Pay') return 'WALLET';
  return 'CARD_OR_ALTERNATIVE';
}

function unavailableStatus({ rail, configured: isConfigured, currency, country, platform, deviceCapable }) {
  if (!isConfigured) return ['REQUIRES_SETUP', 'Configuration fournisseur incomplète.'];
  if (rail === 'Apple Pay' && (platform !== 'IOS' && platform !== 'WEB')) {
    return ['DEVICE_UNAVAILABLE', 'Apple Pay requiert une plateforme Apple ou un navigateur compatible.'];
  }
  if (rail === 'Apple Pay' && deviceCapable === false) {
    return ['DEVICE_UNAVAILABLE', 'Le terminal ne confirme pas la capacité Apple Pay.'];
  }
  const currencies = CURRENCY_BY_RAIL[rail] || [];
  if (currency && currencies.length && !currencies.includes(currency)) {
    return ['UNAVAILABLE_FOR_CURRENCY', `${currency} n’est pas pris en charge par ce rail.`];
  }
  const countries = COUNTRY_BY_RAIL[rail] || [];
  if (country && countries.length && !countries.includes(country) && !countries.includes('EU')) {
    return ['UNAVAILABLE_FOR_COUNTRY', `${country} n’est pas confirmé pour ce rail.`];
  }
  return ['PROVIDER_UNAVAILABLE', 'Exécution financière désactivée dans cet environnement.'];
}

export function paymentCapabilities(input = {}) {
  const country = normalized(input.country);
  const currency = normalized(input.currency);
  const platform = normalized(input.platform || 'WEB');
  const productType = normalized(input.productType || 'FLIGHT');
  const deviceCapable = input.deviceCapable === true
    ? true
    : input.deviceCapable === false
      ? false
      : null;
  const providerConfiguration = configuration();
  const liveExecutionConfigured = flag('PAYMENTS_LIVE_ENABLED');
  const liveExecutionEnabled = false;

  return {
    environment: 'preview-safe',
    liveExecutionConfigured,
    liveExecutionEnabled,
    context: { country: country || null, currency: currency || null, platform, deviceCapable, productType },
    rails: PAYMENT_RAILS.map((rail) => {
      const isConfigured = providerConfiguration[rail] === true;
      const [status, reason] = unavailableStatus({ rail, configured: isConfigured, currency, country, platform, deviceCapable });
      // This phase never enables an execution path. AVAILABLE requires a
      // separately reviewed server release with PAYMENTS_LIVE_ENABLED=true.
      const available = liveExecutionEnabled && isConfigured && status === 'PROVIDER_UNAVAILABLE';
      return {
        rail,
        provider: rail === 'Apple Pay' || rail === 'Pix' ? 'Stripe' : rail,
        family: family(rail),
        configured: isConfigured,
        available,
        status: available ? 'AVAILABLE' : status,
        reason: available ? 'Configuration et exécution serveur confirmées.' : reason,
        supportedCurrencies: CURRENCY_BY_RAIL[rail] || [],
        supportedCountries: COUNTRY_BY_RAIL[rail] || [],
        requiresDeviceCapability: rail === 'Apple Pay',
        environment: 'preview-safe',
      };
    }),
  };
}
