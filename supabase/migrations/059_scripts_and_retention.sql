-- 059 — Çoklu senaryo + video saklama süresi + silme kuyruğu
--
-- Üç bağlantılı değişiklik:
--   1. Rol başına tek senaryo (project_roles.script_url) → senaryo havuzu + davet
--      başına seçim. Cast direktörü farklı adaylara farklı sahne gönderebilsin.
--   2. Videolara saklama süresi. Tarihi YALNIZCA direktör belirler; oyuncu
--      tarihe müdahale etmez ama istediği an kendi videosunu silebilir
--      (auditions.talent_deleted_video_at ile izleniyor).
--   3. R2 silme kuyruğu — DB ile nesne deposu arasındaki sıralama tuzağı için.

-- ---------------------------------------------------------------------------
-- 1. Senaryo havuzu
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_scripts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id         uuid NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  storage_path    text NOT NULL,              -- 'scripts' bucket'ındaki yol
  original_name   text NOT NULL,
  label           text,                       -- "Sahne 12 — Kavga"
  sort_order      integer NOT NULL DEFAULT 0,
  file_size_bytes bigint,
  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS role_scripts_role_idx ON role_scripts (role_id, sort_order);

-- ---------------------------------------------------------------------------
-- 2. Davet başına senaryo seçimi
-- ---------------------------------------------------------------------------
-- Havuz rolde, seçim burada. Yetkilendirme sınırı da bu tablo: /api/script
-- rotası senaryonun role ait olmasına değil, O DAVETE gönderilmiş olmasına
-- bakar — aksi halde token sahibi kendisine yollanmayan sahneleri de çekerdi.
CREATE TABLE IF NOT EXISTS audition_scripts (
  audition_id uuid NOT NULL REFERENCES auditions(id)    ON DELETE CASCADE,
  script_id   uuid NOT NULL REFERENCES role_scripts(id) ON DELETE CASCADE,
  PRIMARY KEY (audition_id, script_id)
);

CREATE INDEX IF NOT EXISTS audition_scripts_audition_idx ON audition_scripts (audition_id);

-- ---------------------------------------------------------------------------
-- 3. Saklama süresi
-- ---------------------------------------------------------------------------
-- Org varsayılanı davet oluşturulurken MUTLAK tarihe çevrilip auditions'a
-- yazılır (snapshot). Böylece org varsayılanı sonradan kısalırsa mevcut
-- davetlerin videoları beklenmedik şekilde silinmez.
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS default_retention_days integer DEFAULT 180
    CHECK (default_retention_days IS NULL OR default_retention_days BETWEEN 1 AND 3650);

ALTER TABLE auditions
  ADD COLUMN IF NOT EXISTS retention_until timestamptz,
  ADD COLUMN IF NOT EXISTS talent_deleted_video_at timestamptz;

COMMENT ON COLUMN auditions.retention_until IS
  'Videolarin otomatik silinecegi tarih. NULL = otomatik silme yok. Yalnizca direktor belirler.';
COMMENT ON COLUMN auditions.talent_deleted_video_at IS
  'Oyuncu KVKK/GDPR silme hakkini kullandiysa zaman damgasi. Videolar gitse de bu iz kalir.';

-- Mevcut audition'lar bilerek NULL bırakılıyor: yürürlükteki verilere geriye
-- dönük silme tarihi atamak, müşterinin onayı olmadan veri imha etmek olurdu.
CREATE INDEX IF NOT EXISTS auditions_retention_idx
  ON auditions (retention_until) WHERE retention_until IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4. R2 silme kuyruğu
-- ---------------------------------------------------------------------------
-- Sıralama tuzağı: önce R2 silinip DB patlarsa sayaç yalan söyler; önce DB
-- silinip R2 patlarsa yolu kaybederiz ve dosya sonsuza kadar para yakar.
-- Çözüm: yolu önce kuyruğa yaz, DB satırını sil (sayaç trigger'ı düşürür),
-- sonra R2'yi temizle. Başarısızlar kuyrukta kalıp yeniden denenir.
CREATE TABLE IF NOT EXISTS video_purge_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  storage_path    text NOT NULL UNIQUE,
  reason          text NOT NULL CHECK (reason IN ('retention', 'talent_request', 'cascade', 'manual')),
  attempts        integer NOT NULL DEFAULT 0,
  last_error      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz
);

CREATE INDEX IF NOT EXISTS video_purge_queue_pending_idx ON video_purge_queue (attempts, created_at);

-- ---------------------------------------------------------------------------
-- 5. Mevcut senaryoları havuza taşı
-- ---------------------------------------------------------------------------
INSERT INTO role_scripts (organization_id, role_id, storage_path, original_name, sort_order)
SELECT r.organization_id, r.id, r.script_url,
       -- Yol '<org>/<timestamp>-<dosyaadi>' biçiminde; görünen adı geri çıkar.
       regexp_replace(split_part(r.script_url, '/', -1), '^[0-9]+-', ''),
       0
FROM project_roles r
WHERE r.script_url IS NOT NULL AND r.script_url <> ''
ON CONFLICT DO NOTHING;

-- Taşınan senaryoları mevcut davetlere de bağla ki eski linkler çalışmaya devam etsin.
INSERT INTO audition_scripts (audition_id, script_id)
SELECT a.id, s.id
FROM auditions a
JOIN role_scripts s ON s.role_id = a.role_id
ON CONFLICT DO NOTHING;

-- Kolonu düşürüyoruz: bırakırsak onu hâlâ okuyan bir kod yolu sessizce yanlış
-- davranırdı. Düşürünce tipten de kalkıyor ve tsc her okuyucuyu gösteriyor.
ALTER TABLE project_roles DROP COLUMN IF EXISTS script_url;

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE role_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_scripts_select ON role_scripts;
CREATE POLICY role_scripts_select ON role_scripts
  FOR SELECT USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_scripts_insert ON role_scripts;
CREATE POLICY role_scripts_insert ON role_scripts
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_scripts_update ON role_scripts;
CREATE POLICY role_scripts_update ON role_scripts
  FOR UPDATE USING (organization_id = get_user_org_id())
           WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_scripts_delete ON role_scripts;
CREATE POLICY role_scripts_delete ON role_scripts
  FOR DELETE USING (organization_id = get_user_org_id());

ALTER TABLE audition_scripts ENABLE ROW LEVEL SECURITY;

-- audition_scripts'in kendi organization_id'si yok; erişim audition üzerinden.
DROP POLICY IF EXISTS audition_scripts_select ON audition_scripts;
CREATE POLICY audition_scripts_select ON audition_scripts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM auditions a
    WHERE a.id = audition_scripts.audition_id AND a.organization_id = get_user_org_id()
  ));

DROP POLICY IF EXISTS audition_scripts_insert ON audition_scripts;
CREATE POLICY audition_scripts_insert ON audition_scripts
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM auditions a
    WHERE a.id = audition_scripts.audition_id AND a.organization_id = get_user_org_id()
  ));

DROP POLICY IF EXISTS audition_scripts_delete ON audition_scripts;
CREATE POLICY audition_scripts_delete ON audition_scripts
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM auditions a
    WHERE a.id = audition_scripts.audition_id AND a.organization_id = get_user_org_id()
  ));

-- Kuyruk yalnızca service_role'un işi; RLS açık ve politika yok = kilitli.
ALTER TABLE video_purge_queue ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON video_purge_queue FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON role_scripts     TO authenticated;
GRANT SELECT, INSERT, DELETE         ON audition_scripts TO authenticated;
