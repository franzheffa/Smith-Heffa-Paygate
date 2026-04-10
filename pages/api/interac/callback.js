/**
 * GET /api/interac/callback
 * Reçoit code Interac Hub, échange tokens, redirige dashboard
 * Gère le mode Asynchronous (202 polling)
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
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
  const clearBase = `HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure ? '; Secure' : ''}`;

  if (error) {
    console.error('[interac/callback] error:', error, error_description);
    return res.redirect(`/dashboard?interac_error=${encodeURIComponent(error_description || error)}`);
  }
  if (!code) return res.status(400).json({ error: 'Missing code' });

  const cookies = parseCookies(req.headers.cookie || '');
  if (state && cookies.ihub_state && state !== cookies.ihub_state) {
    return res.status(400).json({ error: 'State mismatch' });
  }
  if (!cookies.ihub_cv) {
    return res.status(400).json({ error: 'Missing PKCE verifier cookie' });
  }

  try {
    const tokens = await exchangeCode({ code, codeVerifier: cookies.ihub_cv });
    const sessionBase = `HttpOnly; Path=/; Max-Age=1800; SameSite=Lax${secure ? '; Secure' : ''}`;

    // Stocke le token même si userinfo est async (202)
    res.setHeader('Set-Cookie', [
      `ihub_cv=; ${clearBase}`,
      `ihub_state=; ${clearBase}`,
      `ihub_nonce=; ${clearBase}`,
      `ihub_at=${tokens.access_token}; ${sessionBase}`,
    ]);

    // Tente de récupérer userinfo immédiatement (mode sync)
    try {
      const userInfo = await fetchUserInfo(tokens.access_token);
      // Stocke le sub si disponible
      if (userInfo.sub) {
        res.setHeader('Set-Cookie', [
          `ihub_cv=; ${clearBase}`,
          `ihub_state=; ${clearBase}`,
          `ihub_nonce=; ${clearBase}`,
          `ihub_at=${tokens.access_token}; ${sessionBase}`,
          `ihub_sub=${encodeURIComponent(userInfo.sub)}; ${sessionBase}`,
        ]);
      }
    } catch {
      // Mode async — userinfo sera disponible via polling
    }

    return res.redirect('/dashboard?interac_auth=success');
  } catch (err) {
    console.error('[interac/callback]', err.message);
    return res.redirect(`/dashboard?interac_error=${encodeURIComponent(err.message)}`);
  }
}
