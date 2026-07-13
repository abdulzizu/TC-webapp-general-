-- ============================================================
-- Thrift Collision — Add multi-image support to products
-- Migration: 003_add_product_images.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Add images column (array of image paths, in addition to the primary `image`)
alter table public.products
  add column if not exists images text[] not null default '{}';

-- For existing products, the images array is empty by default.
-- When uploading additional images, add their paths to this array.
-- The primary `image` field remains the cover/thumbnail shown in grids.
