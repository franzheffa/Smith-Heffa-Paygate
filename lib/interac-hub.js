/**
 * lib/interac-hub.js
 * Interac Hub OAuth2 PKCE + optional JWT request object + JWT client_assertion
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import crypto from 'crypto';

function readEnv(name, fallback = '') {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : fallback;
}

const DEFAULT_HUB_BASE = 'https://gateway-portal.hub-verify.innovation.interac.ca';
const WELL_KNOWN_URL = readEnv('INTERAC_OIDC_WELL_KNOWN_URL');
const HUB_BASE = readEnv('INTERAC_HUB_BASE_URL', DEFAULT_HUB_BASE);
const CLIENT_ID = readEnv('INTERAC_CLIENT_ID', 'e94e866b-3955-496b-99ac-5afe64e133d5');
const REDIRECT_URI = readEnv('INTERAC_REDIRECT_URI');
const KID = readEnv('INTERAC_KID');
const UI_LOCALE = readEnv('INTERAC_UI_LOCALE', 'en-CA');
const USE_PAR = readEnv('INTERAC_USE_PAR').toLowerCase() === 'true';
const USE_REQUEST_OBJECT = readEnv('INTERAC_USE_REQUEST_OBJECT', 'true').toLowerCase() === 'true';
const ALLOW_GENERAL_SCOPE = readEnv('INTERAC_ALLOW_GENERAL_SCOPE').toLowerCase() === 'true';

function getInteracScopes() {
  const raw = readEnv('INTERAC_SCOPES', 'openid onlyVme_scope');
  const scopes = raw.split(/\s+/).filter(Boolean);
  const normalized = scopes.includes('openid') ? scopes : ['openid', ...scopes];

  if (!ALLOW_GENERAL_SCOPE && normalized.includes('general_scope')) {
    return normalized
      .filter((value) => value !== 'general_scope')
      .concat(normalized.includes('onlyVme_scope') ? [] : ['onlyVme_scope'])
      .join(' ');
  }

  return normalized.join(' ');
}

const SCOPES = getInteracScopes();

function getPrivateKeyPem() {
  return (process.env.INTERAC_PRIVATE_KEY_PEM || '').replace(/\\n/g, '\n').trim();
}

export function generateCodeVerifier() {
  return crypto.randomBytes(64).toString('base64url');
}

export function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

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
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${unsigned}.${sig}`;
}

let cachedConfig = null;
export async function getOidcConfig() {
  if (cachedConfig) return cachedConfig;
  const url = WELL_KNOWN_URL || `${HUB_BASE}/.well-known/openid-configuration`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Discovery failed ${res.status}: ${url}`);
  cachedConfig = await res.json();
  return cachedConfig;
}

function buildAuthorizationParams({ state, nonce, codeChallenge }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: SCOPES,
    state,
    nonce,
    redirect_uri: REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });
  if (UI_LOCALE) params.set('ui_locale', UI_LOCALE);
  if (UI_LOCALE) params.set('ui_locales', UI_LOCALE);
  return params;
}

export async function buildAuthUrl({ state, nonce, codeChallenge }) {
  const cfg = await getOidcConfig();
  if (!REDIRECT_URI) throw new Error('INTERAC_REDIRECT_URI non défini');

  const params = buildAuthorizationParams({ state, nonce, codeChallenge });

  if (USE_REQUEST_OBJECT) {
    const pem = getPrivateKeyPem();
    if (!pem) throw new Error('INTERAC_PRIVATE_KEY_PEM non défini');
    if (!KID) throw new Error('INTERAC_KID non défini');

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
      ui_locale: UI_LOCALE,
      ui_locales: UI_LOCALE,
      iat: now,
      exp: now + 300,
    };
    params.set('request', signJwt(header, claims, pem));
  }

  if (USE_PAR) {
    if (!cfg.pushed_authorization_request_endpoint) {
      console.warn('[interac][par] endpoint absent, fallback to direct authorization request');
      return `${cfg.authorization_endpoint}?${params.toString()}`;
    }
    try {
      const parRes = await fetch(cfg.pushed_authorization_request_endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      const parData = await parRes.json().catch(() => ({}));
      if (!parRes.ok) {
        console.warn('[interac][par] fallback to direct authorization request', {
          status: parRes.status,
          payload: parData,
        });
        return `${cfg.authorization_endpoint}?${params.toString()}`;
      }
      if (parData.user_href) return parData.user_href;
      if (parData.request_uri) {
        return `${cfg.authorization_endpoint}?${new URLSearchParams({ request_uri: parData.request_uri }).toString()}`;
      }
      console.warn('[interac][par] missing user_href and request_uri, fallback to direct authorization request');
      return `${cfg.authorization_endpoint}?${params.toString()}`;
    } catch (error) {
      console.warn('[interac][par] request failed, fallback to direct authorization request', error?.message || error);
      return `${cfg.authorization_endpoint}?${params.toString()}`;
    }
  }

  return `${cfg.authorization_endpoint}?${params.toString()}`;
}

export async function exchangeCode({ code, codeVerifier }) {
  const cfg = await getOidcConfig();
  const pem = getPrivateKeyPem();
  if (!pem) throw new Error('INTERAC_PRIVATE_KEY_PEM non défini');
  if (!KID) throw new Error('INTERAC_KID non défini');

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
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Token exchange ${res.status}: ${JSON.stringify(data)}`);
  return data;
}

export async function fetchUserInfo(accessToken) {
  const cfg = await getOidcConfig();
  const res = await fetch(cfg.userinfo_endpoint, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  const retryAfter = Number(res.headers.get('retry-after') || '0') || null;
  const data = await res.json().catch(() => ({}));

  if (res.status === 202) {
    return {
      status: 'processing',
      retryAfter,
      data,
    };
  }
  if (!res.ok) {
    const details = typeof data === 'object' ? JSON.stringify(data) : String(data);
    throw new Error(`UserInfo ${res.status}: ${details}`);
  }
  return {
    status: 'complete',
    retryAfter,
    data,
  };
}
