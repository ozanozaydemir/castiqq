-- ──────────────────────────────────────────────────────────────────
-- 050_submission_item_profile.sql — Öneri kalemine daha zengin
-- oyuncu profili snapshot'ı — CD sadece isim/foto değil, karar
-- vermesine yetecek kadar bilgi görsün.
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.role_share_submission_items
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS notable_experience TEXT,
  ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}';
