'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, ExternalLink, Play, Plus, Check, Loader2, ChevronDown } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { addCandidate } from '@/app/actions/auditions'
import { useTranslations } from 'next-intl'

// ── Constants ─────────────────────────────────────────────────────

const GENDER_LABELS: Record<string, string> = { erkek: 'Erkek', kadin: 'Kadın', diger: 'Diğer' }

const GRADIENTS = [
  'from-indigo-500 to-purple-600',
  'from-violet-500 to-pink-500',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-sky-400 to-blue-600',
]

function getInitials(name: string) {
  const p = name.trim().split(' ')
  return (p.length >= 2 ? p[0][0] + p[p.length - 1][0] : p[0].slice(0, 2)).toUpperCase()
}

// ── Types ─────────────────────────────────────────────────────────

export type SlideshowProject = {
  id: string
  title: string
  project_roles: { id: string; name: string }[]
}

export type SlideshowTalent = {
  id: string
  full_name: string
  city: string | null
  gender: string | null
  playable_age_min: number | null
  playable_age_max: number | null
  height_cm: number | null
  agency_name: string | null
  availability: string
  skills: string[] | null
  avatar_url: string | null
  photos: string[] | null
}

// ── Add to candidate dropdown ──────────────────────────────────────

type RoleStatus = 'idle' | 'loading' | 'success' | 'error'

