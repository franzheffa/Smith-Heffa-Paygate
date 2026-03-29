import crypto from 'crypto';

function b64url(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function randomString(bytes = 48) {
  return b64url(crypto.randomBytes(bytes));
}

function sha256base64url(input) {
  return b64url(crypto.createHash('sha256').update(input).digest());
}

function getAuthorizeUrl() {
  if (process.env.ORANGE_OIDC_AUTHORIZE_URL) {
    return process.env.ORANGE_OIDC_AUTHORIZE_URL;
  }
  if (process.env.ORANGE_OAUTH_TOKEN_URL) {
    return process.env.ORANGE_OAUTH_TOKEN_URL.replace(/\/token$/, '/authorize');
  }
  return 'https://api.orange.com/oauth/v3/authorize';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const clientId = process.env.ORANGE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: 'Missing ORANGE_CLIENT_ID' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = process.env.ORANGE_OIDC_REDIRECT_URI || `${appUrl}/api/oidc/callback`;
  const scope = String(
    req.body?.scope ||
      process.env.ORANGE_OIDC_SCOPE ||
      'openid dpv:FraudPreventionAndDetection number-verification:verify'
  );

  const state = randomString(24);
  const codeVerifier = randomString(64);
  const codeChallenge = sha256base64url(codeVerifier);
  const authorizeUrl = new URL(getAuthorizeUrl());

  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('redirect_uri', redirectUri);
  authorizeUrl.searchParams.set('scope', scope);
  authorizeUrl.searchParams.set('response_type', 'code');
  authorizeUrl.searchParams.set('code_challenge', codeChallenge);
  authorizeUrl.searchParams.set('code_challenge_method', 'S256');
  authorizeUrl.searchParams.set('state', state);

  const secure = process.env.NODE_ENV === 'production';
  const cookieBase = `Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure ? '; Secure' : ''}`;
  res.setHeader('Set-Cookie', [
    `oidc_state=${encodeURIComponent(state)}; ${cookieBase}`,
    `oidc_code_verifier=${encodeURIComponent(codeVerifier)}; ${cookieBase}`
  ]);

  return res.status(200).json({
    authorizeUrl: authorizeUrl.toString(),
    redirectUri,
    scope,
    state
  });
}
