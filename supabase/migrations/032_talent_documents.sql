-- ──────────────────────────────────────────────────────────────────
-- 032_talent_documents.sql — Belge takibi (kimlik, sağlık raporu,
-- çalışma izni, pasaport/vize, veli izni vb.) + son geçerlilik tarihi
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.talent_documents (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  document_type     TEXT NOT NULL DEFAULT 'diger'
                      CHECK (document_type IN ('kimlik', 'saglik_raporu', 'calisma_izni', 'pasaport', 'vize', 'veli_izni', 'diger')),
  file_path         TEXT,
  expiry_date       DATE,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS talent_documents_talent_id_idx ON public.talent_documents (talent_id);
CREATE INDEX IF NOT EXISTS talent_documents_org_expiry_idx ON public.talent_documents (organization_id, expiry_date);

ALTER TABLE public.talent_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "talent_documents: org isolation"
  ON public.talent_documents
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.talent_documents TO authenticated;

-- Belge dosyaları için private bucket (scripts/contracts ile aynı desen)
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-documents', 'talent-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "talent_documents_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'talent-documents'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "talent_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'talent-documents'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "talent_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'talent-documents'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
