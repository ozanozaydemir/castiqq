-- Org-level tag definitions
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (organization_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags: org isolation"
  ON public.tags
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

-- Audition ↔ Tag junction
CREATE TABLE IF NOT EXISTS public.audition_tags (
  audition_id UUID NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  tag_id      UUID NOT NULL REFERENCES public.tags(id)      ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (audition_id, tag_id)
);

ALTER TABLE public.audition_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audition_tags: org isolation"
  ON public.audition_tags
  USING (
    EXISTS (
      SELECT 1 FROM public.tags t
      WHERE t.id = tag_id
        AND t.organization_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tags t
      WHERE t.id = tag_id
        AND t.organization_id = get_user_org_id()
    )
  );

GRANT ALL ON public.tags TO authenticated;
GRANT ALL ON public.audition_tags TO authenticated;
