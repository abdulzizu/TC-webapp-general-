import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";

// POST /api/admin/discounts/send
// Body: { code: string, emails: string[], note?: string }
// Emails a discount code (with its terms) to specific customers via Resend.

type DiscountRow = {
  code: string;
  discount_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_purchase: number;
  end_date: string | null;
  active: boolean;
};

function describeDiscount(d: DiscountRow): string {
  const parts: string[] = [];
  if (d.discount_type === "percentage") parts.push(`${d.discount_value}% off`);
  else if (d.discount_type === "fixed") parts.push(`₦${d.discount_value.toLocaleString()} off`);
  else parts.push("Free shipping");
  if (d.min_purchase > 0) parts.push(`on orders from ₦${d.min_purchase.toLocaleString()}`);
  return parts.join(" ");
}

function buildHtml(firstName: string, d: DiscountRow, note: string, email: string): string {
  const perk = describeDiscount(d);
  const expiry = d.end_date
    ? `Valid until ${new Date(d.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}.`
    : "";
  const safeNote = note.trim();

  return `
    <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
      <!-- Header -->
      <div style="background: #1a1a1a; padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">THRIFT COLLISION</h1>
        <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">Unisex Thrifted Streetwear</p>
      </div>

      <!-- Body -->
      <div style="padding: 40px 32px;">
        <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">A little something for you 🎁</h2>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0; line-height: 1.6;">
          Hi ${firstName}, here's a discount to use on your next order.
        </p>

        ${safeNote ? `<p style="color: #4b5563; font-size: 14px; line-height: 1.7; margin: 0 0 20px 0; white-space: pre-line;">${safeNote}</p>` : ""}

        <!-- Code block -->
        <div style="background: #f0fdf4; border: 1px dashed #1a6b2f; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">${perk}</p>
          <p style="margin: 0; font-size: 26px; font-weight: 700; color: #1a6b2f; font-family: monospace; letter-spacing: 2px;">${d.code}</p>
        </div>

        ${expiry ? `<p style="color: #9ca3af; font-size: 12px; margin: 0 0 24px 0; text-align: center;">${expiry}</p>` : ""}

        <!-- CTA -->
        <div style="text-align: center;">
          <a href="https://www.thriftcollision.com/shop" style="display: inline-block; background: #1a6b2f; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.5px;">
            Shop Now
          </a>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 20px 32px; border-top: 1px solid #e5e7eb; text-align: center;">
        <div style="margin-bottom: 12px;">
          <a href="https://www.instagram.com/thriftcollision/" style="display: inline-block; margin: 0 6px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="20" height="20" style="border-radius: 4px;">
          </a>
          <a href="https://x.com/thriftcollision" style="display: inline-block; margin: 0 6px; text-decoration: none;">
            <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" width="20" height="20">
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 11px; margin: 0 0 4px 0;">
          <a href="https://www.thriftcollision.com" style="color: #1a6b2f; text-decoration: none;">thriftcollision.com</a>
        </p>
        <p style="color: #d1d5db; font-size: 10px; margin: 0;">
          © 2026 Thrift Collision. All rights reserved.
        </p>
      </div>
    </div>
  `;
}

export async function POST(req: NextRequest) {
  if (!verifyAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code, emails, note } = await req.json();

  if (!code || !Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "A code and at least one email are required" }, { status: 400 });
  }

  // De-dupe + basic email validation
  const cleanEmails = Array.from(
    new Set(
      emails
        .map((e: string) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
        .filter((e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    )
  );

  if (cleanEmails.length === 0) {
    return NextResponse.json({ error: "No valid email addresses provided" }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Confirm the code exists (and warn if it's inactive/expired, but still send)
  const { data: discount } = await supabase
    .from("discount_codes")
    .select("code, discount_type, discount_value, min_purchase, end_date, active")
    .eq("code", String(code).trim().toUpperCase())
    .single();

  if (!discount) {
    return NextResponse.json({ error: "That discount code no longer exists" }, { status: 404 });
  }

  // Best-effort first-name lookup per email (from profiles, then orders).
  const nameByEmail = new Map<string, string>();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("email, name")
    .in("email", cleanEmails);
  for (const p of profiles ?? []) {
    if (p.email && p.name) nameByEmail.set(p.email.toLowerCase(), String(p.name).split(" ")[0]);
  }
  const missing = cleanEmails.filter((e) => !nameByEmail.has(e));
  if (missing.length > 0) {
    const { data: orders } = await supabase
      .from("orders")
      .select("guest_email, guest_name")
      .in("guest_email", missing);
    for (const o of orders ?? []) {
      if (o.guest_email && o.guest_name && !nameByEmail.has(o.guest_email.toLowerCase())) {
        nameByEmail.set(o.guest_email.toLowerCase(), String(o.guest_name).split(" ")[0]);
      }
    }
  }

  // Send individually so each email is personalised.
  const payloads = cleanEmails.map((email) => ({
    from: "Thrift Collision <hello@thriftcollision.com>",
    reply_to: "help@thriftcollision.com",
    to: email,
    subject: `${describeDiscount(discount as DiscountRow)} — just for you`,
    html: buildHtml(nameByEmail.get(email) || "there", discount as DiscountRow, note || "", email),
  }));

  try {
    let sent = 0;
    // Resend batch endpoint accepts up to 100 per call.
    for (let i = 0; i < payloads.length; i += 100) {
      const batch = payloads.slice(i, i + 100);
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify(batch),
      });
      if (res.ok) sent += batch.length;
      else console.error("Discount send batch failed:", await res.json());
    }

    if (sent === 0) {
      return NextResponse.json({ error: "Failed to send emails" }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      sent,
      total: cleanEmails.length,
      inactive: !discount.active,
    });
  } catch (err: any) {
    console.error("Discount send error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
