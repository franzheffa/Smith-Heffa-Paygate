import { fetchUserInfo } from '../../../lib/interac-hub';

function parseCookies(h = '') {
  return h.split(';').reduce((a, p) => {
    const i = p.indexOf('=');
    if (i > 0) a[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim());
    return a;
  }, {});
}

export default async function handler(req, res) {
  const { ihub_at } = parseCookies(req.headers.cookie || '');
  if (!ihub_at) return res.status(401).json({ error: 'Not authenticated' });
  try {
    return res.status(200).json(await fetchUserInfo(ihub_at));
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}
