-- ──────────────────────────────────────────────────────────────────
-- 046_client_interactions.sql — Müşteri (yapım şirketi/reklam ajansı)
-- etkileşim geçmişi — sektöre özel görüşme türleri
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.client_interactions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  talent_id         UUID REFERENCES public.talent(id) ON DELETE SET NULL,
  interaction_type  TEXT NOT NULL DEFAULT 'diger'
                      CHECK (interaction_type IN (
                        'tanisma', 'telefon_gorusmesi', 'toplanti', 'oyuncu_onerisi',
                        'audition_talebi', 'okuma_provasi', 'kostum_provasi',
                        'deneme_cekimi', 'sozlesme_gorusmesi', 'diger'
                      )),
  interaction_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS client_interactions_client_id_idx ON public.client_interactions (client_id);
CREATE INDEX IF NOT EXISTS client_interactions_talent_id_idx ON public.client_interactions (talent_id);

ALTER TABLE public.client_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_interactions: org isolation"
  ON public.client_interactions
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.client_interactions TO authenticated;
