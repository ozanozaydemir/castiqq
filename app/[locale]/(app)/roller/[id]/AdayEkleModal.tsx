'use client'

import { useState, useTransition } from 'react'
import { X, Search, UserPlus, Loader2, Check } from 'lucide-react'
import { addCandidate } from '@/app/actions/auditions'
import { useTranslations } from 'next-intl'

type Talent = { id: string; full_name: string; phone: string | null; email: string | null }

interface Props {
  roleId: string
  talents: Talent[]
  existingTalentIds: string[]
  onClose: () => void
}

export function AdayEkleModal({ roleId, talents, existingTalentIds, onClose }: Props) {
  const t = useTranslations('auditions')
  const tc = useTranslations('common')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const available = talents.filter(tl =>
    !existingTalentIds.includes(tl.id) &&
    tl.full_name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function handleSubmit() {
    if (selected.length === 0) return
    setError(null)
    startTransition(async () => {
      for (const talentId of selected) {
        const result = await addCandidate(roleId, talentId)
        console.log('[AdayEkleModal] addCandidate result:', result)
        if (result?.error) { setError(result.error); return }
      }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">{t('addCandidateTitle')}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t('addCandidateSubtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="sb-input pl-9"
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-64 overflow-y-auto space-y-1 -mx-1">
            {available.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                {talents.length === 0
                  ? t('noTalentYet')
                  : existingTalentIds.length >= talents.length
                  ? t('allAdded')
                  : t('noMatch')}
              </p>
            )}
            {available.map(tl => (
              <button
                key={tl.id}
                onClick={() => toggle(tl.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${
                  selected.includes(tl.id)
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  selected.includes(tl.id)
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'border-gray-300'
                }`}>
                  {selected.includes(tl.id) && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <span className="flex-1 font-medium">{tl.full_name}</span>
                {tl.phone && <span className="text-xs text-gray-400 flex-shrink-0">{tl.phone}</span>}
              </button>
            ))}
          </div>

          {selected.length > 0 && (
            <p className="text-xs text-indigo-600 font-medium">
              {t('selectedCount', { count: selected.length })}
            </p>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={isPending || selected.length === 0}
            className="sb-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('adding')}</>
              : <><UserPlus className="w-4 h-4" />
                  {selected.length > 1 ? t('selectedCount', { count: selected.length }) + ' ' + t('addCandidateTitle') : t('addCandidateTitle')}
                </>}
          </button>
        </div>
      </div>
    </div>
  )
}
