import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp, company_name } = body;

    if (!otp || otp.length < 4) {
      return NextResponse.json(
        { detail: "Invalid OTP verification code." },
        { status: 400 }
      );
    }

    console.log(`[Ziga POS API] OTP verified for ${email} (${company_name}). Provisioning tenant workspace...`);

    // Simulated JWT token response for multi-tenant workspace access
    const mockAccessToken = `ziga_access_token_${Date.now()}`;
    const mockRefreshToken = `ziga_refresh_token_${Date.now()}`;

    return NextResponse.json({
      status: true,
      message: "Company workspace & owner account activated!",
      access: mockAccessToken,
      refresh: mockRefreshToken,
      user: {
        email,
        company: company_name || "Ziga Business",
        role: "owner",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { detail: "Failed to verify OTP code." },
      { status: 500 }
    );
  }
}
