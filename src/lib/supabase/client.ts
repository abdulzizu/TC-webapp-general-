import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — safe to use in "use client" components
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During static build/prerender, env vars may not be available.
    // Return a dummy client that won't crash — real calls only happen client-side at runtime.
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  return createBrowserClient(url, key);
}
