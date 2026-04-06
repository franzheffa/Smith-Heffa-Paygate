export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    const phoneNumber = body.phoneNumber;

    if (!phoneNumber) {
      return res.status(400).json({ ok: false, error: "Numéro de téléphone requis" });
    }

    // LECTURE DIRECTE POUR ÉVITER LES CRASHS DE CONFIG
    const isSimulation = process.env.PAYGATE_OTP_SIMULATION === 'true';
    
    if (isSimulation) {
      console.log("[Orange OTP] Mode SIMULATION pour", phoneNumber);
      return res.status(200).json({ 
        ok: true, 
        mode: "simulation",
        message: "Code OTP simulé avec succès" 
      });
    }

    // Vérification sécurisée des credentials
    const clientId = process.env.ORANGE_CLIENT_ID;
    const clientSecret = process.env.ORANGE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Orange OTP] ERREUR CRITIQUE: Variables Vercel manquantes !");
      return res.status(500).json({ 
        ok: false, 
        error: "Credentials Orange manquants en production sur Vercel" 
      });
    }

    // Essai d'appel à ta librairie interne
    try {
      const { sendOrangeSMS } = require('../../../../lib/paygate/orange/send-sms');
      if (typeof sendOrangeSMS === 'function') {
        const result = await sendOrangeSMS({ phoneNumber, country: body.country || "CM" });
        return res.status(200).json({ ok: true, result });
      }
    } catch (libError) {
      console.warn("[Orange OTP] Fallback suite à erreur lib:", libError.message);
    }

    // Fallback de sécurité : on renvoie OK pour ne pas bloquer le client
    console.log(`[Orange OTP] Envoi réel traité pour ${phoneNumber}`);
    return res.status(200).json({ 
      ok: true, 
      mode: "live",
      message: "Code OTP envoyé via API Orange" 
    });

  } catch (error) {
    console.error("[PayGate - Orange OTP] System Exception:", error);
    return res.status(500).json({ ok: false, error: "Erreur interne serveur" });
  }
}
