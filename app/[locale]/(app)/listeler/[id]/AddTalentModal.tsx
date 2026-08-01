'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addToCollection } from '@/app/actions/collections'
import { useRouter } from '@/i18n/navigation'
import { X, Search, UserPlus, Check, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type TalentResult = {
  id: string
  full_name: string
  city: string | null
  availability: string
  avatar_url: string | null
}

const AVAIL_DOT: Record<string, string> = {
  available:   'bg-green-400',
  busy:        'bg-amber-400',
  unavailable: 'bg-gray-300',
}

interface Props {
  collectionId: string
  existingIds: Set<string>
  onClose: () => void
}

export function AddTalentModal({ collectionId, existingIds, onClose }: Props) {
  const tc = useTranslations('collections')
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<TalentResult[]>([])
  const [loading, setLoading] = useState(true)
  const [added, setAdded]     = useState<Set<string>>(new Set())
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const timer = setTimeout(async () => {
      let q = supabase
        .from('talent')
        .select('id, full_name, city, availability, avatar_url')
        .order('full_name')
        .limit(40)
      if (query.trim()) q = q.ilike('full_name', `%${query.trim()}%`)
      const { data, error: err } = await q
      if (err) setError(err.message)
      else setResults(data ?? [])
      setLoading(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAdd(talentId: string) {
    if (pending || added.has(talentId) || existingIds.has(talentId)) return
    setPending(talentId)
    setError(null)
    const result = await addToCollection(collectionId, talentId)
    setPending(null)
    if (result?.error) { setError(result.error); return }
    setAdded(prev => new Set([...prev, talentId]))
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '82vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <h3 className="font-semibold text-gray-900 text-sm">{tc('addTalentTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={tc('searchTalentPlaceholder')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-indigo-400 transition-colors"
            />
          </div>
          {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 py-1">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">{tc('noTalentFound')}</p>
          )}

          {!loading && results.map(t => {
            const inList  = existingIds.has(t.id) || added.has(t.id)
            const loading = pending === t.id
            const initials = t.full_name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

            return (
              <button
                key={t.id}
                onClick={() => handleAdd(t.id)}
                disabled={inList || !!pending}
                className={`w-full flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 text-left transition-colors ${
                  inList
                    ? 'opacity-50 cursor-default'
                    : pending
                    ? 'opacity-70 cursor-wait'
                    : 'hover:bg-indigo-50 cursor-pointer'
                }`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {t.avatar_url
                    ? <img src={t.avatar_url} alt={t.full_name} className="w-full h-full object-cover" />
                    : <span className="text-xs font-semibold text-indigo-500">{initials}</span>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{t.full_name}</p>
                  {t.city && <p className="text-xs text-gray-400 truncate">{t.city}</p>}
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <span
                    className={`w-2 h-2 rounded-full ${AVAIL_DOT[t.availability] ?? AVAIL_DOT.unavailable}`}
                  />
                  {loading ? (
                    <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  ) : inList ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-gray-300" />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400">{tc('addTalentHint')}</p>
        </div>
      </div>
    </div>
  )
}
