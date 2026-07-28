-- ──────────────────────────────────────────────────────────────────
-- 048_agency_role_shares.sql — İki org arası rol paylaşımı
--
-- Cast direktörü (production) bir rolü + senaryo parçasını belirli bir
-- menajerlik org'una paylaşır; menajerlik kendi roster'ından uygun
-- gördüğü oyuncuları geri önerir. İki org birbirinin tenant tablosuna
-- hiçbir zaman doğrudan erişmez — paylaşılan satırlar rol/oyuncu
-- bilgisinin *snapshot*'ını taşır (canlı FK join değil).
-- ──────────────────────────────────────────────────────────────────

-- ── Org kimliği: slug + dış paylaşım tercihi ──
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE
    CHECK (public_slug IS NULL OR public_slug ~ '^[a-z0-9-]{3,40}$'),
  ADD COLUMN IF NOT EXISTS accepts_external_shares BOOLEAN NOT NULL DEFAULT true;

-- ── Daha önce paylaşım yapılmış org'lar — hızlı seçim için adres defteri ──
CREATE TABLE IF NOT EXISTS public.org_partners (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id          UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  partner_organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_connected_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (organization_id, partner_organization_id)
);

ALTER TABLE public.org_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_partners: kendi taraf"
  ON public.org_partners FOR SELECT
  USING (organization_id = get_user_org_id() OR partner_organization_id = get_user_org_id());

GRANT SELECT ON public.org_partners TO authenticated;
-- INSERT yalnızca admin client (server action) üzerinden — kullanıcı doğrudan yazmaz.

-- ── Rol paylaşımı (production → agency) ──
CREATE TABLE IF NOT EXISTS public.role_shares (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id         UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_role_id         UUID NOT NULL REFERENCES public.project_roles(id) ON DELETE CASCADE,
  target_organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  -- Rol snapshot'ı — agency project_roles'a JOIN edemediği için kopya tutulur
  role_title              TEXT NOT NULL,
  role_description        TEXT,
  project_title           TEXT,
  gender                  TEXT,
  age_min                 INT,
  age_max                 INT,
  height_min              INT,
  height_max              INT,
  required_skills         TEXT[] NOT NULL DEFAULT '{}',
  city                    TEXT,
  submission_deadline     DATE,

  script_asset_path       TEXT,
  share_token             TEXT NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  message                 TEXT,
  status                  TEXT NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'revoked', 'role_closed', 'expired')),
  expires_at              TIMESTAMPTZ,

  created_by              UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (share_token)
);

