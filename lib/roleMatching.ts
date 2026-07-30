export type RoleCriteria = {
  gender: string | null
  age_min: number | null
  age_max: number | null
  min_height_cm: number | null
  max_height_cm: number | null
  required_skills: string[]
  city: string | null
}

export type TalentCandidate = {
  id: string
  full_name: string
  gender: string | null
  birth_year: number | null
  playable_age_min: number | null
  playable_age_max: number | null
  height_cm: number | null
  city: string | null
  skills: string[] | null
  availability: string
  photos: string[] | null
}

export type MatchReason =
  | { type: 'gender' }
  | { type: 'age' }
  | { type: 'height' }
  | { type: 'skills'; count: number }
  | { type: 'city' }
  | { type: 'available' }

export type MatchResult = {
  talent: TalentCandidate
  score: number
  reasons: MatchReason[]
}

function talentAgeRange(talent: TalentCandidate): [number, number] | null {
  if (talent.playable_age_min !== null && talent.playable_age_max !== null) {
    return [talent.playable_age_min, talent.playable_age_max]
  }
  if (talent.birth_year) {
    const age = new Date().getFullYear() - talent.birth_year
    return [age, age]
  }
  return null
}

function rangesOverlap(aMin: number, aMax: number, bMin: number, bMax: number): boolean {
  return aMin <= bMax && aMax >= bMin
}

// Rolün kriterlerine göre org'un talent havuzunu filtreler ve skorlar.
// Sert filtreler (cinsiyet/yaş/boy açıkça uyuşmazsa eleniyor); yumuşak
// puanlama (yetenek/şehir/müsaitlik) sonucu sıralıyor. Bilinmeyen alanlar
// (talent'ta veri yoksa) elenmeye değil, sadece puan almamaya sebep olur.
export function matchTalentToRole(role: RoleCriteria, pool: TalentCandidate[]): MatchResult[] {
  const results: MatchResult[] = []

  for (const talent of pool) {
    const reasons: MatchReason[] = []
    let score = 0

    // Cinsiyet — sert filtre
    if (role.gender && talent.gender) {
      if (role.gender !== talent.gender) continue
      score += 20
      reasons.push({ type: 'gender' })
    }

    // Yaş — sert filtre (aralık hiç kesişmiyorsa ele)
    if (role.age_min !== null || role.age_max !== null) {
      const talentRange = talentAgeRange(talent)
      if (talentRange) {
        const roleMin = role.age_min ?? 0
        const roleMax = role.age_max ?? 200
        if (!rangesOverlap(roleMin, roleMax, talentRange[0], talentRange[1])) continue
        score += 20
        reasons.push({ type: 'age' })
      }
    }

    // Boy — sert filtre
    if ((role.min_height_cm !== null || role.max_height_cm !== null) && talent.height_cm !== null) {
      const min = role.min_height_cm ?? 0
      const max = role.max_height_cm ?? 300
      if (talent.height_cm < min || talent.height_cm > max) continue
      score += 15
      reasons.push({ type: 'height' })
    }

    // Yetenekler — yumuşak puan
    if (role.required_skills.length > 0 && talent.skills) {
      const matchCount = role.required_skills.filter(s => talent.skills!.includes(s)).length
      if (matchCount > 0) {
        score += matchCount * 10
        reasons.push({ type: 'skills', count: matchCount })
      }
    }

    // Şehir — yumuşak puan
    if (role.city && talent.city && role.city.trim().toLocaleLowerCase('tr') === talent.city.trim().toLocaleLowerCase('tr')) {
      score += 8
      reasons.push({ type: 'city' })
    }

    // Müsaitlik — yumuşak puan
    if (talent.availability === 'available') {
      score += 5
      reasons.push({ type: 'available' })
    }

    results.push({ talent, score, reasons })
  }

  return results.sort((a, b) => b.score - a.score)
}
