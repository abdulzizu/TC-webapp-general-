-- ============================================================
-- Thrift Collision — Shipping Zones (editable from dashboard)
-- Migration: 005_shipping_zones.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.shipping_zones (
  id            serial primary key,
  zone_name     text not null,           -- e.g. "Garki", "Lugbe", "Lagos (GUO)"
  region        text not null,           -- "Abuja" | "Lagos" | "Other States"
  price_min     integer not null,        -- minimum cost in Naira
  price_max     integer,                 -- max cost (null if fixed price)
  delivery_days text not null,           -- e.g. "1–2 business days"
  notes         text,                    -- e.g. "Customer picks up at GUO station"
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.shipping_zones enable row level security;

create policy "Shipping zones are publicly readable"
  on public.shipping_zones for select
  using (true);

create policy "Anon can manage shipping zones"
  on public.shipping_zones for all
  to anon
  using (true) with check (true);

create policy "Service role manages shipping zones"
  on public.shipping_zones for all
  to service_role
  using (true) with check (true);

-- Seed initial zones
insert into public.shipping_zones (zone_name, region, price_min, price_max, delivery_days, notes) values
  ('Gwarinpa', 'Abuja', 2500, null, '1–2 business days', 'Free pickup available in Gwarinpa'),
  ('Garki', 'Abuja', 3500, null, '1–2 business days', null),
  ('Wuse', 'Abuja', 3500, null, '1–2 business days', null),
  ('Maitama', 'Abuja', 3500, null, '1–2 business days', null),
  ('Lugbe', 'Abuja', 4000, null, '1–2 business days', null),
  ('Lokogoma', 'Abuja', 4000, null, '1–2 business days', null),
  ('Kubwa', 'Abuja', 4000, null, '1–2 business days', null),
  ('Jabi', 'Abuja', 3500, null, '1–2 business days', null),
  ('Asokoro', 'Abuja', 3500, null, '1–2 business days', null),
  ('Lagos (GUO)', 'Lagos', 5000, 5500, '2–4 business days', 'Shipped via GUO. Customer picks up at nearest GUO station or requests home delivery from GUO.'),
  ('Other States (GUO)', 'Other States', 5000, 5500, '2–4 business days', 'Shipped via GUO. Customer picks up at nearest GUO station or requests home delivery from GUO.');
