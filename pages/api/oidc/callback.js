function parseCookies(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((v) => v.trim())
    .filter(Boolean)
    .reduce((acc, entry) => {
      const i = entry.indexOf('=');
      if (i > 0) {
        acc[entry.slice(0, i)] = decodeURIComponent(entry.slice(i + 1));
      }
      return acc;
    }, {});
}

function getTokenUrl() {
  return process.env.ORANGE_OIDC_TOKEN_URL || process.env.ORANGE_OAUTH_TOKEN_URL || 'https://api.orange.com/oauth/v3/token';
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const code = String(req.query?.code || '');
  const returnedState = String(req.query?.state || '');
  const error = String(req.query?.error || '');
  const errorDescription = String(req.query?.error_description || '');

  if (error) {
    return res.status(400).json({ error, error_description: errorDescription || undefined });
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  const expectedState = cookies.oidc_state;
  const codeVerifier = cookies.oidc_code_verifier;

  if (!expectedState || !codeVerifier) {
    return res.status(400).json({ error: 'Missing PKCE session (state/verifier cookie)' });
  }
  if (returnedState !== expectedState) {
    return res.status(400).json({ error: 'Invalid state' });
  }

  const clientId = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Missing ORANGE_CLIENT_ID/ORANGE_CLIENT_SECRET' });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = process.env.ORANGE_OIDC_REDIRECT_URI || `${appUrl}/api/oidc/callback`;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  });

  try {
    const response = await fetch(getTokenUrl(), {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      },
      body
    });

    const raw = await response.text();
    let data;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch (_) {
      data = { raw };
    }

    const secure = process.env.NODE_ENV === 'production';
    const clearCookie = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [`oidc_state=; ${clearCookie}`, `oidc_code_verifier=; ${clearCookie}`]);

    return res.status(response.status).json(data);
  } catch (err) {
    return res.status(500).json({
      error: 'OIDC token exchange failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}
