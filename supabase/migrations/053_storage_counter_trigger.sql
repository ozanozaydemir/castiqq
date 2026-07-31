-- ═══════════════════════════════════════════════════
-- Migration 053: Depolama sayacını trigger'a taşı
--
-- Sorun:
--   1) storage_used_bytes yalnızca uygulama kodundan güncelleniyordu.
--      Proje/rol/audition silindiğinde audition_videos ON DELETE CASCADE
--      ile siliniyor ama sayaç düşmüyordu — müşteri sildiği alanı geri
--      kazanamıyor, limiti dolduğunda upload'a kilitleniyordu.
--   2) deleteVideo'daki decrement await edilmiyordu; serverless'ta
--      response döndükten sonra process donabildiği için hiç
--      çalışmayabiliyordu. Artırma await'liydi — yani drift her zaman
--      yukarı yönlüydü, hep müşterinin aleyhine.
--
-- Çözüm: sayacı audition_videos üzerindeki trigger yönetir. Cascade
-- dahil her silme yolunda, aynı transaction içinde, atomik çalışır.
-- ═══════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION sync_org_storage()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.organizations
    SET storage_used_bytes = GREATEST(0, storage_used_bytes + COALESCE(NEW.file_size_bytes, 0))
    WHERE id = NEW.organization_id;

  ELSIF TG_OP = 'DELETE' THEN
    -- Org'un kendisi siliniyorsa (cascade) UPDATE 0 satır etkiler; hata vermez.
    UPDATE public.organizations
    SET storage_used_bytes = GREATEST(0, storage_used_bytes - COALESCE(OLD.file_size_bytes, 0))
    WHERE id = OLD.organization_id;

  ELSE  -- UPDATE
    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
      UPDATE public.organizations
      SET storage_used_bytes = GREATEST(0, storage_used_bytes - COALESCE(OLD.file_size_bytes, 0))
      WHERE id = OLD.organization_id;

      UPDATE public.organizations
      SET storage_used_bytes = GREATEST(0, storage_used_bytes + COALESCE(NEW.file_size_bytes, 0))
      WHERE id = NEW.organization_id;
    ELSE
      UPDATE public.organizations
      SET storage_used_bytes = GREATEST(
            0,
            storage_used_bytes
              + COALESCE(NEW.file_size_bytes, 0)
              - COALESCE(OLD.file_size_bytes, 0)
          )
      WHERE id = NEW.organization_id;
    END IF;
  END IF;

  RETURN NULL;  -- AFTER trigger, dönüş değeri yok sayılır
END;
$$;

-- INSERT + DELETE
DROP TRIGGER IF EXISTS trg_sync_org_storage ON public.audition_videos;
CREATE TRIGGER trg_sync_org_storage
AFTER INSERT OR DELETE ON public.audition_videos
FOR EACH ROW EXECUTE FUNCTION sync_org_storage();

-- UPDATE — yalnızca boyut veya org değiştiyse (file_size_bytes sonradan
-- doldurulan NULL kayıtlar bu yolla sayaca yansır)
DROP TRIGGER IF EXISTS trg_sync_org_storage_update ON public.audition_videos;
CREATE TRIGGER trg_sync_org_storage_update
AFTER UPDATE OF file_size_bytes, organization_id ON public.audition_videos
FOR EACH ROW
WHEN (
  OLD.file_size_bytes IS DISTINCT FROM NEW.file_size_bytes
  OR OLD.organization_id IS DISTINCT FROM NEW.organization_id
)
EXECUTE FUNCTION sync_org_storage();

-- ── Mevcut sayaçları gerçek kayıtlardan yeniden hesapla ───────────
-- Trigger öncesi oluşmuş drift'i temizler. Bundan sonra sayaç
-- kendiliğinden tutarlı kalır.
UPDATE public.organizations o
SET storage_used_bytes = COALESCE(v.total, 0)
FROM (
  SELECT organization_id, SUM(COALESCE(file_size_bytes, 0))::BIGINT AS total
  FROM public.audition_videos
  GROUP BY organization_id
) v
WHERE o.id = v.organization_id
  AND o.storage_used_bytes IS DISTINCT FROM COALESCE(v.total, 0);

UPDATE public.organizations o
SET storage_used_bytes = 0
WHERE o.storage_used_bytes <> 0
  AND NOT EXISTS (
    SELECT 1 FROM public.audition_videos av WHERE av.organization_id = o.id
  );

-- ── increment_storage() artık kullanılmıyor ───────────────────────
-- Migration 021'de eklenmişti, sayaç trigger'a taşındığı için uygulama
-- kodundan çağrılmıyor. Yanlışlıkla çağrılırsa çift sayıma yol açar.
COMMENT ON FUNCTION increment_storage(UUID, BIGINT) IS
  'DEPRECATED (migration 053): storage_used_bytes artık audition_videos '
  'üzerindeki trg_sync_org_storage trigger''ı ile yönetiliyor. Bu fonksiyonu '
  'çağırmak çift sayıma neden olur.';
