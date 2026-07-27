'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ClientModal } from './ClientModal'
import { createClientRecord, updateClient, deleteClient } from '@/app/actions/clients'
import type { Client } from '@/types/database'

export type ClientWithStats = Client & { bookingCount: number; totalNet: Record<string, number>; lastWorkDate: string | null }

export function ClientsListClient({ clients }: { clients: ClientWithStats[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('clients')

  const TYPE_LABELS: Record<string, string> = {
    yapim_sirketi: t('types.yapim_sirketi'), reklam_ajansi: t('types.reklam_ajansi'),
    marka: t('types.marka'), diger: t('types.diger'),
  }

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Client) { setEditing(c); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    startTransition(async () => { await deleteClient(id); router.refresh() })
  }

  const boundUpdate = editing ? updateClient.bind(null, editing.id) : null

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={openNew} className="sb-btn-primary">
          <Plus className="w-4 h-4" /> {t('addClient')}
        </button>
      </div>

      {clients.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('empty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="sb-card overflow-hidden">
          <table className="sb-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('type')}</th>
                <th>{t('bookingCount')}</th>
                <th>{t('totalRevenue')}</th>
                <th>{t('lastWork')}</th>
                <th className="text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td>
                    <p className="font-medium text-gray-900">{c.name}</p>
                    {c.contact_name && <p className="text-xs text-gray-400">{c.contact_name}</p>}
                  </td>
                  <td className="text-gray-500">{TYPE_LABELS[c.client_type] ?? c.client_type}</td>
                  <td className="text-gray-500">{c.bookingCount}</td>
                  <td className="text-gray-700 font-medium">
                    {Object.keys(c.totalNet).length === 0
                      ? '—'
                      : Object.entries(c.totalNet).map(([cur, amt]) => `${amt.toLocaleString('tr-TR')} ${cur}`).join(' · ')}
                  </td>
                  <td className="text-gray-500">{c.lastWorkDate ? new Date(c.lastWorkDate).toLocaleDateString('tr-TR') : '—'}</td>
                  <td>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => openEdit(c)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(c.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <ClientModal
          action={editing && boundUpdate ? boundUpdate : createClientRecord}
          editingClient={editing}
          onClose={closeModal}
        />
      )}
    </>
  )
}
