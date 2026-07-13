import { NextRequest, NextResponse } from "next/server";

// ── Termii send-token endpoint ────────────────────────────────
// POST /api/auth/send-otp
// Body: { phone: string }  — accepts any Nigerian format e.g. 0801…, +2348…, 2348…
// Returns: { pinId: string } on success, { error: string } on failure

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // 0801… → 2348…  (11 digits starting with 0)
  if (digits.startsWith("0") && digits.length === 11) {
    return "234" + digits.slice(1);
  }
  // +2348… → 2348…
  if (raw.trim().startsWith("+")) return digits;
  return digits;
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json();

    if (!phone || typeof phone !== "string") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const normalisedPhone = normalisePhone(phone);

    if (normalisedPhone.length < 10) {
      return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
    }

    const body = {
      api_key: process.env.TERMII_API_KEY,
      message_type: "NUMERIC",
      to: normalisedPhone,
      from: process.env.TERMII_SENDER_ID,
      // Channel controlled by TERMII_OTP_CHANNEL env var:
      // "whatsapp" for WhatsApp delivery, "generic" for SMS
      channel: process.env.TERMII_OTP_CHANNEL ?? "generic",
      pin_attempts: 3,
      pin_time_to_live: 10, // minutes
      pin_length: 6,
      pin_placeholder: "< 000000 >",
      message_text: "Your Thrift Collision verification code is < 000000 >. Valid for 10 minutes.",
      pin_type: "NUMERIC",
    };

    const response = await fetch(`${process.env.TERMII_BASE_URL}/api/sms/otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Termii returns { pinId, to, smsStatus } on success
    if (!response.ok || !data.pinId) {
      console.error("Termii send-otp error:", data);
      return NextResponse.json(
        { error: data.message || "Failed to send verification code. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ pinId: data.pinId });
  } catch (err) {
    console.error("send-otp unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
