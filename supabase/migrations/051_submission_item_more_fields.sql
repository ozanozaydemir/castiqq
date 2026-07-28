-- ──────────────────────────────────────────────────────────────────
-- 051_submission_item_more_fields.sql — eğitim, self-tape linkleri,
-- ağırlık, saç/göz rengi de öneri kalemi snapshot'ına eklensin
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.role_share_submission_items
  ADD COLUMN IF NOT EXISTS weight_kg INT,
  ADD COLUMN IF NOT EXISTS hair_color TEXT,
  ADD COLUMN IF NOT EXISTS eye_color TEXT,
  ADD COLUMN IF NOT EXISTS education TEXT,
  ADD COLUMN IF NOT EXISTS selftape_drama_url TEXT,
  ADD COLUMN IF NOT EXISTS selftape_comedy_url TEXT,
  ADD COLUMN IF NOT EXISTS selftape_ad_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_sample_url TEXT;
