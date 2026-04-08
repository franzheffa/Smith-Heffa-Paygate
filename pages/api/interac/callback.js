import { exchangeCode, fetchUserInfo } from '../../../lib/interac-hub';

function parseCookies(h = '') {
  return h.split(';').reduce((a, p) => {
    const i = p.indexOf('=');
    if (i > 0) a[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    return a;
  }, {});
}

export default async function handler(req, res) {
  const { code, state, error, error_description } = req.query;
  const secure = process.env.NODE_ENV === 'production';
  const clear = `HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;

  if (error) {
    return res.redirect(`/dashboard?interac_error=${encodeURIComponent(error_description || error)}`);
  }
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const cookies = parseCookies(req.headers.cookie || '');
  if (state && cookies.ihub_state && state !== cookies.ihub_state) {
    return res.status(400).json({ error: 'State mismatch' });
  }
  if (!cookies.ihub_cv) return res.status(400).json({ error: 'Missing PKCE verifier' });

  try {
    const tokens = await exchangeCode({ code, codeVerifier: cookies.ihub_cv });
    const userInfo = await fetchUserInfo(tokens.access_token);
    const sessionBase = `HttpOnly; Path=/; Max-Age=1800; SameSite=Lax${secure ? '; Secure' : ''}`;

    res.setHeader('Set-Cookie', [
      `ihub_cv=; ${clear}`,
      `ihub_state=; ${clear}`,
      `ihub_nonce=; ${clear}`,
      `ihub_at=${tokens.access_token}; ${sessionBase}`,
      `ihub_sub=${encodeURIComponent(userInfo.sub || '')}; ${sessionBase}`,
    ]);
    return res.redirect('/dashboard?interac_auth=success');
  } catch (err) {
    console.error('[interac/callback]', err.message);
    return res.redirect(`/dashboard?interac_error=${encodeURIComponent(err.message)}`);
  }
}
