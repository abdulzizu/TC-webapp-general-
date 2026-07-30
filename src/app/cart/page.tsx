"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useCart } from "@/lib/cart-context";
import { createClient } from "@/lib/supabase/client";

export default function CartPage() {
  const { items, removeItem, subtotal } = useCart();
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; pct: number; type: string; value: number } | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [validating, setValidating] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(60000);

  // Load free shipping threshold from store settings
  useState(() => {
    const supabase = createClient();
    supabase.from("store_settings").select("value").eq("key", "free_shipping_threshold").single()
      .then(({ data }) => { if (data) setFreeShippingThreshold(Number(data.value)); });
  });

  const isFreeShipping = subtotal >= freeShippingThreshold;
  const discountAmount = appliedDiscount
    ? appliedDiscount.type === "percentage"
      ? Math.round((subtotal * appliedDiscount.value) / 100)
      : appliedDiscount.type === "fixed"
        ? appliedDiscount.value
        : 0
    : 0;
  const total = subtotal - discountAmount;

  async function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (!code) return;
    setValidating(true);
    setDiscountError("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .eq("active", true)
      .single();

    setValidating(false);

    if (error || !data) {
      setDiscountError("Invalid discount code");
      setAppliedDiscount(null);
      return;
    }

    // Check date range
    const now = new Date();
    if (data.start_date && new Date(data.start_date) > now) {
      setDiscountError("This code isn't active yet");
      return;
    }
    if (data.end_date && new Date(data.end_date) < now) {
      setDiscountError("This code has expired");
      return;
    }

    // Check max uses
    if (data.max_uses && data.uses_count >= data.max_uses) {
      setDiscountError("This code has been fully redeemed");
      return;
    }

    // Check minimum purchase
    if (data.min_purchase > 0 && subtotal < data.min_purchase) {
      setDiscountError(`Minimum purchase of ₦${data.min_purchase.toLocaleString()} required`);
      return;
    }

    // Check product scope
    if (data.product_scope === "specific" && data.product_ids?.length > 0) {
      const cartProductIds = items.map((i) => i.product.id);
      const hasQualifying = cartProductIds.some((id) => data.product_ids.includes(id));
      if (!hasQualifying) {
        setDiscountError("This code doesn't apply to items in your cart");
        return;
      }
    }

    setAppliedDiscount({
      code: data.code,
      pct: data.discount_type === "percentage" ? data.discount_value : 0,
      type: data.discount_type,
      value: data.discount_value,
    });
    setDiscountError("");
  }

  if (items.length === 0) {
    return (
      <>
        <MarqueeBanner />
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 py-24 text-center">
          <p className="text-6xl mb-6" aria-hidden="true">🛒</p>
          <h1 className="text-2xl font-bold mb-3">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/shop" className="btn-tc-primary px-8 py-3.5 rounded-full text-sm inline-block">Shop the Drop</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-3xl font-bold text-[#1a1a1a] mb-8">Your Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.size}`} className="flex gap-4 p-4 border border-gray-100 rounded-2xl bg-white">
                <Link href={`/product/${item.product.id}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#ede8d8]">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="96px" />
                  </div>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link href={`/product/${item.product.id}`}>
                        <p className="font-semibold text-[#1a1a1a] hover:text-[#1a6b2f] transition-colors line-clamp-2">{item.product.name}</p>
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">Size: {item.size}</p>
                      <p className="text-xs text-gray-400">One-of-one piece</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.size)}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0 p-1"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-[#1a6b2f] text-base">₦{item.product.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Return policy note */}
            <div className="p-4 bg-[#f5f0e8] rounded-2xl border border-[#1a6b2f]/10">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold">Return policy:</span> Items can be returned within 24 hours of delivery if they are in their original condition. Contact us via WhatsApp or email to initiate a return.
              </p>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="border border-gray-100 rounded-2xl bg-white p-6 sticky top-24">
              <h2 className="font-bold text-lg mb-5">Order Summary</h2>

              {/* Discount code */}
              <div className="mb-5">
                <label htmlFor="discount" className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-2">Discount Code</label>
                <div className="flex gap-2">
                  <input
                    id="discount"
                    type="text"
                    value={discountCode}
                    onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(""); }}
                    placeholder="Enter code"
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[#1a6b2f]"
                  />
                  <button onClick={applyDiscount} className="btn-tc-primary px-4 py-2 text-xs rounded-full">Apply</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-1" role="alert">{discountError}</p>}
                {appliedDiscount && <p className="text-[#1a6b2f] text-xs mt-1 font-semibold" role="status">✓ {appliedDiscount.code} — {appliedDiscount.pct}% off applied</p>}
              </div>

              {/* Shipping */}
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Shipping</p>
                <div className="p-3 rounded-xl border border-gray-100 bg-gray-50">
                  {isFreeShipping ? (
                    <p className="text-sm text-[#1a6b2f] font-semibold">Free delivery on this order 🎉</p>
                  ) : (
                    <div>
                      <p className="text-sm text-gray-700">Calculated at checkout based on your delivery address.</p>
                      <p className="text-xs text-gray-400 mt-1">Abuja: same day – 1 day · Other states: 2–4 days via GUO</p>
                      <p className="text-xs text-[#1a6b2f] font-semibold mt-1">Free delivery on orders above ₦{freeShippingThreshold.toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#1a6b2f] font-semibold">
                    <span>Discount ({appliedDiscount!.type === "percentage" ? `${appliedDiscount!.value}%` : `₦${appliedDiscount!.value.toLocaleString()}`})</span><span>−₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span><span>{isFreeShipping ? "FREE" : "At checkout"}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-[#1a1a1a] pt-2 border-t border-gray-100">
                  <span>Subtotal</span><span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href={`/checkout${appliedDiscount ? `?discount=${appliedDiscount.type === "percentage" ? appliedDiscount.value : 0}&code=${appliedDiscount.code}&dtype=${appliedDiscount.type}&dvalue=${appliedDiscount.value}` : ""}`}
                className="block w-full py-4 text-center bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm"
              >
                Proceed to Checkout
              </Link>
              <Link href="/shop" className="block text-center text-sm text-[#1a6b2f] mt-3 hover:underline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
