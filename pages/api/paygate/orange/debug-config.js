const {
  readEnv,
  getOrangeRuntimeConfig,
} = require("../../../../lib/paygate/orange/runtime");

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const computed = getOrangeRuntimeConfig();

  return res.status(200).json({
    ok: true,
    env: {
      PAYGATE_OTP_SIMULATION: readEnv("PAYGATE_OTP_SIMULATION"),
      ORANGE_SMS_ENABLED: readEnv("ORANGE_SMS_ENABLED"),
      ORANGE_SMS_CM_ENABLED: readEnv("ORANGE_SMS_CM_ENABLED"),
      ORANGE_SMS_SN_ENABLED: readEnv("ORANGE_SMS_SN_ENABLED"),
      ORANGE_SMS_CM_ORANGE_ONLY_ENABLED: readEnv("ORANGE_SMS_CM_ORANGE_ONLY_ENABLED"),
      ORANGE_SMS_CI_ENABLED: readEnv("ORANGE_SMS_CI_ENABLED"),
      ORANGE_SMS_CD_ENABLED: readEnv("ORANGE_SMS_CD_ENABLED"),
      ORANGE_SMS_BF_ENABLED: readEnv("ORANGE_SMS_BF_ENABLED"),
      ORANGE_SMS_GN_ENABLED: readEnv("ORANGE_SMS_GN_ENABLED"),
    },
    computed,
  });
}
