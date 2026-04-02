const orangeConfig = {
  clientId: process.env.ORANGE_CLIENT_ID || "",
  clientSecret: process.env.ORANGE_CLIENT_SECRET || "",
  tokenUrl: process.env.ORANGE_TOKEN_URL || "https://api.orange.com/oauth/v3/token",
  smsEnabled: process.env.ORANGE_SMS_ENABLED === "true",
  smsBaseUrl: process.env.ORANGE_SMS_BASE_URL || "https://api.orange.com/smsmessaging/v1",
  senderAddress: process.env.ORANGE_SMS_SENDER_ADDRESS || "",
  callbackUrl: process.env.ORANGE_SMS_CALLBACK_URL || "",
  simulation: process.env.PAYGATE_OTP_SIMULATION === "true",
  countries: {
    CM: process.env.ORANGE_SMS_CM_ENABLED === "true",
    CM_ORANGE_ONLY: process.env.ORANGE_SMS_CM_ORANGE_ONLY_ENABLED === "true",
    CI: process.env.ORANGE_SMS_CI_ENABLED === "true",
    CD: process.env.ORANGE_SMS_CD_ENABLED === "true",
    BF: process.env.ORANGE_SMS_BF_ENABLED === "true",
    GN: process.env.ORANGE_SMS_GN_ENABLED === "true",
    SN: process.env.ORANGE_SMS_SN_ENABLED === "true",
  },
};

function assertOrangeConfigured() {
  if (!orangeConfig.smsEnabled) {
    throw new Error("Orange SMS disabled");
  }

  if (orangeConfig.simulation) {
    return;
  }

  if (!orangeConfig.clientId || !orangeConfig.clientSecret) {
    throw new Error("Missing Orange credentials");
  }
}

module.exports = {
  orangeConfig,
  assertOrangeConfigured,
};
