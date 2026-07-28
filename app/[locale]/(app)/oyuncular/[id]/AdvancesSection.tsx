'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Wallet } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { AdvanceModal } from './AdvanceModal'
import { createAdvance, updateAdvance, deleteAdvance, toggleAdvanceSettled } from '@/app/actions/advances'
import type { TalentAdvance } from '@/types/database'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR')
}

export function AdvancesSection({ talentId, advances }: { talentId: string; advances: TalentAdvance[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TalentAdvance | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('talent.advances')

  const outstanding = advances.filter(a => !a.is_settled)
  const totalsByCurrency: Record<string, number> = {}
  for (const a of outstanding) {
    totalsByCurrency[a.currency] = (totalsByCurrency[a.currency] ?? 0) + Number(a.amount)
  }

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(a: TalentAdvance) { setEditing(a); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteAdvance(id, talentId); router.refresh() })
  }

  function handleToggleSettled(id: string, current: boolean) {
    startTransition(async () => { await toggleAdvanceSettled(id, talentId, !current); router.refresh() })
  }

  const boundCreate = createAdvance.bind(null, talentId)
  const boundUpdate = editing ? updateAdvance.bind(null, editing.id, talentId) : null

  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('addAdvance')}
        </button>
      </div>

      {Object.keys(totalsByCurrency).length > 0 && (
        <p className="text-xs text-amber-600 font-medium mb-3">
          {t('outstandingTotal')}: {Object.entries(totalsByCurrency).map(([cur, amt]) => `${amt.toLocaleString('tr-TR')} ${cur}`).join(' · ')}
        </p>
      )}

      {advances.length === 0 ? (
        <p className="text-sm text-gray-400 py-4 text-center">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {advances.map(a => (
            <div key={a.id} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-900">{t(`types.${a.type}`)}: {Number(a.amount).toLocaleString('tr-TR')} {a.currency}</p>
                  {a.is_settled && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">{t('settled')}</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{formatDate(a.date)}</p>
                {a.description && <p className="text-xs text-gray-400 italic mt-0.5">{a.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => handleToggleSettled(a.id, a.is_settled)} disabled={isPending} className="text-[10px] font-medium px-2 py-1 rounded-lg border border-gray-200 text-gray-500 hover:border-indigo-300 hover:text-indigo-600 transition-colors">
                  {a.is_settled ? t('markUnsettled') : t('markSettled')}
                </button>
                <button onClick={() => openEdit(a)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(a.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AdvanceModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingAdvance={editing}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
