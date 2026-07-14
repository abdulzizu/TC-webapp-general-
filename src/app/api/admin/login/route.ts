import { NextRequest, NextResponse } from "next/server";

// POST /api/admin/login
// Body: { pin: string }
// Sets an httpOnly cookie if PIN matches

export async function POST(req: NextRequest) {
  const { pin } = await req.json();

  if (!pin || pin !== process.env.ADMIN_PIN) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  // Set a simple session cookie — expires in 24 hours
  const token = Buffer.from(`admin:${Date.now()}:${process.env.ADMIN_PIN}`).toString("base64");

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
