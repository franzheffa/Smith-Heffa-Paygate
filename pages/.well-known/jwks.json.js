import { readFile } from 'fs/promises';
import path from 'path';

export default function JwksPage() {
  return null;
}

async function loadJwks() {
  const n = process.env.INTERAC_PUBLIC_KEY_N;
  const e = process.env.INTERAC_PUBLIC_KEY_E;
  const kid = process.env.INTERAC_KID;

  if (n && e && kid) {
    return {
      keys: [{
        use: 'sig',
        kty: 'RSA',
        kid,
        alg: 'RS256',
        n,
        e,
      }],
    };
  }

  const filePath = path.join(process.cwd(), 'public', 'interac-jwks.json');
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export async function getServerSideProps({ req, res }) {
  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return { props: {} };
  }

  try {
    const jwks = await loadJwks();
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(jwks));
  } catch {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'JWKS not configured' }));
  }

  return { props: {} };
}
