'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Sparkles, UserPlus, Check, MapPin } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { addCandidate } from '@/app/actions/auditions'
import type { MatchResult } from '@/lib/roleMatching'

const AVAIL_DOT: Record<string, string> = { available: 'bg-green-400', busy: 'bg-amber-400', unavailable: 'bg-gray-300' }
const VISIBLE_COUNT = 10

function InitialsAvatar({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)
  return (
    <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
      <span className="text-xs font-bold text-indigo-600">{initials.toUpperCase()}</span>
    </div>
  )
}

export function RoleMatches({ roleId, matches, existingTalentIds }: { roleId: string; matches: MatchResult[]; existingTalentIds: string[] }) {
  const [added, setAdded] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('roles.matching')

  function handleAdd(talentId: string) {
    setPendingId(talentId)
    startTransition(async () => {
      const result = await addCandidate(roleId, talentId)
      if (!result?.error) setAdded(prev => [...prev, talentId])
      setPendingId(null)
      router.refresh()
    })
  }

  function reasonLabel(reason: MatchResult['reasons'][number]): string {
    switch (reason.type) {
      case 'gender': return t('reasonGender')
      case 'age': return t('reasonAge')
      case 'height': return t('reasonHeight')
      case 'skills': return t('reasonSkills', { count: reason.count })
      case 'city': return t('reasonCity')
      case 'available': return t('reasonAvailable')
    }
  }

  if (matches.length === 0) {
    return (
      <div className="sb-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">{t('title')}</h3>
        </div>
        <p className="text-sm text-gray-400 py-4 text-center">{t('empty')}</p>
      </div>
    )
  }

  const visible = showAll ? matches : matches.slice(0, VISIBLE_COUNT)

  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-700">{t('title')}</h3>
        </div>
        <span className="text-xs text-gray-400">{t('resultCount', { count: matches.length })}</span>
      </div>

      <div className="space-y-2 mt-3">
        {visible.map(({ talent, reasons }) => {
          const alreadyAdded = existingTalentIds.includes(talent.id) || added.includes(talent.id)
          return (
            <div key={talent.id} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="relative flex-shrink-0">
                {talent.photos?.[0] ? (
                  <img src={talent.photos[0]} alt="" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <InitialsAvatar name={talent.full_name} />
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${AVAIL_DOT[talent.availability] ?? 'bg-gray-300'}`} />
              </div>

              <div className="min-w-0 flex-1">
                <Link href={`/oyuncular/${talent.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 truncate block">
                  {talent.full_name}
                </Link>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {talent.city && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{talent.city}</span>
                  )}
                  {reasons.map((r, i) => (
                    <span key={i} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                      {reasonLabel(r)}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAdd(talent.id)}
                disabled={alreadyAdded || (isPending && pendingId === talent.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                  alreadyAdded
                    ? 'text-green-600 bg-green-50 cursor-default'
                    : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                }`}
              >
                {alreadyAdded ? <><Check className="w-3.5 h-3.5" /> {t('added')}</> : <><UserPlus className="w-3.5 h-3.5" /> {t('addCta')}</>}
              </button>
            </div>
          )
        })}
      </div>

      {matches.length > VISIBLE_COUNT && !showAll && (
        <button onClick={() => setShowAll(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-3">
          {t('showAll', { count: matches.length - VISIBLE_COUNT })}
        </button>
      )}
    </div>
  )
}
