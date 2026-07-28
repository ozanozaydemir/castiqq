-- ──────────────────────────────────────────────────────────────────
-- 040_talent_advances.sql — Avans/masraf takibi
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.talent_advances (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  type              TEXT NOT NULL DEFAULT 'avans' CHECK (type IN ('avans', 'masraf')),
  amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          TEXT NOT NULL DEFAULT 'TRY',
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  description       TEXT,
  is_settled        BOOLEAN NOT NULL DEFAULT false,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS talent_advances_talent_id_idx ON public.talent_advances (talent_id);
CREATE INDEX IF NOT EXISTS talent_advances_org_settled_idx ON public.talent_advances (organization_id, is_settled);

ALTER TABLE public.talent_advances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_advances: org isolation"
  ON public.talent_advances
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.talent_advances TO authenticated;
