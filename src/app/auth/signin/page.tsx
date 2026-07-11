"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp" | "success";

function normaliseDisplay(raw: string): string {
  // Show e.g. +234 801 234 5678 for display purposes only
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return "+234 " + digits.slice(1, 4) + " " + digits.slice(4, 7) + " " + digits.slice(7);
  }
  return raw.trim();
}

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [pinId, setPinId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: Request OTP via Termii ────────────────────────
  async function handleRequestOtp(e?: React.FormEvent) {
    e?.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.pinId) {
      setError(data.error || "Failed to send code. Please try again.");
      return;
    }

    setPinId(data.pinId);
    setStep("otp");
  }

  // ── Step 2: Verify OTP, get session tokens ────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = otp.replace(/\D/g, "");
    if (digits.length < 4) {
      setError("Enter the 6-digit code we sent you");
      return;
    }
    setLoading(true);

    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinId, pin: digits, phone }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      setLoading(false);
      setError(data.error || "Incorrect or expired code. Please try again.");
      return;
    }

    // Set the Supabase session client-side using the token hash from the server
    const { error: sessionError } = await supabase.auth.verifyOtp({
      email: data.email,
      token: data.tokenHash,
      type: "email",
    });

    setLoading(false);

    if (sessionError) {
      setError("Signed in but failed to load session. Please try again.");
      return;
    }

    setStep("success");
    setTimeout(() => router.push("/profile"), 1200);
  }

  return (
    <>
      <MarqueeBanner />
      <Navbar />
      <main className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <Image
              src="/tc-logo.png"
              alt="Thrift Collision"
              width={64}
              height={64}
              className="object-contain mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              {step === "phone" && "Sign in or create account"}
              {step === "otp" && "Enter your code"}
              {step === "success" && "You're in!"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === "phone" && "We'll send a one-time code to your WhatsApp"}
              {step === "otp" && `Code sent to ${normaliseDisplay(phone)} via WhatsApp`}
              {step === "success" && "Taking you to your profile…"}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

            {/* ── Success state ── */}
            {step === "success" && (
              <div className="text-center py-4" role="status" aria-live="polite">
                <div className="w-14 h-14 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="font-bold text-[#1a1a1a] text-lg">Verified!</p>
                <p className="text-gray-500 text-sm mt-1">Redirecting to your profile…</p>
              </div>
            )}

            {/* ── Step 1: Phone input ── */}
            {step === "phone" && (
              <form onSubmit={handleRequestOtp} noValidate>
                <div className="mb-5">
                  <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setError(""); }}
                    placeholder="e.g. 08012345678"
                    autoComplete="tel"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
                      error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
                    }`}
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>
                  )}
                </div>

                {/* WhatsApp note */}
                <div className="flex items-start gap-2.5 p-3 bg-[#1a6b2f]/5 rounded-xl mb-5">
                  <span className="text-lg mt-0.5 shrink-0" aria-hidden="true">💬</span>
                  <p className="text-xs text-[#1a6b2f] leading-relaxed">
                    We&apos;ll send your one-time code via <strong>WhatsApp</strong> or <strong>SMS</strong>. Make sure your number is active and can receive messages.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm disabled:opacity-60"
                >
                  {loading ? "Sending code…" : "Send WhatsApp Code"}
                </button>
              </form>
            )}

            {/* ── Step 2: OTP input ── */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} noValidate>
                <div className="mb-5">
                  <label htmlFor="otp" className="block text-xs font-semibold text-gray-600 mb-1">
                    6-Digit Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(""); }}
                    placeholder="000000"
                    autoComplete="one-time-code"
                    className={`w-full border rounded-xl px-4 py-3.5 text-xl tracking-[0.5em] text-center font-bold focus:outline-none transition ${
                      error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
                    }`}
                    aria-required="true"
                    aria-invalid={!!error}
                    autoFocus
                  />
                  {error && (
                    <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm disabled:opacity-60 mb-3"
                >
                  {loading ? "Verifying…" : "Verify Code"}
                </button>

                <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
                  <button
                    type="button"
                    onClick={() => { setStep("phone"); setOtp(""); setPinId(""); setError(""); }}
                    className="hover:text-[#1a6b2f] transition-colors"
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequestOtp()}
                    disabled={loading}
                    className="text-[#1a6b2f] hover:underline disabled:opacity-40"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>

          {step === "phone" && (
            <div className="space-y-2 mt-6 text-center">
              <p className="text-sm text-gray-400">
                New here? No problem — we&apos;ll create your account automatically.
              </p>
              <p className="text-sm text-gray-400">
                Just browsing?{" "}
                <Link href="/shop" className="text-[#1a6b2f] font-semibold hover:underline">
                  Continue as guest
                </Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
