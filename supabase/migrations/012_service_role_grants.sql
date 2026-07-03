-- ──────────────────────────────────────────────────────────────────
-- 012_service_role_grants.sql
-- service_role (admin client) hiçbir tabloya GRANT edilmemişti —
-- RLS bypass edilse bile temel tablo yetkisi olmadan sorgular
-- "permission denied" ile başarısız oluyor (data null döner).
-- Bu, /oyuncu/[token] sayfasının her zaman 404 vermesine sebep
-- oluyordu (admin client auditions'ı okuyamıyordu).
--
-- Ayrıca anon rolüne auditions.submitted_at güncellemesi için
-- (video yükleme sonrası) UPDATE izni hiç verilmemişti.
-- ──────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects           TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_roles      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent             TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_languages   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_experiences TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_education   TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auditions          TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audition_videos    TO service_role;

-- anon: video yükleme sonrası kendi audition kaydını (submitted_at, status)
-- güncelleyebilsin. SELECT politikasıyla aynı gevşek kalıp (token IS NOT NULL).
GRANT UPDATE ON public.auditions TO anon;

CREATE POLICY "audition_update_by_token" ON public.auditions
  FOR UPDATE TO anon
  USING (token IS NOT NULL)
  WITH CHECK (token IS NOT NULL);
