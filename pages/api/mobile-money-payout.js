import crypto from 'crypto';

function envValue(key, fallback = '') {
  return String(process.env[key] ?? fallback).trim();
}

function providerConfig(provider) {
  const map = {
    mtn: {
      name: 'MTN_MOMO',
      baseUrl: envValue('MTN_MOMO_API_BASE_URL'),
      path: envValue('MTN_MOMO_PAYOUT_PATH', '/payouts'),
      required: [
        'MTN_MOMO_API_BASE_URL',
        'MTN_MOMO_API_USER_ID',
        'MTN_MOMO_API_KEY',
        'MTN_MOMO_TARGET_ENVIRONMENT',
        'MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY',
        'MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY'
      ]
    },
    mpesa: {
      name: 'MPESA',
      baseUrl: envValue('MPESA_API_BASE_URL'),
      path: envValue('MPESA_PAYOUT_PATH', '/payouts'),
      required: ['MPESA_API_BASE_URL', 'MPESA_API_KEY']
    },
    orange: {
      name: 'ORANGE_MONEY',
      baseUrl: envValue('ORANGE_MONEY_API_BASE_URL'),
      path: envValue('ORANGE_MONEY_PAYOUT_PATH', '/payouts'),
      required: ['ORANGE_MONEY_API_BASE_URL', 'ORANGE_MONEY_API_KEY']
    }
  };
  return map[provider];
}

function missingVars(keys) {
  return keys.filter((key) => !process.env[key]);
}

function looksLikePlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return true;
  return v.includes('replace_me') || v.includes('example') || v === 'changeme' || v === 'dummy';
}

function preflightReport(provider, cfg) {
  const missing = missingVars(cfg.required);
  const warnings = [];

  if (!cfg.baseUrl) {
    warnings.push('Missing base URL value');
  } else if (looksLikePlaceholder(cfg.baseUrl)) {
    warnings.push('Base URL still uses placeholder value');
  }

  if (provider === 'mtn') {
    const suspectKeys = [
      'MTN_MOMO_API_USER_ID',
      'MTN_MOMO_API_KEY',
      'MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY',
      'MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY'
    ];
    const keyWarnings = suspectKeys.filter((k) => looksLikePlaceholder(envValue(k)));
    if (keyWarnings.length) {
      warnings.push(`Suspicious placeholder values: ${keyWarnings.join(', ')}`);
    }
    return {
      provider: cfg.name,
      ready: missing.length === 0 && warnings.length === 0,
      missing,
      warnings,
      endpoints: {
        tokenCollection: `${mtnBaseUrl()}/collection/token`,
        tokenDisbursement: `${mtnBaseUrl()}/disbursement/token`,
        requestToPay: `${mtnBaseUrl()}/collection/v1_0/requesttopay`,
        transfer: `${mtnBaseUrl()}/disbursement/v1_0/transfer`
      }
    };
  }

  const apiKeyName = `${cfg.name}_API_KEY`;
  if (looksLikePlaceholder(envValue(apiKeyName)) || looksLikePlaceholder(envValue('MOBILE_MONEY_API_KEY'))) {
    warnings.push(`API key appears to be placeholder: ${apiKeyName} or MOBILE_MONEY_API_KEY`);
  }

  return {
    provider: cfg.name,
    ready: missing.length === 0 && warnings.length === 0,
    missing,
    warnings,
    endpoint: `${cfg.baseUrl || ''}${cfg.path || ''}`
  };
}

function mtnBaseUrl() {
  return envValue('MTN_MOMO_API_BASE_URL', 'https://sandbox.momodeveloper.mtn.com').replace(/\/+$/, '');
}

function mtnTargetEnvironment() {
  return envValue('MTN_MOMO_TARGET_ENVIRONMENT', 'sandbox');
}

function parseMaybeJson(raw) {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch (_) {
    return { raw };
  }
}

function noCacheHeaders(headers = {}) {
  return {
    ...headers,
    'Cache-Control': 'no-store'
  };
}

async function mtnFetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const raw = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    data: parseMaybeJson(raw)
  };
}

async function mtnToken(product) {
  const productKey = String(product || '').toUpperCase();
  const apiUser = process.env.MTN_MOMO_API_USER_ID;
  const apiKey = process.env.MTN_MOMO_API_KEY;
  const subKey = process.env[`MTN_MOMO_${productKey}_SUBSCRIPTION_KEY`];
  if (!apiUser || !apiKey || !subKey) {
    return {
      ok: false,
      status: 503,
      data: {
        error: 'MTN credentials missing',
        missing: ['MTN_MOMO_API_USER_ID', 'MTN_MOMO_API_KEY', `MTN_MOMO_${productKey}_SUBSCRIPTION_KEY`].filter((k) => !process.env[k])
      }
    };
  }
  const basic = Buffer.from(`${apiUser}:${apiKey}`).toString('base64');
  return mtnFetchJson(`${mtnBaseUrl()}/${product}/token`, {
    method: 'POST',
    headers: noCacheHeaders({
      Authorization: `Basic ${basic}`,
      'Ocp-Apim-Subscription-Key': subKey,
      'X-Target-Environment': mtnTargetEnvironment()
    })
  });
}

