import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";

// POST /api/admin/login
// Body: { pin: string }
// Sets an httpOnly cookie with HMAC-signed token

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function signToken(payload: string): string {
  const secret = process.env.ADMIN_PIN || "fallback";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req);

  // Rate limiting
  const record = attempts.get(ip);
  if (record && record.count >= MAX_ATTEMPTS) {
    const elapsed = Date.now() - record.lastAttempt;
    if (elapsed < LOCKOUT_MS) {
      return NextResponse.json(
        { error: "Too many attempts. Try again in 15 minutes." },
        { status: 429 }
      );
    }
    // Reset after lockout period
    attempts.delete(ip);
  }

  const { pin } = await req.json();

  if (!pin || pin !== process.env.ADMIN_PIN) {
    // Track failed attempt
    const current = attempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });

    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  // Success — clear attempts
  attempts.delete(ip);

  // Create a signed token (not reversible like base64)
  const timestamp = Date.now().toString();
  const signature = signToken(`admin:${timestamp}`);
  const token = `${timestamp}:${signature}`;

  const res = NextResponse.json({ success: true });
  res.cookies.set("tc_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return res;
}
