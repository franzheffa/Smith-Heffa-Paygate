const crypto = require("crypto");
const {
  withInternationalPlus,
  resolveCountryCode,
  getOrangeRuntimeConfig,
  getCountryLabel,
} = require("../../../../../lib/paygate/orange/runtime");

function ensureCountryAllowed(runtime, countryCode) {
  if (!runtime.smsEnabled) {
    const error = new Error("Orange SMS disabled");
    error.code = "ORANGE_SMS_DISABLED";
    throw error;
  }

  if (!countryCode || !runtime.countries[countryCode]) {
    const error = new Error(`Orange country ${countryCode || "UNKNOWN"} disabled`);
    error.code = "ORANGE_COUNTRY_DISABLED";
    throw error;
  }
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSimulation({ countryCode }) {
  return {
    ok: true,
    mode: "simulation",
    provider: "orange",
    messageId: `sim-${Date.now()}-${countryCode.toLowerCase()}`,
  };
}

function validatePayload(body) {
  const phoneNumber = withInternationalPlus(body?.phoneNumber);
  const countryCode = resolveCountryCode(body?.country, phoneNumber);

  if (!phoneNumber) {
    const error = new Error("phoneNumber is required");
    error.code = "INVALID_PHONE_NUMBER";
    throw error;
  }

  if (!countryCode) {
    const error = new Error("country is required or must be derivable from phoneNumber");
    error.code = "INVALID_COUNTRY";
    throw error;
  }

  return { phoneNumber, countryCode };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const runtime = getOrangeRuntimeConfig();
    const { phoneNumber, countryCode } = validatePayload(req.body);

    ensureCountryAllowed(runtime, countryCode);

    const otp = generateOtp();

    let delivery;
    if (runtime.simulation) {
      delivery = await sendSimulation({ countryCode, phoneNumber, otp });
    } else {
      const error = new Error("Production Orange SMS transport not wired in this sprint route");
      error.code = "ORANGE_TRANSPORT_NOT_CONFIGURED";
      throw error;
    }

    return res.status(200).json({
      ok: true,
      provider: "orange",
      mode: delivery.mode,
      countryCode,
      countryLabel: getCountryLabel(countryCode),
      otpPreview: runtime.simulation ? otp : undefined,
      delivery,
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("[PayGate - Orange OTP] System Exception:", error?.message || error);

    const code = error?.code || "INTERNAL_ERROR";
    const status =
      code === "INVALID_PHONE_NUMBER" || code === "INVALID_COUNTRY"
        ? 400
        : code === "ORANGE_SMS_DISABLED" || code === "ORANGE_COUNTRY_DISABLED"
          ? 400
          : code === "ORANGE_TRANSPORT_NOT_CONFIGURED"
            ? 503
            : 500;

    return res.status(status).json({
      ok: false,
      code,
      error: error?.message || "Internal Server Error processing Orange OTP.",
    });
  }
}
