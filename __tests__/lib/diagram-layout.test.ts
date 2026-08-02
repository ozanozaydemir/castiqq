import { describe, it, expect } from 'vitest'
import { computeLayout, withFallbackPositions, NODE_W, NODE_H } from '../../lib/diagram-layout'
import type { RelationshipType } from '../../types/database'

const rel = (from: string, to: string, type: RelationshipType) =>
  ({ from_role_id: from, to_role_id: to, type })

const ids = (...list: string[]) => list.map(id => ({ id }))

/** İki düğüm dikdörtgeni çakışıyor mu? */
function overlaps(a: { x: number; y: number }, b: { x: number; y: number }): boolean {
  return Math.abs(a.x - b.x) < NODE_W && Math.abs(a.y - b.y) < NODE_H
}

describe('computeLayout — aile ağacı', () => {
  it('eşleri aynı satıra, çocuğu altlarına yerleştirir', () => {
    // Union node tekniğinin asıl sınavı: düz dagre'de eşler farklı satırlara
    // düşer ve çift birlikte görünmez.
    const pos = computeLayout('family', ids('baba', 'anne', 'cocuk'), [
      rel('anne', 'baba', 'spouse'),
      rel('baba', 'cocuk', 'parent'),
      rel('anne', 'cocuk', 'parent'),
    ])

    expect(pos.baba.y).toBeCloseTo(pos.anne.y, 0)
    expect(pos.cocuk.y).toBeGreaterThan(pos.baba.y)
  })

  it('çocuğu çiftin yatay ortasına yakın koyar', () => {
    const pos = computeLayout('family', ids('baba', 'anne', 'cocuk'), [
      rel('anne', 'baba', 'spouse'),
      rel('baba', 'cocuk', 'parent'),
      rel('anne', 'cocuk', 'parent'),
    ])
    const mid = (pos.baba.x + pos.anne.x) / 2
    expect(Math.abs(pos.cocuk.x - mid)).toBeLessThan(NODE_W)
  })

  it('tek ebeveynli çocuğu doğrudan altına koyar', () => {
    const pos = computeLayout('family', ids('anne', 'cocuk'), [
      rel('anne', 'cocuk', 'parent'),
    ])
    expect(pos.cocuk.y).toBeGreaterThan(pos.anne.y)
  })

  it('kardeşleri aynı satırda tutar', () => {
    const pos = computeLayout('family', ids('anne', 'c1', 'c2'), [
      rel('anne', 'c1', 'parent'),
      rel('anne', 'c2', 'parent'),
      rel('c1', 'c2', 'sibling'),
    ])
    // Kardeş kenarı dagre'ye verilmiyor; ortak ebeveyn zaten aynı sıraya düşürüyor.
    expect(pos.c1.y).toBeCloseTo(pos.c2.y, 0)
  })

  it('üç kuşağı sırayla dizer', () => {
    const pos = computeLayout('family', ids('dede', 'baba', 'torun'), [
      rel('dede', 'baba', 'parent'),
      rel('baba', 'torun', 'parent'),
    ])
    expect(pos.baba.y).toBeGreaterThan(pos.dede.y)
    expect(pos.torun.y).toBeGreaterThan(pos.baba.y)
  })

  it('hiçbir düğüm çakışmaz', () => {
    const pos = computeLayout('family', ids('a', 'b', 'c', 'd', 'e'), [
      rel('a', 'b', 'spouse'),
      rel('a', 'c', 'parent'),
      rel('b', 'c', 'parent'),
      rel('a', 'd', 'parent'),
      rel('b', 'd', 'parent'),
    ])
    const entries = Object.entries(pos)
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        expect(overlaps(entries[i][1], entries[j][1])).toBe(false)
      }
    }
  })

  it('ilişkisiz rolleri de yerleştirir (kaybetmez)', () => {
    const pos = computeLayout('family', ids('a', 'b', 'yalniz'), [rel('a', 'b', 'spouse')])
    expect(pos.yalniz).toBeDefined()
    expect(Number.isFinite(pos.yalniz.x)).toBe(true)
  })

  it('union düğümleri sonuca sızmaz', () => {
    const pos = computeLayout('family', ids('a', 'b'), [rel('a', 'b', 'spouse')])
    expect(Object.keys(pos).sort()).toEqual(['a', 'b'])
  })
})

describe('computeLayout — org şeması', () => {
  it('yöneticiyi astının üstüne koyar', () => {
    const pos = computeLayout('org', ids('patron', 'calisan'), [
      rel('patron', 'calisan', 'manager'),
    ])
    expect(pos.calisan.y).toBeGreaterThan(pos.patron.y)
  })

  it('aile kenarlarını hiyerarşiye katmaz', () => {
    const pos = computeLayout('org', ids('a', 'b'), [rel('a', 'b', 'parent')])
    // `parent` iş hiyerarşisi değil; org düzeninde aynı satırda kalmalılar.
    expect(pos.a.y).toBeCloseTo(pos.b.y, 0)
  })
})

describe('computeLayout — ızgara', () => {
  it('boş girdide boş döner', () => {
    expect(computeLayout('grid', [], [])).toEqual({})
  })

  it('tüm rollere konum verir ve çakıştırmaz', () => {
    const pos = computeLayout('grid', ids('a', 'b', 'c', 'd', 'e', 'f'), [])
    expect(Object.keys(pos)).toHaveLength(6)
    const entries = Object.entries(pos)
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        expect(overlaps(entries[i][1], entries[j][1])).toBe(false)
      }
    }
  })
})

describe('withFallbackPositions', () => {
  it('kaydedilmiş konumları aynen korur', () => {
    const pos = withFallbackPositions(
      [{ id: 'a', diagram_x: 123, diagram_y: 456 }],
      [],
    )
    expect(pos.a).toEqual({ x: 123, y: 456 })
  })

  it('konumsuz rollere konum üretir', () => {
    const pos = withFallbackPositions(
      [{ id: 'a', diagram_x: null, diagram_y: null }],
      [],
    )
    expect(pos.a).toBeDefined()
    expect(Number.isFinite(pos.a.x)).toBe(true)
  })

  it('yeni rolleri kaydedilmiş olanların altına kaydırır', () => {
    const pos = withFallbackPositions([
      { id: 'kayitli', diagram_x: 0, diagram_y: 0 },
      { id: 'yeni',    diagram_x: null, diagram_y: null },
    ], [])
    expect(pos.yeni.y).toBeGreaterThan(pos.kayitli.y + NODE_H)
  })

  it('yalnız bir eksen doluysa konumu kaydedilmiş saymaz', () => {
    // diagram_x var ama diagram_y yoksa {x, undefined} üretip canvas'ı kırardı.
    const pos = withFallbackPositions(
      [{ id: 'a', diagram_x: 50, diagram_y: null }],
      [],
    )
    expect(Number.isFinite(pos.a.x)).toBe(true)
    expect(Number.isFinite(pos.a.y)).toBe(true)
  })

  it('konumsuz roller arasındaki aile bağlarını kullanır', () => {
    const pos = withFallbackPositions([
      { id: 'anne',  diagram_x: null, diagram_y: null },
      { id: 'cocuk', diagram_x: null, diagram_y: null },
    ], [rel('anne', 'cocuk', 'parent')])
    expect(pos.cocuk.y).toBeGreaterThan(pos.anne.y)
  })
})
