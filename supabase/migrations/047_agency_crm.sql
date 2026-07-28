-- ──────────────────────────────────────────────────────────────────
-- 047_agency_crm.sql — Menajerlik B2B CRM'i
--
-- clients tablosu şimdiye kadar sadece "isim + tek kontak" tutuyordu.
-- Menajerlik işinde müşteri (yapımevi/marka/ajans) ilişkisi bundan çok
-- daha katmanlı: kurumun kendisi, içindeki kişiler, açık teklifler ve
-- finansal risk profili ayrı ayrı takip edilmek zorunda. Bu migration
-- dört şeyi getiriyor:
--   1. clients → tam B2B account (segment, tier, vergi/vade/risk, marka
--      kategorisi kısıtları, sorumlu menajer)
--   2. client_contacts → kurumdaki kişiler rol bazlı (casting direktörü,
--      uygulayıcı yapımcı, marka müdürü…) — projeyi getiren ilişki
--   3. pitches + pitch_items → teklif/opsiyon aşaması. Booking zaten
--      kesinleşmiş işi tutuyor; kazanılmadan önceki süreç kayıpsızdı.
--   4. exclusivity artık serbest metin değil, marka kategorisi —
--      böylece "bu oyuncuya banka reklamı önerilemez" otomatik çıkar.
-- ──────────────────────────────────────────────────────────────────

-- ═══ 1. clients → B2B account ═══

-- Casting ajansı ve PR ajansı da müşteri olabiliyor (özellikle reklam
-- işlerinde brief casting ajansı üzerinden geliyor).
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_client_type_check;
ALTER TABLE public.clients
  ADD CONSTRAINT clients_client_type_check
  CHECK (client_type IN ('yapim_sirketi', 'reklam_ajansi', 'marka', 'casting_ajansi', 'pr_ajansi', 'diger'));

ALTER TABLE public.clients
  -- Temel kurumsal bilgi
  ADD COLUMN IF NOT EXISTS industry_segments TEXT[] NOT NULL DEFAULT '{}'
    CHECK (industry_segments <@ ARRAY['dizi','sinema','dijital_ott','reklam','moda','etkinlik','tiyatro','seslendirme']::TEXT[]),
  ADD COLUMN IF NOT EXISTS parent_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'tier_3'
    CHECK (tier IN ('tier_1', 'tier_2', 'tier_3')),
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,

  -- Finansal / fatura / risk
  ADD COLUMN IF NOT EXISTS tax_office TEXT,
  ADD COLUMN IF NOT EXISTS tax_number TEXT,
  ADD COLUMN IF NOT EXISTS payment_terms TEXT NOT NULL DEFAULT 'net_30'
    CHECK (payment_terms IN ('avans', 'net_15', 'net_30', 'net_60', 'net_90', 'yayin_sonrasi')),
  ADD COLUMN IF NOT EXISTS payment_rating TEXT NOT NULL DEFAULT 'belirsiz'
    CHECK (payment_rating IN ('belirsiz', 'guvenilir', 'gecikmeli', 'riskli')),
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS billing_email TEXT,

  -- İlişki / sektörel
  ADD COLUMN IF NOT EXISTS account_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exclusivity_categories TEXT[] NOT NULL DEFAULT '{}'
    CHECK (exclusivity_categories <@ ARRAY[
      'bankacilik','telekom','icecek','otomotiv','gida','kozmetik','perakende','moda',
      'elektronik','sigorta','havayolu','gayrimenkul','saglik','e_ticaret','enerji','sans_oyunlari'
    ]::TEXT[]),
  ADD COLUMN IF NOT EXISTS preferred_pitch_styles TEXT,
  ADD COLUMN IF NOT EXISTS budget_range TEXT
    CHECK (budget_range IS NULL OR budget_range IN ('dusuk', 'orta', 'premium')),
  ADD COLUMN IF NOT EXISTS working_status TEXT NOT NULL DEFAULT 'aktif'
    CHECK (working_status IN ('aktif', 'potansiyel', 'gecmis', 'kara_liste'));

CREATE INDEX IF NOT EXISTS clients_org_status_idx ON public.clients (organization_id, working_status);
CREATE INDEX IF NOT EXISTS clients_account_manager_idx ON public.clients (account_manager_id);
CREATE INDEX IF NOT EXISTS clients_parent_idx ON public.clients (parent_client_id);


-- ═══ 2. client_contacts — kurumdaki kişiler ═══
-- Yapımevinde işi getiren kurum değil, kişidir: casting direktörü
-- şirket değiştirince ilişki onunla birlikte taşınır.

CREATE TABLE IF NOT EXISTS public.client_contacts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id         UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  role              TEXT NOT NULL DEFAULT 'diger'
                      CHECK (role IN (
                        'uygulayici_yapimci', 'casting_direktoru', 'yonetmen', 'marka_muduru',
                        'ajans_produktoru', 'yapim_koordinatoru', 'finans', 'diger'
                      )),
  title             TEXT,
  email             TEXT,
  phone             TEXT,
  is_primary        BOOLEAN NOT NULL DEFAULT false,
  last_contacted_at DATE,
  -- "Hangi projeleri çekti, hangi tip oyuncu tercih ediyor" — ilişki hafızası
  notes             TEXT,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS client_contacts_client_id_idx ON public.client_contacts (client_id);

ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_contacts: org isolation"
  ON public.client_contacts
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.client_contacts TO authenticated;

-- Etkileşim artık kuruma değil, kurumdaki kişiye bağlanabiliyor
ALTER TABLE public.client_interactions
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES public.client_contacts(id) ON DELETE SET NULL;

