"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      setError("No payment reference found");
      return;
    }

    // Verify payment with our backend
    async function verify() {
      try {
        const res = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await res.json();

        if (data.verified) {
          setStatus("success");
          clearCart();
          // Redirect to order confirmation after a brief success display
          setTimeout(() => {
            router.push(`/order-confirmation?orderId=${reference}&paid=true`);
          }, 2000);
        } else {
          setStatus("failed");
          setError(data.error || "Payment could not be verified");
        }
      } catch {
        setStatus("failed");
        setError("Failed to verify payment. Please contact support with your order ID.");
      }
    }

    verify();
  }, [reference, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f0e8]">
      <div className="text-center max-w-sm">
        {status === "verifying" && (
          <>
            <div className="w-12 h-12 border-3 border-[#1a6b2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Verifying payment…</h1>
            <p className="text-sm text-gray-500">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#1a6b2f] mb-2">Payment successful!</h1>
            <p className="text-sm text-gray-500">Redirecting to your order confirmation…</p>
          </>
        )}

        {status === "failed" && (
          <>
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Payment not confirmed</h1>
            <p className="text-sm text-gray-500 mb-2">{error}</p>
            {reference && (
              <p className="text-xs text-gray-400 mb-4">Reference: {reference}</p>
            )}
            <div className="flex flex-col gap-2">
              <Link href="/cart" className="btn-tc-primary px-6 py-3 rounded-full text-sm inline-block">
                Back to Cart
              </Link>
              <Link href="/contact" className="text-sm text-[#1a6b2f] font-semibold hover:underline">
                Contact Support
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-[#1a6b2f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
