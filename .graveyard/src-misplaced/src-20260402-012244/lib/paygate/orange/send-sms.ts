import { orangeConfig } from "./config";
import { getOrangeAccessToken } from "./token";
import type { OrangeCountryCode } from "./countries";

export type SendOrangeSmsInput = {
  country: OrangeCountryCode;
  phoneNumber: string;
  message: string;
};

export type SendOrangeSmsResult =
  | { ok: true; mode: "simulation" | "live"; provider: "orange" }
  | { ok: false; mode: "simulation" | "live"; provider: "orange"; error: string };

function normalizePhoneNumber(phoneNumber: string) {
  return phoneNumber.replace(/[^\d+]/g, "");
}

export async function sendOrangeSms(
  input: SendOrangeSmsInput
): Promise<SendOrangeSmsResult> {
  const phoneNumber = normalizePhoneNumber(input.phoneNumber);

  if (!orangeConfig.smsEnabled) {
    return { ok: true, mode: "simulation", provider: "orange" };
  }

  if (!orangeConfig.senderAddress) {
    return {
      ok: false,
      mode: "simulation",
      provider: "orange",
      error: "Missing ORANGE_SMS_SENDER_ADDRESS",
    };
  }

  const token = await getOrangeAccessToken();
  const outbound = encodeURIComponent(`tel:${orangeConfig.senderAddress}`);

  const response = await fetch(
    `https://api.orange.com/smsmessaging/v1/outbound/${outbound}/requests`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        outboundSMSMessageRequest: {
          address: `tel:${phoneNumber}`,
          senderAddress: `tel:${orangeConfig.senderAddress}`,
          outboundSMSTextMessage: {
            message: input.message,
          },
          ...(orangeConfig.callbackUrl
            ? { receiptRequest: { notifyURL: orangeConfig.callbackUrl } }
            : {}),
        },
      }),
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

  return { ok: true, mode: "live", provider: "orange" };
}
