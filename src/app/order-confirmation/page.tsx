"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";

function getEstimatedDelivery() {
  const date = new Date();
  date.setDate(date.getDate() + 5);
  return date.toLocaleDateString("en-NG", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "TC-XXXXXX";
  const name = searchParams.get("name") || "there";
  const isGuest = searchParams.get("guest") === "true";
  const deliveryDate = getEstimatedDelivery();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-[#1a1a1a] mb-2">Order confirmed!</h1>
      <p className="text-gray-500 text-lg mb-8">Thanks, {name.split(" ")[0]}. Your order is on its way.</p>

      {/* Order details card */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-8 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Order ID</p>
            <p className="font-bold text-[#1a6b2f] text-lg">{orderId}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Est. Delivery</p>
            <p className="font-semibold text-[#1a1a1a] text-sm">{deliveryDate}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#1a6b2f] animate-pulse" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#1a1a1a]">Processing — we&apos;ll send you a tracking update</p>
            </div>
          </div>
        </div>
      </div>

      {/* Account hook for guest users */}
      {isGuest && (
        <div className="bg-[#1a6b2f]/5 border border-[#1a6b2f]/20 rounded-2xl p-6 mb-8 text-left">
          <h2 className="font-bold text-[#1a1a1a] mb-2">Save your details for next time</h2>
          <p className="text-sm text-gray-600 mb-4">
            Create an account with one click — we&apos;ll save your address, sizes, and order history for faster checkout next time.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/profile" className="btn-tc-primary px-5 py-2.5 text-sm rounded-full inline-block">
              Create Account
            </Link>
            <Link href="/auth/signin" className="btn-tc-outline px-5 py-2.5 text-sm rounded-full inline-block">
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* What's next */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 text-left mb-8">
        <h2 className="font-bold text-[#1a1a1a] mb-4">What happens next?</h2>
        <div className="space-y-3">
          {[
            { icon: "📧", text: "A confirmation email is on its way (if you provided one)." },
            { icon: "📦", text: "We'll pack and dispatch your order within 1–2 business days." },
            { icon: "🚚", text: "You'll receive tracking info once your order ships." },
            { icon: "📍", text: `Estimated delivery by ${deliveryDate}.` },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-lg shrink-0" aria-hidden="true">{step.icon}</span>
              <p className="text-sm text-gray-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact via WhatsApp */}
      <div className="bg-[#f5f0e8] rounded-2xl p-5 mb-8 text-sm text-gray-600">
        <p><span className="font-semibold">Questions about your order?</span> Message us directly on{" "}
          <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer" className="text-[#1a6b2f] font-semibold hover:underline">WhatsApp</a>{" "}
          with your Order ID <span className="font-bold text-[#1a1a1a]">{orderId}</span>.
        </p>
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
