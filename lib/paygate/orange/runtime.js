function readEnv(name, fallback = "") {
  return String(process.env[name] ?? fallback).replace(/\r/g, "").trim();
}

function readBool(name, fallback = false) {
  const value = readEnv(name, fallback ? "true" : "false").toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

function withInternationalPlus(raw) {
  const value = String(raw || "").replace(/\s+/g, "").trim();
  if (!value) return "";
  return value.startsWith("+") ? value : `+${value}`;
}

function resolveCountryCode(rawCountryCode, rawPhoneNumber) {
  const requested = String(rawCountryCode || "").trim().toUpperCase();
  if (requested) return requested;

  const phone = withInternationalPlus(rawPhoneNumber);
  if (phone.startsWith("+237")) return "CM";
  if (phone.startsWith("+221")) return "SN";
  if (phone.startsWith("+225")) return "CI";
  if (phone.startsWith("+243")) return "CD";
  if (phone.startsWith("+226")) return "BF";
  if (phone.startsWith("+224")) return "GN";

  return "";
}

function getOrangeRuntimeConfig() {
  return {
    simulation: readBool("PAYGATE_OTP_SIMULATION", true),
    smsEnabled: readBool("ORANGE_SMS_ENABLED", false),
    countries: {
      CM: readBool("ORANGE_SMS_CM_ENABLED", false),
      SN: readBool("ORANGE_SMS_SN_ENABLED", false),
      CM_ORANGE_ONLY: readBool("ORANGE_SMS_CM_ORANGE_ONLY_ENABLED", false),
      CI: readBool("ORANGE_SMS_CI_ENABLED", false),
      CD: readBool("ORANGE_SMS_CD_ENABLED", false),
      BF: readBool("ORANGE_SMS_BF_ENABLED", false),
      GN: readBool("ORANGE_SMS_GN_ENABLED", false),
    },
  };
}

function getCountryLabel(code) {
  const labels = {
    CM: "Cameroun",
    SN: "Senegal",
    CI: "Cote d'Ivoire",
    CD: "RD Congo",
    BF: "Burkina Faso",
    GN: "Guinee",
  };

  return labels[code] || code || "Unknown";
}

module.exports = {
  readEnv,
  readBool,
  withInternationalPlus,
  resolveCountryCode,
  getOrangeRuntimeConfig,
  getCountryLabel,
};
