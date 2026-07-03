'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { usePathname } from '@/i18n/navigation'
import { useCallback, useTransition } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

const SKILL_OPTIONS = [
  'Şarkı', 'Dans', 'At Binme', 'Motosiklet', 'Yüzme',
  'Silah Kullanımı', 'Dövüş Koreografisi', 'Enstrüman', 'Spor',
]

export function OyuncuFilters() {
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

  const clear = useCallback(() => {
    startTransition(() => router.push(pathname))
  }, [pathname, router])

  const hasFilters = ['q', 'gender', 'city', 'age_min', 'age_max', 'height_min', 'height_max', 'skill', 'availability', 'agency'].some(k => searchParams.has(k))

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
          value={get('q')}
          onChange={e => update('q', e.target.value)}
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
          <input type="number" value={get('age_min')} onChange={e => update('age_min', e.target.value)}
            placeholder="Min" min={0} max={120} className="sb-input text-sm w-full" />
          <span className="text-gray-300 flex-shrink-0">–</span>
          <input type="number" value={get('age_max')} onChange={e => update('age_max', e.target.value)}
            placeholder="Max" min={0} max={120} className="sb-input text-sm w-full" />
        </div>
      </div>

      {/* Height */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('heightCm')}</p>
        <div className="flex items-center gap-2">
          <input type="number" value={get('height_min')} onChange={e => update('height_min', e.target.value)}
            placeholder="Min" min={100} max={250} className="sb-input text-sm w-full" />
          <span className="text-gray-300 flex-shrink-0">–</span>
          <input type="number" value={get('height_max')} onChange={e => update('height_max', e.target.value)}
            placeholder="Max" min={100} max={250} className="sb-input text-sm w-full" />
        </div>
      </div>

      {/* City */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{t('city')}</p>
        <input value={get('city')} onChange={e => update('city', e.target.value)}
          placeholder={t('cityPlaceholder')} className="sb-input text-sm" />
      </div>

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
