'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RepresentationHistoryModal } from './RepresentationHistoryModal'
import { createRepresentationPeriod, updateRepresentationPeriod, deleteRepresentationPeriod } from '@/app/actions/representationHistory'
import type { RepresentationPeriod } from '@/types/database'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('tr-TR')
}

export function RepresentationHistorySection({ talentId, periods }: { talentId: string; periods: RepresentationPeriod[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<RepresentationPeriod | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('talent.repHistory')

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(p: RepresentationPeriod) { setEditing(p); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteRepresentationPeriod(id, talentId); router.refresh() })
  }

  const boundCreate = createRepresentationPeriod.bind(null, talentId)
  const boundUpdate = editing ? updateRepresentationPeriod.bind(null, editing.id, talentId) : null

  if (periods.length === 0 && !modalOpen) {
    return (
      <div className="sb-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addPeriod')}
          </button>
        </div>
        <p className="text-sm text-gray-400 py-4 text-center">{t('empty')}</p>
        {modalOpen && <RepresentationHistoryModal action={boundCreate} editingPeriod={null} onClose={closeModal} />}
      </div>
    )
  }

  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('addPeriod')}
        </button>
      </div>

      <div className="space-y-2">
        {periods.map(p => (
          <div key={p.id} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {formatDate(p.start_date)} — {p.end_date ? formatDate(p.end_date) : t('present')}
              </p>
              {p.commission_rate !== null && <p className="text-xs text-gray-500 mt-0.5">{t('commissionRate')}: %{p.commission_rate}</p>}
              {p.notes && <p className="text-xs text-gray-400 italic mt-0.5">{p.notes}</p>}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => openEdit(p)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => handleDelete(p.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <RepresentationHistoryModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingPeriod={editing}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
