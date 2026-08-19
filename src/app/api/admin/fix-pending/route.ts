import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// GET /api/admin/fix-pending
// One-time fix: checks all pending orders with Paystack and updates paid ones to processing
// Protected by admin cookie

export async function GET(req: NextRequest) {
  // Verify admin cookie
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get all pending orders
  const { data: pendingOrders } = await supabase
    .from("orders")
    .select("id, order_id, total, is_stockpile")
    .eq("status", "pending");

  if (!pendingOrders || pendingOrders.length === 0) {
    return NextResponse.json({ message: "No pending orders found", fixed: 0 });
  }

  let fixed = 0;
  let failed = 0;
  const results: any[] = [];

  for (const order of pendingOrders) {
    try {
      // Verify with Paystack
      const res = await fetch(`https://api.paystack.co/transaction/verify/${order.order_id}`, {
        headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
      });
      const data = await res.json();

      if (data.status && data.data?.status === "success") {
        // Payment was successful — update order
        const newStatus = order.is_stockpile ? "stockpiled" : "processing";
        await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);

        // Mark products as sold
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id")
          .eq("order_id", order.id);

        if (orderItems) {
          for (const item of orderItems) {
            if (item.product_id) {
              await supabase.from("products").update({ tag: "SOLD" }).eq("id", item.product_id);
            }
          }
        }

        fixed++;
        results.push({ order_id: order.order_id, status: newStatus, paid: true });
      } else {
        // Not paid — leave as pending or mark unsuccessful
        results.push({ order_id: order.order_id, status: "pending", paid: false, reason: data.data?.gateway_response || "not paid" });
        failed++;
      }
    } catch (err: any) {
      results.push({ order_id: order.order_id, error: err.message });
      failed++;
    }
  }

  return NextResponse.json({
    message: `Fixed ${fixed} orders, ${failed} unpaid/failed`,
    fixed,
    failed,
    total: pendingOrders.length,
    results,
  });
}
