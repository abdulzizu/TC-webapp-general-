import { createBrowserClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeHVwcHVucHBzZ3J5dnJpZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTE3MDMsImV4cCI6MjA5OTE4NzcwM30.ezvcrKbUVhEHuZTCBsDsqvvSWvGns-Cua0vyaq3Ec5k";

// Browser-side Supabase client — safe to use in "use client" components
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
