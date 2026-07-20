"use client";

import { Suspense, useEffect } from "react";
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
  const name      = searchParams.get("name")    || "there";
  const isGuest   = searchParams.get("guest")   === "true";
  const isStockpile = searchParams.get("stockpile") === "true";
  const deliveryDate = getEstimatedDelivery();

  const { saveOrder, isSignedIn } = useUser();

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
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  })();

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
        Thanks, {decodeURIComponent(name).split(" ")[0]}.{" "}
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
              {isStockpile ? stockpileDeadline : deliveryDate}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1a6b2f] animate-pulse" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {isStockpile
                  ? "Stockpiled — request delivery when you're ready"
                  : "Processing — we'll send you an SMS update when shipped"
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
            We&apos;re holding your items securely until <strong>{stockpileDeadline}</strong>. When you&apos;re ready for delivery, just message us with your Order ID and we&apos;ll arrange shipping and charge the delivery fee then.
          </p>
          <a
            href={`https://wa.me/2348061979299?text=Hi! I'd like to request delivery for order ${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1a6b2f] text-white font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-[#104020] transition-colors"
          >
            Request delivery via SMS
          </a>
        </div>
      )}

      {/* Shipping info */}
      {!isStockpile && (
        <div className="bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-2xl p-5 mb-6 text-left">
          <p className="font-bold text-[#1a1a1a] mb-2">🚚 What happens next?</p>
          <div className="space-y-2 text-sm text-gray-600">
            {[
              "We pack your order within 1–2 business days.",
              "You'll receive an SMS when your order ships with tracking info.",
              `Estimated delivery: ${deliveryDate}.`,
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
