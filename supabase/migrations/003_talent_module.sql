-- M2: Talent Module — expanded talent profile

-- 1. Expand talent table
ALTER TABLE public.talent
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS manager_name TEXT,
  ADD COLUMN IF NOT EXISTS agency_name TEXT,
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available'
    CHECK (availability IN ('available', 'busy', 'unavailable')),
  ADD COLUMN IF NOT EXISTS work_permit TEXT[],
  ADD COLUMN IF NOT EXISTS playable_age_min INTEGER,
  ADD COLUMN IF NOT EXISTS playable_age_max INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS hair_color TEXT,
  ADD COLUMN IF NOT EXISTS hair_length TEXT,
  ADD COLUMN IF NOT EXISTS eye_color TEXT,
  ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS licenses TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS showreel_url TEXT,
  ADD COLUMN IF NOT EXISTS selftape_drama_url TEXT,
  ADD COLUMN IF NOT EXISTS selftape_comedy_url TEXT,
  ADD COLUMN IF NOT EXISTS selftape_ad_url TEXT,
  ADD COLUMN IF NOT EXISTS voice_sample_url TEXT;

-- 2. Languages table
CREATE TABLE IF NOT EXISTS public.talent_languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1')),
  accents TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Experience table (max 10 per talent)
CREATE TABLE IF NOT EXISTS public.talent_experiences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  year INTEGER,
  role_name TEXT,
  role_type TEXT CHECK (role_type IN ('lead', 'supporting', 'guest', 'cameo', 'ad', 'extra', 'voiceover')),
  production_type TEXT CHECK (production_type IN ('film', 'dizi', 'reklam', 'tiyatro', 'diger')),
  director TEXT,
  production_company TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Education table
CREATE TABLE IF NOT EXISTS public.talent_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  talent_id UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  school TEXT NOT NULL,
  program TEXT,
  year INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS
ALTER TABLE public.talent_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_education ENABLE ROW LEVEL SECURITY;

-- talent_languages policies
CREATE POLICY "lang_select" ON public.talent_languages FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "lang_insert" ON public.talent_languages FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "lang_update" ON public.talent_languages FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "lang_delete" ON public.talent_languages FOR DELETE USING (organization_id = get_user_org_id());

-- talent_experiences policies
CREATE POLICY "exp_select" ON public.talent_experiences FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "exp_insert" ON public.talent_experiences FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "exp_update" ON public.talent_experiences FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "exp_delete" ON public.talent_experiences FOR DELETE USING (organization_id = get_user_org_id());

-- talent_education policies
CREATE POLICY "edu_select" ON public.talent_education FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "edu_insert" ON public.talent_education FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "edu_update" ON public.talent_education FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "edu_delete" ON public.talent_education FOR DELETE USING (organization_id = get_user_org_id());

-- 6. Indexes for common filter queries
CREATE INDEX IF NOT EXISTS idx_talent_gender ON public.talent(organization_id, gender);
CREATE INDEX IF NOT EXISTS idx_talent_city ON public.talent(organization_id, city);
CREATE INDEX IF NOT EXISTS idx_talent_availability ON public.talent(organization_id, availability);
CREATE INDEX IF NOT EXISTS idx_talent_languages_talent ON public.talent_languages(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_experiences_talent ON public.talent_experiences(talent_id);
CREATE INDEX IF NOT EXISTS idx_talent_education_talent ON public.talent_education(talent_id);
