import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// POST /api/payments/initialize
// Body: { email, amount, orderId, metadata }
// Returns: { authorization_url, reference }

export async function POST(req: NextRequest) {
  try {
    const { email, amount, orderId, metadata } = await req.json();

    if (!email || !amount || !orderId) {
      return NextResponse.json({ error: "email, amount, and orderId are required" }, { status: 400 });
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
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

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
