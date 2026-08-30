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
    ├── cart-context.tsx      Cart state (React context)
    ├── user-context.tsx      Customer auth/profile state + guest-order linking
    ├── products.ts           Static product catalogue + categories (fallback data)
    ├── use-products.ts       Hook to load products from Supabase, falls back to static
    └── cloudinary.ts         Wraps image URLs through Cloudinary's fetch/optimise CDN
```

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
- `POST /api/admin/clear-new-tags` — bulk-clear "NEW" tags
- `POST /api/admin/release-expired` — release expired stockpiled orders
- `POST /api/admin/fix-pending` — maintenance for stuck pending orders

**Drops**
- `POST /api/drops/notify-matches` — notify interested customers when a drop matches their wishlist keywords

---

## Authentication

There are two entirely separate auth systems:

**Customer auth** — Supabase Auth, email magic link (`signInWithOtp`). No passwords. Phone OTP (Termii) exists in the API but the sign-in UI currently offers email only. Managed client-side via `src/lib/user-context.tsx`.

**Admin auth** — custom, independent of Supabase Auth. Credentials live in the `admin_users` table (bcrypt-hashed passwords). Login issues an HMAC-signed `tc_admin` httpOnly cookie (signed with `SUPABASE_SERVICE_ROLE_KEY`, valid 24h). The `/admin` layout calls `GET /api/admin/check` on mount and redirects to `/admin/login` if the cookie is missing or invalid. Login is rate-limited (5 attempts / 15 min per IP).

> There is no `middleware.ts`. Admin protection is enforced in the client layout + the check route, not at the edge. Individual admin API routes should validate the cookie themselves.

---

## Data model (Supabase tables)

Tables referenced across the app:

| Table | Purpose |
|-------|---------|
| `products` | Live product catalogue (one-of-one items) |
| `orders` | Customer orders (`guest_name`, `guest_phone`, `guest_email`, `user_id`, `status`, totals, address, `is_stockpile`, `stockpiled_until`) |
| `order_items` | Line items per order (product snapshot: name, image, size, qty, price) |
| `reviews` | Customer reviews (`order_id`, `first_name`, `comment`, `photo`, `status`, `featured`) |
| `profiles` / `user_profiles` | Customer profile data |
| `keywords` | Wishlist keywords for drop-matching |
| `featured_products` | Homepage hero/featured picks |
| `drops` / `upcoming_drops` | Scheduled product drops |
| `discount_codes` | Discount / promo codes |
| `shipping_zones` | Delivery zones & costs |
| `store_settings` | Global store config (e.g. free-shipping threshold) |
| `admin_users` | Admin accounts (bcrypt password hashes) |
| `temp_leads` | Captured leads (notify signups etc.) |

**Storage bucket:** `product-images` (product photos + review photos).

Products use a **DB-first-with-static-fallback** pattern: `use-products.ts` loads from Supabase and falls back to the static array in `products.ts` if the DB is empty or unreachable.

---

## Deployment

Hosted on **Vercel**, deployed from the `main` branch (auto-deploy on push). Set every environment variable above in the Vercel project settings. The Paystack webhook must point at `https://<your-domain>/api/payments/webhook`.

Images: `next.config.ts` allows the Supabase storage host and the Cloudinary host, with `images.unoptimized: true` (optimisation is handled by the Cloudinary fetch proxy in `cloudinary.ts`).

---

## Conventions

- Brand green is `#1a6b2f`; near-black is `#1a1a1a`.
- Items are **one-of-one** — a single unit at a single size. When sold, they're tagged `SOLD` and later hidden.
- Keep secrets server-side. Never log secret values.
- Match existing component/styling patterns (Tailwind utility classes, the shared `btn-tc-primary` / `btn-tc-outline` styles).
