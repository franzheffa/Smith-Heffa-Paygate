export default function handler(req, res) {
  return res.status(200).json({
    ok: true,
    env: {
      PAYGATE_OTP_SIMULATION: process.env.PAYGATE_OTP_SIMULATION ?? null,
      ORANGE_SMS_ENABLED: process.env.ORANGE_SMS_ENABLED ?? null,
      ORANGE_SMS_CM_ENABLED: process.env.ORANGE_SMS_CM_ENABLED ?? null,
      ORANGE_SMS_SN_ENABLED: process.env.ORANGE_SMS_SN_ENABLED ?? null,
      ORANGE_SMS_CM_ORANGE_ONLY_ENABLED:
        process.env.ORANGE_SMS_CM_ORANGE_ONLY_ENABLED ?? null,
      ORANGE_SMS_CI_ENABLED: process.env.ORANGE_SMS_CI_ENABLED ?? null,
      ORANGE_SMS_CD_ENABLED: process.env.ORANGE_SMS_CD_ENABLED ?? null,
      ORANGE_SMS_BF_ENABLED: process.env.ORANGE_SMS_BF_ENABLED ?? null,
      ORANGE_SMS_GN_ENABLED: process.env.ORANGE_SMS_GN_ENABLED ?? null,
    },
    computed: {
      simulation: process.env.PAYGATE_OTP_SIMULATION === "true",
      smsEnabled: process.env.ORANGE_SMS_ENABLED === "true",
      countries: {
        CM: process.env.ORANGE_SMS_CM_ENABLED === "true",
        SN: process.env.ORANGE_SMS_SN_ENABLED === "true",
        CM_ORANGE_ONLY:
          process.env.ORANGE_SMS_CM_ORANGE_ONLY_ENABLED === "true",
        CI: process.env.ORANGE_SMS_CI_ENABLED === "true",
        CD: process.env.ORANGE_SMS_CD_ENABLED === "true",
        BF: process.env.ORANGE_SMS_BF_ENABLED === "true",
        GN: process.env.ORANGE_SMS_GN_ENABLED === "true",
      },
    },
  });
}
