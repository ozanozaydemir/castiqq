-- ──────────────────────────────────────────────────────────────────
-- 037_bookings_ongoing.sql — Devam eden (sezonu süren) dizi anlaşmaları
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS is_ongoing BOOLEAN NOT NULL DEFAULT false;
