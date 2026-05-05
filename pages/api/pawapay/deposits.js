import {
  buildMetadata,
  createId,
  formatAmount,
  normalizePhoneNumber,
  pawapayFetch,
  requirePawapayConfig
} from '../../../lib/pawapay';

function badRequest(res, error) {
  return res.status(400).json({ error });
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

  const action = String(req.body?.action || 'initiate').toLowerCase();

  if (action === 'status') {
    const depositId = String(req.body?.depositId || '').trim();
    if (!depositId) return badRequest(res, 'Missing depositId');
    const result = await pawapayFetch(`/v2/deposits/${encodeURIComponent(depositId)}`);
    return res.status(result.status).json(result.data);
  }

  if (action === 'resendcallback') {
    const depositId = String(req.body?.depositId || '').trim();
    if (!depositId) return badRequest(res, 'Missing depositId');
    const result = await pawapayFetch(`/v2/deposits/resend-callback/${encodeURIComponent(depositId)}`, { method: 'POST' });
    return res.status(result.status).json(result.data);
  }

  const amount = formatAmount(req.body?.amount);
  const currency = String(req.body?.currency || '').trim().toUpperCase();
  const provider = String(req.body?.provider || req.body?.payer?.accountDetails?.provider || '').trim().toUpperCase();
  const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber || req.body?.phone, req.body?.prefix);
  const depositId = createId(req.body?.depositId);

  if (!amount) return badRequest(res, 'Invalid amount');
  if (!currency) return badRequest(res, 'Missing currency');
  if (!provider) return badRequest(res, 'Missing provider');
  if (!phoneNumber) return badRequest(res, 'Missing phoneNumber');

  const payload = {
    depositId,
    amount,
    currency,
    payer: {
      type: 'MMO',
      accountDetails: {
        phoneNumber,
        provider
      }
    },
    ...(req.body?.preAuthorisationCode ? { preAuthorisationCode: String(req.body.preAuthorisationCode).trim() } : {}),
    ...(req.body?.customerMessage ? { customerMessage: String(req.body.customerMessage).trim() } : {}),
    ...(req.body?.clientReferenceId ? { clientReferenceId: String(req.body.clientReferenceId).trim() } : {}),
    ...(req.body?.successfulUrl ? { successfulUrl: String(req.body.successfulUrl).trim() } : {}),
    ...(req.body?.failedUrl ? { failedUrl: String(req.body.failedUrl).trim() } : {}),
    ...(buildMetadata(req.body?.metadata) ? { metadata: buildMetadata(req.body.metadata) } : {})
  };

  const result = await pawapayFetch('/v2/deposits', { method: 'POST', body: payload });
  return res.status(result.status).json(result.data);
}
