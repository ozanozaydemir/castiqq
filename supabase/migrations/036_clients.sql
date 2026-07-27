-- ──────────────────────────────────────────────────────────────────
-- 036_clients.sql — Müşteri (yapım şirketi/reklam ajansı/marka) CRM
-- ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.clients (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  client_type       TEXT NOT NULL DEFAULT 'diger'
                      CHECK (client_type IN ('yapim_sirketi', 'reklam_ajansi', 'marka', 'diger')),
  contact_name      TEXT,
  phone             TEXT,
  email             TEXT,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (organization_id, name)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients: org isolation"
  ON public.clients
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.clients TO authenticated;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS bookings_client_id_idx ON public.bookings (client_id);

-- Mevcut bookinglerdeki serbest metin müşteri adlarını clients tablosuna taşı
INSERT INTO public.clients (organization_id, name)
SELECT DISTINCT organization_id, client_name FROM public.bookings
ON CONFLICT (organization_id, name) DO NOTHING;

UPDATE public.bookings b
SET client_id = c.id
FROM public.clients c
WHERE b.organization_id = c.organization_id AND b.client_name = c.name AND b.client_id IS NULL;
