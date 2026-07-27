-- ──────────────────────────────────────────────────────────────────
-- 034_talent_assigned_to.sql — Çoklu menajerli ajanslarda oyuncu ataması
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS talent_assigned_to_idx ON public.talent (assigned_to);
