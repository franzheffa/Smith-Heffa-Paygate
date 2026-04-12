const { fdxGaps, fdxReadiness } = require('../../../lib/fdx');

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const readiness = fdxReadiness();
  const gaps = fdxGaps(readiness);

  return res.status(200).json({
    ok: true,
    asOf: new Date().toISOString(),
    readiness,
    gaps,
    note: 'Internal readiness metadata for Smith-Heffa-Paygate. This is not an official FDX certification artifact.'
  });
}
