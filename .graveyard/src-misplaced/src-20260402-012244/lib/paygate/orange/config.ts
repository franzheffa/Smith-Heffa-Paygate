export const orangeConfig = {
  clientId: process.env.ORANGE_CLIENT_ID || "",
  clientSecret: process.env.ORANGE_CLIENT_SECRET || "",
  authHeader: process.env.ORANGE_AUTH_HEADER || "",
  senderAddress: process.env.ORANGE_SMS_SENDER_ADDRESS || "",
  callbackUrl: process.env.ORANGE_SMS_CALLBACK_URL || "",

  smsEnabled: process.env.ORANGE_SMS_ENABLED === "true",
  simVerifyEnabled: process.env.ORANGE_SIM_VERIFY_ENABLED === "true",
  viewBillEnabled: process.env.ORANGE_VIEW_BILL_ENABLED === "true",

  countries: {
    CM: process.env.ORANGE_SMS_CM_ENABLED === "true",
    CM_ORANGE_ONLY: process.env.ORANGE_SMS_CM_ORANGE_ONLY_ENABLED === "true",
    CI: process.env.ORANGE_SMS_CI_ENABLED === "true",
    CD: process.env.ORANGE_SMS_CD_ENABLED === "true",
    BF: process.env.ORANGE_SMS_BF_ENABLED === "true",
    GN: process.env.ORANGE_SMS_GN_ENABLED === "true",
    SN: process.env.ORANGE_SMS_SN_ENABLED === "true",
  },
} as const;

export function assertOrangeConfigured() {
  if (!orangeConfig.smsEnabled) {
    throw new Error("Orange SMS disabled");
  }

  if (!orangeConfig.clientId || !orangeConfig.clientSecret) {
    throw new Error("Missing Orange credentials");
  }
}
