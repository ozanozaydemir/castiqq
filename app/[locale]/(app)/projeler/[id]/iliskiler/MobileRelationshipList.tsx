'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Trash2, ArrowRight, ArrowLeftRight, Loader2, Monitor, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TYPE_STYLE, ALL_TYPES, isSymmetric } from '@/lib/role-relationships'
import { createRelationship, deleteRelationship } from '@/app/actions/role-relationships'
import type { RelationshipType } from '@/types/database'
import type { DiagramRole, DiagramRelationship } from './RelationshipDiagram'

interface Props {
  projectId: string
  roles: DiagramRole[]
  relationships: DiagramRelationship[]
}

/**
 * Mobil görünüm. Node grafiği küçük ekranda kullanılabilir değil; kırpılmış bir
 * tuval göstermek yerine aynı veriyi yapılandırılmış liste olarak veriyoruz.
 */
export function MobileRelationshipList({ projectId, roles, relationships }: Props) {
  const t = useTranslations('relationships')
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, start] = useTransition()

  const roleNames = useMemo(() => new Map(roles.map(r => [r.id, r.name])), [roles])

  function handleDelete(id: string) {
    setBusyId(id)
    start(async () => {
      await deleteRelationship(id, projectId)
      router.refresh()
      setBusyId(null)
    })
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex items-start gap-2">
        <Monitor className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-500">{t('mobileNotice')}</p>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-800">
          {t('relationshipCount', { count: relationships.length })}
        </p>
        <button onClick={() => setAdding(true)} className="sb-btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> {t('addRelationship')}
        </button>
      </div>

      {relationships.length === 0 ? (
        <div className="sb-card p-8 text-center">
          <p className="text-sm text-gray-400">{t('emptyList')}</p>
        </div>
      ) : (
        <div className="sb-card divide-y divide-gray-50">
          {relationships.map(rel => {
            const style = TYPE_STYLE[rel.type]
            const sym = isSymmetric(rel.type)
            return (
              <div key={rel.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="w-1 h-8 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm text-gray-900 min-w-0">
                    <span className="truncate">{roleNames.get(rel.from_role_id) ?? '?'}</span>
                    {sym
                      ? <ArrowLeftRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                      : <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />}
                    <span className="truncate">{roleNames.get(rel.to_role_id) ?? '?'}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {rel.label || t(`type.${rel.type}`)}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(rel.id)}
                  disabled={busyId === rel.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                >
                  {busyId === rel.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {adding && (
        <AddRelationshipSheet
          projectId={projectId}
          roles={roles}
          onClose={() => setAdding(false)}
          onDone={() => { setAdding(false); router.refresh() }}
        />
      )}
    </div>
  )
}

function AddRelationshipSheet({ projectId, roles, onClose, onDone }: {
  projectId: string
  roles: DiagramRole[]
  onClose: () => void
  onDone: () => void
}) {
  const t = useTranslations('relationships')
  const [from, setFrom] = useState(roles[0]?.id ?? '')
  const [to, setTo]     = useState(roles[1]?.id ?? '')
  const [type, setType] = useState<RelationshipType>('spouse')
  const [label, setLabel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  function handleSave() {
    setError(null)
    if (from === to) { setError(t('sameRoleError')); return }
    start(async () => {
      const res = await createRelationship(projectId, from, to, type, label)
      if (res?.error) { setError(res.error); return }
      onDone()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{t('newTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('fromRole')}</label>
            <select value={from} onChange={e => setFrom(e.target.value)} className="sb-input">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('typeLabel')}</label>
            <select value={type} onChange={e => setType(e.target.value as RelationshipType)} className="sb-input">
              {ALL_TYPES.map(opt => <option key={opt} value={opt}>{t(`type.${opt}`)}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('toRole')}</label>
            <select value={to} onChange={e => setTo(e.target.value)} className="sb-input">
              {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('labelLabel')}</label>
            <input
              value={label} onChange={e => setLabel(e.target.value)}
              placeholder={t('labelPlaceholder')} className="sb-input" maxLength={60}
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="sb-btn-secondary flex-1 text-sm">{t('cancel')}</button>
            <button onClick={handleSave} disabled={pending} className="sb-btn-primary flex-1 text-sm justify-center disabled:opacity-50">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : t('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
