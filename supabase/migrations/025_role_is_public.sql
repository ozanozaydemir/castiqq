-- Migration 025: is_public toggle for project_roles
-- Rol başvuru sayfasını herkese açık/kapalı yapabilmek için

ALTER TABLE public.project_roles
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
