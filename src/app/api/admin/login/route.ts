import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Force Node.js runtime (not Edge) — needed for bcryptjs
export const runtime = "nodejs";

// POST /api/admin/login
// Body: { email: string, password: string }
// Sets an httpOnly cookie with HMAC-signed token

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const attempts: Map<string, { count: number; lastAttempt: number }> = new Map();

function getClientIP(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function signToken(payload: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
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
    attempts.delete(ip);
  }

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  // Look up admin user
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, name, email, password_hash, role")
    .eq("email", email.trim().toLowerCase())
    .single();

  if (!admin) {
    const current = attempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Verify password
  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) {
    const current = attempts.get(ip) || { count: 0, lastAttempt: 0 };
    attempts.set(ip, { count: current.count + 1, lastAttempt: Date.now() });
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  // Success — clear attempts
  attempts.delete(ip);

  // Create signed token with admin info
  const timestamp = Date.now().toString();
  const payload = `admin:${admin.id}:${admin.role}:${timestamp}`;
  const signature = signToken(payload);
  const token = `${admin.id}:${admin.role}:${timestamp}:${signature}`;

  const res = NextResponse.json({ success: true, name: admin.name, role: admin.role });
  res.cookies.set("tc_admin", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return res;
}
