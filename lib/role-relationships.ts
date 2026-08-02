import type { RelationshipType, ProjectRole } from '@/types/database'

// İlişki semantiğinin tek kaynağı. DB CHECK'i 058_role_relationships.sql'de,
// kanonik sıralama trigger'ı da aynı simetrik listeyi kullanıyor — biri
// değişirse diğeri de değişmeli.

export const SYMMETRIC_TYPES = ['spouse', 'partner', 'sibling', 'friend', 'rival'] as const
export const DIRECTED_TYPES  = ['parent', 'manager', 'other'] as const

export const ALL_TYPES: RelationshipType[] = [...SYMMETRIC_TYPES, ...DIRECTED_TYPES]

export function isSymmetric(type: RelationshipType): boolean {
  return (SYMMETRIC_TYPES as readonly string[]).includes(type)
}

// Diyagram filtresi için kategoriler
export type RelationshipCategory = 'family' | 'work' | 'social'

export const TYPE_CATEGORY: Record<RelationshipType, RelationshipCategory> = {
  spouse:  'family',
  partner: 'family',
  sibling: 'family',
  parent:  'family',
  manager: 'work',
  friend:  'social',
  rival:   'social',
  other:   'social',
}

// Kenar görünümü. Aile bağları düz ve koyu, iş bağları kesikli, sosyal bağlar açık.
export const TYPE_STYLE: Record<RelationshipType, { color: string; dashed: boolean }> = {
  spouse:  { color: '#e11d48', dashed: false },  // rose-600
  partner: { color: '#f43f5e', dashed: true  },  // rose-500
  sibling: { color: '#8b5cf6', dashed: false },  // violet-500
  parent:  { color: '#6366f1', dashed: false },  // indigo-500
  manager: { color: '#0891b2', dashed: true  },  // cyan-600
  friend:  { color: '#10b981', dashed: true  },  // emerald-500
  rival:   { color: '#f59e0b', dashed: true  },  // amber-500
  other:   { color: '#94a3b8', dashed: true  },  // slate-400
}

/**
 * Kenarın okunabilir yönünü verir.
 * Yönlü tiplerde uçların rolü farklıdır: `parent` için from=ebeveyn, to=çocuk.
 * Simetrik tiplerde iki uç eşdeğerdir, bu yüzden tek etiket döner.
 */
export function edgeEndpointLabels(type: RelationshipType): { from: string; to: string } | null {
  switch (type) {
    case 'parent':  return { from: 'parentOf',  to: 'childOf'  }
    case 'manager': return { from: 'managerOf', to: 'reportsTo' }
    default:        return null
  }
}

// ── Doğrulamalar ─────────────────────────────────────────────────────────────
// Grafiği yapılandırılmış tuttuğumuz için bunlar bedava geliyor: sistem
// "ebeveyn"in ne demek olduğunu biliyor.

export type RelationshipWarning = {
  relationshipId: string
  severity: 'error' | 'warning'
  code: 'age_gap' | 'cycle' | 'same_talent'
  /** i18n anahtarı için değişkenler */
  params: Record<string, string | number>
}

/** Ebeveyn ile çocuk rolü arasında beklenen en az yaş farkı. */
const MIN_PARENT_AGE_GAP = 16

type RelRow = {
  id: string
  from_role_id: string
  to_role_id: string
  type: RelationshipType
}

/**
 * Yaş aralıkları çelişen ebeveyn ilişkilerini bulur.
 * Ebeveynin üst yaş sınırı, çocuğun alt yaş sınırından en az MIN_PARENT_AGE_GAP
 * fazla olmalı; değilse casting sırasında imkânsız bir eşleşme aranıyor demektir.
 */
export function findAgeGapWarnings(
  relationships: RelRow[],
  roles: Pick<ProjectRole, 'id' | 'name' | 'age_min' | 'age_max'>[],
): RelationshipWarning[] {
  const byId = new Map(roles.map(r => [r.id, r]))
  const out: RelationshipWarning[] = []

  for (const rel of relationships) {
    if (rel.type !== 'parent') continue
    const parent = byId.get(rel.from_role_id)
    const child  = byId.get(rel.to_role_id)
    if (!parent || !child) continue
    if (parent.age_max == null || child.age_min == null) continue

    const gap = parent.age_max - child.age_min
    if (gap < MIN_PARENT_AGE_GAP) {
      out.push({
        relationshipId: rel.id,
        severity: 'warning',
        code: 'age_gap',
        params: { parent: parent.name, child: child.name, gap, min: MIN_PARENT_AGE_GAP },
      })
    }
  }
  return out
}

/**
 * `parent` kenarlarında döngü arar (A → B → A veya daha uzunu).
 * Böyle bir grafik anlamsızdır ve otomatik yerleşimi de sonsuz döngüye sokar.
 */
export function findCycles(relationships: RelRow[], roles: { id: string; name: string }[]): RelationshipWarning[] {
  const nameById = new Map(roles.map(r => [r.id, r.name]))
  const adj = new Map<string, { to: string; relId: string }[]>()
  for (const rel of relationships) {
    if (rel.type !== 'parent') continue
    const list = adj.get(rel.from_role_id) ?? []
    list.push({ to: rel.to_role_id, relId: rel.id })
    adj.set(rel.from_role_id, list)
  }

  const out: RelationshipWarning[] = []
  const state = new Map<string, 'visiting' | 'done'>()
  const seenRel = new Set<string>()

  function walk(node: string, path: string[]) {
    state.set(node, 'visiting')
    for (const { to, relId } of adj.get(node) ?? []) {
      if (state.get(to) === 'visiting') {
        if (!seenRel.has(relId)) {
          seenRel.add(relId)
          const cycleNames = [...path, node, to].map(id => nameById.get(id) ?? '?')
          out.push({
            relationshipId: relId,
            severity: 'error',
            code: 'cycle',
            params: { path: cycleNames.join(' → ') },
          })
        }
      } else if (state.get(to) !== 'done') {
        walk(to, [...path, node])
      }
    }
    state.set(node, 'done')
  }

  for (const id of adj.keys()) {
    if (!state.has(id)) walk(id, [])
  }
  return out
}

/**
 * Aynı oyuncunun birbiriyle ilişkili iki role seçilmiş olması.
 * Bir kişi kendi eşini/kardeşini oynayamaz — bu her zaman hatadır.
 */
export function findSameTalentConflicts(
  relationships: RelRow[],
  selectedTalentByRole: Map<string, { talentId: string; talentName: string }>,
  roles: { id: string; name: string }[],
): RelationshipWarning[] {
  const nameById = new Map(roles.map(r => [r.id, r.name]))
  const out: RelationshipWarning[] = []

  for (const rel of relationships) {
    const a = selectedTalentByRole.get(rel.from_role_id)
    const b = selectedTalentByRole.get(rel.to_role_id)
    if (!a || !b || a.talentId !== b.talentId) continue
    out.push({
      relationshipId: rel.id,
      severity: 'error',
      code: 'same_talent',
      params: {
        talent: a.talentName,
        roleA: nameById.get(rel.from_role_id) ?? '?',
        roleB: nameById.get(rel.to_role_id) ?? '?',
      },
    })
  }
  return out
}
