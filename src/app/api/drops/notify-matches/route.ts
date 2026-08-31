import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// POST /api/drops/notify-matches
// Body: { dropId: number }  OR  { productIds: number[] }
// Checks user wishlist keywords against the given products (a whole drop, or a
// specific set of newly-available items) and emails the customers who match.

export async function POST(req: NextRequest) {
  try {
    const { dropId, productIds } = await req.json();
    if (!dropId && (!Array.isArray(productIds) || productIds.length === 0)) {
      return NextResponse.json({ error: "dropId or productIds required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get the products to notify about — either a whole drop, or a specific set.
    let query = supabase
      .from("products")
      .select("id, name, subcategory, description, image, price")
      .eq("available", true)
      .neq("tag", "SOLD");
    query = dropId ? query.eq("drop_id", dropId) : query.in("id", productIds);
    const { data: products } = await query;

    if (!products || products.length === 0) {
      return NextResponse.json({ matches: 0 });
    }

    // Get all user keywords with their email
    const { data: keywords } = await supabase
      .from("keywords")
      .select("keyword, user_id");

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ matches: 0 });
    }

    // Get profiles to get emails
    const userIds = [...new Set(keywords.map((k: any) => k.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);

    if (!profiles) return NextResponse.json({ matches: 0 });

    // Match keywords against product names/descriptions/subcategories
    const notifications: { email: string; name: string; matchedProducts: any[] }[] = [];

    for (const profile of profiles) {
      if (!profile.email) continue;

      const userKeywords = keywords
        .filter((k: any) => k.user_id === profile.id)
        .map((k: any) => k.keyword.toLowerCase());

      const matched = products.filter((p: any) => {
        const searchText = `${p.name} ${p.subcategory} ${p.description}`.toLowerCase();
        return userKeywords.some((kw: string) => searchText.includes(kw));
      });

      if (matched.length > 0) {
        notifications.push({ email: profile.email, name: profile.name || "", matchedProducts: matched });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ matches: 0 });
    }

    // Send emails via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) return NextResponse.json({ matches: notifications.length, sent: 0, error: "Resend not configured" });

    let sent = 0;
    for (const notif of notifications) {
      const productList = notif.matchedProducts
        .map((p: any) => `<li style="margin-bottom:8px"><strong>${p.name}</strong> — ₦${p.price.toLocaleString()}</li>`)
        .join("");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "Thrift Collision <hello@thriftcollision.com>",
          reply_to: "help@thriftcollision.com",
          to: notif.email,
          subject: "Items on your wishlist just dropped! 🔥",
          html: `
            <div style="font-family:'Space Grotesk',-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
              <div style="background:#1a1a1a;padding:32px 24px;text-align:center">
                <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0">THRIFT COLLISION</h1>
                <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase">Unisex Thrifted Streetwear</p>
              </div>
              <div style="padding:32px">
                <h2 style="color:#1a1a1a;font-size:20px;font-weight:700;margin:0 0 12px">Items matching your wishlist just dropped!</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px">Hey${notif.name ? ` ${notif.name.split(" ")[0]}` : ""}, we noticed these new items match what you're looking for:</p>
                <ul style="padding-left:16px;color:#374151;font-size:14px">${productList}</ul>
                <br>
                <a href="https://www.thriftcollision.com/shop" style="display:inline-block;background:#1a6b2f;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px">Shop Now</a>
              </div>
              <div style="background:#f9fafb;padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center">
                <p style="color:#d1d5db;font-size:10px;margin:0">© 2026 Thrift Collision. All rights reserved.</p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) sent++;
    }

    return NextResponse.json({ matches: notifications.length, sent });
  } catch (err: any) {
    console.error("Wishlist notify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
