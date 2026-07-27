-- ──────────────────────────────────────────────────────────────────
-- 038_union_and_representation_history.sql — Sendika üyeliği +
-- geçmiş temsil dönemleri
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS union_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS union_name TEXT,
  ADD COLUMN IF NOT EXISTS union_id_number TEXT;

CREATE TABLE IF NOT EXISTS public.talent_representation_history (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  start_date        DATE NOT NULL,
  end_date          DATE,
  commission_rate   NUMERIC(5,2),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS talent_rep_history_talent_id_idx ON public.talent_representation_history (talent_id);

ALTER TABLE public.talent_representation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_representation_history: org isolation"
  ON public.talent_representation_history
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.talent_representation_history TO authenticated;
