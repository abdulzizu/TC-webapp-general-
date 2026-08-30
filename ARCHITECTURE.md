# Thrift Collision — Architecture

A developer-level look at how the major flows work and why they're built this way. Pair this with the [`README.md`](./README.md) (setup, stack, structure).

---

## Guiding principle: one-of-one inventory

Every product is a single unit at a single size. This shapes a lot of decisions:
- No quantity/variant matrix — a product is available or it isn't.
- When sold, a product is tagged `SOLD` (stays visible so people see it went), then later hidden.
- Reviews are about the **store experience**, not a specific product — because products disappear after selling, so product-level reviews would orphan themselves.

---

## Products: DB-first with static fallback

`src/lib/products.ts` holds a static `PRODUCTS` array plus `CATEGORIES` and `POPULAR_SEARCHES`. This is both seed/reference data and a **safety net**.

`src/lib/use-products.ts` (`useProducts` hook) loads live products from Supabase and, if the DB is empty, errors, or returns nothing, silently falls back to the static array (filtered to `available`). So the storefront always renders products even if the DB hiccups.

`fetchProductById` is the server-side equivalent for a single product, again falling back to the static `getProduct(id)`.

---

## Checkout → payment → verification

The happy path spans the checkout page, Paystack, and two server routes.

1. **Checkout** (`src/app/checkout/page.tsx`)
   - Form fields: name, phone, email, address, city, state. Email is pre-filled and **read-only** for signed-in users (guaranteed present, can't be blanked); optional and editable for guests.
   - Generates an order ID like `TC-XXXXXX`.
   - Inserts a row into `orders` (with `user_id` for signed-in users, or `guest_*` fields), status `pending`, and inserts `order_items`.
   - Kicks off payment via `POST /api/payments/initialize` (Paystack).

2. **Payment** — handled by Paystack. On return, the customer lands on `/payment/verify`.

3. **Verification** — two independent mechanisms, both idempotent:

   **a) `GET /api/payments/verify`** (client-triggered on return)
   - Calls Paystack's verify endpoint for the reference.
   - **Amount check:** the paid amount must fall between `total − ₦1` and `total × 1.02 + ₦200` (allows Paystack fees). Mismatch → rejected, flagged for support.
   - If the order isn't already processing/shipped/delivered, sets it to `processing` (or `stockpiled` for stockpile orders).
   - Marks each ordered product `tag: "SOLD"`.
   - Fires the confirmation email (see below) if `guest_email` exists.

   **b) `POST /api/payments/webhook`** (Paystack server-to-server)
   - Verifies the `x-paystack-signature` HMAC (SHA-512 with the Paystack secret).
   - Same amount check, same idempotency guard, same status update and `SOLD` tagging.
   - Always returns 200 so Paystack doesn't retry forever.

   Two paths exist because the client return can be interrupted (customer closes the tab) — the webhook guarantees the order still gets processed. The status guards (`processing`/`shipped`/`delivered` short-circuit) make double-processing safe.

---

## Order status lifecycle

```
pending ──pay──> processing ──> shipped ──> delivered
                     │
                     └─(stockpile)─> stockpiled ──> shipped ──> delivered

any ──payment fails──> unsuccessful
```

Managed in `src/app/admin/orders/page.tsx` via `updateStatus()`.

**Side effects of `delivered`** (both in `updateStatus`):
1. **Auto-hide products:** each item's product is set `available: false`. One-of-one items are done once delivered.
2. **Review request:** if `order.guest_email` exists, POST to `/api/reviews/request` to email the customer a review link.

---

## Stockpiling

Customers can choose to **stockpile** (pay now, hold items, ship later — useful for accumulating pieces or awaiting a convenient delivery window).

- Order gets `is_stockpile: true` and a `stockpiled_until` deadline (default 1 month out).
- If a signed-in user already has an active stockpile, new stockpile orders reuse that existing deadline (so everything ships together).
- The admin **Overview** surfaces stockpiles within 5 days of their deadline (red at ≤2 days).
- `POST /api/admin/release-expired` handles releasing expired stockpiles.

---

## Reviews system

Text-only, photo-optional, admin-moderated. Four parts:

1. **Submission** — `/review` (`src/app/review/page.tsx`)
   - Order ID (pre-fillable via `?order=TC-XXXXXX`), first name, comment (min 10 chars), optional photo (uploaded to the `product-images` bucket under `reviews/`).
   - Verifies the order exists in `orders` before inserting.
   - Inserts into `reviews` with `status: 'pending'`, `featured: false`.
   - Runs on the browser with the anon key — an RLS insert policy (`Anyone can insert`) permits this.

