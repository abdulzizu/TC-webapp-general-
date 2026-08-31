# Thrift Collision

The web store for **Thrift Collision** — a unisex thrifted streetwear brand based in Abuja, Nigeria. Every item is one-of-one (single unit, single size), sold through timed drops with an admin dashboard for running the whole operation.

This is the **technical README** for developers. If you're here to run the store day-to-day (add products, moderate reviews, manage orders), read [`ADMIN_GUIDE.md`](./ADMIN_GUIDE.md) instead. For a deeper look at how the major flows work under the hood, see [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript, React 19 |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (Postgres + Auth + Storage) |
| Payments | Paystack |
| Transactional email | Resend |
| SMS / WhatsApp OTP | Termii |
| AI product descriptions | OpenAI (`gpt-4o-mini`) |
| Image delivery / optimisation | Cloudinary (fetch proxy) |
| Analytics | Vercel Analytics |
| Hosting | Vercel |

> Note: this project runs on a modified Next.js 16. Some APIs, conventions, and file structure differ from older versions. Check `node_modules/next/dist/docs/` before writing framework-level code.

---

## Getting started

### Prerequisites
- Node.js 20+
- npm
- Access to the Supabase project, and the environment variables below

### Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

### Scripts
| Command | What it does |
|---------|--------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (also runs type-checking) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Environment variables

Create a `.env.local` in the project root. None of these are committed.

| Variable | Public? | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key (browser-side, RLS-enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | no | Supabase service role key (server-side, bypasses RLS). Also used as the HMAC secret for signing admin session cookies. |
| `NEXT_PUBLIC_SITE_URL` | yes | Canonical site URL, e.g. `https://www.thriftcollision.com` |
| `PAYSTACK_SECRET_KEY` | no | Paystack secret key — payment init, verification, webhook signature check |
| `RESEND_API_KEY` | no | Resend API key — order confirmation & review-request emails |
| `TERMII_API_KEY` | no | Termii API key — phone OTP |
| `TERMII_BASE_URL` | no | Termii API base URL |
| `TERMII_SENDER_ID` | no | Termii sender ID |
| `TERMII_OTP_CHANNEL` | no | `whatsapp` or `generic` (SMS) |
| `OPENAI_API_KEY` | no | OpenAI key — AI-generated product descriptions in the admin |
| `CRON_SECRET` | no | Optional shared secret for triggering `clear-new-tags` from an external cron. If unset, the route requires an admin session. |

> `NEXT_PUBLIC_*` variables are exposed to the browser. Everything else must stay server-side only.

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              Homepage (hero, product grid, drops, reviews, etc.)
│   ├── shop/                 Product catalogue + search + filters
│   ├── product/[id]/         Product detail page
│   ├── cart/                 Cart
│   ├── checkout/             Checkout form + Paystack init
│   ├── payment/verify/       Post-payment verification landing
│   ├── order-confirmation/   Order success page
│   ├── tracking/             Order tracking by order ID
│   ├── profile/              Signed-in user profile, order history, wishlist keywords
│   ├── review/               Leave-a-review submission form
│   ├── reviews/              Public approved-reviews page
│   ├── auth/
│   │   ├── signin/           Email magic-link sign-in
│   │   └── callback/         Auth redirect handler
│   ├── contact / faqs / privacy / returns / shipping / sizing-guide / terms / unsubscribe
│   ├── admin/                Admin dashboard (see ADMIN_GUIDE.md)
│   └── api/                  Route handlers (see below)
├── components/
│   ├── Navbar.tsx
│   └── MarqueeBanner.tsx
└── lib/
    ├── supabase/             client.ts (browser), server.ts (server), types.ts
    ├── admin-auth.ts         verifyAdmin / verifyAdminOrCron — admin session verification
    ├── cart-context.tsx      Cart state (React context)
    ├── user-context.tsx      Customer auth/profile state + guest-order linking
    ├── products.ts           Static product catalogue + categories (fallback data)
    ├── use-products.ts       Hook to load products from Supabase, falls back to static
    └── cloudinary.ts         Wraps image URLs through Cloudinary's fetch/optimise CDN
```

The admin dashboard (`src/app/admin/`) has these sections: `analytics` (drop performance), `products`, `stock`, `orders`, `customers`, `reviews`, `demand`, `leads`, `discounts`, `featured`, `drops`, `shipping`, `settings`, plus `login`.

### API routes (`src/app/api`)

**Payments**
- `POST /api/payments/initialize` — start a Paystack transaction
- `GET /api/payments/verify` — verify a payment, update order status, fire confirmation email
- `POST /api/payments/webhook` — Paystack server-to-server events (signature-verified)

**Orders & reviews**
- `POST /api/orders/confirm` — send branded order-confirmation email (Resend)
- `POST /api/reviews/request` — send review-request email when an order is delivered (Resend)

**Auth (customer)**
- `POST /api/auth/send-otp` — send phone OTP via Termii
- `POST /api/auth/verify-otp` — verify phone OTP

**Admin**
- `POST /api/admin/login` — password login, sets signed httpOnly cookie
- `POST /api/admin/logout` — clear session
- `GET  /api/admin/check` — verify admin session cookie
- `POST /api/admin/change-password`
- `GET  /api/admin/customers` — customer list
- `POST /api/admin/ai-describe` — OpenAI product description from an image
- `POST /api/admin/notify` — notify customers (e.g. drop alerts)
- `POST /api/admin/discounts/send` — email a discount code to specific customers (Resend)
- `POST /api/admin/clear-new-tags` — bulk-clear "NEW" tags
- `POST /api/admin/fix-pending` — maintenance for stuck pending orders

**Drops**
- `POST /api/drops/notify-matches` — notify customers whose wishlist keywords match given products. Accepts `{ dropId }` (whole drop) or `{ productIds }` (specific items). Dedupes against `wishlist_notifications` so no customer is emailed about the same item twice.

> All admin routes (except `login`/`logout`) authenticate via `verifyAdmin`/`verifyAdminOrCron` in `src/lib/admin-auth.ts`.

---

## Authentication

There are two entirely separate auth systems:

**Customer auth** — Supabase Auth, email magic link (`signInWithOtp`). No passwords. Phone OTP (Termii) exists in the API but the sign-in UI currently offers email only. Managed client-side via `src/lib/user-context.tsx`.

**Admin auth** — custom, independent of Supabase Auth. Credentials live in the `admin_users` table (bcrypt-hashed passwords). Login issues an HMAC-signed `tc_admin` httpOnly cookie (signed with `SUPABASE_SERVICE_ROLE_KEY`, valid 24h). The `/admin` layout calls `GET /api/admin/check` on mount and redirects to `/admin/login` if the cookie is missing or invalid. Login is rate-limited (5 attempts / 15 min per IP).

> There is no `middleware.ts`. The client-layout redirect is UX only. Real protection is server-side: every admin API route (except `login`/`logout`) verifies the signed cookie via `verifyAdmin`/`verifyAdminOrCron` in `src/lib/admin-auth.ts`.

---

## Data model (Supabase tables)

Tables referenced across the app:

| Table | Purpose |
|-------|---------|
| `products` | Live product catalogue (one-of-one items). Notable cols: `tag`, `available`, `drop_id`, `visible_at`, `held_until` + `held_by_order` (payment holds), `sold_at` + `sold_channel` (off-site sale tracking) |
| `orders` | Customer orders (`guest_name`, `guest_phone`, `guest_email`, `user_id`, `status`, totals, address, `is_stockpile`, `stockpiled_until`, `discount_code`) |
| `order_items` | Line items per order (product snapshot: name, image, size, qty, price) |
| `reviews` | Customer reviews (`order_id`, `first_name`, `comment`, `photo`, `status`, `featured`) |
| `wishlist_notifications` | Dedup log of `(user_id, product_id)` pairs already emailed, so wishlist alerts never repeat |
| `profiles` / `user_profiles` | Customer profile data (incl. size profile) |
| `keywords` | Wishlist keywords for drop-matching |
| `featured_products` | Homepage hero/featured picks |
| `drops` / `upcoming_drops` | `drops` = actual releases (`name`, `status`, `released_at`, `scheduled_at`); `upcoming_drops` = homepage teasers |
| `discount_codes` | Discount / promo codes (`uses_count` incremented on payment via the `increment_discount_use` RPC) |
| `shipping_zones` | Delivery zones & costs |
| `store_settings` | Global store config (e.g. `free_shipping_threshold`, `drop_day`, `drop_time`) |
| `admin_users` | Admin accounts (bcrypt password hashes) |
| `temp_leads` | Captured leads (notify signups etc.) |

**Storage bucket:** `product-images` (product photos + review photos).

Products use a **DB-first-with-static-fallback** pattern: `use-products.ts` loads from Supabase and falls back to the static array in `products.ts` if the DB is empty or unreachable.

### Schema additions (run once in Supabase if not already applied)

```sql
-- Reviews
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

-- One-of-one payment holds
alter table public.products
  add column if not exists held_until timestamptz,
  add column if not exists held_by_order text;

-- Off-site sale tracking (IG/WhatsApp/etc.)
alter table public.products
  add column if not exists sold_at timestamptz,
  add column if not exists sold_channel text;

-- Discount code on orders + atomic usage counter
alter table public.orders add column if not exists discount_code text;
create or replace function public.increment_discount_use(p_code text)
returns void language sql as $$
  update public.discount_codes set uses_count = uses_count + 1 where code = p_code;
$$;

-- Wishlist-alert dedup log
create table if not exists public.wishlist_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null,
  notified_at timestamptz not null default now(),
  unique (user_id, product_id)
);
```

---

## Deployment

Hosted on **Vercel**, deployed from the `main` branch (auto-deploy on push). Set every environment variable above in the Vercel project settings. The Paystack webhook must point at `https://<your-domain>/api/payments/webhook`.

