-- Fix project_roles_status_check: migration 002 changed allowed statuses to
-- ('open','casting','callback','closed'), but the app code and seed data
-- use ('open','casting','filled','cancelled'). Restore the original values.

ALTER TABLE public.project_roles
  DROP CONSTRAINT IF EXISTS project_roles_status_check;

ALTER TABLE public.project_roles
  ADD CONSTRAINT project_roles_status_check
  CHECK (status IN ('open', 'casting', 'filled', 'cancelled'));
