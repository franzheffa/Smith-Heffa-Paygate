"use client";

import { useState } from "react";

type OrangeOtpResponse = {
  ok: boolean;
  otpPreview?: string;
  error?: string;
  delivery?: unknown;
};

export function useOrangeOtp() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrangeOtpResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendOtp(country: string, phoneNumber: string) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/paygate/orange/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country, phoneNumber }),
      });

      const data = (await response.json()) as OrangeOtpResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
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
