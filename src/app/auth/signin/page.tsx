"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Step = "phone" | "otp" | "success";

function normalisePhone(raw: string): string {
  // Convert Nigerian local format 0801… → +2348…
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 11) {
    return "+234" + digits.slice(1);
  }
  if (!raw.trim().startsWith("+")) return "+" + digits;
  return raw.trim();
}

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Step 1: Request OTP ────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Enter a valid phone number");
      return;
    }
    setLoading(true);
    const normalised = normalisePhone(phone);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalised,
    });
    setLoading(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setStep("otp");
  }

  // ── Step 2: Verify OTP ─────────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (otp.replace(/\D/g, "").length < 4) {
      setError("Enter the code we sent you");
      return;
    }
    setLoading(true);
    const normalised = normalisePhone(phone);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: normalised,
      token: otp.replace(/\D/g, ""),
      type: "sms",
    });
    setLoading(false);
    if (verifyError) {
      setError(verifyError.message);
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
            <Image src="/tc-logo.png" alt="Thrift Collision" width={64} height={64} className="object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#1a1a1a]">
              {step === "phone" ? "Sign in or create account" : step === "otp" ? "Enter your code" : "You're in!"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === "phone" && "We'll send a one-time code to your WhatsApp"}
              {step === "otp" && `Code sent to ${phone} via WhatsApp`}
              {step === "success" && "Taking you to your profile…"}
            </p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">

            {/* ── Success ── */}
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
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"}`}
                    aria-required="true"
                    aria-invalid={!!error}
                  />
                  {error && <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
                </div>

                {/* WhatsApp note */}
                <div className="flex items-start gap-2 p-3 bg-[#1a6b2f]/5 rounded-xl mb-5">
                  <span className="text-lg mt-0.5" aria-hidden="true">💬</span>
                  <p className="text-xs text-[#1a6b2f] leading-relaxed">
                    We'll send your one-time code via <strong>WhatsApp</strong>. Make sure WhatsApp is active on this number.
                    If WhatsApp fails, we'll fall back to SMS.
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
                    One-Time Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value); setError(""); }}
                    placeholder="Enter code"
                    autoComplete="one-time-code"
                    className={`w-full border rounded-xl px-4 py-3 text-sm tracking-widest text-center font-bold focus:outline-none transition ${error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"}`}
                    aria-required="true"
                    aria-invalid={!!error}
                    autoFocus
                  />
                  {error && <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm disabled:opacity-60 mb-3"
                >
                  {loading ? "Verifying…" : "Verify Code"}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep("phone"); setOtp(""); setError(""); }}
                  className="w-full text-xs text-gray-400 hover:text-[#1a6b2f] transition-colors"
                >
                  ← Change phone number
                </button>

                {/* Resend */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    disabled={loading}
                    className="text-xs text-[#1a6b2f] hover:underline disabled:opacity-40"
                  >
                    Didn't receive it? Resend code
                  </button>
                </div>
              </form>
            )}
          </div>

          {step === "phone" && (
            <>
              <p className="text-center text-sm text-gray-400 mt-6">
                New here? No problem — we&apos;ll create your account automatically.
              </p>
              <p className="text-center text-sm text-gray-400 mt-2">
                Just browsing?{" "}
                <Link href="/shop" className="text-[#1a6b2f] font-semibold hover:underline">
                  Continue as guest
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </>
  );
}
