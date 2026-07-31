-- ═══════════════════════════════════════════════════
-- Migration 057: Fonksiyon sertleştirmesi (search_path + EXECUTE)
--
-- ── 1. search_path sabitleme ──────────────────────────────────────
-- search_path'i SET edilmemiş fonksiyonlarda, çağıran kendi şemasını
-- öne alarak gövdedeki nesne referanslarını kaçırabilir. SECURITY
-- DEFINER fonksiyonlarda bu ayrıcalık yükseltmesine dönüşür.
-- Gövdeler zaten tam nitelikli (public.profiles vb.) ama search_path'i
-- sabitlemek katmanlı savunma.
--
-- ── 2. Trigger fonksiyonlarından EXECUTE alınması ─────────────────
-- Postgres fonksiyonlara varsayılan olarak PUBLIC'e EXECUTE verir; bu
-- yüzden trigger fonksiyonları /rest/v1/rpc/... üzerinden API yüzeyinde
-- görünüyordu. Trigger'lar ateşlenirken çağıranın EXECUTE yetkisine
-- BAKILMAZ, dolayısıyla revoke etmek trigger'ları bozmaz — transaction
-- içinde test edilip doğrulandı (update_updated_at tetiklendi,
-- handle_new_auth_user signup'ta profili oluşturmaya devam etti).
--
-- ── Kasten DOKUNULMAYANLAR ────────────────────────────────────────
-- get_user_org_id() / get_user_role(): advisor bunları da işaretliyor
-- ama YANLIŞ POZİTİF. Her RLS politikası bunları çağırıyor ve politika
-- ifadeleri sorguyu çalıştıran rolün yetkileriyle değerlendiriliyor.
-- PUBLIC'ten EXECUTE alınınca tüm RLS "permission denied for function
-- get_user_org_id" ile çöküyor (test edildi). Argüman almıyorlar ve
-- yalnızca auth.uid()'den kullanıcının KENDİ org/rolünü döndürüyorlar,
-- yani RPC'den çağrılmaları bilgi sızdırmaz. Sadece search_path'leri
-- sabitlendi.
--
-- rls_auto_enable(): search_path'i zaten sabit (pg_catalog) ve dönüş
-- tipi event_trigger — RPC ile çağrılamaz. Ayrıca platform tarafından
-- yönetiliyor olabilir, o yüzden dokunulmadı.
-- ═══════════════════════════════════════════════════

ALTER FUNCTION public.update_updated_at()                 SET search_path = public;
ALTER FUNCTION public.handle_new_auth_user()              SET search_path = public;
ALTER FUNCTION public.close_role_shares_on_role_closed()  SET search_path = public;
ALTER FUNCTION public.get_user_org_id()                   SET search_path = public;
ALTER FUNCTION public.get_user_role()                     SET search_path = public;

REVOKE ALL ON FUNCTION public.update_updated_at()                FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_auth_user()             FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.close_role_shares_on_role_closed() FROM PUBLIC, anon, authenticated;
