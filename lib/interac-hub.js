import crypto from 'crypto';
import { buildCanonicalUrl, getCanonicalOrigin, resolveConfiguredPath } from './public-url';

const DEFAULT_BASE_URL = 'https://gateway-portal.hub-verify.innovation.interac.ca';
const DEFAULT_WELL_KNOWN_PATH = '.well-known/openid-configuration';
const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
const DISCOVERY_TIMEOUT_MS = 4000;

let discoveryCache = null;
let discoveryCacheKey = null;

function boolEnv(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

function cleanBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function getBaseUrl() {
  return cleanBaseUrl(process.env.INTERAC_HUB_BASE_URL || process.env.INTERAC_BASE_URL || DEFAULT_BASE_URL);
}

function getWellKnownUrl() {
  return process.env.INTERAC_OIDC_WELL_KNOWN_URL || `${getBaseUrl()}/${DEFAULT_WELL_KNOWN_PATH}`;
}

function getIssuer() {
  return process.env.INTERAC_ISSUER || `${getBaseUrl()}/`;
}

function getAudience() {
  return (
    process.env.INTERAC_AUDIENCE ||
    process.env.INTERAC_REQUEST_AUD ||
    process.env.INTERAC_TOKEN_AUD ||
    getIssuer()
  );
}

function fallbackEndpoint(kind) {
  const wellKnownUrl = cleanBaseUrl(getWellKnownUrl());

  switch (kind) {
    case 'authorization':
      return `${wellKnownUrl}/auth`;
    case 'token':
      return `${wellKnownUrl}/oauth2/token`;
    case 'userinfo':
      return `${wellKnownUrl}/userinfo`;
    default:
      return `${getBaseUrl()}/${kind}`;
  }
}

async function loadDiscoveryDocument() {
  const wellKnownUrl = getWellKnownUrl();

  if (discoveryCache && discoveryCacheKey === wellKnownUrl) {
    return discoveryCache;
  }

  discoveryCacheKey = wellKnownUrl;
  discoveryCache = null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DISCOVERY_TIMEOUT_MS);

  try {
    const response = await fetch(wellKnownUrl, {
      method: 'GET',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });
    const text = await response.text();
    const data = safeJson(text);

    if (!response.ok) {
      console.warn(`[interac] discovery failed ${response.status}; falling back to configured endpoints.`);
      return null;
    }

    discoveryCache = data;
    return data;
  } catch (error) {
    console.warn(`[interac] discovery unavailable (${error.message}); falling back to configured endpoints.`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function resolveEndpoint(envName, kind, fieldName) {
  if (process.env[envName]) return process.env[envName];

  const discovery = await loadDiscoveryDocument();
  if (discovery?.[fieldName]) return discovery[fieldName];

  return fallbackEndpoint(kind);
}

function getClientId() {
  return process.env.INTERAC_CLIENT_ID || '';
}

function getRedirectUri(originOverride) {
  const configured = String(process.env.INTERAC_REDIRECT_URI || '').trim();
  const pathname = resolveConfiguredPath(configured, '/api/interac/callback');
  return buildCanonicalUrl(pathname, originOverride || getCanonicalOrigin());
}

function normalizePem(value) {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

function getPrivateKeyPem() {
  return normalizePem(process.env.INTERAC_PRIVATE_KEY_PEM || process.env.INTERAC_PRIVATE_KEY || '');
}

function getKeyObject() {
  const pem = getPrivateKeyPem();
  if (!pem) return null;
  return crypto.createPrivateKey(pem);
}

function isEcKey(key) {
  return key?.asymmetricKeyType === 'ec';
}

function b64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function jsonB64(data) {
  return b64url(JSON.stringify(data));
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function normalizeScopes() {
  const warnings = [];
  const raw = process.env.INTERAC_SCOPES || process.env.INTERAC_SCOPE || 'openid onlyVme_scope';
  const scopes = [];
  const allowGeneralScope = boolEnv('INTERAC_ALLOW_GENERAL_SCOPE', false);

  for (const original of raw.split(/\s+/).filter(Boolean)) {
    let scope = original === 'onlyVme' ? 'onlyVme_scope' : original;

    if (scope === 'general_scope' && !allowGeneralScope) {
      scope = 'onlyVme_scope';
      warnings.push('INTERAC_SCOPES contained general_scope; remapped to onlyVme_scope for tenant compatibility.');
    }

    if (!scopes.includes(scope)) scopes.push(scope);
  }

  if (!scopes.includes('openid')) scopes.unshift('openid');

  return { scope: scopes.join(' '), warnings };
}

function validateRequiredConfig(originOverride) {
  const missing = [];
  if (!getClientId()) missing.push('INTERAC_CLIENT_ID');
  if (!getRedirectUri(originOverride)) missing.push('INTERAC_REDIRECT_URI');
  return missing;
}

function signJwt(payload) {
  const key = getKeyObject();
  if (!key) {
    throw new Error('INTERAC_PRIVATE_KEY_PEM is required to sign Interac request objects.');
  }

  const header = {
    alg: isEcKey(key) ? 'ES256' : 'RS256',
    kid: process.env.INTERAC_KID || undefined,
    typ: 'JWT',
  };

  const signingInput = `${jsonB64(header)}.${jsonB64(payload)}`;
  const signature = crypto.sign(
    'sha256',
    Buffer.from(signingInput),
    isEcKey(key) ? { key, dsaEncoding: 'ieee-p1363' } : key
  );

  return `${signingInput}.${b64url(signature)}`;
}

function buildAuthorizationPayload({ state, nonce, codeChallenge, originOverride }) {
  const missing = validateRequiredConfig(originOverride);
  if (missing.length > 0) {
    throw new Error(`Interac is not configured: missing ${missing.join(', ')}`);
  }

  const { scope } = normalizeScopes();
  const payload = {
    iss: getClientId(),
    aud: getAudience(),
    response_type: 'code',
    client_id: getClientId(),
    redirect_uri: getRedirectUri(originOverride),
    scope,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  if (process.env.INTERAC_UI_LOCALE) {
    payload.ui_locales = process.env.INTERAC_UI_LOCALE || 'en-CA';
  }

  if (boolEnv('INTERAC_INCLUDE_NONCE', false) && nonce) {
    payload.nonce = nonce;
  }

  return payload;
}

export function generateCodeVerifier() {
  return b64url(crypto.randomBytes(32));
}

export function generateCodeChallenge(verifier) {
  return b64url(crypto.createHash('sha256').update(verifier).digest());
}

export async function buildAuthUrl({ state, nonce, codeChallenge, originOverride }) {
  const authEndpoint = await resolveEndpoint(
    'INTERAC_AUTHORIZATION_ENDPOINT',
    'authorization',
    'authorization_endpoint'
  );
  const payload = buildAuthorizationPayload({ state, nonce, codeChallenge, originOverride });
  const url = new URL(authEndpoint);
  const useRequestObject = process.env.INTERAC_USE_REQUEST_OBJECT !== 'false';
  const privateKeyPem = getPrivateKeyPem();
  const { iss, aud, iat, exp, ...query } = payload;

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  if (boolEnv('INTERAC_USE_PAR', false)) {
    console.warn('[interac] PAR disabled in runtime helper; using direct authorization request.');
  }

  if (useRequestObject && privateKeyPem) {
    // In JAR mode, keep the outer query minimal to avoid duplicated signed
    // parameters that some provider gateways reject or process slowly.
    url.search = '';
    url.searchParams.set('client_id', getClientId());
    url.searchParams.set('request', signJwt(payload));
    return url.toString();
  }

  if (useRequestObject && !privateKeyPem) {
    console.warn('[interac] request object disabled because INTERAC_PRIVATE_KEY_PEM is missing.');
  }

  return url.toString();
}

export async function getInteracReadiness() {
  const missing = validateRequiredConfig();
  const warnings = [];
  const keyPem = getPrivateKeyPem();
  const useRequestObject = process.env.INTERAC_USE_REQUEST_OBJECT !== 'false';
  const { scope, warnings: scopeWarnings } = normalizeScopes();
  warnings.push(...scopeWarnings);

  if (boolEnv('INTERAC_USE_PAR', false)) {
    warnings.push('INTERAC_USE_PAR is ignored by this deployment to avoid PAR invalid_request failures.');
  }

  if (process.env.INTERAC_UI_LOCALE && !boolEnv('INTERAC_INCLUDE_UI_LOCALES', false)) {
    warnings.push('INTERAC_UI_LOCALE is embedded in the signed request object only; outer query duplication is avoided.');
  }

  if (useRequestObject) {
    if (!keyPem) missing.push('INTERAC_PRIVATE_KEY_PEM');
    if (!process.env.INTERAC_KID) missing.push('INTERAC_KID');
    if (keyPem) {
      try {
        getKeyObject();
      } catch (error) {
        warnings.push(`INTERAC_PRIVATE_KEY_PEM is not parseable: ${error.message}`);
      }
    }
  } else {
    warnings.push('Plain PKCE mode enabled; Interac Hub may reject this if your client requires JAR.');
  }

  const authorizationEndpoint = await resolveEndpoint(
    'INTERAC_AUTHORIZATION_ENDPOINT',
    'authorization',
    'authorization_endpoint'
  );
  const tokenEndpoint = await resolveEndpoint(
    'INTERAC_TOKEN_ENDPOINT',
    'token',
    'token_endpoint'
  );
  const userinfoEndpoint = await resolveEndpoint(
    'INTERAC_USERINFO_ENDPOINT',
    'userinfo',
    'userinfo_endpoint'
  );

  return {
    ready: missing.length === 0,
    missing: [...new Set(missing)],
    warnings,
    config: {
      baseUrl: getBaseUrl(),
      wellKnownUrl: getWellKnownUrl(),
      issuer: getIssuer(),
      audience: getAudience(),
      authorizationEndpoint,
      tokenEndpoint,
      userinfoEndpoint,
      redirectUri: getRedirectUri(),
      scope,
      requestObject: useRequestObject,
      par: false,
      sendsUiLocales: boolEnv('INTERAC_INCLUDE_UI_LOCALES', false),
    },
  };
}

export async function exchangeCode({ code, codeVerifier, originOverride }) {
  const tokenEndpoint = await resolveEndpoint(
    'INTERAC_TOKEN_ENDPOINT',
    'token',
    'token_endpoint'
  );
  const clientId = getClientId();
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: String(code || ''),
    redirect_uri: getRedirectUri(originOverride),
    client_id: clientId,
    code_verifier: String(codeVerifier || ''),
  });

  if (process.env.INTERAC_CLIENT_SECRET) {
    params.set('client_secret', process.env.INTERAC_CLIENT_SECRET);
  }

  const tokenAuthMethod = (process.env.INTERAC_TOKEN_AUTH_METHOD || '').toLowerCase();
  const shouldUsePrivateKeyJwt = Boolean(getPrivateKeyPem()) && !['client_secret_basic', 'client_secret_post', 'none'].includes(tokenAuthMethod);

  if (shouldUsePrivateKeyJwt) {
    const now = Math.floor(Date.now() / 1000);
    const assertion = signJwt({
      iss: clientId,
      sub: clientId,
      aud: getAudience(),
      jti: crypto.randomUUID(),
      iat: now,
      exp: now + 300,
    });

    params.set('client_assertion_type', CLIENT_ASSERTION_TYPE);
    params.set('client_assertion', assertion);
  }

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const text = await response.text();
  const body = safeJson(text);

  if (!response.ok) {
    throw new Error(`Interac token exchange failed ${response.status}: ${text.slice(0, 500)}`);
  }

  return body;
}

export async function fetchUserInfo(accessToken) {
  const userinfoEndpoint = await resolveEndpoint(
    'INTERAC_USERINFO_ENDPOINT',
    'userinfo',
    'userinfo_endpoint'
  );
  const response = await fetch(userinfoEndpoint, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${accessToken}`,
      accept: 'application/json',
    },
  });
  const text = await response.text();
  const data = safeJson(text);

  if (response.status === 202) {
    return {
      status: 'processing',
      retryAfter: response.headers.get('retry-after'),
      data,
    };
  }

  if (!response.ok) {
    throw new Error(`Interac userinfo failed ${response.status}: ${text.slice(0, 500)}`);
  }

  return {
    status: 'ready',
    data,
  };
}
