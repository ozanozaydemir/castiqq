-- ──────────────────────────────────────────────────────────────────
-- 015_audition_notes_author.sql
-- Audition notlarının hangi ekip üyesi tarafından yazıldığını
-- takip etmek için notes_updated_by ve notes_updated_at kolonları.
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS notes_updated_by  UUID,
  ADD COLUMN IF NOT EXISTS notes_updated_at  TIMESTAMPTZ,
  ADD CONSTRAINT auditions_notes_author_fkey
    FOREIGN KEY (notes_updated_by)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
