import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { detail: "Email address is required." },
        { status: 400 }
      );
    }

    console.log(`[Ziga POS API] Password reset OTP requested for ${email}`);

    return NextResponse.json({
      status: true,
      message: `Password reset instructions and verification code sent to ${email}`,
      email,
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
