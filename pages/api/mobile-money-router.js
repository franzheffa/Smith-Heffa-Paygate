import { createId, formatAmount, normalizePhoneNumber, pawapayFetch, requirePawapayConfig } from '../../lib/pawapay';

const COUNTRY_3_TO_2 = {
  BFA: 'BF',
  CIV: 'CI',
  CMR: 'CM',
  COD: 'CD',
  GHA: 'GH',
  KEN: 'KE',
  MOZ: 'MZ',
  RWA: 'RW',
  SEN: 'SN',
  TZA: 'TZ',
  UGA: 'UG',
  ZMB: 'ZM'
};

const DIRECT_COUNTRY_SUPPORT = {
  orange: new Set(['CM', 'SN', 'CI', 'CD', 'BF', 'GN']),
  mtn: new Set(['CM', 'GH', 'UG', 'RW', 'ZM']),
  mpesa: new Set(['KE', 'TZ', 'MZ'])
};

function mapProviderToDirectRail(providerCode = '') {
  const value = String(providerCode || '').toUpperCase();
  if (value.includes('ORANGE')) return 'orange';
  if (value.includes('MTN')) return 'mtn';
  if (value.includes('M-PESA') || value.includes('MPESA') || value.includes('VODACOM')) return 'mpesa';
  return '';
}

function providerLooksOperational(providerConfig, operationType, currency) {
  const currencies = Array.isArray(providerConfig?.currencies) ? providerConfig.currencies : [];
  const matchingCurrency = currencies.find((item) => item.currency === currency) || currencies[0];
  const opConfig = matchingCurrency?.operationTypes?.[operationType];
  return {
    opConfig,
    currency: matchingCurrency?.currency || currency,
    status: opConfig?.status || 'UNKNOWN'
  };
}

function getOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const config = requirePawapayConfig();
  if (!config.ready) {
    return res.status(503).json({ error: 'pawaPay not configured', missing: config.missing, baseUrl: config.baseUrl });
  }

  const operationType = String(req.body?.operationType || (String(req.body?.operation || '').toLowerCase() === 'deposit' ? 'DEPOSIT' : 'PAYOUT')).toUpperCase();
  const country = String(req.body?.country || '').trim().toUpperCase();
  const currency = String(req.body?.currency || '').trim().toUpperCase();
  const amount = formatAmount(req.body?.amount);
  const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber || req.body?.phone, req.body?.prefix);
  const execute = Boolean(req.body?.execute);
  const requestedRail = String(req.body?.forceRail || '').trim().toLowerCase();
  const forceRail = requestedRail && requestedRail !== 'auto' ? requestedRail : '';
  let provider = String(req.body?.provider || '').trim().toUpperCase();

  if (!country) return res.status(400).json({ error: 'Missing country' });
  if (!amount) return res.status(400).json({ error: 'Invalid amount' });
  if (!phoneNumber) return res.status(400).json({ error: 'Missing phoneNumber' });

  if (!provider) {
    const predicted = await pawapayFetch('/v2/predict-provider', {
      method: 'POST',
      body: { phoneNumber }
    });
    provider = String(predicted.data?.provider || '').trim().toUpperCase();
  }

  const activeConf = await pawapayFetch('/v2/active-conf', {
    query: { country, operationType }
  });

  const countryConfig = Array.isArray(activeConf.data?.countries)
    ? activeConf.data.countries.find((item) => item.country === country)
    : null;

  const configuredProviders = Array.isArray(countryConfig?.providers) ? countryConfig.providers : [];
  const matchedProvider = configuredProviders.find((item) => item.provider === provider) || configuredProviders[0] || null;
  const providerHealth = matchedProvider ? providerLooksOperational(matchedProvider, operationType, currency) : { opConfig: null, currency, status: 'UNKNOWN' };

  const directRail = mapProviderToDirectRail(provider || matchedProvider?.provider || '');
  const country2 = COUNTRY_3_TO_2[country] || '';
  const directSupported = directRail && DIRECT_COUNTRY_SUPPORT[directRail]?.has(country2);

  let selectedRail = 'pawapay';
  let reason = 'Primary aggregated rail selected.';

  if (!matchedProvider && directSupported && operationType === 'PAYOUT') {
    selectedRail = directRail;
    reason = 'No pawaPay provider matched; using direct payout fallback.';
  } else if (providerHealth.status === 'CLOSED' && directSupported && operationType === 'PAYOUT') {
    selectedRail = directRail;
    reason = 'pawaPay provider closed; using direct payout fallback.';
  } else if (forceRail && forceRail !== 'pawapay' && forceRail === directRail && directSupported) {
    selectedRail = forceRail;
    reason = 'Forced direct rail selected.';
  } else if (forceRail === 'pawapay') {
    selectedRail = 'pawapay';
    reason = 'Forced pawaPay rail selected.';
  }

  const recommendation = {
    country,
    provider: matchedProvider?.provider || provider,
    selectedRail,
    reason,
    operationType,
    currency: providerHealth.currency || currency,
    pawaPayStatus: providerHealth.status,
    directRail: directSupported ? directRail : '',
    directSupported
  };

  if (!execute) {
    return res.status(200).json({ ok: true, recommendation });
  }

  if (selectedRail === 'pawapay') {
    const payload = operationType === 'DEPOSIT'
      ? {
          depositId: createId(req.body?.depositId),
          amount,
          currency: providerHealth.currency || currency,
          payer: {
            type: 'MMO',
            accountDetails: {
              phoneNumber,
              provider: matchedProvider?.provider || provider
            }
          },
          ...(req.body?.customerMessage ? { customerMessage: String(req.body.customerMessage).trim() } : {}),
          ...(req.body?.clientReferenceId ? { clientReferenceId: String(req.body.clientReferenceId).trim() } : {})
        }
      : {
          payoutId: createId(req.body?.payoutId),
          amount,
          currency: providerHealth.currency || currency,
          recipient: {
            type: 'MMO',
            accountDetails: {
              phoneNumber,
              provider: matchedProvider?.provider || provider
            }
          },
          ...(req.body?.customerMessage ? { customerMessage: String(req.body.customerMessage).trim() } : {}),
          ...(req.body?.clientReferenceId ? { clientReferenceId: String(req.body.clientReferenceId).trim() } : {})
        };

    const result = await pawapayFetch(operationType === 'DEPOSIT' ? '/v2/deposits' : '/v2/payouts', {
      method: 'POST',
      body: payload
    });

    return res.status(result.status).json({
      selectedRail,
      reason,
      ...result.data
    });
  }

  const origin = getOrigin(req);
  const directResponse = await fetch(`${origin}/api/mobile-money-payout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: selectedRail,
      country: country2,
      phoneNumber,
      phone: phoneNumber,
      amount: Number(amount),
      currency: providerHealth.currency || currency,
      operation: operationType === 'DEPOSIT' ? 'collection' : 'disbursement',
      dryRun: false,
      simulateFallback: true
    })
  });

  const data = await directResponse.json().catch(() => null);
  return res.status(directResponse.status).json({
    selectedRail,
    reason,
    ...data
  });
}
