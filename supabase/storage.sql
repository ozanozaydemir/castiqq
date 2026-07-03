-- ══════════════════════════════════════════════════════════════════
-- CastFlow — Supabase Storage Buckets
-- Supabase Dashboard > Storage'da oluştur ya da SQL Editor'da çalıştır
-- ══════════════════════════════════════════════════════════════════

-- Audition videoları (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('audition-videos', 'audition-videos', false)
ON CONFLICT (id) DO NOTHING;

-- Oyuncu fotoğrafları (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('talent-avatars', 'talent-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Org logoları (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- ── Storage RLS ────────────────────────────────────────────────

-- audition-videos: sadece kendi org kullanıcıları erişebilir
CREATE POLICY "videos_org_access" ON storage.objects FOR ALL
  USING (
    bucket_id = 'audition-videos'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'audition-videos'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

-- talent-avatars: public read, org members write
CREATE POLICY "talent_avatars_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'talent-avatars');

CREATE POLICY "talent_avatars_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'talent-avatars'
    AND auth.uid() IS NOT NULL
  );

-- org-logos: public read, admin write
CREATE POLICY "org_logos_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'org-logos');

CREATE POLICY "org_logos_write" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
