import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// GET /auth/callback
// Handles the magic link redirect from Supabase email auth
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://cdxuppunppsgryvrieoz.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkeHVwcHVucHBzZ3J5dnJpZW96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MTE3MDMsImV4cCI6MjA5OTE4NzcwM30.ezvcrKbUVhEHuZTCBsDsqvvSWvGns-Cua0vyaq3Ec5k",
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, req.url));
    }
  }

  // If something went wrong, redirect to signin with error
  return NextResponse.redirect(new URL("/auth/signin?error=auth", req.url));
}
