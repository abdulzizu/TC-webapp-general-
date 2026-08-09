import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// GET /api/admin/release-expired
// Releases items from pending orders older than 30 minutes (payment abandoned)
// Can be called via cron-job.org every 15 minutes

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Find pending orders older than 30 minutes
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data: expiredOrders } = await supabase
      .from("orders")
      .select("id, order_id")
      .eq("status", "pending")
      .lt("created_at", thirtyMinsAgo);

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({ message: "No expired pending orders", released: 0 });
    }

    let releasedCount = 0;

    for (const order of expiredOrders) {
      // Get the order items
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", order.id);

      if (items) {
        for (const item of items) {
          if (!item.product_id) continue;
          // Only release if still marked SOLD OUT (not if manually changed)
          await supabase
            .from("products")
            .update({ tag: "NEW" })
            .eq("id", item.product_id)
            .eq("tag", "SOLD OUT");
        }
      }

      // Mark order as expired/cancelled
      await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", order.id);

      releasedCount++;
    }

    return NextResponse.json({
      message: `Released items from ${releasedCount} expired order(s)`,
      released: releasedCount,
      orders: expiredOrders.map((o) => o.order_id),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
