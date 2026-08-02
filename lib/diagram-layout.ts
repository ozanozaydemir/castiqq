import dagre from 'dagre'
import type { RelationshipType } from '@/types/database'

export const NODE_W = 208
export const NODE_H = 96

export type LayoutRole = { id: string }
export type LayoutRel  = { from_role_id: string; to_role_id: string; type: RelationshipType }
export type Positions  = Record<string, { x: number; y: number }>

export type LayoutMode = 'family' | 'org' | 'grid'

/** Simetrik kenarlar DB'de kanonik sırayla saklanıyor; arama yaparken de sıralıyoruz. */
function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`
}

function pushInto<T>(map: Map<string, T[]>, key: string, value: T) {
  const list = map.get(key)
  if (list) list.push(value)
  else map.set(key, [value])
}

function newGraph(ranksep: number) {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: 'TB', nodesep: 44, ranksep, marginx: 48, marginy: 48 })
  g.setDefaultEdgeLabel(() => ({}))
  return g
}

/** dagre düğüm merkezini verir; React Flow sol-üst köşe bekliyor. */
function extract(g: dagre.graphlib.Graph, roles: LayoutRole[]): Positions {
  const out: Positions = {}
  for (const role of roles) {
    const node = g.node(role.id) as { x: number; y: number } | undefined
    if (!node) continue
    out[role.id] = { x: node.x - NODE_W / 2, y: node.y - NODE_H / 2 }
  }
  return out
}

/**
 * Aile ağacı yerleşimi.
 *
 * Düz dagre "Ahmet → Mehmet" ve "Ayşe → Mehmet" oklarını bağımsız çizer, çift
 * birlikte görünmez. Genealoji araçlarının standart çözümü **union node**:
 * evliliği temsil eden görünmez bir düğüm. Eşler ona bağlanır, çocuklar ondan
 * sarkar — böylece eşler aynı sırada yan yana durur ve çocuklar çiftin
 * ortasından iner.
 *
 * Union düğümü 1×1 boyutunda olduğu için araya giren satır göze çarpmıyor.
 */
function layoutFamily(roles: LayoutRole[], rels: LayoutRel[]): Positions {
  const g = newGraph(28)
  for (const r of roles) g.setNode(r.id, { width: NODE_W, height: NODE_H })

  // 1) Her çift için bir union düğümü
  const unionByPair = new Map<string, string>()
  let unionSeq = 0
  for (const rel of rels) {
    if (rel.type !== 'spouse' && rel.type !== 'partner') continue
    if (!g.hasNode(rel.from_role_id) || !g.hasNode(rel.to_role_id)) continue

    const key = pairKey(rel.from_role_id, rel.to_role_id)
    if (unionByPair.has(key)) continue

    const uid = `__union_${unionSeq++}`
    g.setNode(uid, { width: 1, height: 1 })
    g.setEdge(rel.from_role_id, uid)
    g.setEdge(rel.to_role_id, uid)
    unionByPair.set(key, uid)
  }

  // 2) Çocukları, ebeveynleri bir çift oluşturuyorsa union üzerinden bağla
  const parentsOfChild = new Map<string, string[]>()
  for (const rel of rels) {
    if (rel.type !== 'parent') continue
    if (!g.hasNode(rel.from_role_id) || !g.hasNode(rel.to_role_id)) continue
    pushInto(parentsOfChild, rel.to_role_id, rel.from_role_id)
  }

  const childWiredViaUnion = new Set<string>()
  for (const [child, parents] of parentsOfChild) {
    let union: string | undefined
    for (let i = 0; i < parents.length && !union; i++) {
      for (let j = i + 1; j < parents.length && !union; j++) {
        union = unionByPair.get(pairKey(parents[i], parents[j]))
      }
    }
    if (union) {
      g.setEdge(union, child)
      childWiredViaUnion.add(child)
    }
  }

  // 3) Tek ebeveynli (veya ebeveynleri çift olmayan) çocuklar doğrudan bağlanır
  for (const rel of rels) {
    if (rel.type !== 'parent') continue
    if (childWiredViaUnion.has(rel.to_role_id)) continue
    if (!g.hasNode(rel.from_role_id) || !g.hasNode(rel.to_role_id)) continue
    g.setEdge(rel.from_role_id, rel.to_role_id)
  }

  // Kardeş kenarları dagre'ye verilmiyor: sıra (rank) yaratıp kardeşleri
  // alt alta dizerdi. Ortak ebeveyni olan kardeşler zaten aynı sıraya düşüyor.

  dagre.layout(g)
  return extract(g, roles)
}

/** Organizasyon şeması: yalnızca `manager` kenarları, düz hiyerarşi. */
function layoutOrg(roles: LayoutRole[], rels: LayoutRel[]): Positions {
  const g = newGraph(64)
  for (const r of roles) g.setNode(r.id, { width: NODE_W, height: NODE_H })
  for (const rel of rels) {
    if (rel.type !== 'manager') continue
    if (!g.hasNode(rel.from_role_id) || !g.hasNode(rel.to_role_id)) continue
    g.setEdge(rel.from_role_id, rel.to_role_id)
  }
  dagre.layout(g)
  return extract(g, roles)
}

/** İlişkisiz roller için basit ızgara — ilk açılışta boş tuval görünmesin diye. */
function layoutGrid(roles: LayoutRole[]): Positions {
  const perRow = Math.max(1, Math.ceil(Math.sqrt(roles.length)))
  const out: Positions = {}
  roles.forEach((r, i) => {
    out[r.id] = {
      x: 48 + (i % perRow) * (NODE_W + 48),
      y: 48 + Math.floor(i / perRow) * (NODE_H + 64),
    }
  })
  return out
}

export function computeLayout(mode: LayoutMode, roles: LayoutRole[], rels: LayoutRel[]): Positions {
  if (roles.length === 0) return {}
  switch (mode) {
    case 'family': return layoutFamily(roles, rels)
    case 'org':    return layoutOrg(roles, rels)
    case 'grid':   return layoutGrid(roles)
  }
}

/**
 * Konumu kaydedilmemiş rollere başlangıç yeri verir.
 *
 * İlk açılışta boş/üst üste binmiş tuval göstermemek için otomatik yerleşim
 * uygulanır, ama kullanıcı sürükleyene veya "Otomatik Diz"e basana kadar
 * DB'ye yazılmaz — her görüntülemede yazma yapmamak için.
 */
export function withFallbackPositions(
  roles: { id: string; diagram_x: number | null; diagram_y: number | null }[],
  rels: LayoutRel[],
): Positions {
  const saved: Positions = {}
  const missing: LayoutRole[] = []

  for (const r of roles) {
    if (r.diagram_x != null && r.diagram_y != null) saved[r.id] = { x: r.diagram_x, y: r.diagram_y }
    else missing.push({ id: r.id })
  }
  if (missing.length === 0) return saved

  // Yerleşmemiş roller aralarındaki ilişkilere göre dizilir; hiç ilişki yoksa ızgara.
  const missingIds = new Set(missing.map(m => m.id))
  const relsAmongMissing = rels.filter(
    r => missingIds.has(r.from_role_id) && missingIds.has(r.to_role_id),
  )
  const hasFamilyEdges = relsAmongMissing.some(
    r => r.type === 'spouse' || r.type === 'partner' || r.type === 'parent',
  )
  const computed = hasFamilyEdges
    ? layoutFamily(missing, relsAmongMissing)
    : layoutGrid(missing)

  // Kaydedilmiş düğümlerin altına kaydır ki üst üste binmesinler.
  const savedBottom = Object.values(saved).reduce((max, p) => Math.max(max, p.y + NODE_H), 0)
  const offset = savedBottom > 0 ? savedBottom + 72 : 0
  for (const [id, p] of Object.entries(computed)) {
    saved[id] = { x: p.x, y: p.y + offset }
  }
  return saved
}