CREATE UNIQUE INDEX IF NOT EXISTS role_shares_active_unique
  ON public.role_shares (project_role_id, target_organization_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS role_shares_target_org_idx ON public.role_shares (target_organization_id);
CREATE INDEX IF NOT EXISTS role_shares_project_role_idx ON public.role_shares (project_role_id);

ALTER TABLE public.role_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_shares: sahip veya hedef org görebilir"
  ON public.role_shares FOR SELECT
  USING (organization_id = get_user_org_id() OR target_organization_id = get_user_org_id());

CREATE POLICY "role_shares: yalnızca sahip org oluşturur"
  ON public.role_shares FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "role_shares: yalnızca sahip org düzenler"
  ON public.role_shares FOR UPDATE
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "role_shares: yalnızca sahip org siler"
  ON public.role_shares FOR DELETE
  USING (organization_id = get_user_org_id());

GRANT ALL ON public.role_shares TO authenticated;

CREATE TRIGGER role_shares_updated_at BEFORE UPDATE ON public.role_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Rol dolduruldu/iptal edildiğinde bağlı aktif paylaşımlar otomatik kapanır
CREATE OR REPLACE FUNCTION close_role_shares_on_role_closed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('filled', 'cancelled') AND OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE public.role_shares
    SET status = 'role_closed'
    WHERE project_role_id = NEW.id AND status = 'active';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS project_roles_close_shares ON public.project_roles;
CREATE TRIGGER project_roles_close_shares AFTER UPDATE ON public.project_roles
  FOR EACH ROW EXECUTE FUNCTION close_role_shares_on_role_closed();

-- ── Menajerliğin gönderdiği öneri turu ──
CREATE TABLE IF NOT EXISTS public.role_share_submissions (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_share_id           UUID NOT NULL REFERENCES public.role_shares(id) ON DELETE CASCADE,
  agency_organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submitted_by            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status                  TEXT NOT NULL DEFAULT 'taslak'
                            CHECK (status IN ('taslak', 'gonderildi', 'incelendi', 'kismen_kabul', 'kabul', 'red')),
  pdf_url                 TEXT,
  reviewed_by             UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS role_share_submissions_share_idx ON public.role_share_submissions (role_share_id);
CREATE INDEX IF NOT EXISTS role_share_submissions_agency_idx ON public.role_share_submissions (agency_organization_id);

ALTER TABLE public.role_share_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_share_submissions: agency veya paylaşım sahibi görebilir"
  ON public.role_share_submissions FOR SELECT
  USING (
    agency_organization_id = get_user_org_id()
    OR EXISTS (
      SELECT 1 FROM public.role_shares rs
      WHERE rs.id = role_share_submissions.role_share_id AND rs.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "role_share_submissions: yalnızca hedeflenen agency oluşturur"
  ON public.role_share_submissions FOR INSERT
  WITH CHECK (
    agency_organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.role_shares rs
      WHERE rs.id = role_share_submissions.role_share_id
        AND rs.target_organization_id = get_user_org_id()
        AND rs.status = 'active'
    )
  );

CREATE POLICY "role_share_submissions: agency veya paylaşım sahibi günceller"
  ON public.role_share_submissions FOR UPDATE
  USING (
    agency_organization_id = get_user_org_id()
    OR EXISTS (
      SELECT 1 FROM public.role_shares rs
      WHERE rs.id = role_share_submissions.role_share_id AND rs.organization_id = get_user_org_id()
    )
  );

CREATE POLICY "role_share_submissions: yalnızca agency siler"
  ON public.role_share_submissions FOR DELETE
  USING (agency_organization_id = get_user_org_id());

GRANT ALL ON public.role_share_submissions TO authenticated;

CREATE TRIGGER role_share_submissions_updated_at BEFORE UPDATE ON public.role_share_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Önerilen oyuncu satırları — snapshot, agency'nin talent tablosuna FK değil ──
CREATE TABLE IF NOT EXISTS public.role_share_submission_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id     UUID NOT NULL REFERENCES public.role_share_submissions(id) ON DELETE CASCADE,
  source_talent_id  UUID, -- yalnızca agency'nin kendi talent tablosuna işaret eder; production bunu okuyamaz (RLS talent tablosunda durur)
  full_name         TEXT NOT NULL,
  photo_url         TEXT,
  age               INT,
  height_cm         INT,
  city              TEXT,
  reel_url          TEXT,
  proposed_fee      NUMERIC,
  currency          TEXT DEFAULT 'TRY',
  agency_notes      TEXT,
  cd_decision       TEXT NOT NULL DEFAULT 'beklemede'
                      CHECK (cd_decision IN ('beklemede', 'begenildi', 'reddedildi')),
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (submission_id, source_talent_id)
);

CREATE INDEX IF NOT EXISTS role_share_submission_items_submission_idx ON public.role_share_submission_items (submission_id);

ALTER TABLE public.role_share_submission_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "role_share_submission_items: her iki taraf görebilir"
  ON public.role_share_submission_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.role_share_submissions s
      JOIN public.role_shares rs ON rs.id = s.role_share_id
      WHERE s.id = role_share_submission_items.submission_id
        AND (s.agency_organization_id = get_user_org_id() OR rs.organization_id = get_user_org_id())
    )
  );

CREATE POLICY "role_share_submission_items: yalnızca agency ekler"
  ON public.role_share_submission_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.role_share_submissions s
      WHERE s.id = role_share_submission_items.submission_id
        AND s.agency_organization_id = get_user_org_id()
        AND s.status = 'taslak'
    )
  );

CREATE POLICY "role_share_submission_items: her iki taraf günceller"
  ON public.role_share_submission_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.role_share_submissions s
      JOIN public.role_shares rs ON rs.id = s.role_share_id
      WHERE s.id = role_share_submission_items.submission_id
        AND (s.agency_organization_id = get_user_org_id() OR rs.organization_id = get_user_org_id())
    )
  );

CREATE POLICY "role_share_submission_items: yalnızca agency siler"
  ON public.role_share_submission_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.role_share_submissions s
      WHERE s.id = role_share_submission_items.submission_id
        AND s.agency_organization_id = get_user_org_id()
        AND s.status = 'taslak'
    )
  );

GRANT ALL ON public.role_share_submission_items TO authenticated;

-- ── Bildirimler (in-app zil + email tetikleyici referansı) ──
CREATE TABLE IF NOT EXISTS public.notifications (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  type              TEXT NOT NULL
                      CHECK (type IN ('role_shared', 'submission_received', 'submission_decided', 'share_revoked', 'share_expiring')),
  title             TEXT NOT NULL,
  body              TEXT,
  link_url          TEXT,
  related_id        UUID,
  read_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS notifications_org_unread_idx ON public.notifications (organization_id, read_at);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications: org izolasyonu"
  ON public.notifications
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.notifications TO authenticated;
-- Cross-org bildirim yazımı (örn. production paylaşınca agency'ye bildirim) yalnızca
-- admin client (service role) üzerinden yapılır — RLS burada normal kullanıcı için
-- kendi org'una yazım/okumayla sınırlı kalır.
