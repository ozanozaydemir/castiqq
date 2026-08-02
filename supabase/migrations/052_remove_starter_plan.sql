-- ═══════════════════════════════════════════════════════════════
-- Migration 052: 'starter' planını kaldır
-- Artık yalnızca 'pro' (cast direktörleri) ve 'agency' (menajerlik) planı var.
-- Ücretsiz tier yoktur; yeni kullanıcılar 14 günlük deneme sonrası abone olur.
-- ═══════════════════════════════════════════════════════════════

-- NOT NULL'ı önce kaldır. schema.sql'den beri kolon NOT NULL'dı ve bu migration
-- onu hiç düşürmüyordu: aşağıdaki UPDATE 23502 ile patlıyor, migration yarıda
-- kalıyordu. Uygulansa bile NULL yazılamadığı için 'abonelik yok' durumu
-- temsil edilemiyordu — webhook'un revoke handler'ı tam olarak bu yüzden
-- sessizce başarısız oluyordu.
ALTER TABLE public.organizations
  ALTER COLUMN subscription_plan DROP NOT NULL;

-- Mevcut 'starter'/'trial' kayıtlarını NULL yap (abonelik yok = deneme/ön-kayıt aşaması).
-- 020 trial'ları starter'a çevirmişti ama artakalan olabilir; ikisini de temizliyoruz.
UPDATE public.organizations
  SET subscription_plan = NULL
  WHERE subscription_plan IN ('starter', 'trial');

-- CHECK constraint'i güncelle: sadece 'pro' ve 'agency' geçerli, NULL serbest
ALTER TABLE public.organizations
  DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE public.organizations
  ADD CONSTRAINT organizations_subscription_plan_check
  CHECK (subscription_plan IS NULL OR subscription_plan IN ('pro', 'agency'));

-- DEFAULT'u kaldır: yeni org'lar aboneliksiz (NULL) başlar
ALTER TABLE public.organizations
  ALTER COLUMN subscription_plan DROP DEFAULT;
