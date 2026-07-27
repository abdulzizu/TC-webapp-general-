import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

// Force Node.js runtime (not Edge) — needed for bcryptjs
export const runtime = "nodejs";

// GET /api/admin/setup?name=Admin&email=admin@thriftcollision.com&password=YourPassword
// One-time setup — creates the first admin user
// IMPORTANT: Delete this route or protect it after first use

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Admin";
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email || !password) {
    return NextResponse.json({
      error: "Usage: /api/admin/setup?name=YourName&email=your@email.com&password=YourSecurePassword",
    }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Check if admin already exists
  const { data: existing } = await supabase.from("admin_users").select("id").eq("email", email).single();
  if (existing) {
    return NextResponse.json({ error: "Admin with this email already exists" }, { status: 409 });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Insert admin
  const { error } = await supabase.from("admin_users").insert({
    name,
    email,
    password_hash: passwordHash,
    role: "owner",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: `Admin "${name}" created with email "${email}". You can now log in at /admin/login. DELETE this setup route after use.`,
  });
}
