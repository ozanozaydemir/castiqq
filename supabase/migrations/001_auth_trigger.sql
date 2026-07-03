-- ══════════════════════════════════════════════════════════════════
-- Migration 001 — Auth trigger: kullanıcı kayıt olunca
-- DB seviyesinde org + profile oluşturur (race condition yok)
-- Supabase SQL Editor'da çalıştır
-- ══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_org_id      UUID;
  v_org_name    TEXT;
  v_full_name   TEXT;
  v_org_id_meta TEXT;
BEGIN
  -- Davetli kullanıcıysa atla (callback profili oluşturur)
  v_org_id_meta := NEW.raw_user_meta_data->>'organization_id';
  IF v_org_id_meta IS NOT NULL AND v_org_id_meta != '' THEN
    RETURN NEW;
  END IF;

  v_org_name  := COALESCE(NULLIF(NEW.raw_user_meta_data->>'org_name', ''), 'Organizasyon');
  v_full_name := COALESCE(
    NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'Kullanıcı'
  );

  -- Org oluştur
  INSERT INTO public.organizations (name)
  VALUES (v_org_name)
  RETURNING id INTO v_org_id;

  -- Profile oluştur
  INSERT INTO public.profiles (id, organization_id, full_name, role)
  VALUES (NEW.id, v_org_id, v_full_name, 'admin')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();
