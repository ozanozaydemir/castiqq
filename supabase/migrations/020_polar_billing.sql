-- ═══════════════════════════════════════════════════
-- Migration 020: Polar billing entegrasyonu
-- organizations tablosuna Polar-specific kolonlar ekle
-- ═══════════════════════════════════════════════════

-- Polar customer ve subscription ID'lerini sakla
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS polar_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS polar_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS subscription_ends_at  TIMESTAMPTZ;

-- Plan CHECK constraint'i güncelle: starter, pro, agency + eski trial değeri
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_plan_check
  CHECK (subscription_plan IN ('starter', 'pro', 'agency', 'trial'));

-- Mevcut 'trial' kayıtları 'starter' olarak güncelle
UPDATE public.organizations
  SET subscription_plan = 'starter'
  WHERE subscription_plan = 'trial';

-- subscription_status CHECK constraint'i genişlet
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_status_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_status_check
  CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trial', 'incomplete'));

-- Yeni kayıtlar için default plan 'starter' olsun
ALTER TABLE public.organizations
  ALTER COLUMN subscription_plan SET DEFAULT 'starter';
