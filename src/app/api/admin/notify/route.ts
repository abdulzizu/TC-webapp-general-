import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/notify
// Body: { subject: string, message: string }
// Sends an email to all leads via Resend

export async function POST(req: NextRequest) {
  // Verify admin cookie
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, message } = await req.json();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 400 });
  }

  // Get all leads with email addresses
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: leads } = await supabase
    .from("temp_leads")
    .select("email, phone")
    .not("email", "is", null);

  const emails = (leads ?? [])
    .filter((l: any) => l.email && l.email.includes("@"))
    .map((l: any) => l.email);

  if (emails.length === 0) {
    return NextResponse.json({ error: "No leads with email addresses found" }, { status: 400 });
  }

  // Send via Resend (batch — max 100 per call)
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Resend API key not configured" }, { status: 500 });
  }

  try {
    // Resend supports batch sending
    const batches = [];
    for (let i = 0; i < emails.length; i += 50) {
      batches.push(emails.slice(i, i + 50));
    }

    let totalSent = 0;

    for (const batch of batches) {
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify(
          batch.map((email: string) => ({
            from: "Thrift Collision <hello@thriftcollision.com>",
            to: email,
            subject,
            html: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #1a6b2f;">Thrift Collision</h2>
                <p>${message.replace(/\n/g, "<br>")}</p>
                <br>
                <a href="https://www.thriftcollision.com/shop" style="display: inline-block; background: #1a6b2f; color: white; padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: bold;">Shop the Drop</a>
                <br><br>
                <p style="color: #999; font-size: 12px;">You're receiving this because you signed up for drop notifications at thriftcollision.com</p>
              </div>
            `,
          }))
        ),
      });

      if (res.ok) {
        totalSent += batch.length;
      }
    }

    return NextResponse.json({ success: true, sent: totalSent, total: emails.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to send" }, { status: 500 });
  }
}
