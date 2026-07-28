'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, History } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { InteractionModal } from './InteractionModal'
import { createInteraction, updateInteraction, deleteInteraction } from '@/app/actions/clientInteractions'
import type { ClientInteraction, ClientContact } from '@/types/database'

export type InteractionRow = ClientInteraction & { talent: { full_name: string } | null }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR')
}

const TYPE_COLORS: Record<string, string> = {
  tanisma: 'bg-blue-50 text-blue-600',
  telefon_gorusmesi: 'bg-gray-100 text-gray-600',
  toplanti: 'bg-gray-100 text-gray-600',
  oyuncu_onerisi: 'bg-indigo-50 text-indigo-600',
  audition_talebi: 'bg-purple-50 text-purple-600',
  okuma_provasi: 'bg-teal-50 text-teal-600',
  kostum_provasi: 'bg-pink-50 text-pink-600',
  deneme_cekimi: 'bg-amber-50 text-amber-600',
  sozlesme_gorusmesi: 'bg-green-50 text-green-600',
  diger: 'bg-gray-100 text-gray-500',
}

export function InteractionsSection({ clientId, interactions, talents, contacts = [] }: { clientId: string; interactions: InteractionRow[]; talents: { id: string; full_name: string }[]; contacts?: ClientContact[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClientInteraction | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('clients.interactions')

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(i: ClientInteraction) { setEditing(i); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteInteraction(id, clientId); router.refresh() })
  }

  const contactNames = new Map(contacts.map(c => [c.id, c.full_name]))

  const boundCreate = createInteraction.bind(null, clientId)
  const boundUpdate = editing ? updateInteraction.bind(null, editing.id, clientId) : null

  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
        </div>
        <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
          <Plus className="w-4 h-4" /> {t('addInteraction')}
        </button>
      </div>

      {interactions.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">{t('empty')}</p>
      ) : (
        <div className="space-y-2">
          {interactions.map(i => (
            <div key={i.id} className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[i.interaction_type]}`}>
                    {t(`types.${i.interaction_type}`)}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(i.interaction_date)}</span>
                  {i.talent && (
                    <Link href={`/oyuncular/${i.talent_id}`} className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
                      {i.talent.full_name}
                    </Link>
                  )}
                  {i.contact_id && contactNames.get(i.contact_id) && (
                    <span className="text-xs text-gray-500">{contactNames.get(i.contact_id)}</span>
                  )}
                </div>
                {i.notes && <p className="text-sm text-gray-600 mt-1.5 whitespace-pre-line">{i.notes}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => openEdit(i)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(i.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <InteractionModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingInteraction={editing}
          talents={talents}
          contacts={contacts}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
