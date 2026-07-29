-- ============================================================
-- Thrift Collision — Add 'pending' to order_status enum
-- Migration: 010_add_pending_status.sql
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending' BEFORE 'processing';