2. **Moderation** — `/admin/reviews`
   - Filter tabs (pending/approved/rejected/all), approve/reject/delete.
   - **Feature on homepage** toggle appears only once a review is approved.

3. **Display**
   - Public page `/reviews`: all `status = 'approved'` reviews.
   - Homepage section (`ReviewsSection` in `src/app/page.tsx`): `status = 'approved' AND featured = true`, limit 4. **Returns `null` (hides entirely) when empty** — deliberate, so the store never looks untested.
   - Both show first name only, a "✓ Verified purchase" badge, and photo-or-initial avatar.

4. **Delivery email** — `POST /api/reviews/request`
   - Triggered from `updateStatus('delivered')`.
   - Sends a branded Resend email from `hello@thriftcollision.com` (reply-to `help@thriftcollision.com`), CTA linking to `/review?order=<id>`.

**Required table** (run once in Supabase):
```sql
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  order_id text not null,
  first_name text not null,
  comment text not null,
  photo text,
  status text not null default 'pending',
  featured boolean not null default false,
  created_at timestamptz default now()
);
alter table public.reviews enable row level security;
create policy "Anyone can insert reviews" on public.reviews for insert with check (true);
create policy "Anyone can read approved reviews" on public.reviews for select using (true);
```

---

## Transactional email (Resend)

Two branded HTML emails, same house style (dark header, green accents, social footer), both from `hello@thriftcollision.com` / reply-to `help@thriftcollision.com`:

- **Order confirmation** — `POST /api/orders/confirm`, fired from payment verification. Includes itemised order, totals, delivery address, and a "Track Your Order" CTA.
- **Review request** — `POST /api/reviews/request`, fired on delivery. Invites a review, links to the pre-filled form.

Both do a basic origin check (must come from a known host) and require `RESEND_API_KEY`. Neither sends if there's no recipient email on the order.

---

## Authentication (two systems)

### Customer — Supabase Auth (magic link)
- `signInWithOtp({ email })` sends a link → `/auth/callback` → session.
- `src/lib/user-context.tsx` (`UserProvider`) tracks the Supabase user/session, loads/creates a `profiles` row, mirrors a lightweight profile to `localStorage`, and **links guest orders** to the account by matching phone/email.
- Phone OTP via Termii (`/api/auth/send-otp`, `/api/auth/verify-otp`) exists but the sign-in UI currently exposes email only.

### Admin — custom signed cookie
- Credentials in `admin_users` (bcrypt hashes). Login (`/api/admin/login`) verifies with `bcrypt.compare`, then issues a `tc_admin` cookie: `adminId:role:timestamp:signature`.
- Signature is HMAC-SHA256 over `admin:<id>:<role>:<timestamp>` using `SUPABASE_SERVICE_ROLE_KEY` as the secret. Cookie is httpOnly, `sameSite=strict`, `secure` in production, 24h expiry.
- `/api/admin/check` re-verifies signature + age. The `/admin` client layout calls it on mount and redirects to `/admin/login` if invalid.
- Login is rate-limited: 5 attempts / 15 min per IP (in-memory map).

> No `middleware.ts`. Protection is layout + check-route based, not edge middleware. Admin API routes should each validate the `tc_admin` cookie server-side rather than trusting the client redirect.

---

## Images (Cloudinary fetch proxy)

`next.config.ts` sets `images.unoptimized: true` and whitelists the Supabase storage and Cloudinary hosts. `src/lib/cloudinary.ts` (`cloudinaryUrl`) wraps external image URLs through Cloudinary's **fetch** delivery (`f_auto`, `q_auto`, optional `w_*` + `c_limit`), so Cloudinary fetches the original from Supabase, optimises, resizes, and CDN-caches it. Local `/public` images pass through untouched.

---

## AI product descriptions (OpenAI)

`POST /api/admin/ai-describe` takes an image URL and asks `gpt-4o-mini` (vision) to return structured JSON: name, category, subcategory, colours, size, description, and a styling rationale. The system prompt enforces the brand voice (young Nigerian streetwear tone, no Western seasons) and constrains subcategory to a fixed list. Used in the admin product editor to speed up listing.

---

## Notable conventions & gotchas

- **Idempotency** on payments is by order status guard, not locks — safe because the terminal states short-circuit re-processing.
- **Amount tolerance** on payments intentionally allows Paystack fees (`total × 1.02 + ₦200`); don't tighten it without accounting for fees.
- **`SUPABASE_SERVICE_ROLE_KEY` doubles as the admin-cookie signing secret.** Rotating it invalidates all admin sessions — expected, just know it.
- **Reviews homepage section returning `null`** when unfeatured is intentional product behaviour, not a bug.
- Brand colours: green `#1a6b2f`, near-black `#1a1a1a`.
