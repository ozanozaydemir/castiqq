'use client'

import { useState, useTransition } from 'react'
import { X, ArrowRight, ArrowLeftRight, Loader2, Trash2, RefreshCw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ALL_TYPES, TYPE_STYLE, isSymmetric } from '@/lib/role-relationships'
import type { RelationshipType } from '@/types/database'

export type PendingEdge = {
  /** Var olan bir ilişki düzenleniyorsa dolu; yeni bağlantıda null. */
  id: string | null
  fromRoleId: string
  toRoleId: string
  type: RelationshipType
  label: string
}

interface Props {
  edge: PendingEdge
  roleNames: Map<string, string>
  onSave: (edge: PendingEdge) => Promise<{ error?: string } | void>
  onDelete?: (id: string) => Promise<{ error?: string } | void>
  onClose: () => void
}

export function RelationshipModal({ edge, roleNames, onSave, onDelete, onClose }: Props) {
  const t = useTranslations('relationships')
  const [type, setType]   = useState<RelationshipType>(edge.type)
  const [label, setLabel] = useState(edge.label)
  const [from, setFrom]   = useState(edge.fromRoleId)
  const [to, setTo]       = useState(edge.toRoleId)
  const [error, setError] = useState<string | null>(null)
  const [pending, start]  = useTransition()

  const symmetric = isSymmetric(type)
  const fromName  = roleNames.get(from) ?? '?'
  const toName    = roleNames.get(to) ?? '?'

  function handleSave() {
    setError(null)
    start(async () => {
      const res = await onSave({ id: edge.id, fromRoleId: from, toRoleId: to, type, label })
      if (res?.error) { setError(res.error); return }
      onClose()
    })
  }

  function handleDelete() {
    if (!edge.id || !onDelete) return
    setError(null)
    start(async () => {
      const res = await onDelete(edge.id!)
      if (res?.error) { setError(res.error); return }
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">
            {edge.id ? t('editTitle') : t('newTitle')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Yön göstergesi */}
          <div className="flex items-center gap-2 text-sm bg-gray-50 rounded-xl px-3 py-2.5">
            <span className="font-medium text-gray-900 truncate flex-1 text-right">{fromName}</span>
            {symmetric
              ? <ArrowLeftRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              : <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
            <span className="font-medium text-gray-900 truncate flex-1">{toName}</span>
          </div>

          {/* Yönlü tiplerde yönü ters çevirme */}
          {!symmetric && (
            <button
              onClick={() => { setFrom(to); setTo(from) }}
              className="w-full inline-flex items-center justify-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 hover:border-indigo-300 rounded-lg py-1.5 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> {t('swapDirection')}
            </button>
          )}

          {/* Tip seçimi */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('typeLabel')}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_TYPES.map(opt => {
                const active = type === opt
                const style  = TYPE_STYLE[opt]
                return (
                  <button
                    key={opt}
                    onClick={() => setType(opt)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs transition-colors ${
                      active
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 font-medium'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span
                      className="w-3 h-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: style.color,
                        ...(style.dashed
                          ? { backgroundImage: `repeating-linear-gradient(to right, ${style.color} 0 3px, transparent 3px 5px)`, backgroundColor: 'transparent' }
                          : {}),
                      }}
                    />
                    {t(`type.${opt}`)}
                  </button>
                )
              })}
            </div>
            {!symmetric && (
              <p className="text-[11px] text-gray-400 pt-0.5">{t(`directionHint.${type}`, { from: fromName, to: toName })}</p>
            )}
          </div>

          {/* Serbest etiket */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('labelLabel')}</label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')}
              className="sb-input"
              maxLength={60}
            />
          </div>

          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            {edge.id && onDelete && (
              <button
                onClick={handleDelete}
                disabled={pending}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors disabled:opacity-50"
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="sb-btn-secondary flex-1 text-sm">{t('cancel')}</button>
            <button
              onClick={handleSave}
              disabled={pending}
              className="sb-btn-primary flex-1 text-sm disabled:opacity-50 justify-center"
            >
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
