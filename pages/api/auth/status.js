export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  return res.status(200).json({
    auth_api: 'ready',
    routes: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'POST /api/auth/logout',
      'POST /api/auth/2fa/setup',
      'POST /api/auth/2fa/enable'
    ]
  });
}
