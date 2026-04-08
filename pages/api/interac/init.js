import crypto from 'crypto';
import { generateCodeVerifier, generateCodeChallenge, buildAuthUrl } from '../../../lib/interac-hub';

export default async function handler(req, res) {
  try {
    const cv = generateCodeVerifier();
    const cc = generateCodeChallenge(cv);
    const state = crypto.randomBytes(16).toString('hex');
    const nonce = crypto.randomBytes(16).toString('hex');
    const authUrl = await buildAuthUrl({ state, nonce, codeChallenge: cc });

    const secure = process.env.NODE_ENV === 'production';
    const base = `HttpOnly; Path=/; Max-Age=600; SameSite=Lax${secure ? '; Secure' : ''}`;
    res.setHeader('Set-Cookie', [
      `ihub_cv=${cv}; ${base}`,
      `ihub_state=${state}; ${base}`,
      `ihub_nonce=${nonce}; ${base}`,
    ]);
    return res.redirect(302, authUrl);
  } catch (err) {
    console.error('[interac/init]', err.message);
    return res.status(500).json({ error: err.message });
  }
}
