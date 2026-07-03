ALTER TABLE public.project_roles
  ADD COLUMN IF NOT EXISTS public_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS project_roles_public_token_idx
  ON public.project_roles (public_token);
