-- ============================================================
-- Thrift Collision — Upcoming Drops (editable from dashboard)
-- Migration: 006_upcoming_drops.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists public.upcoming_drops (
  id            serial primary key,
  title         text not null,           -- e.g. "Soja, not soldier"
  subtitle      text not null,           -- e.g. "Camo capsule drop"
  timing        text not null,           -- e.g. "Coming soon", "September"
  emoji         text not null default '🔥', -- display emoji
  display_order integer not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

alter table public.upcoming_drops enable row level security;

create policy "Upcoming drops are publicly readable"
  on public.upcoming_drops for select
  using (true);

create policy "Anon can manage upcoming drops"
  on public.upcoming_drops for all
  to anon
  using (true) with check (true);

create policy "Service role manages upcoming drops"
  on public.upcoming_drops for all
  to service_role
  using (true) with check (true);

-- Seed initial drops
insert into public.upcoming_drops (title, subtitle, timing, emoji, display_order) values
  ('Soja, not soldier', 'Camo capsule drop', 'Coming soon', '🪖', 1),
  ('Jersey Drop', 'Football jerseys collection', 'September', '⚽', 2);
