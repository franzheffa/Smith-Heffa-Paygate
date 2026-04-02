const { orangeConfig, assertOrangeConfigured } = require("./config");
const { getOrangeAccessToken } = require("./token");

async function sendOrangeSms({ to, message }) {
  assertOrangeConfigured();

  if (!to) {
    throw new Error("Missing recipient phone number");
  }

  if (!message) {
    throw new Error("Missing SMS message");
  }

  if (orangeConfig.simulation) {
    return {
      ok: true,
      mode: "simulation",
      provider: "orange",
      messageId: `sim-${Date.now()}`,
    };
  }

  const accessToken = await getOrangeAccessToken();

  const sender =
    orangeConfig.senderAddress && orangeConfig.senderAddress.trim()
      ? orangeConfig.senderAddress.trim()
      : "tel:+000000000";

  const outboundSMSMessageRequest = {
    address: to,
    senderAddress: sender,
    outboundSMSTextMessage: {
      message,
    },
  };

  if (orangeConfig.callbackUrl) {
    outboundSMSMessageRequest.receiptRequest = {
      notifyURL: orangeConfig.callbackUrl,
      callbackData: "smith-heffa-paygate",
    };
  }

  const response = await fetch(
    `${orangeConfig.smsBaseUrl}/outbound/${encodeURIComponent(sender)}/requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ outboundSMSMessageRequest }),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      ok: false,
      mode: "live",
      provider: "orange",
      error: `Orange SMS error ${response.status}: ${text}`,
    };
  }

  const data = await response.json().catch(() => ({}));

  return {
    ok: true,
    mode: "live",
    provider: "orange",
    data,
  };
}

module.exports = {
  sendOrangeSms,
};
