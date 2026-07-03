-- M1: Project Module extra fields + role status update
-- Run this after 001_auth_trigger.sql

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS director TEXT,
  ADD COLUMN IF NOT EXISTS shooting_start DATE,
  ADD COLUMN IF NOT EXISTS shooting_end DATE,
  ADD COLUMN IF NOT EXISTS shooting_location TEXT;

-- Update role status values to match casting flow
ALTER TABLE public.project_roles
  DROP CONSTRAINT IF EXISTS project_roles_status_check;

ALTER TABLE public.project_roles
  ADD CONSTRAINT project_roles_status_check
  CHECK (status IN ('open', 'casting', 'callback', 'closed'));
