"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function handleAuth() {
      // Check for code in URL params (PKCE flow)
      const code = searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setError(error.message);
          return;
        }
        router.replace("/profile");
        return;
      }

      // Check for hash-based tokens (implicit flow / magic link)
      // Supabase puts access_token in the URL hash
      const hash = window.location.hash;
      if (hash) {
        // The hash contains tokens — Supabase client auto-detects and sets session
        // Just wait a moment for the auth state to update
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/profile");
          return;
        }
      }

      // If neither code nor hash, check if already signed in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/profile");
        return;
      }

      // Wait a bit and retry (auth state might be updating)
      setTimeout(async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace("/profile");
        } else {
          setError("Unable to verify sign-in. Please try again.");
        }
      }, 2000);
    }

    handleAuth();
  }, [supabase, router, searchParams]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <a href="/auth/signin" className="text-sm text-[#1a6b2f] font-semibold hover:underline">
            ← Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-500">Signing you in…</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
