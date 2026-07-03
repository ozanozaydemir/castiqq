-- ──────────────────────────────────────────────────────────────────
-- 008_talent_photos.sql — Oyuncu fotoğraf galerisi
-- ──────────────────────────────────────────────────────────────────

-- photos: sıralı public URL'ler dizisi, ilk öğe = kart kapağı
ALTER TABLE talent ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}';
