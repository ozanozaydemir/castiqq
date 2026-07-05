'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { Users, Check, X, ListPlus, Loader2, ArrowUpDown } from 'lucide-react'
import { Pagination } from '@/components/ui/Pagination'
import { TalentSlideshowButton } from './TalentSlideshow'
import { bulkAddToCollection } from '@/app/actions/collections'

type TalentRow = {
  id: string; full_name: string; city: string | null; gender: string | null
  playable_age_min: number | null; playable_age_max: number | null
  height_cm: number | null; agency_name: string | null
  availability: string; skills: string[] | null
  avatar_url: string | null; photos: string[] | null
}

type ProjectRow = {
  id: string; title: string
  project_roles: { id: string; name: string }[]
}

type CollectionRow = { id: string; name: string }

const AVATAR_GRADIENTS = [
  'from-indigo-500 to-purple-600', 'from-violet-500 to-pink-500',
  'from-blue-500 to-cyan-500',     'from-emerald-500 to-teal-500',
  'from-amber-400 to-orange-500',  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
]

function getInitials(name: string) {
  const parts = name.trim().split(' ')
  return (parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2)).toUpperCase()
}

const AVAIL_DOTS: Record<string, string> = {
  available: 'bg-green-400', busy: 'bg-amber-400', unavailable: 'bg-gray-300',
}

const SORT_OPTIONS = ['name_asc', 'name_desc', 'available', 'recent'] as const
type SortOption = typeof SORT_OPTIONS[number]

