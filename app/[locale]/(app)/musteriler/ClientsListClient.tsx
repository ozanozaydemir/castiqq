'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Building2, AlertTriangle, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ClientModal } from './ClientModal'
import { createClientRecord, updateClient, deleteClient } from '@/app/actions/clients'
import { TIER_STYLES, PAYMENT_RATING_STYLES, WORKING_STATUS_STYLES } from '@/lib/crm'
import type { Client } from '@/types/database'

export type ClientWithStats = Client & {
  bookingCount: number
  totalNet: Record<string, number>
  lastWorkDate: string | null
  outstanding: number
  overdueCount: number
  primaryContact: string | null
}

export function ClientsListClient({
  clients,
  teamMembers = [],
}: {
  clients: ClientWithStats[]
  teamMembers?: { id: string; full_name: string }[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tierFilter, setTierFilter] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('clients')

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(c: Client) { setEditing(c); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    startTransition(async () => { await deleteClient(id); router.refresh() })
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase('tr')
    return clients.filter(c => {
      if (statusFilter && c.working_status !== statusFilter) return false
      if (tierFilter && c.tier !== tierFilter) return false
      if (!q) return true
      return c.name.toLocaleLowerCase('tr').includes(q)
        || (c.primaryContact?.toLocaleLowerCase('tr').includes(q) ?? false)
    })
  }, [clients, search, statusFilter, tierFilter])

  const boundUpdate = editing ? updateClient.bind(null, editing.id) : null
  const allClientOptions = clients.map(c => ({ id: c.id, name: c.name }))

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('name')}
            className="sb-input pl-9 w-full"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sb-input sm:w-44">
          <option value="">{t('filterStatus')}: {t('filterAll')}</option>
          {['aktif', 'potansiyel', 'gecmis', 'kara_liste'].map(k => (
            <option key={k} value={k}>{t(`workingStatuses.${k}`)}</option>
          ))}
        </select>
        <select value={tierFilter} onChange={e => setTierFilter(e.target.value)} className="sb-input sm:w-40">
          <option value="">{t('filterTier')}: {t('filterAll')}</option>
          {['tier_1', 'tier_2', 'tier_3'].map(k => (
            <option key={k} value={k}>{t(`tiers.${k}`)}</option>
          ))}
        </select>
        <button onClick={openNew} className="sb-btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> {t('addClient')}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('empty')}</p>
          <p className="text-gray-400 text-sm mt-1">{t('emptyHint')}</p>
        </div>
      ) : (
        <div className="sb-card overflow-x-auto">
          <table className="sb-table">
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('type')}</th>
                <th>{t('workingStatus')}</th>
                <th>{t('paymentRating')}</th>
                <th>{t('bookingCount')}</th>
                <th>{t('totalRevenue')}</th>
                <th>{t('risk.outstanding')}</th>
                <th className="text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <Link href={`/musteriler/${c.id}`} className="font-medium text-gray-900 hover:text-indigo-600">{c.name}</Link>
                      {c.tier === 'tier_1' && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${TIER_STYLES.tier_1}`}>
                          {t('tiers.tier_1')}
                        </span>
                      )}
                    </div>
                    {c.primaryContact && <p className="text-xs text-gray-400">{c.primaryContact}</p>}
                  </td>
                  <td className="text-gray-500">{t(`types.${c.client_type}`)}</td>
                  <td>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${WORKING_STATUS_STYLES[c.working_status]}`}>
                      {t(`workingStatuses.${c.working_status}`)}
                    </span>
                  </td>
                  <td>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${PAYMENT_RATING_STYLES[c.payment_rating]}`}>
                      {t(`paymentRatings.${c.payment_rating}`)}
                    </span>
                  </td>
                  <td className="text-gray-500">{c.bookingCount}</td>
                  <td className="text-gray-700 font-medium whitespace-nowrap">
                    {Object.keys(c.totalNet).length === 0
                      ? '—'
                      : Object.entries(c.totalNet).map(([cur, amt]) => `${amt.toLocaleString('tr-TR')} ${cur}`).join(' · ')}
                  </td>
                  <td className="whitespace-nowrap">
                    {c.outstanding > 0 ? (
                      <span className={`inline-flex items-center gap-1 text-sm font-medium ${c.overdueCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {c.overdueCount > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
                        {c.outstanding.toLocaleString('tr-TR')} TRY
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
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
          teamMembers={teamMembers}
          allClients={allClientOptions}
          onClose={closeModal}
        />
      )}
    </>
  )
}
