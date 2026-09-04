import { duffelReadiness } from '../../../lib/duffel';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  const readiness = duffelReadiness(req.headers.origin);
  return res.status(readiness.ready ? 200 : 503).json({
    ok: readiness.ready,
    provider: 'Duffel',
    ...readiness,
  });
}
