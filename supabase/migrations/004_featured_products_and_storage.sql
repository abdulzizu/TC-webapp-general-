-- ============================================================
-- Thrift Collision — Featured products table + Storage bucket
-- Migration: 004_featured_products_and_storage.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Table: featured_products ─────────────────────────────────
-- Controls the 4 hero cards on the homepage.
-- Update these rows weekly from the Supabase dashboard — no code changes needed.
create table if not exists public.featured_products (
  id            serial primary key,
  label         text not null,              -- e.g. "Liverpool FC Jersey"
  price         text not null,              -- formatted e.g. "₦12,500"
  size          text not null,              -- e.g. "S–XL" or "M"
  tag           text not null,              -- e.g. "NEW", "2 LEFT"
  image_url     text not null,              -- full URL from Supabase Storage
  display_order integer not null default 0, -- lower = shown first
  product_id    integer references public.products(id) on delete set null, -- optional link
  created_at    timestamptz not null default now()
);

-- RLS: publicly readable, service role manages
alter table public.featured_products enable row level security;

create policy "Featured products are publicly readable"
  on public.featured_products for select
  using (true);

create policy "Service role manages featured products"
  on public.featured_products for all
  to service_role
  using (true) with check (true);

-- ── Seed initial 4 featured items ────────────────────────────
-- These use local paths for now. Once you upload to Storage, update image_url to the public URL.
insert into public.featured_products (label, price, size, tag, image_url, display_order, product_id) values
  ('Liverpool FC Jersey', '₦12,500', 'M', '2 LEFT', '/products/liverpool 2006 jersey.jpeg', 1, 2),
  ('Burgundy Windbreaker', '₦18,000', 'M', 'NEW', '/products/burgundy wind breaker jacket.jpeg', 2, 3),
  ('Striped T-Shirt', '₦7,500', 'L', 'NEW', '/products/Stripe t-shirt.jpeg', 3, 31),
  ('Black Baggy Jeans', '₦15,000', '32', 'NEW', '/products/black baggy jeans.jpeg', 4, 11);

-- ── Storage bucket for product images ────────────────────────
-- Creates a public bucket so images are accessible without auth
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public read access for product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Allow authenticated/service role to upload
create policy "Service role can upload product images"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'product-images');

create policy "Authenticated users can upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Service role can delete product images"
  on storage.objects for delete
  to service_role
  using (bucket_id = 'product-images');
