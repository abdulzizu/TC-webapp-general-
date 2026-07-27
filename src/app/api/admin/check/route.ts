import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// GET /api/admin/check — verifies admin cookie signature
function signToken(payload: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const parts = cookie.split(":");
    if (parts.length !== 4) throw new Error("malformed");

    const [adminId, role, timestamp, signature] = parts;

    // Verify signature
    const payload = `admin:${adminId}:${role}:${timestamp}`;
    const expected = signToken(payload);
    if (signature !== expected) throw new Error("invalid signature");

    // Check token age (max 24 hours)
    const age = Date.now() - Number(timestamp);
    if (age > 24 * 60 * 60 * 1000) throw new Error("expired");

    return NextResponse.json({ authenticated: true, adminId, role });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
