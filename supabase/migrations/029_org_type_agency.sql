-- İki taraflı yapı: production (yapım şirketi/cast direktörü) ve agency
-- (menajerlik şirketi) — ayrı plan, ayrı navigasyon, ayrı iş akışı.
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS org_type TEXT NOT NULL DEFAULT 'production'
  CHECK (org_type IN ('production', 'agency'));

-- Kayıt trigger'ı: user_metadata.org_type'ı okuyup yeni org'a yazsın.
-- Davetli kullanıcı akışı (invited_org_id) değişmedi — davet edilen kişi
-- zaten var olan org'a katılıyor, org_type orada anlamsız.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  new_org_id     UUID;
  invited_org_id UUID;
BEGIN
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
    INSERT INTO public.organizations (name, org_type)
    VALUES (
      COALESCE(new.raw_user_meta_data->>'org_name', 'Organizasyon'),
      COALESCE(new.raw_user_meta_data->>'org_type', 'production')
    )
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
