export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const clientId     = process.env.ORANGE_CLIENT_ID;
  const clientSecret = process.env.ORANGE_CLIENT_SECRET;
  const tokenUrl     = process.env.ORANGE_OAUTH_TOKEN_URL || 'https://api.orange.com/oauth/v3/token';

  if (!clientId || !clientSecret) {
    return res.status(500).json({ ok: false, error: 'vars manquantes', clientId: !!clientId, clientSecret: !!clientSecret });
  }

  try {
    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const txt = await r.text();
    return res.status(200).json({
      ok: r.ok,
      status: r.status,
      tokenUrl,
      clientIdPrefix: clientId.substring(0, 8) + '...',
      response: txt.substring(0, 300),
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: e.message, tokenUrl });
  }
}
