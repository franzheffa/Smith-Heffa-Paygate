const ORANGE_COUNTRY_PREFIXES = {
  CM: "+237",
  CM_ORANGE_ONLY: "+237",
  CI: "+225",
  CD: "+243",
  BF: "+226",
  GN: "+224",
  SN: "+221",
};

const ORANGE_COUNTRY_LABELS = {
  CM: "Cameroun",
  CM_ORANGE_ONLY: "Cameroun (Orange)",
  CI: "Côte d’Ivoire",
  CD: "RDC",
  BF: "Burkina Faso",
  GN: "Guinée",
  SN: "Sénégal",
};

function normalizePhoneNumber(raw) {
  return String(raw || "").replace(/[^\d+]/g, "");
}

function ensureCountryAllowed(countryCode, config) {
  if (!config.countries[countryCode]) {
    throw new Error(`Orange country ${countryCode} disabled`);
  }
}

module.exports = {
  ORANGE_COUNTRY_PREFIXES,
  ORANGE_COUNTRY_LABELS,
  normalizePhoneNumber,
  ensureCountryAllowed,
};
