-- ──────────────────────────────────────────────────────────────────
-- 006_audition_sort_order.sql — Manuel drag-drop sıralama
-- ──────────────────────────────────────────────────────────────────

ALTER TABLE public.auditions
  ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- Mevcut kayıtlar için created_at sırasına göre sort_order ata
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY role_id ORDER BY created_at) - 1 AS rn
  FROM public.auditions
)
UPDATE public.auditions a SET sort_order = o.rn FROM ordered o WHERE a.id = o.id;
