const { orangeConfig } = require('./config');

async function sendOrangeSMS({ phoneNumber, country = "CM" }) {
  console.log(`[sendOrangeSMS] Tentative d'envoi vers ${phoneNumber} (${country})`);
  
  if (orangeConfig.simulation) {
    console.log(`[sendOrangeSMS] Mode simulation. Pas de SMS réel envoyé.`);
    return { success: true, simulated: true };
  }

  if (!orangeConfig.clientId || !orangeConfig.clientSecret) {
     throw new Error("Credentials manquants pour l'envoi réel.");
  }

  // Si on arrive ici en mode réel, c'est que l'auth M2M doit se faire.
  // Pour éviter un double appel (puisque send.js le fait déjà), on bypass ici
  // ou on laisse la logique métier s'exécuter si elle existait.
  
  return { success: true, message: "Requête déléguée au contrôleur principal." };
}

module.exports = { sendOrangeSMS };
