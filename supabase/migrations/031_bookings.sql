-- ──────────────────────────────────────────────────────────────────
-- 031_bookings.sql — Menajerlik iş/ödeme takibi (booking log)
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.bookings (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  client_name       TEXT NOT NULL,
  job_type          TEXT NOT NULL DEFAULT 'diger'
                      CHECK (job_type IN ('dizi', 'reklam', 'film', 'sunuculuk', 'seslendirme', 'etkinlik', 'diger')),
  title             TEXT,
  work_date         DATE NOT NULL,
  work_date_end     DATE,
  gross_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'TRY',
  commission_rate   NUMERIC(5,2),
  commission_amount NUMERIC(12,2),
  payment_due_date  DATE,
  payment_status    TEXT NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN ('pending', 'partial', 'paid')),
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS bookings_talent_id_idx ON public.bookings (talent_id);
CREATE INDEX IF NOT EXISTS bookings_org_payment_status_idx ON public.bookings (organization_id, payment_status);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookings: org isolation"
  ON public.bookings
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.bookings TO authenticated;
