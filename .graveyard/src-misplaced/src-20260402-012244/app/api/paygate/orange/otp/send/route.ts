import { NextResponse } from "next/server";
import { generateOtp } from "@/src/lib/paygate/auth/generate-otp";
import { sendOrangeSms } from "@/src/lib/paygate/orange/send-sms";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { country, phoneNumber } = body as {
      country?: string;
      phoneNumber?: string;
    };

    if (!country || !phoneNumber) {
      return NextResponse.json(
        { ok: false, error: "country and phoneNumber are required" },
        { status: 400 }
      );
    }

    const otp = generateOtp(6);

    const delivery = await sendOrangeSms({
      country: country as any,
      phoneNumber,
      message: `Smith-Heffa Paygate - Votre code OTP est ${otp}`,
    });

    if (!delivery.ok) {
      return NextResponse.json(
        { ok: false, error: delivery.error, delivery },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      otpPreview: process.env.NODE_ENV === "production" ? undefined : otp,
      delivery,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
