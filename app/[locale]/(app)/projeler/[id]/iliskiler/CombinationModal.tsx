'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, ChevronLeft, ChevronRight, Loader2, Star, Pencil, UserX } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DiagramRelationship } from './RelationshipDiagram'

type Candidate = {
  auditionId: string
  rating: number | null
  status: string
  talent: {
    id: string
    full_name: string
    avatar_url: string | null
    photos: string[] | null
    height_cm: number | null
    playable_age_min: number | null
    playable_age_max: number | null
  }
}

/** Kamerada göze batmaya başlayan boy farkı — casting direktörlerinin pratik eşiği. */
const HEIGHT_DIFF_WARN = 30

interface Props {
  relationship: DiagramRelationship
  roleNames: Map<string, string>
  onEditRelationship: () => void
  onClose: () => void
}

export function CombinationModal({ relationship, roleNames, onEditRelationship, onClose }: Props) {
  const t = useTranslations('relationships')
  const supabase = createClient()

  const [left, setLeft]   = useState<Candidate[]>([])
  const [right, setRight] = useState<Candidate[]>([])
  const [li, setLi]       = useState(0)
  const [ri, setRi]       = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const leftRole  = roleNames.get(relationship.from_role_id) ?? '?'
  const rightRole = roleNames.get(relationship.to_role_id)  ?? '?'

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const sel = 'id, rating, status, talent:talent_id(id, full_name, avatar_url, photos, height_cm, playable_age_min, playable_age_max)'
      const [a, b] = await Promise.all([
        supabase.from('auditions').select(sel).eq('role_id', relationship.from_role_id),
        supabase.from('auditions').select(sel).eq('role_id', relationship.to_role_id),
      ])
      if (cancelled) return
      if (a.error || b.error) {
        setError(a.error?.message ?? b.error?.message ?? 'error')
        setLoading(false)
        return
      }
      // talent_id boş olan başvurular (yalnızca isimle girilmiş) karşılaştırmaya girmiyor.
      const norm = (rows: unknown[]): Candidate[] =>
        (rows as Candidate[])
          .filter(r => r.talent)
          .sort((x, y) => (y.rating ?? -1) - (x.rating ?? -1))
      setLeft(norm(a.data ?? []))
      setRight(norm(b.data ?? []))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationship.from_role_id, relationship.to_role_id])

  const step = useCallback((side: 'l' | 'r', dir: 1 | -1) => {
    if (side === 'l') setLi(i => (left.length ? (i + dir + left.length) % left.length : 0))
    else setRi(i => (right.length ? (i + dir + right.length) % right.length : 0))
  }, [left.length, right.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft')  step('l', 1)
      if (e.key === 'ArrowRight') step('r', 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [step, onClose])

  const lc = left[li]
  const rc = right[ri]

  const heightDiff = lc?.talent.height_cm && rc?.talent.height_cm
    ? Math.abs(lc.talent.height_cm - rc.talent.height_cm)
    : null

  const ageDiff = (() => {
    const mid = (c?: Candidate) => {
      const lo = c?.talent.playable_age_min, hi = c?.talent.playable_age_max
      if (lo != null && hi != null) return (lo + hi) / 2
      return lo ?? hi ?? null
    }
    const a = mid(lc), b = mid(rc)
    return a != null && b != null ? Math.abs(a - b) : null
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">
              {t('comboTitle', { a: leftRole, b: rightRole })}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('comboHint')}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onEditRelationship}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title={t('editTitle')}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="h-72 flex items-center justify-center text-gray-300">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-red-500">{error}</div>
        ) : (
          <>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <CandidatePane
                roleName={leftRole} list={left} index={li}
                onPrev={() => step('l', -1)} onNext={() => step('l', 1)}
                emptyLabel={t('noCandidate')}
              />
              <CandidatePane
                roleName={rightRole} list={right} index={ri}
                onPrev={() => step('r', -1)} onNext={() => step('r', 1)}
                emptyLabel={t('noCandidate')}
              />
            </div>

            {/* Uyum ölçüleri */}
            {(heightDiff != null || ageDiff != null) && (
              <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap items-center gap-x-6 gap-y-1.5">
                {heightDiff != null && (
                  <span className={`text-xs flex items-center gap-1.5 ${
                    heightDiff > HEIGHT_DIFF_WARN ? 'text-amber-600 font-medium' : 'text-gray-500'
                  }`}>
                    {t('heightDiff', { cm: heightDiff })}
                    {heightDiff > HEIGHT_DIFF_WARN && <span>· {t('heightDiffWarn')}</span>}
                  </span>
                )}
                {ageDiff != null && (
                  <span className="text-xs text-gray-500">{t('ageDiff', { years: Math.round(ageDiff) })}</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CandidatePane({ roleName, list, index, onPrev, onNext, emptyLabel }: {
  roleName: string
  list: Candidate[]
  index: number
  onPrev: () => void
  onNext: () => void
  emptyLabel: string
}) {
  const c = list[index]
  const photo = c?.talent.avatar_url ?? c?.talent.photos?.[0] ?? null

  return (
    <div className="p-5">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide text-center mb-3">
        {roleName}
      </p>

      {!c ? (
        <div className="h-52 flex flex-col items-center justify-center text-gray-300 gap-2">
          <UserX className="w-8 h-8" />
          <p className="text-xs">{emptyLabel}</p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={onPrev}
              disabled={list.length < 2}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-25"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0 flex flex-col items-center">
              <div className="w-28 h-28 rounded-xl bg-indigo-50 overflow-hidden flex items-center justify-center">
                {photo
                  ? <img src={photo} alt={c.talent.full_name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-indigo-300">
                      {c.talent.full_name.split(' ').map(w => w[0]).slice(0, 2).join('')}
                    </span>}
              </div>
              <p className="text-sm font-semibold text-gray-900 mt-2 text-center truncate w-full">
                {c.talent.full_name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {[
                  c.talent.height_cm ? `${c.talent.height_cm} cm` : null,
                  c.talent.playable_age_min && c.talent.playable_age_max
                    ? `${c.talent.playable_age_min}–${c.talent.playable_age_max}`
                    : null,
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-0.5 mt-1.5">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`w-3 h-3 ${
                      (c.rating ?? 0) >= n ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={onNext}
              disabled={list.length < 2}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-25"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-gray-300 text-center mt-2">{index + 1} / {list.length}</p>
        </>
      )}
    </div>
  )
}
