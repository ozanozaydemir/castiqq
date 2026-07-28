-- ──────────────────────────────────────────────────────────────────
-- 041_agency_tasks.sql — Genel görev/hatırlatıcı sistemi
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.agency_tasks (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id         UUID REFERENCES public.talent(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  due_date          DATE,
  is_done           BOOLEAN NOT NULL DEFAULT false,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS agency_tasks_org_done_idx ON public.agency_tasks (organization_id, is_done);
CREATE INDEX IF NOT EXISTS agency_tasks_talent_id_idx ON public.agency_tasks (talent_id);

ALTER TABLE public.agency_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_tasks: org isolation"
  ON public.agency_tasks
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.agency_tasks TO authenticated;
