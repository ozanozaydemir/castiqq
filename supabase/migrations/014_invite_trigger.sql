-- ──────────────────────────────────────────────────────────────────
-- 014_invite_trigger.sql
-- handle_new_auth_user trigger'ını takım daveti akışını destekleyecek
-- şekilde günceller. Supabase admin.inviteUserByEmail ile davet
-- gönderildiğinde user_metadata içinde organization_id varsa,
-- yeni bir org oluşturmak yerine mevcut org'a profile ekler.
-- ──────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger AS $$
DECLARE
  new_org_id     UUID;
  invited_org_id UUID;
BEGIN
  -- Davet edilmiş kullanıcı: metadata'da organization_id var
  invited_org_id := (new.raw_user_meta_data->>'organization_id')::uuid;

  IF invited_org_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, organization_id, full_name, role)
    VALUES (
      new.id,
      invited_org_id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      COALESCE(new.raw_user_meta_data->>'role', 'member')
    )
    ON CONFLICT (id) DO NOTHING;
  ELSE
    -- Normal kayıt: yeni org oluştur
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(new.raw_user_meta_data->>'org_name', 'Organizasyon'))
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, full_name, role)
    VALUES (
      new.id,
      new_org_id,
      COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
      'admin'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
