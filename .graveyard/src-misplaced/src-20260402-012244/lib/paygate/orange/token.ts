import { orangeConfig } from "./config";

type OrangeTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function getOrangeAccessToken(): Promise<string> {
  const basic =
    orangeConfig.authHeader ||
    `Basic ${Buffer.from(
      `${orangeConfig.clientId}:${orangeConfig.clientSecret}`
    ).toString("base64")}`;

  const response = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: {
      Authorization: basic,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Orange token error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OrangeTokenResponse;
  return data.access_token;
}
