import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

// Shared admin-session verification for API routes.
// The tc_admin cookie is: `adminId:role:timestamp:signature`
// where signature = HMAC-SHA256("admin:<id>:<role>:<timestamp>") using
// SUPABASE_SERVICE_ROLE_KEY as the secret. Valid for 24 hours.

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function signToken(payload: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || "fallback";
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export type AdminSession = { adminId: string; role: string };

/**
 * Verifies the tc_admin cookie's signature and age.
 * Returns the session (adminId, role) if valid, otherwise null.
 * This is the ONLY trustworthy way to authenticate an admin in an API route —
 * never trust the cookie's presence or contents without calling this.
 */
export function verifyAdmin(req: NextRequest): AdminSession | null {
  const cookie = req.cookies.get("tc_admin")?.value;
  if (!cookie) return null;

  const parts = cookie.split(":");
  if (parts.length !== 4) return null;

  const [adminId, role, timestamp, signature] = parts;

  const expected = signToken(`admin:${adminId}:${role}:${timestamp}`);

  // Constant-time comparison to avoid timing leaks. Lengths must match first.
  const sigBuf = Buffer.from(signature, "hex");
  const expBuf = Buffer.from(expected, "hex");
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  const age = Date.now() - Number(timestamp);
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) return null;

  return { adminId, role };
}

/**
 * For endpoints that may be triggered either by a logged-in admin OR by an
 * external cron (e.g. cron-job.org). Returns true if the request carries a
 * valid admin session, or a matching cron secret.
 *
 * The cron secret can be supplied as:
 *   - Authorization: Bearer <CRON_SECRET>
 *   - ?token=<CRON_SECRET>
 *
 * If CRON_SECRET is not configured, only a valid admin session is accepted.
 */
export function verifyAdminOrCron(req: NextRequest): boolean {
  if (verifyAdmin(req)) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  const token = bearer || new URL(req.url).searchParams.get("token") || "";
  if (!token) return false;

  // Constant-time comparison
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