Images: `next.config.ts` allows the Supabase storage host and the Cloudinary host, with `images.unoptimized: true` (optimisation is handled by the Cloudinary fetch proxy in `cloudinary.ts`).

---

## Automated jobs (cron)

Two maintenance endpoints are designed to run on a schedule. Both require authentication: a logged-in admin session, or a `CRON_SECRET` token passed as `?token=<secret>` or `Authorization: Bearer <secret>`.

| Endpoint | What it does | Suggested schedule |
|----------|--------------|--------------------|
| `GET /api/admin/clear-new-tags` | Removes the `NEW` tag from products older than 2 weeks | Daily |

Currently scheduled via an external service (cron-job.org). When configuring a job, the URL **must** include the token, e.g.:
```
https://www.thriftcollision.com/api/admin/clear-new-tags?token=<CRON_SECRET>
```
Set `CRON_SECRET` in both `.env.local` and the Vercel project environment (same value).

> Abandoned checkouts don't need a cleanup job: items are only reserved via a short lazy-expiry hold at payment time (see the checkout hold flow in `ARCHITECTURE.md`), and stale holds are ignored automatically on read — nothing runs in the background.

## Conventions

- Brand green is `#1a6b2f`; near-black is `#1a1a1a`.
- Items are **one-of-one** — a single unit at a single size. When sold, they're tagged `SOLD` and later hidden.
- Keep secrets server-side. Never log secret values.
- Match existing component/styling patterns (Tailwind utility classes, the shared `btn-tc-primary` / `btn-tc-outline` styles).
