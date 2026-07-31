-- ═══════════════════════════════════════════════════
-- Migration 056: Public bucket listelemesini org'a kısıtla
--
-- talent-avatars ve org-logos public bucket'lar ve SELECT politikaları
-- yalnızca `bucket_id = '...'` kontrolü yapıyordu — hiçbir org kısıtı yok.
-- Bu, storage.objects üzerinden LISTELEME yetkisi veriyor: giriş yapmış
-- herhangi bir kullanıcı, başka org'ların tüm oyuncu fotoğraflarını ve
-- logolarını sayabilirdi. Oyuncu fotoğrafları kişisel veri (KVKK/GDPR);
-- org logoları da müşteri listesini ifşa eder.
--
-- Şu an tek org olduğu için sömürülebilir değil, ama ikinci müşteride
-- doğrudan kiracı izolasyonu ihlali olur.
--
-- Not: Bucket'lar `public = true`. Public bucket'larda dosya URL'leri
-- (/storage/v1/object/public/...) RLS'ten GEÇMEZ — bu politika yalnızca
-- .list() içindir. Dolayısıyla kısıtlamak görsellerin görüntülenmesini
-- etkilemez; migration öncesi ve sonrası HTTP 200 ile doğrulandı.
--
-- Desen, diğer bucket'lardaki politikalarla aynı hale getiriliyor
-- (videos_org_access, contracts_read, talent_documents_read …).
-- ═══════════════════════════════════════════════════

DROP POLICY IF EXISTS "talent_avatars_read" ON storage.objects;
CREATE POLICY "talent_avatars_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'talent-avatars'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );

DROP POLICY IF EXISTS "org_logos_read" ON storage.objects;
CREATE POLICY "org_logos_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] = get_user_org_id()::text
  );
