-- Rol ilişki haritası: karakterler arası tipli graf (couple, aile ağacı, org şeması)
--
-- Düğümler zaten project_roles satırları; bu migration yalnızca kenarları ve
-- diyagram pozisyonlarını ekliyor. Serbest çizim (JSONB blob) yerine yapılandırılmış
-- graf tercih edildi: veri sistem tarafından anlaşılabilir olunca yaş tutarlılığı
-- doğrulaması, otomatik yerleşim ve casting overlay mümkün oluyor.

-- ---------------------------------------------------------------------------
-- 1. Diyagram pozisyonları
-- ---------------------------------------------------------------------------
-- NULL = henüz yerleştirilmemiş; UI otomatik yerleşim uygular.
-- Ayrı tabloya gerek yok: bir rol kendi projesinin diyagramında bir kez görünür.
ALTER TABLE project_roles
  ADD COLUMN IF NOT EXISTS diagram_x double precision,
  ADD COLUMN IF NOT EXISTS diagram_y double precision;

-- ---------------------------------------------------------------------------
-- 2. İlişki tablosu
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role_relationships (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id      uuid NOT NULL REFERENCES projects(id)      ON DELETE CASCADE,
  from_role_id    uuid NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,
  to_role_id      uuid NOT NULL REFERENCES project_roles(id) ON DELETE CASCADE,

  -- Simetrik: spouse, partner, sibling, friend, rival
  -- Yönlü:    parent (from=ebeveyn), manager (from=yönetici), other (label yön taşır)
  type            text NOT NULL CHECK (type IN (
                    'spouse', 'partner', 'sibling', 'friend', 'rival',
                    'parent', 'manager', 'other'
                  )),
  label           text,          -- serbest metin: "eski sevgilisi", "üvey kızı"

  created_at      timestamptz NOT NULL DEFAULT now(),
  created_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  CONSTRAINT role_rel_no_self_loop CHECK (from_role_id <> to_role_id)
);

-- ---------------------------------------------------------------------------
-- 3. Simetrik ilişkilerde kanonik yön
-- ---------------------------------------------------------------------------
-- "Ahmet–Ayşe evli" tek satırdır. İki satır olarak yazmak veri bütünlüğü sorunu
-- yaratır: biri silinince diğeri hayalet kenar olarak kalır. Simetrik tiplerde
-- uçları sabit bir sıraya sokuyoruz, böylece aşağıdaki unique index ters yönlü
-- kopyayı da yakalıyor.
CREATE OR REPLACE FUNCTION canonicalize_role_relationship()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  tmp uuid;
BEGIN
  IF NEW.type IN ('spouse', 'partner', 'sibling', 'friend', 'rival')
     AND NEW.from_role_id > NEW.to_role_id THEN
    tmp              := NEW.from_role_id;
    NEW.from_role_id := NEW.to_role_id;
    NEW.to_role_id   := tmp;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION canonicalize_role_relationship() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_canonicalize_role_relationship ON role_relationships;
CREATE TRIGGER trg_canonicalize_role_relationship
  BEFORE INSERT OR UPDATE ON role_relationships
  FOR EACH ROW EXECUTE FUNCTION canonicalize_role_relationship();

-- Aynı çift arasında aynı tipten ikinci kenar olamaz.
-- Yönlü tiplerde A→B ve B→A meşru biçimde farklıdır, bu index onları engellemez.
CREATE UNIQUE INDEX IF NOT EXISTS role_relationships_unique_edge
  ON role_relationships (from_role_id, to_role_id, type);

CREATE INDEX IF NOT EXISTS role_relationships_project_idx ON role_relationships (project_id);
CREATE INDEX IF NOT EXISTS role_relationships_from_idx    ON role_relationships (from_role_id);
CREATE INDEX IF NOT EXISTS role_relationships_to_idx      ON role_relationships (to_role_id);

-- ---------------------------------------------------------------------------
-- 4. RLS
-- ---------------------------------------------------------------------------
ALTER TABLE role_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS role_rel_select ON role_relationships;
CREATE POLICY role_rel_select ON role_relationships
  FOR SELECT USING (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_rel_insert ON role_relationships;
CREATE POLICY role_rel_insert ON role_relationships
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_rel_update ON role_relationships;
CREATE POLICY role_rel_update ON role_relationships
  FOR UPDATE USING (organization_id = get_user_org_id())
           WITH CHECK (organization_id = get_user_org_id());

DROP POLICY IF EXISTS role_rel_delete ON role_relationships;
CREATE POLICY role_rel_delete ON role_relationships
  FOR DELETE USING (organization_id = get_user_org_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON role_relationships TO authenticated;
