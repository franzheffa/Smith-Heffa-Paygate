import crypto from 'crypto';

function providerConfig(provider) {
  const map = {
    mtn: {
      name: 'MTN_MOMO',
      baseUrl: process.env.MTN_MOMO_API_BASE_URL,
      path: process.env.MTN_MOMO_PAYOUT_PATH || '/payouts',
      required: ['MTN_MOMO_API_BASE_URL', 'MTN_MOMO_API_KEY']
    },
    mpesa: {
      name: 'MPESA',
      baseUrl: process.env.MPESA_API_BASE_URL,
      path: process.env.MPESA_PAYOUT_PATH || '/payouts',
      required: ['MPESA_API_BASE_URL', 'MPESA_API_KEY']
    },
    orange: {
      name: 'ORANGE_MONEY',
      baseUrl: process.env.ORANGE_MONEY_API_BASE_URL,
      path: process.env.ORANGE_MONEY_PAYOUT_PATH || '/payouts',
      required: ['ORANGE_MONEY_API_BASE_URL', 'ORANGE_MONEY_API_KEY']
    }
  };
  return map[provider];
}

function missingVars(keys) {
  return keys.filter((key) => !process.env[key]);
}

function mtnBaseUrl() {
  return (process.env.MTN_MOMO_API_BASE_URL || 'https://sandbox.momodeveloper.mtn.com').replace(/\/+$/, '');
}

function mtnTargetEnvironment() {
  return process.env.MTN_MOMO_TARGET_ENVIRONMENT || 'sandbox';
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

  const provider = String(req.body?.provider || '').toLowerCase();
  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || 'XAF').toUpperCase();
  const phone = String(req.body?.phone || '').trim();
  const country = String(req.body?.country || 'CM').toUpperCase();
  const reference = String(req.body?.reference || crypto.randomUUID());
  const operation = String(req.body?.operation || 'disbursement').toLowerCase();
  const dryRun = Boolean(req.body?.dryRun ?? true);

  const cfg = providerConfig(provider);
  if (!cfg) {
    return res.status(400).json({ error: 'Unsupported provider', allowed: ['mtn', 'mpesa', 'orange'] });
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

  if (dryRun) {
    return res.status(200).json({
      provider: cfg.name,
      status: 'SIMULATED_ACCEPTED',
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
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: 'Mobile Money payout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
