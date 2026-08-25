"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useUser } from "@/lib/user-context";
import type { Order } from "@/lib/user-context";

function getEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId   = searchParams.get("orderId") || "TC-XXXXXX";
  const paramName = searchParams.get("name") || "";

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { saveOrder, isSignedIn } = useUser();

  // Load order details from Supabase
  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("order_id", orderId)
        .single()
        .then(({ data }) => {
          if (data) setOrder(data);
          setLoading(false);
        });
    });
  }, [orderId]);

  // Derive values from DB order or URL params as fallback
  const customerName = order?.guest_name || (paramName ? decodeURIComponent(paramName) : "");
  const firstName = customerName.split(" ")[0] || "there";
  const isStockpile = order?.is_stockpile ?? (searchParams.get("stockpile") === "true");
  const isGuest = !order?.user_id && (searchParams.get("guest") !== "false");
  const hasEmail = !!(order?.guest_name && searchParams.get("paid")); // If came via Paystack, check if email was in checkout
  const deliveryAddress = order?.delivery_address || "";
  const isAbuja = deliveryAddress.toLowerCase().includes("abuja") || deliveryAddress.toLowerCase().includes("fct");
  const deliveryDate = getEstimatedDelivery();

  // Persist the order to user profile once on mount
  useEffect(() => {
    if (!isSignedIn) return;
    try {
      const raw = sessionStorage.getItem(`tc_pending_order_${orderId}`);
      if (raw) {
        const order = JSON.parse(raw) as Order;
        saveOrder(order);
        sessionStorage.removeItem(`tc_pending_order_${orderId}`);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isSignedIn]);

  const stockpileDeadline = (() => {
    if (order?.stockpiled_until) {
      return new Date(order.stockpiled_until).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
    }
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  })();

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Loading order details…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Icon */}
      <div className="w-20 h-20 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Order confirmed!</h1>
      <p className="text-gray-500 text-lg mb-8">
        Thanks, {firstName}.{" "}
        {isStockpile ? "Your items are safely stockpiled." : "Your order is on its way."}
      </p>

      {/* Order card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
            <p className="font-bold text-[#1a6b2f] text-lg">{orderId}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
              {isStockpile ? "Stockpiled Until" : "Est. Delivery"}
            </p>
            <p className="font-semibold text-[#1a1a1a] text-sm">
              {isStockpile ? stockpileDeadline : "Based on your address (see below)"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1a6b2f] animate-pulse" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {isStockpile
                  ? "Stockpiled — we'll hold your items until you're ready for delivery"
                  : "Processing — we'll send you a WhatsApp message when your order ships"
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stockpile info */}
      {isStockpile && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 text-left">
          <p className="font-bold text-amber-800 mb-2">📦 Your items are stockpiled</p>
          <p className="text-sm text-amber-700 mb-3">
            We&apos;ve got your items safely stored until <strong>{stockpileDeadline}</strong>. When you&apos;re ready for delivery, just message us with your Order ID and we&apos;ll arrange shipping.
          </p>
          <div className="space-y-2 text-sm text-amber-700 mb-4">
            <p>1. We&apos;ll pack your items and keep them safe.</p>
            <p>2. When you&apos;re ready, reach out with your Order ID.</p>
            <p>3. We&apos;ll ship and charge the delivery fee at that point.</p>
          </div>
          <a
            href={`https://wa.me/2348061979299?text=Hi! I'd like to request delivery for order ${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1a6b2f] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#104020] transition-colors"
          >
            Request delivery via WhatsApp
          </a>
        </div>
      )}

      {/* Shipping info */}
      {!isStockpile && (
        <div className="bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-2xl p-5 mb-6 text-left">
          <p className="font-bold text-[#1a1a1a] mb-2">🚚 What happens next?</p>
          <div className="space-y-2 text-sm text-gray-600">
            {[
              isAbuja ? "We pack your order within 0–1 business days." : "We pack your order within 1–2 business days.",
              "We'll send you a WhatsApp message when your order ships.",
              "Questions? Message us with your Order ID.",
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="text-[#1a6b2f] font-bold shrink-0">{i + 1}.</span>
                <p>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Wishlist nudge for signed-in users */}
      {isSignedIn && (
        <WishlistNudge />
      )}

      {/* Account hook for guests */}
      {isGuest && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 text-left shadow-sm">
          <h2 className="font-bold text-[#1a1a1a] mb-2">Save your details for faster checkout</h2>
          <p className="text-sm text-gray-500 mb-4">
            Create an account in one click — your address, sizes, and order history saved for next time.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/profile" className="btn-tc-primary px-5 py-2.5 text-sm rounded-full inline-block">Create Account</Link>
            <Link href="/auth/signin" className="btn-tc-outline px-5 py-2.5 text-sm rounded-full inline-block">Sign In</Link>
          </div>
        </div>
      )}

      {/* Support */}
      <div className="bg-[#f5f0e8] rounded-2xl p-4 mb-8 text-sm text-gray-600">
        Questions? Message us on{" "}
        <a href={`https://wa.me/2348061979299?text=Order ${orderId} query`} target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">
          WhatsApp
        </a>{" "}
        with Order ID <span className="font-bold text-[#1a1a1a]">{orderId}</span>.
      </div>

      <Link href="/shop" className="btn-tc-primary px-8 py-3.5 text-sm rounded-full inline-block">
        Keep Shopping
      </Link>
    </div>
  );
}

function WishlistNudge() {
  const { addKeyword } = useUser();
  const [input, setInput] = useState("");
  const [added, setAdded] = useState<string[]>([]);

  function handleAdd() {
    const keyword = input.trim().toLowerCase();
    if (!keyword || added.includes(keyword)) return;
    addKeyword(keyword);
    setAdded((prev) => [...prev, keyword]);
    setInput("");
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-6 text-left shadow-sm">
      <p className="font-bold text-[#1a1a1a] mb-1">🔔 What should we source next?</p>
      <p className="text-sm text-gray-500 mb-4">
        Tell us what you&apos;re looking for — we&apos;ll email you when something matching drops.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
          placeholder="e.g. bomber jacket, size L trackpants, rugby polo"
          className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-[#1a6b2f]"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="px-4 py-2.5 bg-[#1a6b2f] text-white font-bold text-sm rounded-full hover:bg-[#104020] transition disabled:opacity-40"
        >
          Add
        </button>
      </div>
      {added.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {added.map((kw) => (
            <span key={kw} className="text-xs bg-[#1a6b2f]/10 text-[#1a6b2f] font-semibold px-3 py-1 rounded-full">
              ✓ {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main>
        <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading…</div>}>
          <ConfirmationContent />
        </Suspense>
      </main>
    </>
  );
}
