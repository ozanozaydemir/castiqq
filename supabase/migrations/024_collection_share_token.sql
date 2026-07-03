ALTER TABLE public.collections
  ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid() NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS collections_share_token_idx
  ON public.collections (share_token);
