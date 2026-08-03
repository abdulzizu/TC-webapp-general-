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
        .select("product_id, product_name, product_image, size, quantity, price")
        .eq("order_id", order.id);

      if (orderItems) {
        for (const item of orderItems) {
          if (!item.product_id) continue;
          await supabase.from("products").update({
            tag: "SOLD OUT",
          }).eq("id", item.product_id);
        }
      }

      // Send order confirmation email now that payment is verified
      const { data: fullOrder } = await supabase
        .from("orders")
        .select("guest_email, guest_name, order_id, subtotal, shipping_cost, discount_amount, total, delivery_address, is_stockpile")
        .eq("id", order.id)
        .single();

      if (fullOrder?.guest_email) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.thriftcollision.com";
        try {
          await fetch(`${siteUrl}/api/orders/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: fullOrder.guest_email,
              name: fullOrder.guest_name || "Customer",
              orderId: fullOrder.order_id,
              items: (orderItems || []).map((i) => ({
                productName: i.product_name,
                productImage: i.product_image,
                size: i.size,
                quantity: i.quantity,
                price: i.price,
              })),
              subtotal: fullOrder.subtotal,
              shippingCost: fullOrder.shipping_cost,
              discountAmount: fullOrder.discount_amount,
              total: fullOrder.total,
              deliveryAddress: fullOrder.delivery_address,
              isStockpile: fullOrder.is_stockpile,
            }),
          });
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
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
