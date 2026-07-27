"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function handleCallback() {
      try {
        // The implicit flow puts tokens in the URL hash (#access_token=...)
        // The Supabase client automatically detects and processes them
        // We just need to check if a session was established

        // Small delay to let the client process the hash
        await new Promise((r) => setTimeout(r, 500));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          setError(sessionError.message);
          setChecking(false);
          return;
        }

        if (session) {
          router.replace("/profile");
          return;
        }

        // If no session yet, listen for auth state change
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_IN" && session) {
            subscription.unsubscribe();
            router.replace("/profile");
          }
        });

        // Final timeout
        setTimeout(() => {
          subscription.unsubscribe();
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
              router.replace("/profile");
            } else {
              setError("Sign-in link may have expired. Please request a new one.");
              setChecking(false);
            }
          });
        }, 5000);
      } catch (err: any) {
        setError(err?.message || "Something went wrong. Please try again.");
        setChecking(false);
      }
    }

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <Link
            href="/auth/signin"
            className="inline-block px-5 py-2.5 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Signing you in…</p>
        </div>
      </div>
    );
  }

  return null;
}
