import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { company_name, owner_name, email, phone, address } = body;

    if (!email || !company_name || !owner_name) {
      return NextResponse.json(
        { detail: "Company name, owner name, and email are required." },
        { status: 400 }
      );
    }

    console.log(`[Ziga POS API] Registration requested for ${company_name} (${email}). Sending OTP...`);

    // Return success status with simulated OTP dispatch
    return NextResponse.json({
      status: true,
      message: `OTP verification code sent to ${email}`,
      email,
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Failed to process registration request." },
      { status: 500 }
    );
  }
}
