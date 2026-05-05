import { pawapayFetch, requirePawapayConfig } from '../../../lib/pawapay';

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const config = requirePawapayConfig();
  if (!config.ready) {
    return res.status(503).json({ error: 'pawaPay not configured', missing: config.missing, baseUrl: config.baseUrl });
  }

  const input = req.method === 'GET' ? req.query : req.body;
  const result = await pawapayFetch('/v2/active-conf', {
    query: {
      country: input?.country,
      operationType: input?.operationType
    }
  });

  return res.status(result.status).json(result.data);
}
