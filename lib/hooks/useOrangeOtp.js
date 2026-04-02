import { useState } from "react";

export function useOrangeOtp() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function sendOtp(payload) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/paygate/orange/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setResult(data);

      if (!response.ok) {
        throw new Error(data.error || "OTP send failed");
      }

      return data;
    } catch (err) {
      setError(err.message || "Unknown error");
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    result,
    error,
    sendOtp,
  };
}
