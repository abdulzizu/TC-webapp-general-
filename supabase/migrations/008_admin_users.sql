-- ============================================================
-- Thrift Collision — Admin Users (email + password auth)
-- Migration: 008_admin_users.sql
-- Run in: Supabase Dashboard → SQL Editor
-- Then visit /api/admin/setup to create your first admin account
-- ============================================================

create table if not exists public.admin_users (
  id            serial primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  role          text not null default 'owner' check (role in ('owner', 'editor', 'viewer')),
  created_at    timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create policy "Service role manages admin users"
  on public.admin_users for all
  to service_role
  using (true) with check (true);

create policy "Anon can read admin users for login"
  on public.admin_users for select
  to anon
  using (true);
