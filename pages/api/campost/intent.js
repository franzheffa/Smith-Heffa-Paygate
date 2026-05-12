import { appendPaymentAudit, upsertPaymentLedger } from '../../../lib/paygate/ledger';

function looksLikePlaceholder(value) {
  const v = String(value || '').trim().toLowerCase();
  return !v || v.includes('replace_me') || v.includes('example') || v === 'changeme' || v === 'dummy';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const action = String(req.body?.action || '').toLowerCase();
  const apiBaseUrl = String(process.env.CAMPOST_API_BASE_URL || '').trim();
  const apiKey = String(process.env.CAMPOST_API_KEY || '').trim();
  const missing = ['CAMPOST_API_BASE_URL', 'CAMPOST_API_KEY'].filter((key) => !process.env[key]);
  const warnings = [];

  if (looksLikePlaceholder(apiBaseUrl)) warnings.push('CAMPOST_API_BASE_URL looks like placeholder');
  if (looksLikePlaceholder(apiKey)) warnings.push('CAMPOST_API_KEY looks like placeholder');

  if (action === 'preflight') {
    return res.status(200).json({
      ok: true,
      ready: missing.length === 0,
      missing,
      warnings,
      rail: 'CAMPOST',
      provider: 'campost'
    });
  }

  const amount = Number(req.body?.amount || 0);
  const reference = String(req.body?.reference || `CAMPOST-${Date.now()}`);
  const currency = String(req.body?.currency || 'XAF').toUpperCase();
  const customerPhone = String(req.body?.customerPhone || '').trim();
  const description = String(req.body?.description || 'Smith-Heffa Campost intent');

  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ ok: false, error: 'Invalid amount' });
  }

  const status = missing.length === 0 ? 'PENDING' : 'CONFIG_MISSING';
  const traceabilityId = `campost-${reference}`;

  try {
    await upsertPaymentLedger(req, {
      traceabilityId,
      amount,
      currency,
      status,
      type: 'CAMPOST',
      rail: 'CAMPOST'
    });
    await appendPaymentAudit(req, {
      action: missing.length === 0 ? 'CAMPOST_INTENT_CREATED' : 'CAMPOST_CONFIG_MISSING',
      resourceId: traceabilityId,
      providerIntentId: traceabilityId,
      payload: {
        rail: 'CAMPOST',
        provider: 'campost',
        amount,
        currency,
        customerPhone,
        description,
        missing,
        warnings
      }
    });
  } catch (error) {
    console.warn('[campost][ledger]', error?.message || error);
  }

  return res.status(200).json({
    ok: missing.length === 0,
    rail: 'CAMPOST',
    provider: 'campost',
    reference,
    externalId: traceabilityId,
    status,
    currency,
    amount,
    customerPhone,
    missing,
    warnings,
    message: missing.length === 0
      ? 'Intention Campost préparée. Le rail est prêt à être branché au connecteur souverain.'
      : 'Rail Campost ajouté en préparation. Complétez CAMPOST_API_BASE_URL et CAMPOST_API_KEY pour le live.'
  });
}
