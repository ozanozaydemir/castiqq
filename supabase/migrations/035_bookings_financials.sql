-- ──────────────────────────────────────────────────────────────────
-- 035_bookings_financials.sql — Stopaj/net hesaplama, kısmi ödeme
-- tutarı, reklam yasağı (exclusivity) takibi
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS withholding_rate NUMERIC(5,2) NOT NULL DEFAULT 0
    CHECK (withholding_rate >= 0 AND withholding_rate <= 100),
  ADD COLUMN IF NOT EXISTS withholding_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exclusivity_end_date DATE,
  ADD COLUMN IF NOT EXISTS exclusivity_notes TEXT;

CREATE INDEX IF NOT EXISTS bookings_exclusivity_idx ON public.bookings (talent_id, exclusivity_end_date);

-- Mevcut kayıtlar için net_amount = gross_amount (stopaj yoktu)
UPDATE public.bookings SET net_amount = gross_amount WHERE net_amount = 0;
