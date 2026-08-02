import { describe, it, expect } from 'vitest'
import {
  isSymmetric, SYMMETRIC_TYPES, DIRECTED_TYPES, ALL_TYPES, TYPE_CATEGORY, TYPE_STYLE,
  findAgeGapWarnings, findCycles, findSameTalentConflicts,
} from '../../lib/role-relationships'
import type { RelationshipType } from '../../types/database'

const role = (id: string, name: string, age_min: number | null = null, age_max: number | null = null) =>
  ({ id, name, age_min, age_max })

const rel = (id: string, from: string, to: string, type: RelationshipType) =>
  ({ id, from_role_id: from, to_role_id: to, type })

describe('tip sınıflandırması', () => {
  it('simetrik ve yönlü tipler ayrık', () => {
    const overlap = SYMMETRIC_TYPES.filter(t => (DIRECTED_TYPES as readonly string[]).includes(t))
    expect(overlap).toEqual([])
  })

  it('ALL_TYPES her iki grubu da kapsıyor', () => {
    expect(ALL_TYPES).toHaveLength(SYMMETRIC_TYPES.length + DIRECTED_TYPES.length)
  })

  // DB CHECK'i ve kanonik sıralama trigger'ı bu listeyi birebir yansıtıyor
  // (058_role_relationships.sql). Biri değişirse diğeri de değişmeli.
  it('DB şemasındaki tip listesiyle aynı', () => {
    expect([...ALL_TYPES].sort()).toEqual(
      ['friend', 'manager', 'other', 'parent', 'partner', 'rival', 'sibling', 'spouse'],
    )
  })

  it('parent ve manager yönlü', () => {
    expect(isSymmetric('parent')).toBe(false)
    expect(isSymmetric('manager')).toBe(false)
  })

  it('spouse ve sibling simetrik', () => {
    expect(isSymmetric('spouse')).toBe(true)
    expect(isSymmetric('sibling')).toBe(true)
  })

  it('her tipin kategorisi ve stili tanımlı', () => {
    for (const t of ALL_TYPES) {
      expect(TYPE_CATEGORY[t]).toBeTruthy()
      expect(TYPE_STYLE[t]?.color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('findAgeGapWarnings', () => {
  it('ebeveyn çocuktan yeterince büyük değilse uyarır', () => {
    const roles = [role('a', 'Ahmet', 30, 35), role('b', 'Mehmet', 25, 30)]
    const out = findAgeGapWarnings([rel('r1', 'a', 'b', 'parent')], roles)
    expect(out).toHaveLength(1)
    expect(out[0].code).toBe('age_gap')
    expect(out[0].params.parent).toBe('Ahmet')
    expect(out[0].params.child).toBe('Mehmet')
  })

  it('yaş farkı yeterliyse uyarmaz', () => {
    const roles = [role('a', 'Ahmet', 45, 55), role('b', 'Mehmet', 20, 25)]
    expect(findAgeGapWarnings([rel('r1', 'a', 'b', 'parent')], roles)).toEqual([])
  })

  it('tam sınırda (16 yıl) uyarmaz', () => {
    const roles = [role('a', 'A', 40, 46), role('b', 'B', 30, 35)]
    expect(findAgeGapWarnings([rel('r1', 'a', 'b', 'parent')], roles)).toEqual([])
  })

  it('yaş bilgisi eksikse sessiz kalır — uydurma uyarı üretmez', () => {
    const roles = [role('a', 'A', null, null), role('b', 'B', 20, 30)]
    expect(findAgeGapWarnings([rel('r1', 'a', 'b', 'parent')], roles)).toEqual([])
  })

  it('parent dışındaki tipleri yok sayar', () => {
    const roles = [role('a', 'A', 30, 32), role('b', 'B', 28, 31)]
    expect(findAgeGapWarnings([rel('r1', 'a', 'b', 'spouse')], roles)).toEqual([])
  })
})

describe('findCycles', () => {
  it('iki düğümlü döngüyü bulur', () => {
    const roles = [role('a', 'A'), role('b', 'B')]
    const out = findCycles([rel('r1', 'a', 'b', 'parent'), rel('r2', 'b', 'a', 'parent')], roles)
    expect(out).toHaveLength(1)
    expect(out[0].code).toBe('cycle')
    expect(out[0].severity).toBe('error')
  })

  it('üç düğümlü döngüyü bulur', () => {
    const roles = [role('a', 'A'), role('b', 'B'), role('c', 'C')]
    const out = findCycles([
      rel('r1', 'a', 'b', 'parent'),
      rel('r2', 'b', 'c', 'parent'),
      rel('r3', 'c', 'a', 'parent'),
    ], roles)
    expect(out).toHaveLength(1)
  })

  it('düz hiyerarşide döngü bulmaz', () => {
    const roles = [role('a', 'A'), role('b', 'B'), role('c', 'C')]
    expect(findCycles([
      rel('r1', 'a', 'b', 'parent'),
      rel('r2', 'b', 'c', 'parent'),
    ], roles)).toEqual([])
  })

  // İki ebeveynin ortak çocuğu elmas şekli oluşturur; bu döngü DEĞİLDİR ve
  // yanlış pozitif üretmemeli — aile ağaçlarında en sık görülen desen.
  it('ortak çocuk (elmas) döngü sayılmaz', () => {
    const roles = [role('p1', 'Baba'), role('p2', 'Anne'), role('c', 'Çocuk')]
    expect(findCycles([
      rel('r1', 'p1', 'c', 'parent'),
      rel('r2', 'p2', 'c', 'parent'),
    ], roles)).toEqual([])
  })

  it('parent olmayan kenarlardaki döngüleri yok sayar', () => {
    const roles = [role('a', 'A'), role('b', 'B')]
    expect(findCycles([
      rel('r1', 'a', 'b', 'friend'),
      rel('r2', 'b', 'a', 'rival'),
    ], roles)).toEqual([])
  })
})

describe('findSameTalentConflicts', () => {
  const roles = [role('a', 'Ahmet'), role('b', 'Ayşe')]

  it('aynı oyuncu ilişkili iki role seçilmişse hata verir', () => {
    const selected = new Map([
      ['a', { talentId: 't1', talentName: 'Kemal' }],
      ['b', { talentId: 't1', talentName: 'Kemal' }],
    ])
    const out = findSameTalentConflicts([rel('r1', 'a', 'b', 'spouse')], selected, roles)
    expect(out).toHaveLength(1)
    expect(out[0].severity).toBe('error')
    expect(out[0].params.talent).toBe('Kemal')
  })

  it('farklı oyuncularda sorun yok', () => {
    const selected = new Map([
      ['a', { talentId: 't1', talentName: 'Kemal' }],
      ['b', { talentId: 't2', talentName: 'Deniz' }],
    ])
    expect(findSameTalentConflicts([rel('r1', 'a', 'b', 'spouse')], selected, roles)).toEqual([])
  })

  it('rollerden biri boşsa çakışma aramaz', () => {
    const selected = new Map([['a', { talentId: 't1', talentName: 'Kemal' }]])
    expect(findSameTalentConflicts([rel('r1', 'a', 'b', 'spouse')], selected, roles)).toEqual([])
  })

  it('ilişkisiz rollerde aynı oyuncu sorun değil', () => {
    const selected = new Map([
      ['a', { talentId: 't1', talentName: 'Kemal' }],
      ['b', { talentId: 't1', talentName: 'Kemal' }],
    ])
    expect(findSameTalentConflicts([], selected, roles)).toEqual([])
  })
})
