/**
 * Hiflux Conversion Rate Logic
 * Définit le taux de change entre les monnaies fiduciaires et Ui
 */
export const EXCHANGE_RATES = {
  USD_TO_FCFA: 600,
  FCFA_TO_UI: 0.0016, // Exemple : 1000 FCFA = 1.6 Ui
  UI_TO_USD: 1.15
};

export function convertMomoToUi(amountFcfa) {
  const fee = 0.02; // 2% de frais de réseau
  const netAmount = amountFcfa * (1 - fee);
  return {
    gross: amountFcfa,
    net: netAmount,
    uiValue: netAmount * EXCHANGE_RATES.FCFA_TO_UI,
    timestamp: new Date().toISOString()
  };
}
