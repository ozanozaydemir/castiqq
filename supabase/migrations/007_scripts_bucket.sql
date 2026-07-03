-- ──────────────────────────────────────────────────────────────────
-- 007_scripts_bucket.sql — Senaryo PDF'leri için private bucket
-- ──────────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('scripts', 'scripts', false)
ON CONFLICT (id) DO NOTHING;

-- Org üyeleri kendi org klasörüne yükleyebilir
CREATE POLICY "scripts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scripts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Org üyeleri kendi org klasörünü okuyabilir (admin değişim için)
CREATE POLICY "scripts_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'scripts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Silme: sadece kendi org klasörü
CREATE POLICY "scripts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'scripts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
