'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { addToCollectionByName } from '@/app/actions/collections'
import { useRouter } from '@/i18n/navigation'
import { ListPlus, Check, ChevronDown, Plus, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type CollectionOption = { id: string; name: string }

interface Props {
  talentId: string
  collections: CollectionOption[]
}

export function AddToCollectionButton({ talentId, collections }: Props) {
  const [open, setOpen]         = useState(false)
  const [custom, setCustom]     = useState('')
  const [added, setAdded]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)
  const [isPending, start]      = useTransition()
  const ref                     = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const tc = useTranslations('collections')

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleAdd(name: string) {
    if (!name.trim()) return
    setError(null)
    start(async () => {
      const { error } = await addToCollectionByName(talentId, name)
      if (error) { setError(error); return }
      setAdded(name)
      setOpen(false)
      router.refresh()
      setTimeout(() => setAdded(null), 2500)
    })
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
      >
        {added
          ? <><Check className="w-3.5 h-3.5 text-green-500" /> {tc('addedToList', { name: added })}</>
          : <><ListPlus className="w-3.5 h-3.5" /> {tc('addToList')} <ChevronDown className="w-3 h-3" /></>}
      </button>

      {open && (
        <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-lg border border-gray-200 w-56 overflow-hidden">
          {collections.length > 0 && (
            <div className="border-b border-gray-100">
              {collections.map(c => (
                <button
                  key={c.id}
                  onMouseDown={() => handleAdd(c.name)}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <ListPlus className="w-3.5 h-3.5 text-gray-400" /> {c.name}
                </button>
              ))}
            </div>
          )}
          <div className="p-2">
            <div className="flex gap-1.5">
              <input
                value={custom}
                onChange={e => setCustom(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(custom) }}
                placeholder={tc('newListPlaceholder')}
                className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-400"
              />
              <button
                onMouseDown={() => handleAdd(custom)}
                disabled={isPending || !custom.trim()}
                className="px-2 py-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>
        </div>
      )}
    </div>
  )
}
