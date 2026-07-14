import { NextRequest, NextResponse } from "next/server";

// GET /api/admin/check — verifies admin cookie is valid
export async function GET(req: NextRequest) {
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const decoded = Buffer.from(cookie, "base64").toString();
    const [prefix, , pin] = decoded.split(":");
    if (prefix === "admin" && pin === process.env.ADMIN_PIN) {
      return NextResponse.json({ authenticated: true });
    }
  } catch {}

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
