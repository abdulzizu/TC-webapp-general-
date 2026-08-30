import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// POST /api/payments/initialize
// Body: { email, amount, orderId, metadata }
// Returns: { authorization_url, reference }

// How long an item is held for a customer to complete payment.
const HOLD_MINUTES = 5;

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId, metadata } = await req.json();

    if (!email || !amount || !orderId) {
      return NextResponse.json({ error: "email, amount, and orderId are required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ── Reserve the items (one-of-one hold) ─────────────────────────────
    // Look up this order's product IDs, then try to place a short hold on each.
    // The hold is race-safe: a conditional update only succeeds if the item
    // isn't already freshly held by a *different* order and isn't already sold.
    const { data: orderRow } = await supabase
      .from("orders")
      .select("id")
      .eq("order_id", orderId)
      .single();

    if (orderRow) {
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, product_name")
        .eq("order_id", orderRow.id);

      const nowIso = new Date().toISOString();
      const holdUntilIso = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
      const conflicts: string[] = [];

      for (const item of items ?? []) {
        if (!item.product_id) continue;

        // Atomic claim: set the hold only if the row is currently claimable —
        // i.e. not sold, and either never held, hold expired, or held by us.
        const { data: claimed } = await supabase
          .from("products")
          .update({ held_until: holdUntilIso, held_by_order: orderId })
          .eq("id", item.product_id)
          .neq("tag", "SOLD")
          .or(`held_until.is.null,held_until.lt.${nowIso},held_by_order.eq.${orderId}`)
          .select("id");

        // No row updated → someone else holds it (or it's already sold).
        if (!claimed || claimed.length === 0) {
          conflicts.push(item.product_name || "an item");
        }
      }

      if (conflicts.length > 0) {
        // Roll back any holds we just placed for this order so we don't
        // strand items we can't actually sell together.
        await supabase
          .from("products")
          .update({ held_until: null, held_by_order: null })
          .eq("held_by_order", orderId);

        const names = conflicts.join(", ");
        const multiple = conflicts.length > 1;
        return NextResponse.json(
          {
            error: "item_held",
            heldItems: conflicts,
            message: `Someone's currently checking out ${names}. Since ${multiple ? "these are" : "it's"} one-of-one, we've paused ${multiple ? "them" : "it"} for a few minutes. If they don't complete payment, ${multiple ? "they'll" : "it'll"} free up — check back shortly, or remove ${multiple ? "them" : "it"} and check out the rest of your cart now so you don't miss those too.`,
          },
          { status: 409 }
        );
      }
    }

    // Initialize transaction with Paystack
    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack uses kobo (amount in kobo)
        reference: orderId, // Use our order ID as the Paystack reference
        callback_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://www.thriftcollision.com"}/payment/verify?reference=${orderId}`,
        metadata: {
          order_id: orderId,
          ...metadata,
        },
      }),
    });

    const data = await res.json();

    if (!data.status || !data.data?.authorization_url) {
      console.error("Paystack init failed:", data);
      return NextResponse.json({ error: data.message || "Payment initialization failed" }, { status: 502 });
    }

    // Update order with payment reference in Supabase
    await supabase.from("orders").update({
      pay_method: "paystack",
      status: "pending",
    }).eq("order_id", orderId);

    return NextResponse.json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("Payment init error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
