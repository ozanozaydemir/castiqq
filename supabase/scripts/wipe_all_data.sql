-- ⚠️ GERİ ALINAMAZ. Tüm uygulama verisini ve tüm Supabase Auth hesaplarını siler.
-- Yalnızca test/sandbox ortamında, bilerek çalıştır.

-- 1. Tüm public şema tablolarını temizle (CASCADE, aralarındaki FK'leri de halleder)
TRUNCATE TABLE
  public.audition_tags,
  public.audition_videos,
  public.auditions,
  public.collection_items,
  public.collections,
  public.project_roles,
  public.projects,
  public.talent_education,
  public.talent_experiences,
  public.talent_languages,
  public.video_notes,
  public.tags,
  public.talent,
  public.profiles,
  public.organizations
CASCADE;

-- 2. Tüm Supabase Auth kullanıcılarını sil
--    (auth.identities, auth.sessions, auth.refresh_tokens vb. Supabase'in kendi
--    CASCADE kurallarıyla otomatik temizlenir; public.profiles zaten yukarıda boşaldı)
DELETE FROM auth.users;
