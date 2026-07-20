-- ============================================================
-- Thrift Collision — Drop scheduling + extended tags
-- Migration: 007_drop_scheduling_and_tags.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- ── Update products tag constraint to allow new tags ─────────
alter table public.products drop constraint if exists products_tag_check;
alter table public.products add constraint products_tag_check
  check (tag in ('NEW', '2 LEFT', '1 LEFT', 'SOLD OUT', '👀 HOT', '🔥 TRENDING'));

-- ── Add drop_id to products for grouping into drops ──────────
alter table public.products add column if not exists drop_id integer;

-- ── Table: drops (scheduled releases) ───────────────────────
create table if not exists public.drops (
  id            serial primary key,
  name          text not null,              -- e.g. "Soja, not soldier"
  description   text,                       -- optional description
  status        text not null default 'draft' check (status in ('draft', 'scheduled', 'live', 'ended')),
  scheduled_at  timestamptz,                -- when to go live (null = manual release)
  released_at   timestamptz,                -- actual release time
  created_at    timestamptz not null default now()
);

alter table public.drops enable row level security;

create policy "Drops are publicly readable when live"
  on public.drops for select
  using (true);

create policy "Anon can manage drops"
  on public.drops for all
  to anon
  using (true) with check (true);

create policy "Service role manages drops"
  on public.drops for all
  to service_role
  using (true) with check (true);

-- Foreign key: products can belong to a drop
alter table public.products
  add constraint products_drop_fk foreign key (drop_id) references public.drops(id) on delete set null;
