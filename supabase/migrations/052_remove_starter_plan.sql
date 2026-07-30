-- ═══════════════════════════════════════════════════════════════
-- Migration 052: 'starter' planını kaldır
-- Artık yalnızca 'pro' (cast direktörleri) ve 'agency' (menajerlik) planı var.
-- Ücretsiz tier yoktur; yeni kullanıcılar 14 günlük deneme sonrası abone olur.
-- ═══════════════════════════════════════════════════════════════

-- Mevcut 'starter' kayıtlarını NULL yap (abonelik yok = deneme/ön-kayıt aşaması)
UPDATE public.organizations
  SET subscription_plan = NULL
  WHERE subscription_plan = 'starter';

-- CHECK constraint'i güncelle: sadece 'pro' ve 'agency' geçerli (NULL izinli, CHECK'i geçer)
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_plan_check
  CHECK (subscription_plan IN ('pro', 'agency'));

-- DEFAULT'u kaldır: yeni org'lar aboneliksiz (NULL) başlar
ALTER TABLE public.organizations
  ALTER COLUMN subscription_plan DROP DEFAULT;
