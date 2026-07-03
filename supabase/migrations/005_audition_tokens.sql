-- ──────────────────────────────────────────────────────────────────
-- 005_audition_tokens.sql — M3 Audition Sistemi
-- ──────────────────────────────────────────────────────────────────

-- auditions tablosuna token + invite_phone ekle
ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS token       UUID UNIQUE DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS invite_phone TEXT;

-- Mevcut kayıtlarda token null olmasın
UPDATE public.auditions SET token = uuid_generate_v4() WHERE token IS NULL;
ALTER TABLE public.auditions ALTER COLUMN token SET NOT NULL;

-- project_roles'a script_url ekle
ALTER TABLE public.project_roles
  ADD COLUMN IF NOT EXISTS script_url TEXT;

-- Index: token'a göre hızlı arama
CREATE UNIQUE INDEX IF NOT EXISTS auditions_token_idx ON public.auditions (token);

-- ── Storage: token tabanlı upload politikası ─────────────────────

-- anon kullanıcı geçerli token ile upload yapabilsin
CREATE POLICY "audition_upload_by_token" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (
    bucket_id = 'audition-videos'
    AND EXISTS (
      SELECT 1 FROM public.auditions
      WHERE token::text = (storage.foldername(name))[1]
    )
  );

-- anon kullanıcı kendi token path'ini okuyabilsin (yükleme sonrası kontrol)
CREATE POLICY "audition_read_by_token" ON storage.objects
  FOR SELECT TO anon
  USING (
    bucket_id = 'audition-videos'
    AND EXISTS (
      SELECT 1 FROM public.auditions
      WHERE token::text = (storage.foldername(name))[1]
    )
  );

-- auditions tablosunu anon key ile token'a göre okuma izni
CREATE POLICY "audition_public_by_token" ON public.auditions
  FOR SELECT TO anon
  USING (token IS NOT NULL);

-- audition_videos tablosunu anon key ile insert izni (upload sonrası kayıt)
CREATE POLICY "audition_videos_public_insert" ON public.audition_videos
  FOR INSERT TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.auditions WHERE id = audition_id
    )
  );

GRANT SELECT ON public.auditions TO anon;
GRANT INSERT ON public.audition_videos TO anon;
GRANT SELECT ON public.project_roles TO anon;
GRANT SELECT ON public.projects TO anon;
