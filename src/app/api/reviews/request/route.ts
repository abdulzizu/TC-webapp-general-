import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/reviews/request
// Body: { email, name, orderId }
// Sends a branded "leave a review" email via Resend once an order is delivered.

export async function POST(req: NextRequest) {
  try {
    // Basic origin check — only allow from our own site
    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    const allowedOrigins = ["thriftcollision.com", "tc-webapp-general.vercel.app", "localhost"];
    const isAllowed = allowedOrigins.some((o) => origin.includes(o));
    if (!isAllowed && origin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { email, name, orderId } = await req.json();

    if (!email || !orderId) {
      return NextResponse.json({ error: "Email and order ID required" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const firstName = (name || "there").split(" ")[0];
    const reviewUrl = `https://www.thriftcollision.com/review?order=${encodeURIComponent(orderId)}`;

    const subject = `How was your order, ${firstName}? 💬`;

    const html = `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #1a1a1a; padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">THRIFT COLLISION</h1>
          <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">Unisex Thrifted Streetwear</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
            Your order landed 🎉
          </h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0; line-height: 1.6;">
            Hey ${firstName}, we hope you're loving your pieces. Mind sharing a few words about your experience? It helps other thrifters shop with confidence — and it means a lot to us.
          </p>

          <!-- Order ID badge -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Order ID</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1a6b2f; font-family: monospace;">${orderId}</p>
          </div>

          <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px 0; line-height: 1.6;">
            Just a comment — no star ratings, no fuss. You can add a photo too if you'd like.
          </p>

          <!-- CTA -->
          <a href="${reviewUrl}" style="display: inline-block; background: #1a6b2f; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.5px;">
            Leave a Review
          </a>
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

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: "Thrift Collision <hello@thriftcollision.com>",
        reply_to: "help@thriftcollision.com",
        to: email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("Review request email failed:", err);
      return NextResponse.json({ error: "Failed to send review request email" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Review request email error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
