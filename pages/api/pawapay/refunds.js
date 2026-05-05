import {
  buildMetadata,
  createId,
  formatAmount,
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
  const refundId = String(req.body?.refundId || '').trim();

  if (action === 'status') {
    if (!refundId) return badRequest(res, 'Missing refundId');
    const result = await pawapayFetch(`/v2/refunds/${encodeURIComponent(refundId)}`);
    return res.status(result.status).json(result.data);
  }

  if (action === 'resendcallback') {
    if (!refundId) return badRequest(res, 'Missing refundId');
    const result = await pawapayFetch(`/v2/refunds/resend-callback/${encodeURIComponent(refundId)}`, { method: 'POST' });
    return res.status(result.status).json(result.data);
  }

  const depositId = String(req.body?.depositId || '').trim();
  const generatedRefundId = createId(req.body?.refundId);
  const amount = req.body?.amount !== undefined ? formatAmount(req.body.amount) : '';
  const currency = String(req.body?.currency || '').trim().toUpperCase();

  if (!depositId) return badRequest(res, 'Missing depositId');
  if (req.body?.amount !== undefined && !amount) return badRequest(res, 'Invalid amount');
  if (req.body?.amount !== undefined && !currency) return badRequest(res, 'Missing currency');

  const payload = {
    refundId: generatedRefundId,
    depositId,
    ...(amount ? { amount } : {}),
    ...(currency ? { currency } : {}),
    ...(req.body?.clientReferenceId ? { clientReferenceId: String(req.body.clientReferenceId).trim() } : {}),
    ...(buildMetadata(req.body?.metadata) ? { metadata: buildMetadata(req.body.metadata) } : {})
  };

  const result = await pawapayFetch('/v2/refunds', { method: 'POST', body: payload });
  return res.status(result.status).json(result.data);
}
