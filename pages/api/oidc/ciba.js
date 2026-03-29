import crypto from 'crypto';

const CLIENT_ASSERTION_TYPE = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer';
const CIBA_GRANT_TYPE = 'urn:openid:params:grant-type:ciba';

function b64url(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function getTokenUrl() {
  return process.env.ORANGE_OIDC_TOKEN_URL || process.env.ORANGE_OAUTH_TOKEN_URL || 'https://api.orange.com/oauth/v3/token';
}

function getBcAuthorizeUrl() {
  if (process.env.ORANGE_OIDC_CIBA_AUTHORIZE_URL) return process.env.ORANGE_OIDC_CIBA_AUTHORIZE_URL;
  return getTokenUrl().replace(/\/token$/, '/bc-authorize');
}

function uniq(values) {
  return [...new Set(values.filter(Boolean).map((v) => String(v).trim()))];
}

function authorizeCandidates() {
  return uniq([
    process.env.ORANGE_OIDC_CIBA_AUTHORIZE_URL,
    getBcAuthorizeUrl(),
    'https://api.orange.com/openidconnect/ciba/fr/v1/bc-authorize',
    'https://api.orange.com/es/openapi/oauth/v2/bc-authorize'
  ]);
}

function tokenCandidates(extra = []) {
  return uniq([
    ...extra,
    process.env.ORANGE_OIDC_CIBA_TOKEN_URL,
    getTokenUrl(),
    'https://api.orange.com/openidconnect/ciba/fr/v1/token',
    'https://api.orange.com/es/openapi/oauth/v2/token'
  ]);
}

function normalizePem(value) {
  return String(value || '').replace(/\\n/g, '\n').trim();
}

function clientAssertionJwt() {
  const clientId = process.env.ORANGE_CLIENT_ID;
  const privateKey = normalizePem(process.env.ORANGE_CLIENT_PRIVATE_KEY_PEM);
  if (!clientId) throw new Error('Missing ORANGE_CLIENT_ID');
  if (!privateKey) throw new Error('Missing ORANGE_CLIENT_PRIVATE_KEY_PEM');

  const now = Math.floor(Date.now() / 1000);
  const header = {
    alg: 'RS256',
    typ: 'JWT',
    ...(process.env.ORANGE_CLIENT_KEY_ID ? { kid: process.env.ORANGE_CLIENT_KEY_ID } : {})
  };
  const payload = {
    iss: clientId,
    sub: process.env.ORANGE_CLIENT_ASSERTION_SUB || clientId,
    aud: process.env.ORANGE_CLIENT_ASSERTION_AUD || getTokenUrl(),
    iat: now,
    exp: now + 300,
    jti: crypto.randomUUID()
  };

  const encodedHeader = b64url(JSON.stringify(header));
  const encodedPayload = b64url(JSON.stringify(payload));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(toSign);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${toSign}.${b64url(signature)}`;
}

function basicAuthHeader() {
  const clientId = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Missing ORANGE_CLIENT_ID/ORANGE_CLIENT_SECRET');
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
}

async function postForm(url, form, authMethod = 'basic') {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json'
  };

  if (authMethod === 'jwt_assertion') {
    form.set('client_assertion_type', CLIENT_ASSERTION_TYPE);
    form.set('client_assertion', clientAssertionJwt());
  } else {
    headers.Authorization = basicAuthHeader();
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: form
  });

  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {
    data = { raw };
  }

  return { status: response.status, ok: response.ok, data };
}

async function startCiba({ loginHint, scope, authMethod }) {
  let last = null;
  for (const endpoint of authorizeCandidates()) {
    const form = new URLSearchParams();
    form.set('login_hint', loginHint);
    form.set('scope', scope);
    const result = await postForm(endpoint, form, authMethod);
    const err = String(result.data?.error || '').toLowerCase();
    const errDesc = String(result.data?.error_description || '').toLowerCase();

    if (
      authMethod === 'basic' &&
      (err === 'invalid_request' && errDesc.includes('client_assertion_type'))
    ) {
      last = { ...result, endpoint };
      continue;
    }

    if (result.ok || !['resource_not_found', 'method_not_allowed'].includes(err)) {
      return { ...result, endpoint };
    }
    last = { ...result, endpoint };
  }
  return last || { status: 500, ok: false, data: { error: 'ciba_endpoint_not_found' } };
}

async function getCibaToken({ authReqId, authMethod, preferredTokenUrl }) {
  let last = null;
  for (const endpoint of tokenCandidates([preferredTokenUrl])) {
    const form = new URLSearchParams();
    form.set('grant_type', CIBA_GRANT_TYPE);
    form.set('auth_req_id', authReqId);
    const result = await postForm(endpoint, form, authMethod);
    const err = String(result.data?.error || '').toLowerCase();

    if (result.ok || !['resource_not_found', 'method_not_allowed'].includes(err)) {
      return { ...result, endpoint };
    }
    last = { ...result, endpoint };
  }
  return last || { status: 500, ok: false, data: { error: 'token_endpoint_not_found' } };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const action = String(req.body?.action || '').trim();
  const authMethod = String(req.body?.authMethod || process.env.ORANGE_OIDC_CIBA_AUTH_METHOD || 'basic').toLowerCase();
  if (!['basic', 'jwt_assertion'].includes(authMethod)) {
    return res.status(400).json({ error: 'Invalid authMethod', allowed: ['basic', 'jwt_assertion'] });
  }

  try {
    if (action === 'start') {
      const loginHint = String(req.body?.login_hint || req.body?.loginHint || '').trim();
      const scope = String(
        req.body?.scope ||
          process.env.ORANGE_OIDC_CIBA_SCOPE ||
          process.env.ORANGE_OIDC_SCOPE ||
          'openid dpv:FraudPreventionAndDetection number-verification:verify'
      );
      if (!loginHint) {
        return res.status(400).json({ error: 'Missing login_hint (e.g. tel:+33712345678)' });
      }
      const result = await startCiba({ loginHint, scope, authMethod });
      return res.status(result.status).json({ ...result.data, ciba_endpoint: result.endpoint, auth_method: authMethod });
    }

    if (action === 'token') {
      const authReqId = String(req.body?.auth_req_id || req.body?.authReqId || '').trim();
      const preferredTokenUrl = String(req.body?.token_url || req.body?.tokenUrl || '').trim();
      if (!authReqId) {
        return res.status(400).json({ error: 'Missing auth_req_id' });
      }
      const result = await getCibaToken({ authReqId, authMethod, preferredTokenUrl });
      return res.status(result.status).json({ ...result.data, token_endpoint: result.endpoint, auth_method: authMethod });
    }

    if (action === 'poll') {
      const authReqId = String(req.body?.auth_req_id || req.body?.authReqId || '').trim();
      const preferredTokenUrl = String(req.body?.token_url || req.body?.tokenUrl || '').trim();
      if (!authReqId) {
        return res.status(400).json({ error: 'Missing auth_req_id' });
      }

      const maxAttempts = Number(req.body?.maxAttempts || 6);
      let intervalSec = Number(req.body?.intervalSec || 2);
      let last = null;

      for (let i = 0; i < maxAttempts; i += 1) {
        last = await getCibaToken({ authReqId, authMethod, preferredTokenUrl });

        const errorCode = String(last.data?.error || '');
        if (last.ok) {
          return res.status(200).json({ ...last.data, poll_attempts: i + 1, token_endpoint: last.endpoint, auth_method: authMethod });
        }

        if (errorCode === 'slow_down') intervalSec += 1;
        if (!['authorization_pending', 'slow_down'].includes(errorCode)) {
          return res.status(last.status).json({ ...last.data, poll_attempts: i + 1, token_endpoint: last.endpoint, auth_method: authMethod });
        }

        await new Promise((resolve) => setTimeout(resolve, intervalSec * 1000));
      }

      return res.status(last?.status || 408).json({
        ...(last?.data || { error: 'authorization_pending' }),
        poll_attempts: maxAttempts,
        token_endpoint: last?.endpoint,
        auth_method: authMethod,
        message: 'Polling timed out before token availability'
      });
    }

    return res.status(400).json({ error: 'Unsupported action', allowed: ['start', 'token', 'poll'] });
  } catch (error) {
    return res.status(500).json({
      error: 'OIDC CIBA flow failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
