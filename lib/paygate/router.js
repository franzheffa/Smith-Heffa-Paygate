import { DESTINATION_RAILS, SOURCE_RAILS, USE_CASES } from './types';

const AFRICA_MOMO_COUNTRIES = ['BF', 'BJ', 'CD', 'CI', 'CM', 'GH', 'GN', 'KE', 'RW', 'SN', 'TG', 'TZ', 'UG', 'ZM'];

function normalize(value = '') {
  return String(value || '').trim().toUpperCase();
}

export function resolveSourceRail(intent = {}) {
  const sourceRail = normalize(intent.sourceRail);
  const sourceCountry = normalize(intent.sourceCountry);
  const sourceCurrency = normalize(intent.sourceCurrency);

  if (SOURCE_RAILS.includes(sourceRail)) return sourceRail;
  if (AFRICA_MOMO_COUNTRIES.includes(sourceCountry)) return 'PAWAPAY';
  if (sourceCountry === 'CA' && sourceCurrency === 'CAD') return 'INTERAC';
  if (sourceCurrency === 'EUR') return 'SEPA';
  if (['USD', 'CAD', 'EUR'].includes(sourceCurrency)) return 'STRIPE';
  return 'SWIFT';
}

export function resolveDestinationRail(intent = {}) {
  const destinationRail = normalize(intent.destinationRail);
  const destinationCountry = normalize(intent.destinationCountry);
  const destinationCurrency = normalize(intent.destinationCurrency);

  if (DESTINATION_RAILS.includes(destinationRail)) return destinationRail;
  if (AFRICA_MOMO_COUNTRIES.includes(destinationCountry)) return 'PAWAPAY_PAYOUT';
  if (['USD', 'CAD', 'EUR'].includes(destinationCurrency)) return 'BANK_SETTLEMENT';
  return 'MERCHANT_BALANCE';
}

export function resolveUniversalRoute(intent = {}) {
  const useCase = normalize(intent.useCase);
  const sourceRail = resolveSourceRail(intent);
  const destinationRail = resolveDestinationRail(intent);
  const sourceCurrency = normalize(intent.sourceCurrency);
  const destinationCurrency = normalize(intent.destinationCurrency);

  const fallbackSource = sourceRail === 'PAWAPAY'
    ? ['ORANGE_DIRECT', 'MTN_DIRECT', 'CAMPOST']
    : sourceRail === 'INTERAC'
      ? ['STRIPE', 'APPLE_PAY']
      : ['STRIPE'];

  const fallbackDestination = destinationRail === 'PAWAPAY_PAYOUT'
    ? ['ORANGE_PAYOUT', 'MTN_PAYOUT', 'CAMPOST_PAYOUT']
    : ['BANK_SETTLEMENT'];

  return {
    sourceRail,
    destinationRail,
    useCase: USE_CASES.includes(useCase) ? useCase : 'MERCHANT',
    requiresFx: !!sourceCurrency && !!destinationCurrency && sourceCurrency !== destinationCurrency,
    requiresStrongConfirmation: true,
    storesPaymentCredentials: false,
    voiceExecutionAllowed: false,
    fallback: {
      source: fallbackSource,
      destination: fallbackDestination
    }
  };
}
