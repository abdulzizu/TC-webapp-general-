import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ── Termii verify-token + Supabase session creation ───────────
// POST /api/auth/verify-otp
// Body: { pinId: string, pin: string, phone: string }
// Returns: { success: true, accessToken, refreshToken } on success

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) return "234" + digits.slice(1);
  if (raw.trim().startsWith("+")) return digits;
  return digits;
}

export async function POST(req: NextRequest) {
  try {
    const { pinId, pin, phone } = await req.json();

    if (!pinId || !pin || !phone) {
      return NextResponse.json(
        { error: "pinId, pin, and phone are all required" },
        { status: 400 }
      );
    }

    // ── Step 1: Verify OTP with Termii ──────────────────────
    const termiiRes = await fetch(`${process.env.TERMII_BASE_URL}/api/sms/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TERMII_API_KEY,
        pin_id: pinId,
        pin: pin.replace(/\D/g, ""),
      }),
    });

    const termiiData = await termiiRes.json();

    // Termii returns { verified: "True" } on success
    if (!termiiRes.ok || termiiData.verified !== "True") {
      console.error("Termii verify error:", termiiData);
      return NextResponse.json(
        { error: termiiData.detail || "Incorrect or expired code. Please try again." },
        { status: 401 }
      );
    }

    // ── Step 2: Create or find Supabase user ────────────────
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const normalisedPhone = "+" + normalisePhone(phone);
    // Use a deterministic placeholder email based on phone — needed for generateLink
    const placeholderEmail = `phone_${normalisePhone(phone)}@tc.thriftcollision.app`;

    // Try to find existing user by phone
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    let user = users?.find((u) => u.phone === normalisedPhone);

    if (!user) {
      // Also check by placeholder email (in case phone field wasn't set)
      user = users?.find((u) => u.email === placeholderEmail);
    }

    if (!user) {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        phone: normalisedPhone,
        email: placeholderEmail,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: { phone_verified: true },
      });

      if (createError || !newUser.user) {
        console.error("Supabase createUser error:", createError);
        return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
      }
      user = newUser.user;
    }

    // ── Step 3: Generate a magic link to extract session tokens ─
    // generateLink returns hashed_token + verification_type that we can
    // use with the client's verifyOtp to establish a session
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: user.email || placeholderEmail,
    });

    if (linkError || !linkData) {
      console.error("Supabase generateLink error:", linkError);
      return NextResponse.json({ error: "Failed to generate session" }, { status: 500 });
    }

    // The properties contain the OTP token hash we need
    // Client will use verifyOtp with type 'email' and this token
    return NextResponse.json({
      success: true,
      email: user.email || placeholderEmail,
      tokenHash: linkData.properties.hashed_token,
      type: "email",
    });
  } catch (err) {
    console.error("verify-otp unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
