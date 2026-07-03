-- ══════════════════════════════════════════════════════════════════
-- CastFlow — Canonical Database Schema
-- Çalıştırma sırası önemli:
--   1. Tablolar (dep'siz sırayla)
--   2. Helper fonksiyonlar (profiles var olduktan sonra)
--   3. RLS + policy'ler
--   4. Trigger'lar + index'ler
-- ══════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────
-- 1. updated_at trigger fonksiyonu (tablo bağımlılığı yok)
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─────────────────────────────────────────────────────────────────
-- 2. TABLOLAR — önce oluştur, policy'ler sonra gelecek
-- ─────────────────────────────────────────────────────────────────

CREATE TABLE public.organizations (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                TEXT        NOT NULL,
  logo_url            TEXT,
  subscription_plan   TEXT        NOT NULL DEFAULT 'trial'
                        CHECK (subscription_plan IN ('trial', 'pro')),
  subscription_status TEXT        NOT NULL DEFAULT 'active'
                        CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trial')),
  trial_ends_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.profiles (
  id              UUID  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID  REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name       TEXT  NOT NULL,
  role            TEXT  NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'member', 'viewer')),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.projects (
  id              UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           TEXT  NOT NULL,
  description     TEXT,
  type            TEXT  NOT NULL DEFAULT 'film'
                    CHECK (type IN ('film', 'dizi', 'reklam', 'tiyatro', 'diger')),
  status          TEXT  NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'completed', 'archived')),
  deadline        DATE,
  created_by      UUID  REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.project_roles (
  id              UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id      UUID  NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT  NOT NULL,
  description     TEXT,
  age_min         INT,
  age_max         INT,
  gender          TEXT,
  notes           TEXT,
  status          TEXT  NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'casting', 'filled', 'cancelled')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.talent (
  id              UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name       TEXT  NOT NULL,
  email           TEXT,
  phone           TEXT,
  birth_year      INT,
  gender          TEXT,
  height_cm       INT,
  notes           TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.auditions (
  id              UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role_id         UUID  NOT NULL REFERENCES public.project_roles(id) ON DELETE CASCADE,
  talent_id       UUID  REFERENCES public.talent(id) ON DELETE SET NULL,
  talent_name     TEXT,
  talent_email    TEXT,
  status          TEXT  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'reviewing', 'shortlisted', 'rejected', 'selected')),
  notes           TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.audition_videos (
  id               UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  audition_id      UUID  NOT NULL REFERENCES public.auditions(id) ON DELETE CASCADE,
  organization_id  UUID  NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  storage_path     TEXT  NOT NULL,
  public_url       TEXT,
  duration_seconds INT,
  notes            TEXT,
  uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────────
-- 3. HELPER FONKSİYONLAR — profiles tablosu artık var
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────────
-- 4. RLS + POLİCY'LER
-- ─────────────────────────────────────────────────────────────────

-- organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_select" ON public.organizations FOR SELECT
  USING (id = get_user_org_id());
CREATE POLICY "org_update" ON public.organizations FOR UPDATE
  USING (id = get_user_org_id() AND get_user_role() = 'admin');

-- profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "profiles_insert_admin" ON public.profiles FOR INSERT
  WITH CHECK (get_user_role() = 'admin');

-- projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select" ON public.projects FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- project_roles
ALTER TABLE public.project_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_select" ON public.project_roles FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "roles_insert" ON public.project_roles FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "roles_update" ON public.project_roles FOR UPDATE
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "roles_delete" ON public.project_roles FOR DELETE
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- talent
ALTER TABLE public.talent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "talent_select" ON public.talent FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "talent_insert" ON public.talent FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "talent_update" ON public.talent FOR UPDATE
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "talent_delete" ON public.talent FOR DELETE
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- auditions
ALTER TABLE public.auditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auditions_select" ON public.auditions FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "auditions_insert" ON public.auditions FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "auditions_update" ON public.auditions FOR UPDATE
  USING (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "auditions_delete" ON public.auditions FOR DELETE
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- audition_videos
ALTER TABLE public.audition_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "videos_select" ON public.audition_videos FOR SELECT
  USING (organization_id = get_user_org_id());
CREATE POLICY "videos_insert" ON public.audition_videos FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'));
CREATE POLICY "videos_delete" ON public.audition_videos FOR DELETE
  USING (organization_id = get_user_org_id() AND get_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────
-- 5. TRIGGER'LAR + INDEX'LER
-- ─────────────────────────────────────────────────────────────────
CREATE TRIGGER organizations_updated_at  BEFORE UPDATE ON public.organizations  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at       BEFORE UPDATE ON public.profiles        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER projects_updated_at       BEFORE UPDATE ON public.projects        FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER project_roles_updated_at  BEFORE UPDATE ON public.project_roles   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER talent_updated_at         BEFORE UPDATE ON public.talent           FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER auditions_updated_at      BEFORE UPDATE ON public.auditions        FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_projects_org       ON public.projects(organization_id, status);
CREATE INDEX idx_project_roles_org  ON public.project_roles(organization_id);
CREATE INDEX idx_project_roles_proj ON public.project_roles(project_id);
CREATE INDEX idx_talent_org         ON public.talent(organization_id);
CREATE INDEX idx_auditions_org      ON public.auditions(organization_id);
CREATE INDEX idx_auditions_role     ON public.auditions(role_id);
CREATE INDEX idx_auditions_status   ON public.auditions(organization_id, status);
CREATE INDEX idx_videos_audition    ON public.audition_videos(audition_id);
CREATE INDEX idx_videos_org         ON public.audition_videos(organization_id);
