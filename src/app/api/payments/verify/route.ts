import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// GET /api/payments/verify?reference=TC-XXXXXX
// Verifies payment with Paystack and updates order

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reference = searchParams.get("reference");

    if (!reference) {
      return NextResponse.json({ error: "Reference required", verified: false }, { status: 400 });
    }

    // Verify with Paystack
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await res.json();

    if (!data.status || data.data?.status !== "success") {
      return NextResponse.json({
        verified: false,
        error: data.data?.gateway_response || "Payment not successful",
      });
    }

    // Payment confirmed — verify amount matches order
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: order } = await supabase
      .from("orders")
      .select("id, status, is_stockpile, total")
      .eq("order_id", reference)
      .single();

    // Verify amount matches (allow for Paystack fees which may be added to the charge)
    const paidAmount = data.data.amount / 100;
    if (order) {
      const maxExpected = order.total * 1.02 + 200; // Allow up to 2% + ₦200 for Paystack fees
      if (paidAmount < order.total - 1 || paidAmount > maxExpected) {
        console.error(`Amount mismatch! Order ${reference}: expected ~₦${order.total}, paid ₦${paidAmount}`);
        return NextResponse.json({
          verified: false,
          error: "Payment amount does not match order total. Please contact support.",
        });
      }
    }

    if (order && order.status !== "processing" && order.status !== "shipped" && order.status !== "delivered") {
      const newStatus = order.is_stockpile ? "stockpiled" : "processing";
      await supabase.from("orders").update({ status: newStatus }).eq("id", order.id);

      // Stock tracking — mark products as sold
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id")
        .eq("order_id", order.id);

      if (orderItems) {
        for (const item of orderItems) {
          if (!item.product_id) continue;
          await supabase.from("products").update({
            tag: "SOLD OUT",
          }).eq("id", item.product_id);
        }
      }
    }

    return NextResponse.json({
      verified: true,
      amount: data.data.amount / 100, // Convert back from kobo
      reference: data.data.reference,
    });
  } catch (err: any) {
    console.error("Payment verify error:", err);
    return NextResponse.json({ verified: false, error: "Verification failed" }, { status: 500 });
  }
}
