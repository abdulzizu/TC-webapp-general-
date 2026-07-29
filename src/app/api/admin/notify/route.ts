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
            reply_to: "help@thriftcollision.com",
            to: email,
            subject,
            html: `
              <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
                <!-- Header -->
                <div style="background: #1a1a1a; padding: 32px 24px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">THRIFT COLLISION</h1>
                  <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">Premium Thrifted Streetwear</p>
                </div>
                
                <!-- Body -->
                <div style="padding: 40px 32px;">
                  <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 12px 0;">${subject}</h2>
                  <p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 28px 0; white-space: pre-line;">${message}</p>
                  
                  <!-- CTA Button -->
                  <a href="https://www.thriftcollision.com/shop" style="display: inline-block; background: #1a6b2f; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.5px;">
                    Shop the Drop
                  </a>
                </div>
                
                <!-- Footer -->
                <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
                  <!-- Social icons -->
                  <div style="margin-bottom: 12px;">
                    <a href="https://www.instagram.com/thriftcollision/" style="display: inline-block; margin: 0 6px; text-decoration: none;" title="Instagram">
                      <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="20" height="20" style="border-radius: 4px;">
                    </a>
                    <a href="https://x.com/thriftcollision" style="display: inline-block; margin: 0 6px; text-decoration: none;" title="X (Twitter)">
                      <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" width="20" height="20">
                    </a>
                  </div>
                  <p style="color: #9ca3af; font-size: 11px; margin: 0 0 8px 0;">
                    <a href="https://www.thriftcollision.com" style="color: #1a6b2f; text-decoration: none;">thriftcollision.com</a>
                  </p>
                  <p style="color: #d1d5db; font-size: 10px; margin: 0 0 4px 0;">
                    You signed up for drop notifications at thriftcollision.com
                  </p>
                  <p style="color: #d1d5db; font-size: 10px; margin: 0 0 4px 0;">
                    © 2026 Thrift Collision. All rights reserved.
                  </p>
                  <p style="margin: 8px 0 0 0;">
                    <a href="https://www.thriftcollision.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af; font-size: 10px; text-decoration: underline;">Unsubscribe from notifications</a>
                  </p>
                </div>
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
