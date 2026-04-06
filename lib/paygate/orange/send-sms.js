// Smith-Heffa Paygate — Orange SMS lib stub
// Actual M2M OAuth is handled in pages/api/paygate/orange/otp/send.js
// This file exists to satisfy webpack static analysis

async function sendOrangeSMS({ country, phoneNumber, message }) {
  // No-op stub: real logic lives in the API route handler
  // Prevents "Module not found" webpack warning at build time
  console.info('[Orange lib] sendOrangeSMS called for', country, phoneNumber);
  return { success: true, stubbed: true };
}

module.exports = { sendOrangeSMS };
