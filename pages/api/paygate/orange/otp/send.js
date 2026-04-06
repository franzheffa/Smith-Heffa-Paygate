export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method Not Allowed' });

  try {
    const { phoneNumber, country = 'CM' } = req.body || {};
    if (!phoneNumber) return res.status(400).json({ ok: false, error: 'Numéro de téléphone requis' });

    if (process.env.PAYGATE_OTP_SIMULATION === 'true') {
      return res.status(200).json({ ok: true, mode: 'simulation', message: 'Code OTP simulé' });
    }

    const clientId     = process.env.ORANGE_CLIENT_ID;
    const clientSecret = process.env.ORANGE_CLIENT_SECRET;
    const tokenUrl     = process.env.ORANGE_OAUTH_TOKEN_URL || 'https://api.orange.com/oauth/v3/token';

    if (!clientId || !clientSecret) {
      console.error('[Orange OTP] ORANGE_CLIENT_ID ou ORANGE_CLIENT_SECRET manquant');
      return res.status(500).json({ ok: false, error: 'Configuration opérateur manquante' });
    }

    // 1. Token M2M OAuth
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error('[Orange OTP] Token échoué:', tokenRes.status, txt);
      return res.status(502).json({ ok: false, error: 'Authentification opérateur échouée' });
    }

    const { access_token } = await tokenRes.json();

    // 2. OTP 6 chiffres
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Envoi SMS Orange SMS Messaging API
    const senderAddress = `tel:+${clientId}`;
    const smsRes = await fetch(
      `https://api.orange.com/smsmessaging/v1/outbound/${encodeURIComponent(senderAddress)}/requests`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          outboundSMSMessageRequest: {
            address: [`tel:${phoneNumber}`],
            senderAddress,
            outboundSMSTextMessage: {
              message: `Smith-Heffa Paygate — code : ${otp}. Valable 5 min.`,
            },
          },
        }),
      }
    );

    if (!smsRes.ok) {
      const txt = await smsRes.text();
      console.error('[Orange OTP] SMS échoué:', smsRes.status, txt);
      return res.status(502).json({ ok: false, error: 'Envoi SMS échoué côté opérateur' });
    }

    console.log('[Orange OTP] SMS envoyé à', phoneNumber, 'pays:', country);
    return res.status(200).json({ ok: true, mode: 'live', message: 'Code OTP envoyé' });

  } catch (error) {
    console.error('[Orange OTP] Exception:', error.message);
    return res.status(500).json({ ok: false, error: "Erreur de communication avec l'opérateur" });
  }
}