// ── Collection picker modal ─────────────────────────────────────────
function CollectionPickerModal({
  count,
  collections,
  onPick,
  onClose,
}: {
  count: number
  collections: CollectionRow[]
  onPick: (id: string) => void
  onClose: () => void
}) {
  const tc = useTranslations('collections')
  const [isPending, start] = useTransition()
  const [picked, setPicked] = useState<string | null>(null)

  function handlePick(id: string) {
    setPicked(id)
    start(() => onPick(id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">{tc('selectCollection')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        {collections.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">{tc('empty')}</div>
        ) : (
          <div className="max-h-64 overflow-y-auto py-2">
            {collections.map(c => (
              <button
                key={c.id}
                disabled={isPending}
                onClick={() => handlePick(c.id)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm text-left transition-colors
                  ${picked === c.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {picked === c.id && isPending
                  ? <Loader2 className="w-4 h-4 text-indigo-500 animate-spin flex-shrink-0" />
                  : <ListPlus className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main grid ───────────────────────────────────────────────────────
interface Props {
  list: TalentRow[]
  totalCount: number
  page: number
  totalPages: number
  projects: ProjectRow[]
  collections: CollectionRow[]
  currentSort: string
}

export function TalentGridClient({ list, totalCount, page, totalPages, projects, collections, currentSort }: Props) {
  const t  = useTranslations('talent')
  const ta = useTranslations('talent.availability')
  const tc = useTranslations('collections')

  const router      = useRouter()
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const [, start]   = useTransition()

  const [selected, setSelected]    = useState<Set<string>>(new Set())
  const [showModal, setShowModal]  = useState(false)
  const [bulkMsg, setBulkMsg]      = useState<string | null>(null)

  const AVAILABILITY_CONFIG: Record<string, { dot: string; label: string }> = {
    available:   { dot: AVAIL_DOTS.available,   label: ta('available') },
    busy:        { dot: AVAIL_DOTS.busy,         label: ta('busy') },
    unavailable: { dot: AVAIL_DOTS.unavailable,  label: ta('unavailable') },
  }

  const SORT_LABELS: Record<SortOption, string> = {
    name_asc:    t('sortNameAsc'),
    name_desc:   t('sortNameDesc'),
    available:   t('sortAvailability'),
    recent:      t('sortRecent'),
  }

  const toggle = useCallback((id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelected(new Set())
    setShowModal(false)
    setBulkMsg(null)
  }, [])

  function updateSort(sort: string) {
    const params = new URLSearchParams(searchParams.toString())
    sort === 'name_asc' ? params.delete('sort') : params.set('sort', sort)
    params.delete('page')
    start(() => router.push(`${pathname}?${params.toString()}`))
  }

  async function handleBulkAdd(collectionId: string) {
    const ids = Array.from(selected)
    const col = collections.find(c => c.id === collectionId)
    const result = await bulkAddToCollection(ids, collectionId)
    setShowModal(false)
    if (result.error) {
      setBulkMsg(result.error)
    } else {
      setBulkMsg(tc('bulkAdded', { count: result.count ?? ids.length }))
      setSelected(new Set())
    }
    setTimeout(() => setBulkMsg(null), 3000)
    void col
  }

  if (totalCount === 0) {
    return (
      <div className="sb-card flex flex-col items-center justify-center py-16 text-center flex-1">
        <Users className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">{t('notFound')}</p>
        <p className="text-gray-400 text-sm mt-1 mb-4">{t('notFoundHint')}</p>
        <Link href="/oyuncular/yeni" className="sb-btn-primary">{t('add')}</Link>
      </div>
    )
  }

  return (
    <div className="flex-1 min-w-0">
      {/* Header row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <p className="text-xs text-gray-400 flex-1">{t('count', { count: totalCount })}</p>

        {/* Sort select */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="w-3 h-3 text-gray-400" />
          <select
            value={currentSort}
            onChange={e => updateSort(e.target.value)}
            className="text-xs text-gray-600 border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-indigo-400 cursor-pointer"
          >
            {SORT_OPTIONS.map(s => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <TalentSlideshowButton talents={list} projects={projects} />
      </div>

      {/* Bulk message toast */}
      {bulkMsg && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 font-medium">
          {bulkMsg}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {list.map(talent => {
          const avail    = AVAILABILITY_CONFIG[talent.availability] ?? AVAILABILITY_CONFIG.unavailable
          const gradient = AVATAR_GRADIENTS[talent.full_name.charCodeAt(0) % AVATAR_GRADIENTS.length]
          const initials = getInitials(talent.full_name)
          const ageLabel = talent.playable_age_min && talent.playable_age_max
            ? `${talent.playable_age_min}–${talent.playable_age_max}`
            : talent.playable_age_min ? `${talent.playable_age_min}+`
            : talent.playable_age_max ? `≤${talent.playable_age_max}`
            : null
          const topSkills   = (talent.skills ?? []).slice(0, 2)
          const isSelected  = selected.has(talent.id)

          return (
            <div key={talent.id} className="relative group">
              {/* Selection checkbox — appears on hover or when selected */}
              <button
                onClick={() => toggle(talent.id)}
                aria-label={isSelected ? 'Seçimi kaldır' : 'Seç'}
                className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all
                  ${isSelected
                    ? 'bg-indigo-500 border-indigo-500 opacity-100 shadow-lg'
                    : 'bg-black/40 border-white/60 opacity-0 group-hover:opacity-100'}`}
              >
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </button>

              <Link
                href={`/oyuncular/${talent.id}`}
                className={`aspect-[2/3] rounded-2xl overflow-hidden block shadow-sm hover:shadow-xl transition-all duration-300 relative ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-1' : ''}`}
              >
                {/* Background */}
                {(talent.photos?.[0] ?? talent.avatar_url) ? (
                  <img
                    src={talent.photos?.[0] ?? talent.avatar_url!}
                    alt={talent.full_name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <span className="text-white/20 font-black select-none" style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
                      {initials}
                    </span>
                  </div>
                )}

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

                {/* Availability dot */}
                <div className="absolute top-2.5 right-2.5">
                  <span className={`block w-2.5 h-2.5 rounded-full ring-2 ring-black/30 ${avail.dot}`} />
                </div>

                {/* Agency badge */}
                {talent.agency_name && (
                  <div className="absolute top-2.5 left-2.5">
                    <span className="text-[10px] bg-black/40 backdrop-blur-sm text-white/80 px-1.5 py-0.5 rounded-md font-medium truncate max-w-[90px] block">
                      {talent.agency_name}
                    </span>
                  </div>
                )}

                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="font-bold text-white text-sm leading-tight truncate">{talent.full_name}</p>
                  <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                    {talent.city && <span className="text-white/60 text-xs">{talent.city}</span>}
                    {ageLabel && (
                      <>
                        {talent.city && <span className="text-white/30 text-xs">·</span>}
                        <span className="text-white/60 text-xs">{ageLabel} yaş</span>
                      </>
                    )}
                    {talent.height_cm && (
                      <>
                        <span className="text-white/30 text-xs">·</span>
                        <span className="text-white/60 text-xs">{talent.height_cm} cm</span>
                      </>
                    )}
                  </div>
                  {topSkills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {topSkills.map(s => (
                        <span key={s} className="px-1.5 py-0.5 bg-white/15 backdrop-blur-sm text-white/80 rounded-md text-[10px] font-medium">{s}</span>
                      ))}
                      {(talent.skills ?? []).length > 2 && (
                        <span className="px-1.5 py-0.5 bg-white/10 text-white/50 rounded-md text-[10px]">+{(talent.skills ?? []).length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            </div>
          )
        })}
      </div>

      <Pagination page={page} totalPages={totalPages} />

      {/* Floating bulk bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-medium whitespace-nowrap">{t('selected', { count: selected.size })}</span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 text-sm font-semibold bg-indigo-500 hover:bg-indigo-400 transition-colors px-3 py-1.5 rounded-xl"
          >
            <ListPlus className="w-4 h-4" /> {t('bulkAddToList')}
          </button>
          <button
            onClick={clearSelection}
            className="text-gray-400 hover:text-white transition-colors"
            title={t('clearSelection')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Collection picker modal */}
      {showModal && (
        <CollectionPickerModal
          count={selected.size}
          collections={collections}
          onPick={handleBulkAdd}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
