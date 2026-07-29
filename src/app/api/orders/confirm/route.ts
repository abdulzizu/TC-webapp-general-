import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// POST /api/orders/confirm
// Body: { email, name, orderId, items, subtotal, shippingCost, discountAmount, total, deliveryAddress, isStockpile }
// Sends a branded order confirmation email via Resend

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      name,
      orderId,
      items,
      subtotal,
      shippingCost,
      discountAmount,
      total,
      deliveryAddress,
      isStockpile,
    } = await req.json();

    if (!email || !orderId) {
      return NextResponse.json({ error: "Email and order ID required" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
    }

    const firstName = (name || "there").split(" ")[0];
    const formattedItems = (items || [])
      .map((i: any) => `<tr><td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151;">${i.productName} <span style="color: #9ca3af;">× ${i.quantity}</span></td><td style="padding: 8px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; text-align: right; font-weight: 600;">₦${(i.price * i.quantity).toLocaleString()}</td></tr>`)
      .join("");

    const subject = isStockpile
      ? `Order confirmed — items stockpiled (${orderId})`
      : `Order confirmed! (${orderId})`;

    const html = `
      <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden;">
        <!-- Header -->
        <div style="background: #1a1a1a; padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.5px;">THRIFT COLLISION</h1>
          <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0; letter-spacing: 2px; text-transform: uppercase;">Premium Thrifted Streetwear</p>
        </div>
        
        <!-- Body -->
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 20px; font-weight: 700; margin: 0 0 8px 0;">
            ${isStockpile ? "Items stockpiled!" : "Order confirmed!"}
          </h2>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
            Thanks, ${firstName}. ${isStockpile ? "Your items are safely held for you." : "We're getting your order ready."}
          </p>
          
          <!-- Order ID badge -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 12px 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 12px; color: #6b7280;">Order ID</p>
            <p style="margin: 4px 0 0 0; font-size: 18px; font-weight: 700; color: #1a6b2f; font-family: monospace;">${orderId}</p>
          </div>
          
          <!-- Items table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <thead>
              <tr>
                <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Item</th>
                <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${formattedItems}
            </tbody>
          </table>
          
          <!-- Totals -->
          <div style="border-top: 2px solid #e5e7eb; padding-top: 12px; margin-bottom: 24px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">Subtotal</td>
                <td style="padding: 4px 0; font-size: 13px; color: #374151; text-align: right;">₦${(subtotal || 0).toLocaleString()}</td>
              </tr>
              ${discountAmount > 0 ? `<tr><td style="padding: 4px 0; font-size: 13px; color: #1a6b2f;">Discount</td><td style="padding: 4px 0; font-size: 13px; color: #1a6b2f; text-align: right;">−₦${discountAmount.toLocaleString()}</td></tr>` : ""}
              <tr>
                <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">Shipping</td>
                <td style="padding: 4px 0; font-size: 13px; color: #374151; text-align: right;">${isStockpile ? "Later" : shippingCost === 0 ? "FREE" : `₦${(shippingCost || 0).toLocaleString()}`}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #1a1a1a; border-top: 1px solid #e5e7eb;">Total</td>
                <td style="padding: 8px 0 0 0; font-size: 16px; font-weight: 700; color: #1a1a1a; text-align: right; border-top: 1px solid #e5e7eb;">₦${(total || 0).toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <!-- Delivery info -->
          <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">Delivering to</p>
            <p style="margin: 0; font-size: 14px; color: #374151;">${deliveryAddress || "Address on file"}</p>
            ${isStockpile ? `<p style="margin: 8px 0 0 0; font-size: 12px; color: #d97706;">Stockpiled — contact us when you're ready for delivery</p>` : ""}
          </div>
          
          <!-- CTA -->
          <a href="https://www.thriftcollision.com/tracking" style="display: inline-block; background: #1a6b2f; color: #ffffff; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 50px; letter-spacing: 0.5px;">
            Track Your Order
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
      console.error("Order confirmation email failed:", err);
      return NextResponse.json({ error: "Failed to send confirmation email" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Order confirm email error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
