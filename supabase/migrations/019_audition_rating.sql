ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS rating smallint
  CHECK (rating BETWEEN 1 AND 5);
