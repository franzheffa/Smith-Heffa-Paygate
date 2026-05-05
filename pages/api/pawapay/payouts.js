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
  const payoutId = String(req.body?.payoutId || '').trim();

  if (action === 'status') {
    if (!payoutId) return badRequest(res, 'Missing payoutId');
    const result = await pawapayFetch(`/v2/payouts/${encodeURIComponent(payoutId)}`);
    return res.status(result.status).json(result.data);
  }

  if (action === 'resendcallback') {
    if (!payoutId) return badRequest(res, 'Missing payoutId');
    const result = await pawapayFetch(`/v2/payouts/resend-callback/${encodeURIComponent(payoutId)}`, { method: 'POST' });
    return res.status(result.status).json(result.data);
  }

  if (action === 'cancelenqueued') {
    if (!payoutId) return badRequest(res, 'Missing payoutId');
    const result = await pawapayFetch(`/v2/payouts/fail-enqueued/${encodeURIComponent(payoutId)}`, { method: 'POST' });
    return res.status(result.status).json(result.data);
  }

  const amount = formatAmount(req.body?.amount);
  const currency = String(req.body?.currency || '').trim().toUpperCase();
  const provider = String(req.body?.provider || req.body?.recipient?.accountDetails?.provider || '').trim().toUpperCase();
  const phoneNumber = normalizePhoneNumber(req.body?.phoneNumber || req.body?.phone, req.body?.prefix);
  const generatedPayoutId = createId(req.body?.payoutId);

  if (!amount) return badRequest(res, 'Invalid amount');
  if (!currency) return badRequest(res, 'Missing currency');
  if (!provider) return badRequest(res, 'Missing provider');
  if (!phoneNumber) return badRequest(res, 'Missing phoneNumber');

  const payload = {
    payoutId: generatedPayoutId,
    amount,
    currency,
    recipient: {
      type: 'MMO',
      accountDetails: {
        phoneNumber,
        provider
      }
    },
    ...(req.body?.customerMessage ? { customerMessage: String(req.body.customerMessage).trim() } : {}),
    ...(req.body?.clientReferenceId ? { clientReferenceId: String(req.body.clientReferenceId).trim() } : {}),
    ...(buildMetadata(req.body?.metadata) ? { metadata: buildMetadata(req.body.metadata) } : {})
  };

  const result = await pawapayFetch('/v2/payouts', { method: 'POST', body: payload });
  return res.status(result.status).json(result.data);
}
