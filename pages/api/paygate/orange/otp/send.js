const { generateOtp } = require("../../../../../lib/paygate/auth/generate-otp");
const {
  normalizePhoneNumber,
  ensureCountryAllowed,
  ORANGE_COUNTRY_LABELS,
} = require("../../../../../lib/paygate/orange/countries");
const { orangeConfig } = require("../../../../../lib/paygate/orange/config");
const { sendOrangeSms } = require("../../../../../lib/paygate/orange/send-sms");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const { phoneNumber, countryCode = "CM" } = req.body || {};

    if (!phoneNumber) {
      return res.status(400).json({ ok: false, error: "Phone number is required" });
    }

    if (!orangeConfig.simulation) {
      console.log("ORANGE_SMS_CM_ENABLED env:", process.env.ORANGE_SMS_CM_ENABLED);
      console.log("orangeConfig.countries.CM:", orangeConfig.countries.CM);
      ensureCountryAllowed(countryCode, orangeConfig);
    }

    const to = normalizePhoneNumber(phoneNumber);
    const otp = generateOtp(6);

    const message = `Smith-Heffa Paygate code: ${otp}. Ne partagez jamais ce code.`;

    const delivery = await sendOrangeSms({
      to,
      message,
    });

    if (!delivery.ok) {
      return res.status(502).json({
        ok: false,
        provider: "orange",
        error: delivery.error || "Orange SMS delivery failed",
      });
    }

    return res.status(200).json({
      ok: true,
      provider: "orange",
      mode: delivery.mode,
      countryCode,
      countryLabel: ORANGE_COUNTRY_LABELS[countryCode] || countryCode,
      otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
      delivery,
    });
  } catch (error) {
    console.error("Orange OTP send error:", error);
    return res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
