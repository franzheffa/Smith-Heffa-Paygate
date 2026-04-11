import { generatePain001, validateIban } from '../../../lib/sepa-pain001';

function railConfig(rail) {
  if (rail === 'swift') {
    return {
      name: 'SWIFT',
      baseUrl: process.env.SWIFT_API_BASE_URL,
      path: process.env.SWIFT_PAYOUT_PATH || '/payouts',
      required: ['SWIFT_API_BASE_URL', 'SWIFT_API_KEY']
    };
  }
  if (rail === 'sepa') {
    return {
      name: 'SEPA',
      baseUrl: process.env.SEPA_API_BASE_URL,
      path: process.env.SEPA_PAYOUT_PATH || '/payouts',
      required: ['SEPA_API_BASE_URL', 'SEPA_API_KEY']
    };
  }
  if (rail === 'interac') {
    return {
      name: 'INTERAC',
      baseUrl: process.env.INTERAC_API_BASE_URL || 'https://api.interac.ca/v1',
      path: '/etransfer/v2/send',
      required: ['INTERAC_API_BASE_URL', 'INTERAC_API_KEY']
    };
  }
  return null;
}

function missingVars(keys) {
  return keys.filter((key) => !process.env[key]);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const rail = String(req.body?.rail || '').toLowerCase();
  const amount = Number(req.body?.amount);
  const currency = String(req.body?.currency || (rail === 'sepa' ? 'EUR' : 'USD')).toUpperCase();
  const beneficiaryName = String(req.body?.beneficiaryName || '').trim();
  const accountNumber = String(req.body?.accountNumber || '').trim();
  const iban = String(req.body?.iban || '').trim();
  const bic = String(req.body?.bic || '').trim();
  const reference = String(req.body?.reference || `${rail.toUpperCase()}-${Date.now()}`);
  const dryRun = Boolean(req.body?.dryRun ?? true);

  const cfg = railConfig(rail);
  if (!cfg) {
    return res.status(400).json({ error: 'Unsupported rail', allowed: ['swift', 'sepa'] });
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }
  if (!beneficiaryName) {
    return res.status(400).json({ error: 'Missing beneficiaryName' });
  }
  if (!iban && !accountNumber) {
    return res.status(400).json({ error: 'Missing iban/accountNumber' });
  }

  const missing = missingVars(cfg.required);
  if (missing.length) {
    return res.status(503).json({ error: 'Rail not configured', rail: cfg.name, missing });
  }

  const payload = {
    amount,
    currency,
    beneficiaryName,
    accountNumber: accountNumber || undefined,
    iban: iban || undefined,
    bic: bic || undefined,
    reference
  };

  if (dryRun) {
    return res.status(200).json({
      rail: cfg.name,
      status: 'SIMULATED_ACCEPTED',
      payload
    });
  }

  try {
    const apiKey = process.env[`${cfg.name}_API_KEY`];
    const response = await fetch(`${cfg.baseUrl}${cfg.path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Api-Key': apiKey
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
      error: 'Bank transfer payout failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
