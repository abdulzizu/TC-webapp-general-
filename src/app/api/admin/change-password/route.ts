import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

// POST /api/admin/change-password
// Body: { currentPassword: string, newPassword: string }
// Requires admin cookie

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract admin ID from cookie
  const [adminId] = cookie.split(":");
  if (!adminId) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required" }, { status: 400 });
  }

  if (newPassword.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get current admin
  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, password_hash")
    .eq("id", Number(adminId))
    .single();

  if (!admin) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, admin.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  // Hash new password and update
  const newHash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("admin_users")
    .update({ password_hash: newHash })
    .eq("id", admin.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
