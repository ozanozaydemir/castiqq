'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from '@/i18n/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const SKILL_OPTIONS = [
  'Şarkı', 'Dans', 'At Binme', 'Motosiklet', 'Yüzme',
  'Silah Kullanımı', 'Dövüş Koreografisi', 'Enstrüman', 'Spor',
]

export function OyuncuFilters({ teamMembers = [] }: { teamMembers?: { id: string; full_name: string | null }[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const t = useTranslations('talent.filters')
  const ta = useTranslations('talent.availability')

  const get = (key: string) => searchParams.get(key) ?? ''

  const update = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  // Serbest metin alanları (arama, şehir) her tuş vuruşunda sunucuya
  // istek atmasın diye yerelde tutulup debounce ile URL'e yansıtılıyor.
  const [qLocal, setQLocal] = useState(get('q'))
  const [cityLocal, setCityLocal] = useState(get('city'))
  const [ageMinLocal, setAgeMinLocal] = useState(get('age_min'))
  const [ageMaxLocal, setAgeMaxLocal] = useState(get('age_max'))
  const [heightMinLocal, setHeightMinLocal] = useState(get('height_min'))
  const [heightMaxLocal, setHeightMaxLocal] = useState(get('height_max'))
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQLocal(get('q')) }, [searchParams])
  useEffect(() => { setCityLocal(get('city')) }, [searchParams])
  useEffect(() => { setAgeMinLocal(get('age_min')) }, [searchParams])
  useEffect(() => { setAgeMaxLocal(get('age_max')) }, [searchParams])
  useEffect(() => { setHeightMinLocal(get('height_min')) }, [searchParams])
  useEffect(() => { setHeightMaxLocal(get('height_max')) }, [searchParams])

  const updateDebounced = useCallback((key: string, value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => update(key, value), 400)
  }, [update])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const clear = useCallback(() => {
    startTransition(() => router.push(pathname))
  }, [pathname, router])

  const hasFilters = ['q', 'gender', 'city', 'age_min', 'age_max', 'height_min', 'height_max', 'skill', 'availability', 'agency', 'assigned'].some(k => searchParams.has(k))

  const genderOptions = [
    { v: '', l: t('all') },
    { v: 'erkek', l: t('male') },
    { v: 'kadin', l: t('female') },
  ]

  const availabilityOptions = [
    { v: '', l: t('all') },
    { v: 'available', l: ta('available') },
    { v: 'busy', l: ta('busy') },
  ]

  const agencyOptions = [
    { v: '', l: t('all') },
    { v: 'yes', l: t('withAgency') },
    { v: 'no', l: t('withoutAgency') },
  ]

  return (
    <aside className="w-56 flex-shrink-0 space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={qLocal}
          onChange={e => { setQLocal(e.target.value); updateDebounced('q', e.target.value) }}
          placeholder={t('searchPlaceholder')}
          className="sb-input pl-8 pr-3 py-2 text-sm"
        />
      </div>

      {hasFilters && (
        <button onClick={clear} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors w-full">
          <X className="w-3 h-3" /> {t('clearFilters')}
        </button>
      )}

      {/* Gender */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('gender')}</p>
        <div className="space-y-1.5">
          {genderOptions.map(opt => (
            <label key={opt.v} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="gender"
                checked={get('gender') === opt.v}
                onChange={() => update('gender', opt.v)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('availability')}</p>
        <div className="space-y-1.5">
          {availabilityOptions.map(opt => (
            <label key={opt.v} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="availability"
                checked={get('availability') === opt.v}
                onChange={() => update('availability', opt.v)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Playable age */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('playableAge')}</p>
        <div className="flex items-center gap-2">
          <input type="number" value={ageMinLocal} onChange={e => { setAgeMinLocal(e.target.value); updateDebounced('age_min', e.target.value) }}
            placeholder="Min" min={0} max={120} className="sb-input text-sm w-full" />
          <span className="text-gray-300 flex-shrink-0">–</span>
          <input type="number" value={ageMaxLocal} onChange={e => { setAgeMaxLocal(e.target.value); updateDebounced('age_max', e.target.value) }}
            placeholder="Max" min={0} max={120} className="sb-input text-sm w-full" />
        </div>
      </div>

      {/* Height */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('heightCm')}</p>
        <div className="flex items-center gap-2">
          <input type="number" value={heightMinLocal} onChange={e => { setHeightMinLocal(e.target.value); updateDebounced('height_min', e.target.value) }}
            placeholder="Min" min={100} max={250} className="sb-input text-sm w-full" />
          <span className="text-gray-300 flex-shrink-0">–</span>
          <input type="number" value={heightMaxLocal} onChange={e => { setHeightMaxLocal(e.target.value); updateDebounced('height_max', e.target.value) }}
            placeholder="Max" min={100} max={250} className="sb-input text-sm w-full" />
        </div>
      </div>

      {/* City */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('city')}</p>
        <input value={cityLocal} onChange={e => { setCityLocal(e.target.value); updateDebounced('city', e.target.value) }}
          placeholder={t('cityPlaceholder')} className="sb-input text-sm" />
      </div>

      {/* Sorumlu Menajer (yalnızca menajerlik hesapları) */}
      {teamMembers.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('assignedTo')}</p>
          <select value={get('assigned')} onChange={e => update('assigned', e.target.value)} className="sb-input text-sm">
            <option value="">{t('all')}</option>
            <option value="unassigned">{t('unassigned')}</option>
            {teamMembers.map(m => (
              <option key={m.id} value={m.id}>{m.full_name ?? m.id}</option>
            ))}
          </select>
        </div>
      )}

      {/* Skills */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('skill')}</p>
        <select value={get('skill')} onChange={e => update('skill', e.target.value)} className="sb-input text-sm">
          <option value="">{t('all')}</option>
          {SKILL_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Agency */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('agency')}</p>
        <div className="space-y-1.5">
          {agencyOptions.map(opt => (
            <label key={opt.v} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="agency"
                checked={get('agency') === opt.v}
                onChange={() => update('agency', opt.v)}
                className="accent-indigo-500"
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900">{opt.l}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  )
}