function AddToCandidateDropdown({
  talent,
  projects,
}: {
  talent: SlideshowTalent
  projects: SlideshowProject[]
}) {
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState('')
  const [statuses, setStatuses] = useState<Record<string, RoleStatus>>({})
  const ref      = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const t = useTranslations('talent')

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  // reset statuses when talent changes
  useEffect(() => { setStatuses({}) }, [talent.id])

  async function handleAdd(roleId: string) {
    if (statuses[roleId] === 'loading' || statuses[roleId] === 'success') return
    setStatuses(s => ({ ...s, [roleId]: 'loading' }))
    try {
      const res = await addCandidate(roleId, talent.id)
      if (res && 'error' in res) {
        setStatuses(s => ({ ...s, [roleId]: 'error' }))
      } else {
        setStatuses(s => ({ ...s, [roleId]: 'success' }))
      }
    } catch {
      setStatuses(s => ({ ...s, [roleId]: 'error' }))
    }
  }

  const q = search.trim().toLowerCase()
  const filtered = projects
    .map(p => ({
      ...p,
      project_roles: p.project_roles.filter(
        r => !q || r.name.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)
      ),
    }))
    .filter(p => p.project_roles.length > 0)

  if (projects.length === 0) {
    return (
      <div className="relative group">
        <button
          disabled
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white/30 rounded-xl text-sm font-medium cursor-not-allowed"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('addToRole')}
        </button>
        <div className="absolute bottom-full mb-2 left-0 whitespace-nowrap bg-zinc-700 text-white/60 text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          {t('noActiveProject')}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {t('addToRole')}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-72 bg-zinc-800 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10">
          {/* Arama */}
          <div className="px-3 py-2.5 border-b border-white/10">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchProject')}
              className="w-full bg-white/10 text-white placeholder-white/30 text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
              onKeyDown={e => e.key === 'Escape' && setOpen(false)}
            />
          </div>

          <div className="max-h-72 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-center text-white/30 text-sm py-6">{t('noResultFound')}</p>
            ) : (
              filtered.map(project => (
                <div key={project.id}>
                  <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-white/30 uppercase tracking-widest truncate">
                    {project.title}
                  </p>
                  {project.project_roles.map(role => {
                    const status = statuses[role.id] ?? 'idle'
                    return (
                      <button
                        key={role.id}
                        onClick={() => handleAdd(role.id)}
                        disabled={status === 'loading' || status === 'success'}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors disabled:cursor-default ${
                          status === 'success'
                            ? 'text-green-400 bg-green-500/10'
                            : status === 'error'
                            ? 'text-red-400 hover:bg-white/5'
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                      >
                        <span className="truncate">{role.name}</span>
                        <span className="flex-shrink-0 ml-2">
                          {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/40" />}
                          {status === 'success' && <Check className="w-3.5 h-3.5 text-green-400" />}
                          {status === 'error'   && <span className="text-[10px] text-red-400">{t('error')}</span>}
                        </span>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Single slide ──────────────────────────────────────────────────

function Slide({ talent, projects }: { talent: SlideshowTalent; projects: SlideshowProject[] }) {
  const t = useTranslations('talent')
  const ta = useTranslations('talent.availability')

  const photos = (talent.photos?.length ?? 0) > 0 ? talent.photos! : (talent.avatar_url ? [talent.avatar_url] : [])
  const [photoIndex, setPhotoIndex] = useState(0)
  const photo = photos[photoIndex] ?? null
  const gradient = GRADIENTS[talent.full_name.charCodeAt(0) % GRADIENTS.length]
  const availLabel = ta(talent.availability as 'available' | 'busy' | 'unavailable')
  const availDot: Record<string, string> = {
    available: 'bg-green-400',
    busy: 'bg-amber-400',
    unavailable: 'bg-gray-500',
  }
  const dot = availDot[talent.availability] ?? availDot.available

  const ageLabel = talent.playable_age_min && talent.playable_age_max
    ? `${talent.playable_age_min}–${talent.playable_age_max} yaş`
    : talent.playable_age_min ? `${talent.playable_age_min}+`
    : talent.playable_age_max ? `≤${talent.playable_age_max}`
    : null

  return (
    <div className="flex items-center gap-12 animate-slide-in w-full max-w-5xl mx-auto">
      {/* Fotoğraf */}
      <div className="w-80 flex-shrink-0 space-y-3">
        <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl shadow-black/70">
          {photo ? (
            <img
              src={photo}
              alt={talent.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <span
                className="text-white/20 font-black select-none"
                style={{ fontSize: '5rem', lineHeight: 1 }}
              >
                {getInitials(talent.full_name)}
              </span>
            </div>
          )}
        </div>

        {/* Fotoğraf küçük resim şeridi */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2">
            {photos.map((p, i) => (
              <button
                key={p + i}
                onClick={() => setPhotoIndex(i)}
                className={`flex-1 aspect-[2/3] rounded-lg overflow-hidden transition-all ${
                  i === photoIndex ? 'ring-2 ring-indigo-400 opacity-100' : 'opacity-40 hover:opacity-70'
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Müsaitlik */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
          <span className="text-white/40 text-sm">{availLabel}</span>
        </div>

        {/* İsim */}
        <h2 className="text-4xl font-bold text-white leading-tight tracking-tight">
          {talent.full_name}
        </h2>

        {/* Fiziksel meta */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-white/50 text-sm">
          {talent.city && <span>{talent.city}</span>}
          {GENDER_LABELS[talent.gender ?? ''] && <span>{GENDER_LABELS[talent.gender ?? '']}</span>}
          {ageLabel && <span>{ageLabel}</span>}
          {talent.height_cm && <span>{talent.height_cm} cm</span>}
        </div>

        {/* Ajans */}
        {talent.agency_name && (
          <p className="text-indigo-400 font-medium text-sm">{talent.agency_name}</p>
        )}

        {/* Yetenekler */}
        {(talent.skills?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-2">
            {talent.skills!.map(s => (
              <span
                key={s}
                className="px-2.5 py-1 bg-white/10 text-white/70 rounded-lg text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Aksiyonlar */}
        <div className="flex items-center gap-3 pt-2">
          <Link
            href={`/oyuncular/${talent.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white/80 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {t('openProfile')}
          </Link>
          <AddToCandidateDropdown talent={talent} projects={projects} />
        </div>
      </div>
    </div>
  )
}

// ── Slideshow modal ───────────────────────────────────────────────

function Slideshow({
  talents,
  projects,
  onClose,
}: {
  talents: SlideshowTalent[]
  projects: SlideshowProject[]
  onClose: () => void
}) {
  const [index, setIndex]     = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const t = useTranslations('talent')

  const go = useCallback((delta: number) => {
    setIndex(prev => (prev + delta + talents.length) % talents.length)
    setAnimKey(k => k + 1)
  }, [talents.length])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  go(-1)
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [go, onClose])

  const talent = talents[index]

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col">
      {/* Üst bar */}
      <div className="flex items-center justify-between px-8 py-5 flex-shrink-0">
        <span className="text-white/30 text-sm font-mono tabular-nums">
          {index + 1}
          <span className="mx-1 text-white/15">/</span>
          {talents.length}
        </span>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Ana içerik */}
      <div className="flex-1 flex items-center justify-center px-20 relative overflow-hidden">
        {/* Sol ok */}
        <button
          onClick={() => go(-1)}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
          aria-label={t('prevSlide')}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Slide (key ile yeniden mount → animasyon tetiklenir) */}
        <div key={animKey} className="w-full">
          <Slide talent={talent} projects={projects} />
        </div>

        {/* Sağ ok */}
        <button
          onClick={() => go(1)}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white transition-all"
          aria-label={t('nextSlide')}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Alt bar */}
      <div className="flex-shrink-0 pb-6 flex flex-col items-center gap-3">
        {/* Nokta navigasyonu — 30 ve altı kayıtta göster */}
        {talents.length <= 30 && (
          <div className="flex items-center gap-1.5">
            {talents.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIndex(i); setAnimKey(k => k + 1) }}
                className={`rounded-full transition-all duration-200 ${
                  i === index
                    ? 'w-5 h-1.5 bg-white/60'
                    : 'w-1.5 h-1.5 bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
        <p className="text-white/20 text-xs">{t('keyboardHint')}</p>
      </div>
    </div>
  )
}

// ── Exported button ───────────────────────────────────────────────

export function TalentSlideshowButton({
  talents,
  projects,
}: {
  talents: SlideshowTalent[]
  projects: SlideshowProject[]
}) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('talent')
  if (talents.length === 0) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 bg-white px-3 py-1.5 rounded-lg transition-colors"
      >
        <Play className="w-3 h-3 fill-current" />
        {t('slideshow')}
      </button>

      {open && <Slideshow talents={talents} projects={projects} onClose={() => setOpen(false)} />}
    </>
  )
}
