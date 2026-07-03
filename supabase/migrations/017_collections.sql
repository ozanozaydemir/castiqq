-- Curated talent lists / shortlists
CREATE TABLE IF NOT EXISTS public.collections (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collections: org isolation"
  ON public.collections
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE TABLE IF NOT EXISTS public.collection_items (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collection_id UUID NOT NULL REFERENCES public.collections(id)  ON DELETE CASCADE,
  talent_id     UUID NOT NULL REFERENCES public.talent(id)        ON DELETE CASCADE,
  added_by      UUID REFERENCES public.profiles(id)               ON DELETE SET NULL,
  added_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  note          TEXT,
  UNIQUE (collection_id, talent_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "collection_items: org isolation"
  ON public.collection_items
  USING (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id
        AND c.organization_id = get_user_org_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.collections c
      WHERE c.id = collection_id
        AND c.organization_id = get_user_org_id()
    )
  );

GRANT ALL ON public.collections TO authenticated;
GRANT ALL ON public.collection_items TO authenticated;
