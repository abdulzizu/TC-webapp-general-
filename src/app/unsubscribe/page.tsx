"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (!email) { setStatus("error"); return; }

    const supabase = createClient();
    supabase
      .from("temp_leads")
      .delete()
      .eq("email", email)
      .then(({ error }) => {
        setStatus(error ? "error" : "done");
      });
  }, [email]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f0e8]">
      <div className="text-center max-w-sm">
        {status === "loading" && (
          <div>
            <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-500">Processing…</p>
          </div>
        )}

        {status === "done" && (
          <div>
            <p className="text-4xl mb-4">👋</p>
            <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">You&apos;ve been unsubscribed</h1>
            <p className="text-sm text-gray-500 mb-6">
              You won&apos;t receive any more drop notifications from us. If you change your mind, you can always sign up again on our homepage.
            </p>
            <Link href="/" className="text-sm text-[#1a6b2f] font-semibold hover:underline">
              ← Back to Thrift Collision
            </Link>
          </div>
        )}

        {status === "error" && (
          <div>
            <p className="text-4xl mb-4">😕</p>
            <h1 className="text-xl font-bold text-[#1a1a1a] mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6">
              We couldn&apos;t process your unsubscribe request. Please contact us at{" "}
              <a href="mailto:help@thriftcollision.com" className="text-[#1a6b2f] hover:underline">help@thriftcollision.com</a>.
            </p>
            <Link href="/" className="text-sm text-[#1a6b2f] font-semibold hover:underline">
              ← Back to Thrift Collision
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#1a6b2f] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
