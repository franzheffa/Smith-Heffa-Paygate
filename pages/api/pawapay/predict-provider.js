import { pawapayFetch, requirePawapayConfig } from '../../../lib/pawapay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const config = requirePawapayConfig();
  if (!config.ready) {
    return res.status(503).json({ error: 'pawaPay not configured', missing: config.missing, baseUrl: config.baseUrl });
  }

  const phoneNumber = String(req.body?.phoneNumber || '').trim();
  if (!phoneNumber) {
    return res.status(400).json({ error: 'Missing phoneNumber' });
  }

  const result = await pawapayFetch('/v2/predict-provider', {
    method: 'POST',
    body: { phoneNumber }
  });

  return res.status(result.status).json(result.data);
}
