import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/admin/release-expired
// Releases items from pending orders older than 10 minutes (payment abandoned)
// Verifies with Paystack first — if payment was actually made, updates order to processing instead

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find pending orders older than 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: expiredOrders } = await supabase
      .from("orders")
      .select("id, order_id, is_stockpile, total")
      .eq("status", "pending")
      .lt("created_at", tenMinsAgo);

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: "No expired pending orders", released: 0, confirmed: 0 });
    }

    let releasedCount = 0;
    let confirmedCount = 0;

    for (const order of expiredOrders) {
      // Check with Paystack if this order was actually paid
      let isPaid = false;
      try {
        const paystackRes = await fetch(
          `https://api.paystack.co/transaction/verify/${order.order_id}`,
          { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
        );
        const paystackData = await paystackRes.json();
        if (paystackData.status && paystackData.data?.status === "success") {
          // Verify amount matches
          const paidAmount = paystackData.data.amount / 100;
          const maxExpected = order.total * 1.02 + 200;
          if (paidAmount >= order.total - 1 && paidAmount <= maxExpected) {
            isPaid = true;
          }
        }
      } catch {
        // If Paystack check fails, don't release — err on the side of caution
        continue;
      }

      if (isPaid) {
        // Payment was made — update order status to processing/stockpiled
        const newStatus = order.is_stockpile ? "stockpiled" : "processing";
        await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);
        confirmedCount++;
      } else {
        // Payment was NOT made — release the items
        const { data: items } = await supabase
          .from("order_items")
          .select("product_id")
          .eq("order_id", order.id);

        if (items) {
          for (const item of items) {
            if (!item.product_id) continue;
            // Only release if still marked SOLD OUT
            await supabase
              .from("products")
              .update({ tag: "NEW" })
              .eq("id", item.product_id)
              .eq("tag", "SOLD OUT");
          }
        }

        // Mark order as cancelled
        await supabase.from("orders").update({ status: "cancelled" }).eq("id", order.id);
        releasedCount++;
      }
    }

    return NextResponse.json({
      message: `Processed ${expiredOrders.length} expired order(s): ${confirmedCount} confirmed paid, ${releasedCount} released`,
      released: releasedCount,
      confirmed: confirmedCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
