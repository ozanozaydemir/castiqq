-- ═══════════════════════════════════════════════════
-- Migration 021: Video depolama takibi
-- ═══════════════════════════════════════════════════

-- audition_videos'a dosya boyutu kolonu ekle
ALTER TABLE public.audition_videos
  ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;

-- organizations'a toplam depolama sayacı ekle
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT NOT NULL DEFAULT 0;

-- Atomic storage increment fonksiyonu
CREATE OR REPLACE FUNCTION increment_storage(org_id UUID, bytes BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.organizations
  SET storage_used_bytes = storage_used_bytes + bytes
  WHERE id = org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_storage(UUID, BIGINT) TO service_role;
