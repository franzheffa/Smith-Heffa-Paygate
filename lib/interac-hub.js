/**
 * lib/interac-hub.js
 * Interac Hub OAuth2 PKCE + JWT client_assertion
 * Hub Client ID: e94e866b-3955-496b-99ac-5afe64e133d5
 * Issuer: https://gateway-portal.hub-verify.innovation.interac.ca/
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import crypto from 'crypto';

const HUB_BASE = 'https://gateway-portal.hub-verify.innovation.interac.ca';
const CLIENT_ID = process.env.INTERAC_CLIENT_ID || 'e94e866b-3955-496b-99ac-5afe64e133d5';
const REDIRECT_URI = process.env.INTERAC_REDIRECT_URI;
const SCOPES = 'openid general_scope';
const KID = process.env.INTERAC_KID;

function getPrivateKeyPem() {
  return (process.env.INTERAC_PRIVATE_KEY_PEM || '').replace(/\\n/g, '\n').trim();
}

// ── PKCE ──────────────────────────────────────────────────────────────────────
export function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}
export function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// ── JWT natif Node.js (pas de dépendance) ─────────────────────────────────────
function b64url(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(JSON.stringify(input));
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function signJwt(header, payload, pemKey) {
  const unsigned = `${b64url(header)}.${b64url(payload)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const sig = signer.sign(pemKey).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  return `${unsigned}.${sig}`;
}

// ── OIDC Discovery ────────────────────────────────────────────────────────────
let _cfg = null;
export async function getOidcConfig() {
  if (_cfg) return _cfg;
  const url = `${HUB_BASE}/.well-known/openid-configuration`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Discovery failed ${res.status}: ${url}`);
  _cfg = await res.json();
  return _cfg;
}

// ── Authorization URL (JAR) ───────────────────────────────────────────────────
export async function buildAuthUrl({ state, nonce, codeChallenge }) {
  const cfg = await getOidcConfig();
  const pem = getPrivateKeyPem();
  if (!pem) throw new Error('INTERAC_PRIVATE_KEY_PEM non défini');
  if (!REDIRECT_URI) throw new Error('INTERAC_REDIRECT_URI non défini');

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', kid: KID };
  const claims = {
    iss: CLIENT_ID,
    aud: cfg.issuer,
    client_id: CLIENT_ID,
    scope: SCOPES,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    ui_locale: 'en-CA',
    iat: now,
    exp: now + 300,
  };

  const requestJwt = signJwt(header, claims, pem);
  const params = new URLSearchParams({
    request: requestJwt,
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    state,
    redirect_uri: REDIRECT_URI,
  });

  return `${cfg.authorization_endpoint}?${params.toString()}`;
}

// ── Token Exchange ────────────────────────────────────────────────────────────
export async function exchangeCode({ code, codeVerifier }) {
  const cfg = await getOidcConfig();
  const pem = getPrivateKeyPem();
  if (!pem) throw new Error('INTERAC_PRIVATE_KEY_PEM non défini');

  const now = Math.floor(Date.now() / 1000);
  const clientAssertion = signJwt(
    { alg: 'RS256', kid: KID },
    {
      iss: CLIENT_ID,
      sub: CLIENT_ID,
      aud: cfg.token_endpoint,
      iat: now,
      exp: now + 300,
      jti: crypto.randomUUID(),
    },
    pem
  );

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: clientAssertion,
    code_verifier: codeVerifier,
  });

  const res = await fetch(cfg.token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token exchange ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

// ── UserInfo ──────────────────────────────────────────────────────────────────
export async function fetchUserInfo(accessToken) {
  const cfg = await getOidcConfig();
  const res = await fetch(cfg.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`UserInfo ${res.status}`);
  return res.json();
}
