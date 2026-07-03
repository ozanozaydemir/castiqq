'use client'

import { useState, useTransition, useActionState } from 'react'
import { createCollection, deleteCollection } from '@/app/actions/collections'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Plus, X, ListPlus, Trash2, Users, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Collection = {
  id: string
  name: string
  description: string | null
  created_at: string
  item_count: number
}

interface Props {
  collections: Collection[]
}

function CreateModal({ onClose }: { onClose: () => void }) {
  const [state, formAction, isPending] = useActionState(createCollection, null)
  const router = useRouter()
  const tc = useTranslations('collections')

  if (state?.id) {
    router.refresh()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{tc('createNew')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <form action={formAction} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{tc('listName')}</label>
            <input name="name" className="sb-input" placeholder={tc('listNamePlaceholder')} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{tc('description')}</label>
            <input name="description" className="sb-input" placeholder={tc('descriptionPlaceholder')} />
          </div>
          {state?.error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{state.error}</p>
          )}
          <button type="submit" disabled={isPending} className="sb-btn-primary w-full">
            {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> {tc('creating')}</> : <><ListPlus className="w-4 h-4" /> {tc('create')}</>}
          </button>
        </form>
      </div>
    </div>
  )
}

export function ListelerClient({ collections }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [, startDelete] = useTransition()
  const router = useRouter()
  const tc = useTranslations('collections')

  function handleDelete(id: string, name: string) {
    if (!confirm(tc('deleteConfirm', { name }))) return
    startDelete(async () => {
      await deleteCollection(id)
      router.refresh()
    })
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div />
        <button onClick={() => setShowCreate(true)} className="sb-btn-primary">
          <Plus className="w-4 h-4" /> {tc('new')}
        </button>
      </div>

      {collections.length === 0 ? (
        <div className="sb-card p-12 text-center">
          <ListPlus className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{tc('empty')}</p>
          <p className="text-gray-300 text-sm mt-1">{tc('emptyHint')}</p>
          <button onClick={() => setShowCreate(true)} className="sb-btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> {tc('createFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map(col => (
            <div key={col.id} className="sb-card p-5 flex flex-col gap-3 hover:border-indigo-200 transition-colors group">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/listeler/${col.id}`} className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{col.name}</h3>
                  {col.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{col.description}</p>}
                </Link>
                <button
                  onClick={() => handleDelete(col.id, col.name)}
                  className="flex-shrink-0 text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Users className="w-3.5 h-3.5" />
                {tc('talentCount', { count: col.item_count })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} />}
    </>
  )
}
