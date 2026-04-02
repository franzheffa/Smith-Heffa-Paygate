const { orangeConfig } = require("./config");

async function getOrangeAccessToken() {
  const credentials = Buffer.from(
    `${orangeConfig.clientId}:${orangeConfig.clientSecret}`
  ).toString("base64");

  const response = await fetch(orangeConfig.tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }).toString(),
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Orange token error ${response.status}: ${text}`);
  }

  const data = await response.json();
  return data.access_token;
}

module.exports = {
  getOrangeAccessToken,
};
