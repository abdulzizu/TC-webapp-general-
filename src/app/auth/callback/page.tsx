"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // Supabase client auto-detects hash fragments and exchanges them for a session
    // We just need to wait for the auth state to resolve
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.replace("/profile");
      }
    });

    // Also check if already signed in (in case the event fired before we subscribed)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace("/profile");
      }
    });

    // Timeout fallback
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          router.replace("/profile");
        } else {
          setError("Sign-in link may have expired or was opened in a different browser. Please try again.");
        }
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <a href="/auth/signin" className="inline-block px-5 py-2.5 bg-[#1a6b2f] text-white font-semibold rounded-full text-sm hover:bg-[#104020] transition">
            Try Again
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
