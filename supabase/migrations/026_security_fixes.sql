-- 1. Tehlikeli anon RLS politikalarını kaldır
--    token IS NOT NULL koşulu tüm satırları kapsıyordu;
--    upload akışı zaten admin client üzerinden yürüdüğü için anon erişim gerekmez.
DROP POLICY IF EXISTS audition_public_by_token ON public.auditions;
DROP POLICY IF EXISTS audition_update_by_token ON public.auditions;

-- 2. auditions.token üzerindeki duplicate unique index'i kaldır
--    auditions_token_key (UNIQUE constraint) zaten aynı garantiyi veriyor.
DROP INDEX IF EXISTS public.auditions_token_idx;

-- 3. projects.created_by FK silme kuralını SET NULL yap
--    NO ACTION ile kullanıcı silinmek istendiğinde FK hatası oluşuyordu.
ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_created_by_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_created_by_fkey
  FOREIGN KEY (created_by)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