-- Mevcut serbest metin contact_name'leri gerçek kontak kaydına taşı
INSERT INTO public.client_contacts (organization_id, client_id, full_name, email, phone, is_primary)
SELECT organization_id, id, contact_name, email, phone, true
FROM public.clients
WHERE contact_name IS NOT NULL AND btrim(contact_name) <> '';


-- ═══ 3. pitches + pitch_items — teklif/opsiyon pipeline'ı ═══
-- bookings kesinleşmiş işi tutuyor. Bir işin kesinleşmesinden önceki
-- süreç (brief geldi → oyuncu önerildi → opsiyon verildi → sözleşme)
-- şimdiye kadar hiçbir yerde durmuyordu.

CREATE TABLE IF NOT EXISTS public.pitches (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id     UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id           UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  project_type        TEXT NOT NULL DEFAULT 'diger'
                        CHECK (project_type IN ('dizi', 'reklam', 'film', 'dijital', 'tiyatro', 'sunuculuk', 'seslendirme', 'etkinlik', 'diger')),
  stage               TEXT NOT NULL DEFAULT 'brief'
                        CHECK (stage IN ('brief', 'oyuncu_onerildi', 'opsiyon', 'sozlesme', 'kazanildi', 'kaybedildi')),
  -- Reklam işlerinde marka kategorisi: exclusivity çakışma motorunun girdisi
  brand_category      TEXT
                        CHECK (brand_category IS NULL OR brand_category IN (
                          'bankacilik','telekom','icecek','otomotiv','gida','kozmetik','perakende','moda',
                          'elektronik','sigorta','havayolu','gayrimenkul','saglik','e_ticaret','enerji','sans_oyunlari'
                        )),
  expected_start_date DATE,
  decision_due_date   DATE,
  estimated_value     NUMERIC(12,2),
  currency            TEXT NOT NULL DEFAULT 'TRY',
  owner_id            UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  lost_reason         TEXT,
  notes               TEXT,
  created_by          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS pitches_org_stage_idx ON public.pitches (organization_id, stage);
CREATE INDEX IF NOT EXISTS pitches_client_id_idx ON public.pitches (client_id);

ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pitches: org isolation"
  ON public.pitches
  USING (organization_id = get_user_org_id())
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.pitches TO authenticated;


-- Teklif kalemi: hangi oyuncu → hangi rol → hangi kaşe.
-- Kaşe pazarlık geçmişinin asıl kaynağı bu tablo: iş kazanılmasa bile
-- "bu yapımcı bu oyuncuya ne teklif etti" kaydı kalıyor.
CREATE TABLE IF NOT EXISTS public.pitch_items (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  pitch_id          UUID NOT NULL REFERENCES public.pitches(id) ON DELETE CASCADE,
  talent_id         UUID NOT NULL REFERENCES public.talent(id) ON DELETE CASCADE,
  role_name         TEXT,
  status            TEXT NOT NULL DEFAULT 'onerildi'
                      CHECK (status IN ('onerildi', 'on_elemede', 'geri_cagrildi', 'secildi', 'elendi', 'geri_cekildi')),
  -- Ajansın istediği kaşe
  proposed_fee      NUMERIC(12,2),
  -- Müşterinin karşı teklifi / anlaşılan tutar
  client_offer      NUMERIC(12,2),
  fee_type          TEXT
                      CHECK (fee_type IS NULL OR fee_type IN ('daily', 'weekly', 'per_episode', 'monthly', 'per_project', 'hourly')),
  currency          TEXT NOT NULL DEFAULT 'TRY',
  client_feedback   TEXT,
  -- Kazanılınca oluşan booking'e bağlanır: teklif → iş izlenebilirliği
  booking_id        UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_by        UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (pitch_id, talent_id)
);

CREATE INDEX IF NOT EXISTS pitch_items_pitch_id_idx ON public.pitch_items (pitch_id);
CREATE INDEX IF NOT EXISTS pitch_items_talent_id_idx ON public.pitch_items (talent_id);

ALTER TABLE public.pitch_items ENABLE ROW LEVEL SECURITY;

-- Oyuncu görünürlük kuralı (043) burada da geçerli: member sadece
-- kendine atanan + atanmamış oyuncuların tekliflerini görür.
CREATE POLICY "pitch_items: org isolation"
  ON public.pitch_items
  USING (
    organization_id = get_user_org_id()
    AND EXISTS (
      SELECT 1 FROM public.talent t
      WHERE t.id = pitch_items.talent_id
        AND (get_user_role() = 'admin' OR t.assigned_to IS NULL OR t.assigned_to = auth.uid())
    )
  )
  WITH CHECK (organization_id = get_user_org_id());

GRANT ALL ON public.pitch_items TO authenticated;


-- ═══ 4. Exclusivity artık kategori bazlı ═══
-- exclusivity_notes serbest metindi; "hangi kategoride yasak var"
-- sorusuna makine cevap veremiyordu. Kategori kolonu bunu çözüyor.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS exclusivity_category TEXT
    CHECK (exclusivity_category IS NULL OR exclusivity_category IN (
      'bankacilik','telekom','icecek','otomotiv','gida','kozmetik','perakende','moda',
      'elektronik','sigorta','havayolu','gayrimenkul','saglik','e_ticaret','enerji','sans_oyunlari'
    ));

-- Booking'i doğuran teklif kalemi (varsa) — kaşe geçmişi zinciri
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pitch_item_id UUID REFERENCES public.pitch_items(id) ON DELETE SET NULL;


-- ═══ 5. updated_at trigger'ları ═══
CREATE TRIGGER client_contacts_updated_at BEFORE UPDATE ON public.client_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pitches_updated_at BEFORE UPDATE ON public.pitches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER pitch_items_updated_at BEFORE UPDATE ON public.pitch_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
