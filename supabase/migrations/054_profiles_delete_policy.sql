-- ═══════════════════════════════════════════════════
-- Migration 054: profiles tablosuna DELETE politikası
--
-- Sorun: profiles'ta RLS açıktı ama yalnızca SELECT/UPDATE/INSERT
-- politikaları vardı. RLS açık + DELETE politikası yok = tüm silmeler
-- sessizce engellenir; PostgREST hata dönmez, sadece 0 satır etkilenir.
--
-- Sonucu:
--   - "Daveti iptal et": auth kullanıcısı admin client ile siliniyordu
--     ama profil satırı kalıyordu → bekleyen davet ekranda kalmaya
--     devam ediyordu (sayfa yenilenmiyor sanılıyordu).
--   - "Ekipten çıkar": hiçbir şey yapmıyordu.
--
-- Uygulama katmanı zaten admin rolü kontrolü yapıyor; bu politika aynı
-- kuralı DB seviyesinde de zorunlu kılar.
-- ═══════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles_delete_admin" ON public.profiles;

CREATE POLICY "profiles_delete_admin" ON public.profiles FOR DELETE
  USING (
    organization_id = get_user_org_id()
    AND get_user_role() = 'admin'
  );
