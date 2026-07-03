-- ──────────────────────────────────────────────────────────────────
-- 004_grants.sql — authenticated/anon role table permissions
-- ──────────────────────────────────────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_roles      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_languages   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_experiences TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.talent_education   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.auditions          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audition_videos    TO authenticated;

-- anon rolü sadece public-facing şeyler için (şimdilik gerek yok)
GRANT USAGE ON SCHEMA public TO anon;
