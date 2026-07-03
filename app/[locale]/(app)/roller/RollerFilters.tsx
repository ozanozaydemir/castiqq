'use client'

import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { Search, ArrowUpDown, X } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Project = { id: string; title: string }

export function RollerFilters({ total, projects }: { total: number; projects: Project[] }) {
  const t = useTranslations('roles')
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, start]    = useTransition()

  const STATUS_OPTS = [
    { v: '',          l: t('filterAll') },
    { v: 'open',      l: t('status.open') },
    { v: 'casting',   l: t('status.casting') },
    { v: 'filled',    l: t('status.filled') },
    { v: 'cancelled', l: t('status.cancelled') },
  ]

  const GENDER_OPTS = [
    { v: '',      l: t('filterAllGenders') },
    { v: 'erkek', l: t('gender.erkek') },
    { v: 'kadin', l: t('gender.kadin') },
    { v: 'diger', l: t('gender.diger') },
  ]

  const SORT_OPTS = [
    { v: '',       l: t('sortNewest') },
    { v: 'oldest', l: t('sortOldest') },
    { v: 'az',     l: t('sortAz') },
    { v: 'za',     l: t('sortZa') },
  ]

  const get = (k: string) => searchParams.get(k) ?? ''

  const update = useCallback((key: string, value: string) => {
    const p = new URLSearchParams(searchParams.toString())
    value ? p.set(key, value) : p.delete(key)
    p.delete('page')
    start(() => router.push(`${pathname}?${p.toString()}`))
  }, [searchParams, pathname, router])

  const clear = useCallback(() => {
    start(() => router.push(pathname))
  }, [pathname, router])

  const hasFilters   = ['q', 'status', 'gender', 'sort', 'project'].some(k => searchParams.has(k))
  const currentStatus = get('status')
  const currentSort   = get('sort')
  const currentGender = get('gender')

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">

      {/* Arama */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        <input
          value={get('q')}
          onChange={e => update('q', e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="sb-input pl-8 pr-3 h-8 text-sm w-48"
        />
      </div>

      <div className="h-5 w-px bg-gray-200 mx-0.5" />

      {/* Durum pilleri */}
      <div className="flex items-center gap-1">
        {STATUS_OPTS.map(o => (
          <button
            key={o.v}
            onClick={() => update('status', o.v)}
            className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              currentStatus === o.v
                ? 'bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            {o.l}
          </button>
        ))}
      </div>

      <div className="h-5 w-px bg-gray-200 mx-0.5" />

      {/* Proje */}
      {projects.length > 0 && (
        <div className="relative flex items-center">
          <select
            value={get('project')}
            onChange={e => update('project', e.target.value)}
            className="h-8 pl-3 pr-7 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:border-indigo-400"
          >
            <option value="">{t('filterAllProjects')}</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <span className="absolute right-2 pointer-events-none text-gray-400 text-[10px]">▾</span>
        </div>
      )}

      {/* Cinsiyet */}
      <div className="relative flex items-center">
        <select
          value={currentGender}
          onChange={e => update('gender', e.target.value)}
          className="h-8 pl-3 pr-7 text-xs text-gray-600 bg-white border border-gray-200 rounded-lg appearance-none cursor-pointer hover:border-gray-300 transition-colors focus:outline-none focus:border-indigo-400"
        >
          {GENDER_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <span className="absolute right-2 pointer-events-none text-gray-400 text-[10px]">▾</span>
      </div>

      {/* Sırala */}
      <div className="relative flex items-center gap-1.5 h-8 pl-2.5 pr-7 border border-gray-200 rounded-lg bg-white hover:border-gray-300 transition-colors cursor-pointer">
        <ArrowUpDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
        <span className="text-xs text-gray-600 whitespace-nowrap">
          {SORT_OPTS.find(o => o.v === currentSort)?.l ?? t('sortNewest')}
        </span>
        <select
          value={currentSort}
          onChange={e => update('sort', e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer w-full"
        >
          {SORT_OPTS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <span className="absolute right-2 pointer-events-none text-gray-400 text-[10px]">▾</span>
      </div>

      {/* Sonuç sayısı */}
      <span className="text-xs text-gray-400">{t('totalCount', { count: total })}</span>

      {/* Temizle */}
      {hasFilters && (
        <button
          onClick={clear}
          className="h-8 inline-flex items-center gap-1.5 px-2.5 rounded-lg text-xs text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
          <X className="w-3.5 h-3.5" /> {t('filterClear')}
        </button>
      )}
    </div>
  )
}
