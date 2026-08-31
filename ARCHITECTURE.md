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

   On successful payment, both paths also: clear the item's hold (`held_until`/`held_by_order` → null), and if the order has a `discount_code`, increment its usage via the `increment_discount_use` RPC (counted once, only on real payment).

---

## One-of-one payment holds (preventing double-purchase)

Because items are single-unit, two people must never both pay for the same piece. Handled in `POST /api/payments/initialize` before redirecting to Paystack:

- Each item in the order is claimed with a **race-safe conditional update**: set `held_until = now + 5 min` and `held_by_order = <orderId>` **only if** the row isn't sold and isn't already freshly held by a *different* order.
- If any item can't be claimed (someone else holds it, or it's sold), the whole attempt is rolled back and the route returns `409 { error: "item_held", heldItems, message }`.
- The checkout surfaces this as an inline card offering **"Continue with available items"** (drops the blocked items, re-runs checkout on the rest) — the same card also covers the already-sold case.

**Lazy expiry — no background job.** A hold is only "active" if `held_until` is in the future. Stale holds are simply ignored on read; nothing sweeps them. This is deliberate — an earlier cron-based release caused problems, so there is intentionally no scheduled release. (Verification stays as a final backstop for the rare simultaneous-payment collision.)

Checkout also shows a soft heads-up if a cart item is already held by someone else, and a "held for 5 minutes" notice at the Pay button.

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

The `reviews` table (and other schema additions) are in the README's "Schema additions" block.

---

## Wishlist drop alerts

Customers save interest as `keywords` (from the profile wishlist, or by tapping "notify me" on a sold product — which saves the item's cleaned **name**, e.g. "brown leather jacket", not just its subcategory, so alerts are specific).

`POST /api/drops/notify-matches` powers the alerts. It accepts `{ dropId }` (a whole drop) or `{ productIds }` (specific newly-available items), then substring-matches each customer's keywords against `"{name} {subcategory} {description}"` of the given products and emails the matches.

**Triggers:** the drop **Release** action (`admin/drops/new`) fires it for the whole drop; the products admin fires it with a single `productId` whenever an item goes hidden→visible or is created visible. So alerts fire regardless of how an item is published. (Note: there is no automatic scheduled-drop release — "scheduled" drops are released manually.)

**Dedup:** before sending, it loads existing `(user_id, product_id)` pairs from `wishlist_notifications`, skips already-notified pairs, and records new ones after sending (upsert, ignore-duplicates). A customer is never emailed about the same product twice; a *different* product matching the same keyword still alerts them (the keyword is an ongoing interest until removed). Product-level dedup means multiple matching keywords still yield one email per product.

---

## Drop analytics

`/admin/analytics` — a client-side "Drop Performance" page (no dedicated API; queries Supabase directly).

- **Sell-through %** for a chosen window (24h / 48h / 1 week): of a drop's items, how many sold within `released_at + window`.
- **Sell time** per item = the website order timestamp if one exists, else the manual `sold_at` (see below), whichever is earlier. This is why off-site sales count in the timed metrics.
- **Revenue, category velocity, item velocity, return-customer estimate, unfulfilled demand (top keywords), and a Website-vs-off-site channel split.**
- Only drops that still have linked products (`products.drop_id`) are analysable; released drops whose products were unlinked are filtered out of the picker.
- Traffic/concurrent-user analytics are intentionally **not** here — that's Vercel Analytics' job (no page-view tracking exists in the DB).

---

## Off-site sale tracking (IG / WhatsApp)

Many sales happen via DM: the customer pays into the TC account and the admin marks the item SOLD. To count these accurately, the product editor captures `sold_at` (auto-stamped when tag first becomes SOLD; original date preserved on re-save; cleared if un-sold) and `sold_channel` (Website / Instagram / WhatsApp / In person / Other). Website checkout sales are inferred from the order record; everything else uses the recorded channel. This feeds the analytics channel split and lets manual sales appear in timed sell-through/velocity.

---

## Transactional email (Resend)

Branded HTML emails, same house style (dark header, green accents, social footer), all from `hello@thriftcollision.com` / reply-to `help@thriftcollision.com`:

- **Order confirmation** — `POST /api/orders/confirm`, fired from payment verification. Itemised order, totals, delivery address, "Track Your Order" CTA.
- **Review request** — `POST /api/reviews/request`, fired on delivery. Invites a review, links to the pre-filled form.
- **Wishlist match** — `POST /api/drops/notify-matches`, fired on drop release / item made available. Lists the matching items.
- **Discount code** — `POST /api/admin/discounts/send`, triggered from the admin Discounts page. Sends a code + its terms to chosen customers.
- **Lead broadcast** — `POST /api/admin/notify`, from the admin Leads page.

Customer-facing sends do a basic origin check and require `RESEND_API_KEY`. Order/review emails don't send without a recipient email on the order. On the Resend Pro plan (50k/month), volume isn't a constraint for targeted sends.

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

**Server-side route protection.** There is no `middleware.ts`; the client layout redirect is UX only and provides no real security. Every admin API route authenticates itself via `src/lib/admin-auth.ts`:
- `verifyAdmin(req)` — validates the `tc_admin` cookie's HMAC signature (constant-time) and 24h age, returning `{ adminId, role }` or `null`. This is the single source of truth; never trust the cookie's mere presence or its raw contents.
- `verifyAdminOrCron(req)` — for the `clear-new-tags` endpoint, which is also triggered by external cron. Accepts a valid admin session, or a `CRON_SECRET` supplied as `Authorization: Bearer <secret>` or `?token=<secret>`.

> Set `CRON_SECRET` in the environment if you schedule `clear-new-tags` via an external cron. Without it, the route accepts admin sessions only.

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
- **Discount usage is counted on payment**, not at checkout — via `increment_discount_use`. Counting at checkout would inflate on abandoned carts (an earlier bug). The order stores `discount_code` so verification/webhook know what to increment.
- **No scheduled-drop auto-release exists.** Drops set to "scheduled" are released manually; the wishlist-alert fires on manual release and on single-item availability changes.
- **Payment holds use lazy expiry, no background job** — deliberately, after a prior cron-based release caused problems. Don't reintroduce a sweep.
- **Off-site (IG) sales** only count in *timed* analytics if `sold_at` is set (auto-stamped going forward). Items marked SOLD before this feature have no `sold_at` and appear only in untimed "sold overall" counts.
- Brand colours: green `#1a6b2f`, near-black `#1a1a1a`.
