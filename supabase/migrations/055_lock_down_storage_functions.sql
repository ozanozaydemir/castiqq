-- ═══════════════════════════════════════════════════
-- Migration 055: Depolama fonksiyonlarını REST API'den kapat
--
-- Supabase security advisor'ın yakaladığı iki sorun:
--
-- 1) increment_storage() SECURITY DEFINER ve `anon` rolüne AÇIK. Yani
--    kimlik doğrulaması olmadan /rest/v1/rpc/increment_storage çağrılıp
--    HERHANGİ bir org'un sayacı şişirilebilirdi — hedef hesap depolama
--    limitine takılıp video yükleyemez hale gelirdi. Migration 021'den
--    beri açıktı. Sayaç 053'te trigger'a taşındığı ve uygulama kodunda
--    hiçbir çağrısı kalmadığı için fonksiyonu tamamen kaldırıyoruz.
--
-- 2) sync_org_storage() (053'te eklendi) de RPC olarak görünüyordu.
--    Postgres trigger fonksiyonlarının doğrudan çağrılmasını zaten
--    reddeder, ama API yüzeyinde durmasına gerek yok.
-- ═══════════════════════════════════════════════════

DROP FUNCTION IF EXISTS public.increment_storage(UUID, BIGINT);

REVOKE ALL ON FUNCTION public.sync_org_storage() FROM PUBLIC, anon, authenticated;
