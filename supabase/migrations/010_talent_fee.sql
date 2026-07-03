-- ──────────────────────────────────────────────────────────────────
-- 010_talent_fee.sql — Oyuncu ücret bilgisi
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE talent
  ADD COLUMN IF NOT EXISTS fee_type     text,
  ADD COLUMN IF NOT EXISTS fee_amount   numeric(10, 2),
  ADD COLUMN IF NOT EXISTS fee_currency text DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS fee_notes    text;

ALTER TABLE talent
  ADD CONSTRAINT talent_fee_type_check
    CHECK (fee_type IN ('daily', 'weekly', 'per_episode', 'monthly', 'per_project', 'hourly'));
