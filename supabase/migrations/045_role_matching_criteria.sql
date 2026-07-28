-- ──────────────────────────────────────────────────────────────────
-- 045_role_matching_criteria.sql — Rol eşleştirme motoru için kriterler
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.project_roles
  ADD COLUMN IF NOT EXISTS min_height_cm INT,
  ADD COLUMN IF NOT EXISTS max_height_cm INT,
  ADD COLUMN IF NOT EXISTS required_skills TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS city TEXT;
