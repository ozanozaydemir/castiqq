import { describe, it, expect } from 'vitest'
import { matchTalentToRole, type RoleCriteria, type TalentCandidate } from '../../lib/roleMatching'

const BASE_TALENT: TalentCandidate = {
  id: 't1',
  full_name: 'Ayşe Yıldız',
  gender: 'kadin',
  birth_year: 1990,
  playable_age_min: 28,
  playable_age_max: 40,
  height_cm: 168,
  city: 'İstanbul',
  skills: ['Piyano', 'Dans'],
  availability: 'available',
  photos: null,
}

const BASE_ROLE: RoleCriteria = {
  gender: null,
  age_min: null,
  age_max: null,
  min_height_cm: null,
  max_height_cm: null,
  required_skills: [],
  city: null,
}

describe('matchTalentToRole — cinsiyet filtresi', () => {
  it('aynı cinsiyet geçmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, gender: 'kadin' }, [BASE_TALENT])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'gender')).toBe(true)
  })

  it('farklı cinsiyet elenmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, gender: 'erkek' }, [BASE_TALENT])
    expect(results).toHaveLength(0)
  })

  it('rol cinsiyeti null ise tümü geçmeli', () => {
    const erkek: TalentCandidate = { ...BASE_TALENT, id: 't2', gender: 'erkek' }
    const results = matchTalentToRole({ ...BASE_ROLE, gender: null }, [BASE_TALENT, erkek])
    expect(results).toHaveLength(2)
  })
})

describe('matchTalentToRole — yaş filtresi', () => {
  it('yaş aralığı kesişiyorsa geçmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, age_min: 30, age_max: 45 }, [BASE_TALENT])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'age')).toBe(true)
  })

  it('yaş aralığı hiç kesişmiyorsa elenmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, age_min: 50, age_max: 60 }, [BASE_TALENT])
    expect(results).toHaveLength(0)
  })

  it('talent playable_age yoksa birth_year\'dan hesaplanmalı', () => {
    const t: TalentCandidate = {
      ...BASE_TALENT,
      playable_age_min: null,
      playable_age_max: null,
      birth_year: new Date().getFullYear() - 35,
    }
    const results = matchTalentToRole({ ...BASE_ROLE, age_min: 30, age_max: 40 }, [t])
    expect(results).toHaveLength(1)
  })

  it('talent yaş verisi yoksa elenmiyor, puan almıyor', () => {
    const t: TalentCandidate = {
      ...BASE_TALENT,
      playable_age_min: null,
      playable_age_max: null,
      birth_year: null,
    }
    const results = matchTalentToRole({ ...BASE_ROLE, age_min: 30, age_max: 40 }, [t])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'age')).toBe(false)
  })
})

describe('matchTalentToRole — boy filtresi', () => {
  it('boy aralığı içindeyse geçmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, min_height_cm: 160, max_height_cm: 175 }, [BASE_TALENT])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'height')).toBe(true)
  })

  it('boy aralığı dışındaysa elenmeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, min_height_cm: 175, max_height_cm: 190 }, [BASE_TALENT])
    expect(results).toHaveLength(0)
  })

  it('talent boy bilgisi yoksa boy filtresi uygulanmamalı', () => {
    const t: TalentCandidate = { ...BASE_TALENT, height_cm: null }
    const results = matchTalentToRole({ ...BASE_ROLE, min_height_cm: 175, max_height_cm: 190 }, [t])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'height')).toBe(false)
  })
})

describe('matchTalentToRole — yumuşak puanlama', () => {
  it('eşleşen yetenek puan eklemeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, required_skills: ['Piyano'] }, [BASE_TALENT])
    expect(results[0].score).toBeGreaterThan(0)
    expect(results[0].reasons.some(r => r.type === 'skills')).toBe(true)
  })

  it('eşleşmeyen yetenek puan eklemez ama elemiyor', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, required_skills: ['Atıcılık'] }, [BASE_TALENT])
    expect(results).toHaveLength(1)
    expect(results[0].reasons.some(r => r.type === 'skills')).toBe(false)
  })

  it('şehir eşleşmesi puan eklemeli', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, city: 'İstanbul' }, [BASE_TALENT])
    expect(results[0].reasons.some(r => r.type === 'city')).toBe(true)
  })

  it('şehir büyük/küçük harf duyarsız', () => {
    const results = matchTalentToRole({ ...BASE_ROLE, city: 'istanbul' }, [BASE_TALENT])
    expect(results[0].reasons.some(r => r.type === 'city')).toBe(true)
  })

  it('müsait oyuncu puan almalı', () => {
    const results = matchTalentToRole(BASE_ROLE, [BASE_TALENT])
    expect(results[0].reasons.some(r => r.type === 'available')).toBe(true)
  })

  it('meşgul oyuncu müsaitlik puanı almamalı', () => {
    const t: TalentCandidate = { ...BASE_TALENT, availability: 'busy' }
    const results = matchTalentToRole(BASE_ROLE, [t])
    expect(results[0].reasons.some(r => r.type === 'available')).toBe(false)
  })
})

describe('matchTalentToRole — sıralama', () => {
  it('yüksek puanlı oyuncu önde gelmeli', () => {
    const t1: TalentCandidate = { ...BASE_TALENT, id: 't1', skills: ['Piyano', 'Dans', 'Şarkı'] }
    const t2: TalentCandidate = { ...BASE_TALENT, id: 't2', skills: [] }
    const results = matchTalentToRole(
      { ...BASE_ROLE, required_skills: ['Piyano', 'Dans', 'Şarkı'] },
      [t2, t1],
    )
    expect(results[0].talent.id).toBe('t1')
  })

  it('boş havuz boş dizi döner', () => {
    const results = matchTalentToRole(BASE_ROLE, [])
    expect(results).toEqual([])
  })
})

describe('matchTalentToRole — birden fazla sert filtre', () => {
  it('tüm sert filtreleri geçen oyuncu sonuçta olmalı', () => {
    const results = matchTalentToRole(
      { ...BASE_ROLE, gender: 'kadin', age_min: 25, age_max: 45, min_height_cm: 160, max_height_cm: 180 },
      [BASE_TALENT],
    )
    expect(results).toHaveLength(1)
  })

  it('tek sert filtreden elenen oyuncu sonuçta olmamalı', () => {
    const results = matchTalentToRole(
      { ...BASE_ROLE, gender: 'kadin', age_min: 50, age_max: 60 },
      [BASE_TALENT],
    )
    expect(results).toHaveLength(0)
  })
})
