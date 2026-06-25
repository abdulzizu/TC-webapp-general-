"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useCart } from "@/lib/cart-context";

const SHIPPING_RATES = [
  { label: "Standard (3–5 days)", price: 3500 },
  { label: "Express (1–2 days)", price: 6500 },
  { label: "Free (Orders over ₦30,000)", price: 0 },
];

const DISCOUNT_CODES: Record<string, number> = {
  TCFIRST: 10,
  THRIFT15: 15,
  DROP20: 20,
};

export default function CartPage() {
  const { items, removeItem, subtotal } = useCart();
  const [shippingIndex, setShippingIndex] = useState(0);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; pct: number } | null>(null);
  const [discountError, setDiscountError] = useState("");

  const shippingCost = subtotal >= 30000 ? 0 : SHIPPING_RATES[shippingIndex].price;
  const discountAmount = appliedDiscount ? Math.round((subtotal * appliedDiscount.pct) / 100) : 0;
  const total = subtotal - discountAmount + shippingCost;

  function applyDiscount() {
    const code = discountCode.trim().toUpperCase();
    if (DISCOUNT_CODES[code]) {
      setAppliedDiscount({ code, pct: DISCOUNT_CODES[code] });
      setDiscountError("");
    } else {
      setDiscountError("Invalid discount code");
      setAppliedDiscount(null);
    }
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
                <span className="font-semibold">Return policy:</span> Items can be returned within 7 days of delivery if they are in their original condition. Contact us via WhatsApp or email to initiate a return.
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
                <div className="space-y-2">
                  {SHIPPING_RATES.map((rate, i) => (
                    <label key={i} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${shippingIndex === i ? "border-[#1a6b2f] bg-[#1a6b2f]/5" : "border-gray-100 hover:border-gray-200"} ${rate.price === 0 && subtotal < 30000 ? "opacity-40 pointer-events-none" : ""}`}>
                      <div className="flex items-center gap-2">
                        <input type="radio" name="shipping" checked={shippingIndex === i} onChange={() => setShippingIndex(i)}
                          className="accent-[#1a6b2f]" />
                        <span className="text-xs text-gray-600">{rate.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-700">{rate.price === 0 ? "FREE" : `₦${rate.price.toLocaleString()}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-2 border-t border-gray-100 pt-4 mb-5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span><span>₦{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-[#1a6b2f] font-semibold">
                    <span>Discount ({appliedDiscount!.pct}%)</span><span>−₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping</span><span>{shippingCost === 0 ? "FREE" : `₦${shippingCost.toLocaleString()}`}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-[#1a1a1a] pt-2 border-t border-gray-100">
                  <span>Total</span><span>₦{total.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href={`/checkout?shipping=${shippingCost}${appliedDiscount ? `&discount=${appliedDiscount.pct}&code=${appliedDiscount.code}` : ""}`}
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
