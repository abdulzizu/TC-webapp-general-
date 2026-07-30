-- ============================================================
-- Thrift Collision — Discount usage increment function
-- Migration: 011_discount_increment_function.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create or replace function public.increment_discount_usage(code_value text)
returns void language plpgsql security definer as $$
begin
  update public.discount_codes
  set uses_count = uses_count + 1
  where code = code_value;
end;
$$;
