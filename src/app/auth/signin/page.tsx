"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/client";

type Method = "email" | "phone";
type Step = "input" | "check-email" | "success";

export default function SignInPage() {
  const router = useRouter();
  const supabase = createClient();

  const [method, setMethod] = useState<Method>("email");
  const [step, setStep] = useState<Step>("input");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Email: Send magic link ────────────────────────────────
  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !email.includes("@")) {
      setError("Enter a valid email address");
      return;
    }
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setStep("check-email");
  }

  // Listen for auth state change (when user clicks magic link and returns)
  supabase.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_IN") {
      setStep("success");
      setTimeout(() => router.push("/profile"), 1200);
    }
  });

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
              {step === "input" && "Sign in or create account"}
              {step === "check-email" && "Check your email"}
              {step === "success" && "You're in!"}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {step === "input" && "Choose how you'd like to sign in"}
              {step === "check-email" && `We sent a sign-in link to ${email}`}
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

            {/* ── Check email state ── */}
            {step === "check-email" && (
              <div className="text-center py-4">
                <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📧</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Click the link in your email to sign in. Check your spam folder if you don&apos;t see it.
                </p>
                <button
                  onClick={() => { setStep("input"); setError(""); }}
                  className="text-xs text-[#1a6b2f] hover:underline font-semibold"
                >
                  ← Use a different email
                </button>
              </div>
            )}

            {/* ── Input step ── */}
            {step === "input" && (
              <>
                {/* Method tabs */}
                <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5">
                  <button
                    onClick={() => { setMethod("email"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      method === "email" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-gray-500"
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => { setMethod("phone"); setError(""); }}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      method === "phone" ? "bg-white text-[#1a1a1a] shadow-sm" : "text-gray-500"
                    }`}
                  >
                    Phone
                  </button>
                </div>

                {/* Email form */}
                {method === "email" && (
                  <form onSubmit={handleEmailSubmit} noValidate>
                    <div className="mb-5">
                      <label htmlFor="email" className="block text-xs font-semibold text-gray-600 mb-1">
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${
                          error ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"
                        }`}
                        aria-required="true"
                        aria-invalid={!!error}
                        autoFocus
                      />
                      {error && <p className="text-red-500 text-xs mt-1" role="alert">{error}</p>}
                    </div>

                    <div className="flex items-start gap-2.5 p-3 bg-[#1a6b2f]/5 rounded-xl mb-5">
                      <span className="text-lg mt-0.5 shrink-0" aria-hidden="true">📧</span>
                      <p className="text-xs text-[#1a6b2f] leading-relaxed">
                        We&apos;ll send a sign-in link to your email. Click it to access your account — no password needed.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm disabled:opacity-60"
                    >
                      {loading ? "Sending link…" : "Send Sign-In Link"}
                    </button>
                  </form>
                )}

                {/* Phone — coming soon */}
                {method === "phone" && (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl">📱</span>
                    </div>
                    <p className="font-semibold text-[#1a1a1a] mb-1">Phone sign-in</p>
                    <p className="text-sm text-gray-500 mb-4">Coming soon — we&apos;re setting up SMS verification.</p>
                    <button
                      onClick={() => setMethod("email")}
                      className="text-xs text-[#1a6b2f] font-semibold hover:underline"
                    >
                      Use email instead →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {step === "input" && (
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
