-- 060 — 059'da eklenen tablolar için service_role yetkileri
--
-- Migration 012'nin düzelttiği hatanın aynısı: admin client (service_role)
-- RLS'i baypas etse bile temel tablo GRANT'i olmadan sorgu "permission denied"
-- ile düşüyor ve Supabase istemcisi `data: null` döndürüyor. Public
-- /oyuncu/[token] sayfası bu yüzden 404 veriyordu.
--
-- Yeni tablo eklerken authenticated GRANT'i kadar service_role GRANT'i de
-- zorunlu — admin client'ın dokunduğu her tablo için.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_scripts      TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audition_scripts  TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.video_purge_queue TO service_role;

-- role_relationships (migration 058) da admin client'tan okunmuyor bugün, ama
-- ileride okunursa aynı tuzağa düşmemek için şimdiden veriyoruz.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.role_relationships TO service_role;
