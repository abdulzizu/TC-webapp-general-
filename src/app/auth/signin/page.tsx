"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarqueeBanner from "@/components/MarqueeBanner";
import Navbar from "@/components/Navbar";
import { useUser } from "@/lib/user-context";

export default function SignInPage() {
  const { user, saveUser } = useUser();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [success, setSuccess] = useState(false);

  function validatePhone(val: string) {
    if (!val.trim()) return "Phone number is required";
    if (!/^[\d\s+\-()]{10,15}$/.test(val.trim())) return "Enter a valid phone number";
    return "";
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const err = validatePhone(phone);
    if (err) { setPhoneError(err); return; }
    setPhoneError("");

    // Check if phone matches saved user
    if (user && user.phone.replace(/\s/g, "") === phone.replace(/\s/g, "")) {
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } else {
      setNotFound(true);
    }
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
            <h1 className="text-2xl font-bold text-[#1a1a1a]">Welcome back</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your phone number to sign in</p>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            {success ? (
              <div className="text-center py-4" role="status" aria-live="polite">
                <div className="w-14 h-14 bg-[#1a6b2f]/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-[#1a6b2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="font-bold text-[#1a1a1a] text-lg">Signed in!</p>
                <p className="text-gray-500 text-sm mt-1">Welcome back, {user?.name.split(" ")[0]}</p>
              </div>
            ) : (
              <form onSubmit={handleSignIn} noValidate>
                <div className="mb-5">
                  <label htmlFor="phone" className="block text-xs font-semibold text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setPhoneError(validatePhone(e.target.value));
                      setNotFound(false);
                    }}
                    placeholder="e.g. 08012345678"
                    autoComplete="tel"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition ${phoneError ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#1a6b2f] focus:ring-1 focus:ring-[#1a6b2f]/20"}`}
                    aria-describedby={phoneError ? "phone-error" : undefined}
                    aria-invalid={!!phoneError}
                    aria-required="true"
                  />
                  {phoneError && (
                    <p id="phone-error" className="text-red-500 text-xs mt-1" role="alert">{phoneError}</p>
                  )}
                  {notFound && (
                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl" role="alert">
                      <p className="text-sm text-amber-800 font-semibold mb-1">Number not found</p>
                      <p className="text-xs text-amber-700">
                        No account linked to this number.{" "}
                        <Link href="/profile" className="underline font-semibold">Create an account</Link> or try a different number.
                      </p>
                    </div>
                  )}
                </div>

                <button type="submit"
                  className="w-full py-3.5 bg-[#1a6b2f] text-white font-bold rounded-full hover:bg-[#104020] transition-colors shadow-lg shadow-[#1a6b2f]/20 text-sm">
                  Sign In
                </button>

                {/* Forgot / help */}
                <div className="text-center mt-4">
                  <a href="https://wa.me/2348000000000" target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-[#1a6b2f] transition-colors">
                    Trouble signing in? Message us on WhatsApp
                  </a>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            New here?{" "}
            <Link href="/profile" className="text-[#1a6b2f] font-semibold hover:underline">
              Create an account
            </Link>
          </p>

          <p className="text-center text-sm text-gray-400 mt-2">
            Just browsing?{" "}
            <Link href="/shop" className="text-[#1a6b2f] font-semibold hover:underline">
              Continue as guest
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
