-- ============================================================
-- Thrift Collision — Discount Codes + Store Settings
-- Migration: 009_discount_codes_and_settings.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Store settings (key-value for global config) ─────────────
create table if not exists public.store_settings (
  key         text primary key,
  value       text not null,
  updated_at  timestamptz not null default now()
);

alter table public.store_settings enable row level security;

create policy "Store settings publicly readable"
  on public.store_settings for select using (true);

create policy "Anon can manage store settings"
  on public.store_settings for all to anon using (true) with check (true);

create policy "Service role manages store settings"
  on public.store_settings for all to service_role using (true) with check (true);

-- Seed default free shipping threshold
insert into public.store_settings (key, value) values
  ('free_shipping_threshold', '60000')
on conflict (key) do nothing;

-- ── Discount codes ───────────────────────────────────────────
create table if not exists public.discount_codes (
  id                serial primary key,
  code              text not null unique,
  name              text not null default '',          -- internal reference name
  discount_type     text not null check (discount_type in ('percentage', 'fixed', 'free_shipping')),
  discount_value    integer not null default 0,        -- percentage (e.g. 15) or fixed amount (e.g. 3000)
  min_purchase      integer not null default 0,        -- minimum cart value to qualify
  max_uses          integer,                           -- null = unlimited
  max_uses_per_user integer default 1,                 -- per-customer limit
  uses_count        integer not null default 0,        -- total times redeemed
  product_scope     text not null default 'all' check (product_scope in ('all', 'specific')),
  product_ids       integer[] not null default '{}',   -- specific product IDs (when scope = specific)
  start_date        timestamptz,                       -- null = active immediately
  end_date          timestamptz,                       -- null = no expiry
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

alter table public.discount_codes enable row level security;

create policy "Discount codes publicly readable"
  on public.discount_codes for select using (true);

create policy "Anon can manage discount codes"
  on public.discount_codes for all to anon using (true) with check (true);

create policy "Service role manages discount codes"
  on public.discount_codes for all to service_role using (true) with check (true);

-- Seed initial codes (matching existing hardcoded ones)
insert into public.discount_codes (code, name, discount_type, discount_value, max_uses) values
  ('TCFIRST', 'First-time buyer 10%', 'percentage', 10, null),
  ('THRIFT15', '15% off promo', 'percentage', 15, null),
  ('DROP20', 'Drop day 20%', 'percentage', 20, 50)
on conflict (code) do nothing;
