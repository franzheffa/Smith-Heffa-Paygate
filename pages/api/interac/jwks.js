/**
 * GET /api/interac/jwks
 * JWKS public endpoint — lu par Interac Hub pour valider les JWTs signés
 * BUTTERTECH INC — Smith-Heffa-Paygate
 * Hub Client ID: e94e866b-3955-496b-99ac-5afe64e133d5
 */
import { readFile } from 'fs/promises';
import path from 'path';

async function readFallbackJwks() {
  const filePath = path.join(process.cwd(), 'public', 'interac-jwks.json');
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const n = process.env.INTERAC_PUBLIC_KEY_N;
  const e = process.env.INTERAC_PUBLIC_KEY_E;
  const kid = process.env.INTERAC_KID;

  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.setHeader('Content-Type', 'application/json');

  if (n && e && kid) {
    return res.status(200).json({
      keys: [{
        use: 'sig',
        kty: 'RSA',
        kid,
        alg: 'RS256',
        n,
        e,
      }],
    });
  }

  return readFallbackJwks()
    .then((jwks) => res.status(200).json(jwks))
    .catch(() => res.status(500).json({ error: 'JWKS not configured' }));
}
