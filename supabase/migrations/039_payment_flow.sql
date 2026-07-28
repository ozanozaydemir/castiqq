-- ──────────────────────────────────────────────────────────────────
-- 039_payment_flow.sql — Komisyon tahsilat yönü
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_flow TEXT NOT NULL DEFAULT 'client_to_agency'
    CHECK (payment_flow IN ('client_to_agency', 'client_to_talent')),
  ADD COLUMN IF NOT EXISTS commission_collected BOOLEAN NOT NULL DEFAULT false;
