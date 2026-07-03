-- ──────────────────────────────────────────────────────────────────
-- 013_fix_submitted_at_default.sql
-- auditions.submitted_at varsayılan olarak NOW() idi (schema.sql:107),
-- yani her yeni audition satırı oluşturulduğu anda "video yüklendi"
-- sayılıyordu — gerçek yükleme (UploadSection.tsx) hiç gerçekleşmeden.
-- Doğrusu: submitted_at sadece gerçek video yüklemesinde set edilmeli.
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.auditions ALTER COLUMN submitted_at DROP DEFAULT;

-- Geriye dönük düzeltme: video yüklenmemiş ama submitted_at
-- (yanlışlıkla) dolu olan kayıtları temizle.
UPDATE public.auditions a
SET submitted_at = NULL
WHERE submitted_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.audition_videos v WHERE v.audition_id = a.id
  );
