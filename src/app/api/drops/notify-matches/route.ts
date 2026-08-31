import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// POST /api/drops/notify-matches
// Body: { dropId: number }  OR  { productIds: number[] }
// Checks user wishlist keywords against the given products (a whole drop, or a
// specific set of newly-available items) and emails the customers who match.
// Dedup: tracks (user, product) pairs in `wishlist_notifications` so the same
// customer is never emailed about the same product twice. Different products
// matching the same keyword still trigger new emails — the keyword represents
// an ongoing interest until the customer removes it.

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

    // Get all user keywords with their user_id
    const { data: keywords } = await supabase
      .from("keywords")
      .select("keyword, user_id");

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ matches: 0 });
    }

    // Get profiles (emails)
    const userIds = [...new Set(keywords.map((k: any) => k.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, name")
      .in("id", userIds);

    if (!profiles) return NextResponse.json({ matches: 0 });

    const productIdList = products.map((p: any) => p.id);

    // ── Dedup: load existing (user, product) notification pairs ───────
    const { data: alreadySent } = await supabase
      .from("wishlist_notifications")
      .select("user_id, product_id")
      .in("user_id", userIds)
      .in("product_id", productIdList);

    const sentSet = new Set(
      (alreadySent ?? []).map((r: any) => `${r.user_id}:${r.product_id}`)
    );

    // Match keywords against products, skipping already-notified pairs
    type Notif = {
      userId: string;
      email: string;
      name: string;
      matchedProducts: any[];
    };
    const notifications: Notif[] = [];

    for (const profile of profiles) {
      if (!profile.email) continue;

      const userKeywords = keywords
        .filter((k: any) => k.user_id === profile.id)
        .map((k: any) => k.keyword.toLowerCase());

      const matched = products.filter((p: any) => {
        // Skip if we already emailed this user about this exact product
        if (sentSet.has(`${profile.id}:${p.id}`)) return false;

        const searchText = `${p.name} ${p.subcategory} ${p.description}`.toLowerCase();
        return userKeywords.some((kw: string) => searchText.includes(kw));
      });

      if (matched.length > 0) {
        notifications.push({
          userId: profile.id,
          email: profile.email,
          name: profile.name || "",
          matchedProducts: matched,
        });
      }
    }

    if (notifications.length === 0) {
      return NextResponse.json({ matches: 0 });
    }

    // Send emails via Resend
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ matches: notifications.length, sent: 0, error: "Resend not configured" });
    }

    let sent = 0;
    // Collect all (user, product) pairs we successfully notify — we'll record them after sending.
    const newPairs: { user_id: string; product_id: number }[] = [];

    for (const notif of notifications) {
      const firstName = notif.name ? notif.name.split(" ")[0] : "";
      const productList = notif.matchedProducts
        .map((p: any) =>
          `<tr>` +
          `<td style="padding:10px 0;border-bottom:1px solid #f3f4f6">` +
          (p.image ? `<img src="${p.image}" alt="" width="48" height="48" style="border-radius:8px;object-fit:cover;vertical-align:middle;margin-right:10px">` : "") +
          `<strong style="color:#1a1a1a;font-size:14px">${p.name}</strong>` +
          `<br><span style="color:#6b7280;font-size:12px">₦${p.price.toLocaleString()}</span>` +
          `</td></tr>`
        )
        .join("");

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendKey}` },
        body: JSON.stringify({
          from: "Thrift Collision <hello@thriftcollision.com>",
          reply_to: "help@thriftcollision.com",
          to: notif.email,
          subject: `${firstName ? firstName + ", something" : "Something"} on your wishlist just dropped 🔥`,
          html: `
            <div style="font-family:'Space Grotesk',-apple-system,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden">
              <div style="background:#1a1a1a;padding:32px 24px;text-align:center">
                <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;letter-spacing:-0.5px">THRIFT COLLISION</h1>
                <p style="color:#9ca3af;font-size:12px;margin:8px 0 0;letter-spacing:2px;text-transform:uppercase">Unisex Thrifted Streetwear</p>
              </div>
              <div style="padding:32px">
                <h2 style="color:#1a1a1a;font-size:20px;font-weight:700;margin:0 0 8px">Your wishlist just got real 🎯</h2>
                <p style="color:#6b7280;font-size:14px;margin:0 0 20px;line-height:1.6">
                  Hey${firstName ? ` ${firstName}` : ""}, ${notif.matchedProducts.length > 1 ? "these items match" : "this item matches"} what you've been looking for — and ${notif.matchedProducts.length > 1 ? "they're" : "it's"} one-of-one, so move fast.
                </p>
                <table style="width:100%;border-collapse:collapse;margin-bottom:24px">${productList}</table>
                <div style="text-align:center">
                  <a href="https://www.thriftcollision.com/shop" style="display:inline-block;background:#1a6b2f;color:#fff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:0.5px">
                    Shop Now
                  </a>
                </div>
              </div>
              <div style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;text-align:center">
                <div style="margin-bottom:12px">
                  <a href="https://www.instagram.com/thriftcollision/" style="display:inline-block;margin:0 6px;text-decoration:none">
                    <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" alt="Instagram" width="20" height="20" style="border-radius:4px">
                  </a>
                  <a href="https://x.com/thriftcollision" style="display:inline-block;margin:0 6px;text-decoration:none">
                    <img src="https://cdn-icons-png.flaticon.com/512/5969/5969020.png" alt="X" width="20" height="20">
                  </a>
                </div>
                <p style="color:#9ca3af;font-size:11px;margin:0 0 4px">
                  <a href="https://www.thriftcollision.com" style="color:#1a6b2f;text-decoration:none">thriftcollision.com</a>
                </p>
                <p style="color:#d1d5db;font-size:10px;margin:0">© 2026 Thrift Collision. All rights reserved.</p>
              </div>
            </div>
          `,
        }),
      });

      if (res.ok) {
        sent++;
        // Record each (user, product) pair so we don't re-notify about these exact items.
        for (const p of notif.matchedProducts) {
          newPairs.push({ user_id: notif.userId, product_id: p.id });
        }
      }
    }

    // ── Record sent notifications (ignore conflicts = already tracked) ──
    if (newPairs.length > 0) {
      await supabase
        .from("wishlist_notifications")
        .upsert(newPairs, { onConflict: "user_id,product_id", ignoreDuplicates: true });
    }

    return NextResponse.json({ matches: notifications.length, sent });
  } catch (err: any) {
    console.error("Wishlist notify error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
