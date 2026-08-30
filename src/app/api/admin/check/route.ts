import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";

// GET /api/admin/check — verifies the admin session cookie (signature + age)
export async function GET(req: NextRequest) {
  const session = verifyAdmin(req);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, adminId: session.adminId, role: session.role });
}
