import { clearOrangeOtp, setOrangeOtpVerified, verifyOrangeOtpChallenge } from '../../../../../lib/orangeOtp';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const { phoneNumber, country = 'CM', otp } = req.body || {};
    const cleanOtp = String(otp || '').replace(/\D/g, '');
    if (!phoneNumber) return res.status(400).json({ ok: false, error: 'Numéro requis' });
    if (cleanOtp.length !== 6) return res.status(400).json({ ok: false, error: 'Code OTP à 6 chiffres requis' });

    const verification = verifyOrangeOtpChallenge(req, { phoneNumber, country, otp: cleanOtp });
    if (!verification.ok) {
      clearOrangeOtp(res);
      return res.status(401).json({ ok: false, error: verification.error });
    }

    setOrangeOtpVerified(res, { phoneNumber, country });
    return res.status(200).json({
      ok: true,
      status: 'VERIFIED',
      message: 'OTP Orange vérifié. Vous pouvez maintenant envoyer via Orange Money.'
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Échec de la vérification OTP' });
  }
}
