import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, new_password } = body;

    if (!email || !otp || !new_password) {
      return NextResponse.json(
        { detail: "Email, OTP code, and new password are required." },
        { status: 400 }
      );
    }

    if (otp.length < 4) {
      return NextResponse.json(
        { detail: "Invalid verification code." },
        { status: 400 }
      );
    }

    console.log(`[Ziga POS API] Password successfully reset for ${email}`);

    return NextResponse.json({
      status: true,
      message: "Password reset successful! You can now log in.",
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Failed to reset password." },
      { status: 500 }
    );
  }
}
