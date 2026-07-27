-- ──────────────────────────────────────────────────────────────────
-- 030_talent_representation.sql — Menajerlik temsil/sözleşme takibi
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC(5,2)
    CHECK (commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 100)),
  ADD COLUMN IF NOT EXISTS representation_start_date DATE,
  ADD COLUMN IF NOT EXISTS representation_end_date DATE,
  ADD COLUMN IF NOT EXISTS exclusive_representation BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS contract_file_path TEXT;

-- Sözleşme PDF'leri için private bucket (scripts bucket ile aynı desen)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "contracts_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "contracts_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "contracts_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'contracts'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
