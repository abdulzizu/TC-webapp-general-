-- ============================================================
-- Thrift Collision — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ── Enum: order status ────────────────────────────────────────
create type order_status as enum (
  'processing',
  'stockpiled',
  'shipped',
  'delivered',
  'unsuccessful'
);

-- ── Table: products ──────────────────────────────────────────
-- Central product catalogue. Replaces products.ts hardcoded data.
create table if not exists public.products (
  id              integer primary key,
  name            text not null,
  category        text not null,
  subcategory     text not null,
  price           integer not null, -- stored in kobo-free NGN (e.g. 14500 = ₦14,500)
  size            text not null,
  waist           text,             -- e.g. 'W32"' or 'W28"–36"' for elastic
  length          text,             -- e.g. 'L30"'
  elastic_waist   boolean not null default false,
  colours         text[] not null default '{}',
  tag             text not null check (tag in ('NEW', '2 LEFT', '1 LEFT', 'SOLD OUT')),
  image           text not null,    -- relative path e.g. /products/foo.jpeg
  description     text not null default '',
  available       boolean not null default true,
  pairs_with      jsonb not null default '[]', -- array of {item, reason}
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Update timestamp trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- RLS: anyone can read products, only service role can write
alter table public.products enable row level security;

create policy "Products are publicly readable"
  on public.products for select
  to anon, authenticated
  using (true);

create policy "Service role can manage products"
  on public.products for all
  to service_role
  using (true) with check (true);

-- ── Table: profiles ──────────────────────────────────────────
-- One row per authenticated user. Linked to auth.users.
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  name              text not null default '',
  phone             text not null,
  email             text,
  delivery_address  text,
  -- size profile
  tshirt_size       text,
  chest_inches      text,
  sleeve_inches     text,
  pants_waist       text,
  pants_length      text,
  hip_inches        text,
  cap_inches        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS: users can only read/write their own profile
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Service role full access to profiles"
  on public.profiles for all
  to service_role
  using (true) with check (true);

-- Auto-create profile row when user signs up via Auth
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone, name)
  values (
    new.id,
    coalesce(new.phone, ''),
    coalesce(new.raw_user_meta_data->>'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Table: orders ────────────────────────────────────────────
create table if not exists public.orders (
  id                uuid primary key default uuid_generate_v4(),
  order_id          text not null unique, -- human-readable e.g. TC-A1B2C3
  user_id           uuid references auth.users(id) on delete set null,
  guest_phone       text,             -- for guest checkouts
  guest_name        text,
  status            order_status not null default 'processing',
  subtotal          integer not null,
  shipping_cost     integer not null default 0,
  discount_amount   integer not null default 0,
  total             integer not null,
  delivery_address  text not null,
  pay_method        text not null,
  is_stockpile      boolean not null default false,
  stockpiled_until  timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- Indexes
create index orders_user_id_idx on public.orders(user_id);
create index orders_order_id_idx on public.orders(order_id);

-- RLS
alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Authenticated users can insert orders"
  on public.orders for insert
  to authenticated, anon
  with check (true);

create policy "Users can update their own order status"
  on public.orders for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Service role full access to orders"
  on public.orders for all
  to service_role
  using (true) with check (true);

-- ── Table: order_items ───────────────────────────────────────
create table if not exists public.order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references public.orders(id) on delete cascade,
  product_id      integer references public.products(id) on delete set null,
  product_name    text not null,
  product_image   text not null,
  size            text not null,
  quantity        integer not null default 1,
  price           integer not null
);

create index order_items_order_id_idx on public.order_items(order_id);

-- RLS — inherit via order ownership
alter table public.order_items enable row level security;

create policy "Users can view their own order items"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and o.user_id = auth.uid()
    )
  );

create policy "Anyone can insert order items"
  on public.order_items for insert
  to authenticated, anon
  with check (true);

create policy "Service role full access to order items"
  on public.order_items for all
  to service_role
  using (true) with check (true);

-- ── Table: temp_leads ────────────────────────────────────────
-- Stores phone/email signups BEFORE OTP verification.
-- These are NOT in auth.users yet.
create table if not exists public.temp_leads (
  id          uuid primary key default uuid_generate_v4(),
  phone       text not null,
  email       text,
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Unique on phone so re-submits update the same row
create unique index temp_leads_phone_idx on public.temp_leads(phone);

-- RLS: only service role manages this table
alter table public.temp_leads enable row level security;

create policy "Service role manages temp leads"
  on public.temp_leads for all
  to service_role
  using (true) with check (true);

-- Anon can insert (for homepage signup form)
create policy "Anon can insert temp leads"
  on public.temp_leads for insert
  to anon, authenticated
  with check (true);

-- ── Table: drop_leads ────────────────────────────────────────
-- Verified marketing list. Populated when:
-- (a) a temp_lead completes OTP → user_id is set
-- (b) an authenticated user subscribes to drops
create table if not exists public.drop_leads (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  phone       text not null,
  email       text,
  created_at  timestamptz not null default now()
);

create unique index drop_leads_phone_idx on public.drop_leads(phone);

alter table public.drop_leads enable row level security;

create policy "Users can view their own lead record"
  on public.drop_leads for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Anon and authenticated can insert drop leads"
  on public.drop_leads for insert
  to anon, authenticated
  with check (true);

create policy "Service role full access to drop leads"
  on public.drop_leads for all
  to service_role
  using (true) with check (true);

-- ── Table: keywords ──────────────────────────────────────────
-- Drop alert keywords per authenticated user
create table if not exists public.keywords (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  keyword     text not null,
  created_at  timestamptz not null default now(),
  unique (user_id, keyword)
);

create index keywords_user_id_idx on public.keywords(user_id);

alter table public.keywords enable row level security;

create policy "Users manage their own keywords"
  on public.keywords for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Service role full access to keywords"
  on public.keywords for all
  to service_role
  using (true) with check (true);
