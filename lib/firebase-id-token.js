import crypto from 'crypto';

const CERT_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
const PROJECT_ID = 'smith-heffa-paygate-mobile';
let cachedCertificates = null;
let certificateExpiry = 0;

function decodeJson(value) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
  } catch {
    throw new Error('INVALID_FIREBASE_TOKEN');
  }
}

function maxAge(headers) {
  const match = /max-age=(\d+)/i.exec(headers.get('cache-control') || '');
  return match ? Number(match[1]) : 300;
}

async function googleCertificates() {
  if (cachedCertificates && certificateExpiry > Date.now()) return cachedCertificates;
  const response = await fetch(CERT_URL, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('FIREBASE_CERTIFICATES_UNAVAILABLE');
  cachedCertificates = await response.json();
  certificateExpiry = Date.now() + Math.max(60, maxAge(response.headers)) * 1000;
  return cachedCertificates;
}

function assertClaims(payload, projectId, nowSeconds) {
  if (payload.aud !== projectId) throw new Error('INVALID_FIREBASE_AUDIENCE');
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error('INVALID_FIREBASE_ISSUER');
  if (typeof payload.sub !== 'string' || !payload.sub || payload.sub.length > 128) throw new Error('INVALID_FIREBASE_SUBJECT');
  if (!Number.isFinite(payload.exp) || payload.exp <= nowSeconds) throw new Error('EXPIRED_FIREBASE_TOKEN');
  if (!Number.isFinite(payload.iat) || payload.iat > nowSeconds + 300) throw new Error('INVALID_FIREBASE_ISSUED_AT');
  if (payload.auth_time != null && (!Number.isFinite(payload.auth_time) || payload.auth_time > nowSeconds + 300)) throw new Error('INVALID_FIREBASE_AUTH_TIME');
}

export async function verifyIdToken(token, options = {}) {
  const raw = String(token || '').trim();
  const parts = raw.split('.');
  if (parts.length !== 3) throw new Error('INVALID_FIREBASE_TOKEN');
  const header = decodeJson(parts[0]);
  const payload = decodeJson(parts[1]);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) throw new Error('INVALID_FIREBASE_ALGORITHM');

  const projectId = options.projectId || PROJECT_ID;
  const nowSeconds = options.nowSeconds ?? Math.floor(Date.now() / 1000);
  assertClaims(payload, projectId, nowSeconds);

  const certificates = options.certificates || await googleCertificates();
  const certificate = certificates[header.kid];
  if (!certificate) throw new Error('UNKNOWN_FIREBASE_KEY');
  const verified = crypto.verify(
    'RSA-SHA256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    certificate,
    Buffer.from(parts[2], 'base64url'),
  );
  if (!verified) throw new Error('INVALID_FIREBASE_SIGNATURE');

  return {
    uid: payload.sub,
    emailPresent: typeof payload.email === 'string' && payload.email.length > 0,
    emailVerified: payload.email_verified === true,
    provider: String(payload.firebase?.sign_in_provider || ''),
  };
}

export function bearerToken(req) {
  const match = /^Bearer\s+(.+)$/i.exec(String(req.headers.authorization || '').trim());
  return match?.[1]?.trim() || null;
}

export async function requireFirebasePrincipal(req, res, options) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ ok: false, code: 'AUTH_REQUIRED', error: 'Authentication required.' });
    return null;
  }
  try {
    return await verifyIdToken(token, options);
  } catch {
    res.status(401).json({ ok: false, code: 'INVALID_AUTH_TOKEN', error: 'Authentication is invalid or expired.' });
    return null;
  }
}
