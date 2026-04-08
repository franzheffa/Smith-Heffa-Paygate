/**
 * GET /api/interac/status
 * Vérifie si l'utilisateur est authentifié Interac et retourne ses claims
 * BUTTERTECH INC — Smith-Heffa-Paygate
 */
import { fetchUserInfo } from '../../../lib/interac-hub';

function parseCookies(h = '') {
  return h.split(';').reduce((a, p) => {
    const i = p.indexOf('=');
    if (i > 0) a[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    return a;
  }, {});
}

export default async function handler(req, res) {
  const { ihub_at, ihub_sub } = parseCookies(req.headers.cookie || '');
  
  if (!ihub_at) {
    return res.status(200).json({ 
      authenticated: false,
      interac_url: '/api/interac/init'
    });
  }

  try {
    const userInfo = await fetchUserInfo(ihub_at);
    return res.status(200).json({
      authenticated: true,
      sub: userInfo.sub,
      given_name: userInfo.given_name,
      family_name: userInfo.family_name,
      email: userInfo.email,
      birthdate: userInfo.birthdate,
      address: userInfo.address,
      source: userInfo.source,
    });
  } catch {
    return res.status(200).json({ 
      authenticated: false,
      interac_url: '/api/interac/init'
    });
  }
}