async function mtnRequestToPay({ amount, currency, phone, reference, payerMessage, payeeNote }) {
  const tokenResult = await mtnToken('collection');
  if (!tokenResult.ok || !tokenResult.data?.access_token) return tokenResult;

  const subKey = process.env.MTN_MOMO_COLLECTION_SUBSCRIPTION_KEY;
  return mtnFetchJson(`${mtnBaseUrl()}/collection/v1_0/requesttopay`, {
    method: 'POST',
    headers: noCacheHeaders({
      Authorization: `Bearer ${tokenResult.data.access_token}`,
      'X-Reference-Id': reference,
      'X-Target-Environment': mtnTargetEnvironment(),
      'Ocp-Apim-Subscription-Key': subKey,
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      amount: String(amount),
      currency,
      externalId: reference,
      payer: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage,
      payeeNote
    })
  });
}

async function mtnDisbursementTransfer({ amount, currency, phone, reference, payerMessage, payeeNote }) {
  const tokenResult = await mtnToken('disbursement');
  if (!tokenResult.ok || !tokenResult.data?.access_token) return tokenResult;

  const subKey = process.env.MTN_MOMO_DISBURSEMENT_SUBSCRIPTION_KEY;
  return mtnFetchJson(`${mtnBaseUrl()}/disbursement/v1_0/transfer`, {
    method: 'POST',
    headers: noCacheHeaders({
      Authorization: `Bearer ${tokenResult.data.access_token}`,
      'X-Reference-Id': reference,
      'X-Target-Environment': mtnTargetEnvironment(),
      'Ocp-Apim-Subscription-Key': subKey,
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify({
      amount: String(amount),
      currency,
      externalId: reference,
      payee: { partyIdType: 'MSISDN', partyId: phone },
      payerMessage,
      payeeNote
    })
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const action = String(req.body?.action || '').toLowerCase();
  const provider = String(req.body?.provider || '').toLowerCase();
  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'XAF').toUpperCase();
  const phone = String(req.body?.phone || '').trim();
  const country = String(req.body?.country || 'CM').toUpperCase();
  const reference = String(req.body?.reference || crypto.randomUUID());
  const operation = String(req.body?.operation || 'disbursement').toLowerCase();
  const dryRun = Boolean(req.body?.dryRun ?? true);
  const simulateFallback = Boolean(req.body?.simulateFallback ?? true);

  const cfg = providerConfig(provider);
  if (!cfg) {
    return res.status(400).json({ error: 'Unsupported provider', allowed: ['mtn', 'mpesa', 'orange'] });
  }

  if (action === 'preflight') {
    return res.status(200).json(preflightReport(provider, cfg));
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!phone) {
    return res.status(400).json({ error: 'Missing phone' });
  }

  const missing = missingVars(cfg.required);
  if (missing.length) {
    return res.status(503).json({ error: 'Provider not configured', provider: cfg.name, missing });
  }

  const payload = {
    amount,
    currency,
    phone,
    country,
    reference,
    operation
  };

  const preflight = preflightReport(provider, cfg);
  const notReadyForLive = !preflight.ready;

  if (dryRun) {
    return res.status(200).json({
      provider: cfg.name,
      status: 'SIMULATED_ACCEPTED',
      mode: 'DRY_RUN',
      payload
    });
  }

  if (simulateFallback && notReadyForLive) {
    return res.status(200).json({
      provider: cfg.name,
      status: 'SIMULATED_ACCEPTED',
      mode: 'SIMULATION_FALLBACK',
      reason: 'Provider configuration is not ready for live execution',
      diagnostics: {
        missing: preflight.missing || [],
        warnings: preflight.warnings || []
      },
      payload
    });
  }

  try {
    if (provider === 'mtn') {
      const payerMessage = String(req.body?.payerMessage || 'MTN payout');
      const payeeNote = String(req.body?.payeeNote || 'MTN payout');
      const isCollection = ['collection', 'collect', 'requesttopay'].includes(operation);

      const result = isCollection
        ? await mtnRequestToPay({ amount, currency, phone, reference, payerMessage, payeeNote })
        : await mtnDisbursementTransfer({ amount, currency, phone, reference, payerMessage, payeeNote });

      if (simulateFallback && !result.ok) {
        return res.status(200).json({
          provider: 'MTN_MOMO',
          operation: isCollection ? 'requesttopay' : 'transfer',
          referenceId: reference,
          status: 'SIMULATED_ACCEPTED',
          mode: 'SIMULATION_FALLBACK',
          reason: 'MTN live call failed, returned simulation result',
          upstream: {
            status: result.status,
            data: result.data
          },
          payload
        });
      }

      return res.status(result.status).json({
        provider: 'MTN_MOMO',
        operation: isCollection ? 'requesttopay' : 'transfer',
        referenceId: reference,
        ...result.data
      });
    }

    const response = await fetch(`${cfg.baseUrl}${cfg.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${process.env[`${cfg.name}_API_KEY`] || process.env.MOBILE_MONEY_API_KEY || ''}`,
        'X-Api-Key': process.env[`${cfg.name}_API_KEY`] || process.env.MOBILE_MONEY_API_KEY || ''
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = { raw };
    }
    if (simulateFallback && !response.ok) {
      return res.status(200).json({
        provider: cfg.name,
        status: 'SIMULATED_ACCEPTED',
        mode: 'SIMULATION_FALLBACK',
        reason: 'Provider live call failed, returned simulation result',
        upstream: {
          status: response.status,
          data
        },
        payload
      });
    }

    return res.status(response.status).json(data);
  } catch (error) {
    if (simulateFallback) {
      return res.status(200).json({
        provider: cfg?.name,
        status: 'SIMULATED_ACCEPTED',
        mode: 'SIMULATION_FALLBACK',
        reason: 'Provider request threw an exception, returned simulation result',
        payload
      });
    }
    return res.status(500).json({
      error: 'Mobile Money payout failed',
      provider: cfg?.name,
      hint: 'Check provider base URL, payout path, API key, and network reachability.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
