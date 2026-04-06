const orangeConfig = {
  clientId: process.env.ORANGE_CLIENT_ID,
  clientSecret: process.env.ORANGE_CLIENT_SECRET,
  simulation: process.env.PAYGATE_OTP_SIMULATION === "true",
  apiUrl: "https://api.orange.com"
};

function assertOrangeConfigured() {
  if (orangeConfig.simulation) {
    return;
  }
  if (!orangeConfig.clientId || !orangeConfig.clientSecret) {
    // FIX: On ne crashe plus l'app entière. On prévient juste dans les logs.
    console.warn("[Orange Config] Missing credentials in environment. OTP might fail.");
  }
}

module.exports = {
  orangeConfig,
  assertOrangeConfigured,
};
