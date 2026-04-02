export type OrangeCountryCode =
  | "CM"
  | "CM_ORANGE_ONLY"
  | "CI"
  | "CD"
  | "BF"
  | "GN"
  | "SN";

export const ORANGE_DIAL_CODES: Record<OrangeCountryCode, string> = {
  CM: "+237",
  CM_ORANGE_ONLY: "+237",
  CI: "+225",
  CD: "+243",
  BF: "+226",
  GN: "+224",
  SN: "+221",
};

export const ORANGE_COUNTRY_LABELS: Record<OrangeCountryCode, string> = {
  CM: "Cameroun",
  CM_ORANGE_ONLY: "Cameroun (Orange)",
  CI: "Côte d’Ivoire",
  CD: "RDC",
  BF: "Burkina Faso",
  GN: "Guinée",
  SN: "Sénégal",
};
