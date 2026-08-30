import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// POST /api/payments/webhook
// Paystack sends payment events here
// Verifies signature, updates order status, adjusts stock

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify webhook signature
    const hash = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);

    // Only process successful charges
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const { reference, metadata, amount } = event.data;
    const orderId = reference || metadata?.order_id;

    if (!orderId) {
      return NextResponse.json({ received: true });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get the order
    const { data: order } = await supabase
      .from("orders")
      .select("id, order_id, status, is_stockpile, total")
      .eq("order_id", orderId)
      .single();

    if (!order) {
      console.error("Webhook: order not found for reference:", orderId);
      return NextResponse.json({ received: true });
    }

    // Verify amount matches order total (allow for Paystack fees)
    const paidAmount = amount / 100; // Paystack sends in kobo
    const maxExpected = order.total * 1.02 + 200;
    if (paidAmount < order.total - 1 || paidAmount > maxExpected) {
      console.error(`Webhook: amount mismatch for ${orderId}! Expected ~₦${order.total}, got ₦${paidAmount}`);
      return NextResponse.json({ received: true, error: "amount_mismatch" });
    }

    // Don't process if already processed
    if (order.status === "processing" || order.status === "shipped" || order.status === "delivered") {
      return NextResponse.json({ received: true });
    }

    // Update order status to processing (or stockpiled if stockpile order)
    const newStatus = order.is_stockpile ? "stockpiled" : "processing";
    await supabase.from("orders").update({
      status: newStatus,
      pay_method: "paystack",
    }).eq("id", order.id);

    // Stock tracking — reduce availability
    const { data: orderItems } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", order.id);

    if (orderItems && orderItems.length > 0) {
      for (const item of orderItems) {
        if (!item.product_id) continue;

        // Since items are one-of-one, mark as SOLD (kept visible) and clear the hold.
        await supabase.from("products").update({
          tag: "SOLD",
          held_until: null,
          held_by_order: null,
        }).eq("id", item.product_id);
      }
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    // Always return 200 to Paystack so they don't retry indefinitely
    return NextResponse.json({ received: true, error: err.message });
  }
}
