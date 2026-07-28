-- ──────────────────────────────────────────────────────────────────
-- 042_talent_self_service.sql — Oyuncu self-servis profil güncelleme
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS self_service_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS talent_self_service_token_idx
  ON public.talent (self_service_token);
