import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ca.smithheffa.paygate",
  appName: "Smith-Heffa Paygate",
  webDir: "capacitor-web",
  ios: {
    contentInset: "automatic",
  },
  android: {
    allowMixedContent: false,
  },
  server: {
    url: "https://smith-heffa-paygate.ca",
    cleartext: false,
    allowNavigation: ["smith-heffa-paygate.ca"],
  },
};

export default config;
