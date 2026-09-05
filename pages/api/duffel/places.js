import { duffelFetch, requireDuffelConfig } from '../../../lib/duffel';
import { handleMobileReadCors } from '../../../lib/mobile-api';

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const config = requireDuffelConfig();
  if (!config.ready) {
    return res.status(503).json({ ok: false, error: 'Duffel not configured', missing: config.missing });
  }

  const query = String(req.query.query || req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ ok: false, error: 'Missing query' });
  }

  const response = await duffelFetch('/places/suggestions', {
    query: { query, limit: req.query.limit || 10 },
  });

  return res.status(response.status).json({
    ok: response.ok,
    query,
    ...response.data,
  });
}
