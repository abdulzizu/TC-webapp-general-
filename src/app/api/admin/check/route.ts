import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// GET /api/admin/check — verifies admin cookie signature
function signToken(payload: string): string {
  const secret = process.env.ADMIN_PIN || "fallback";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const [timestamp, signature] = cookie.split(":");
    if (!timestamp || !signature) throw new Error("malformed");

    // Verify signature
    const expected = signToken(`admin:${timestamp}`);
    if (signature !== expected) throw new Error("invalid signature");

    // Check token age (max 24 hours)
    const age = Date.now() - Number(timestamp);
    if (age > 24 * 60 * 60 * 1000) throw new Error("expired");

    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
