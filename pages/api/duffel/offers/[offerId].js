import { duffelFetch, requireDuffelConfig } from '../../../../lib/duffel';
import { handleMobileReadCors } from '../../../../lib/mobile-api';

export default async function handler(req, res) {
  if (handleMobileReadCors(req, res)) return;
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const config = requireDuffelConfig();
  if (!config.ready) return res.status(503).json({ ok: false, error: 'Duffel not configured', missing: config.missing });

  const offerId = String(req.query.offerId || '').trim();
  if (!offerId) return res.status(400).json({ ok: false, error: 'Missing offer id' });

  const response = await duffelFetch(`/air/offers/${encodeURIComponent(offerId)}`, { reqHeaders: req.headers });
  return res.status(response.status).json({ ok: response.ok, ...response.data });
}
