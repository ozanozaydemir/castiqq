ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'tr'
    CHECK (preferred_language IN ('tr', 'en'));
