-- Google Sheets/Drive bağlantısı — org başına tek bağlantı, OAuth access/refresh token'ları tutar.
-- Bu, Supabase Auth'un kendi Google sign-in OAuth'undan tamamen bağımsız bir akış;
-- burada saklanan token'lar Google Sheets/Drive API çağrıları için kullanılıyor.
CREATE TABLE public.google_connections (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  connected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  google_email TEXT
);

ALTER TABLE public.google_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY google_connections_select ON public.google_connections
  FOR SELECT USING (organization_id = get_user_org_id());

CREATE POLICY google_connections_delete ON public.google_connections
  FOR DELETE USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- Insert/update yalnızca admin client (service role) üzerinden yapılıyor
-- (OAuth callback route'u), bu yüzden authenticated kullanıcılar için
-- insert/update policy'si yok — RLS varsayılan olarak reddeder.

GRANT SELECT ON public.google_connections TO authenticated;
GRANT DELETE ON public.google_connections TO authenticated;

-- service_role RLS'i bypass eder ama tablo seviyesi GRANT'lardan muaf değildir —
-- bu olmadan OAuth callback'in admin client'ı "permission denied" alır.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_connections TO service_role;
