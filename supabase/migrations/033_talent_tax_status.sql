-- ──────────────────────────────────────────────────────────────────
-- 033_talent_tax_status.sql — Vergi/stopaj durumu (faturalandırma için)
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS tax_status TEXT NOT NULL DEFAULT 'belirtilmedi'
    CHECK (tax_status IN ('belirtilmedi', 'serbest_meslek', 'sahis_sirketi', 'sirket', 'ucret_bordrosu')),
  ADD COLUMN IF NOT EXISTS tax_id TEXT;
