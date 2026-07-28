'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Users, ArrowRightLeft, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PitchItemModal } from './PitchItemModal'
import {
  createPitchItem, updatePitchItem, deletePitchItem,
  updatePitchItemStatus, convertPitchItemToBooking,
} from '@/app/actions/pitches'
import type { PitchItem, BrandCategory } from '@/types/database'
import type { ExclusivityConflict } from '@/lib/crm'

export type PitchItemRow = PitchItem & { talentName: string }

const STATUS_STYLES: Record<string, string> = {
  onerildi:      'bg-gray-100 text-gray-600',
  on_elemede:    'bg-blue-50 text-blue-600',
  geri_cagrildi: 'bg-purple-50 text-purple-600',
  secildi:       'bg-green-50 text-green-700',
  elendi:        'bg-red-50 text-red-500',
  geri_cekildi:  'bg-gray-100 text-gray-400',
}

function money(n: number | null, currency: string) {
  if (n === null) return null
  return `${Number(n).toLocaleString('tr-TR')} ${currency}`
}

export function PitchItemsSection({
  pitchId,
  items,
  talents,
  brandCategory,
  conflictsByTalent,
}: {
  pitchId: string
  items: PitchItemRow[]
  talents: { id: string; full_name: string }[]
  brandCategory: BrandCategory | null
  conflictsByTalent: Record<string, ExclusivityConflict[]>
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PitchItem | null>(null)
  const [convertingId, setConvertingId] = useState<string | null>(null)
  const [convertError, setConvertError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('pitches.items')
  const tcl = useTranslations('clients')

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(i: PitchItem) { setEditing(i); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    startTransition(async () => { await deletePitchItem(id, pitchId); router.refresh() })
  }

  function handleStatus(id: string, status: string) {
    startTransition(async () => { await updatePitchItemStatus(id, pitchId, status); router.refresh() })
  }

  function handleConvert(id: string) {
    setConvertError(null)
    setConvertingId(id)
    startTransition(async () => {
      const res = await convertPitchItemToBooking(id, pitchId)
      setConvertingId(null)
      if (res?.error) setConvertError(res.error)
      else router.refresh()
    })
  }

  // Zaten teklifte olan oyuncular tekrar seçilemesin (DB'de de UNIQUE var).
  const availableTalents = talents.filter(t2 => !items.some(i => i.talent_id === t2.id))

  const boundCreate = createPitchItem.bind(null, pitchId)
  const boundUpdate = editing ? updatePitchItem.bind(null, editing.id, pitchId) : null

  return (
    <>
      <div className="sb-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addItem')}
          </button>
        </div>

        {convertError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm mb-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {convertError}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {items.map(i => {
              const conflicts = conflictsByTalent[i.talent_id] ?? []
              return (
                <div key={i.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link href={`/oyuncular/${i.talent_id}`} className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
                        {i.talentName}
                      </Link>
                      {i.role_name && <p className="text-xs text-gray-500 mt-0.5">{i.role_name}</p>}
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

                  {/* Kaşe pazarlığı: istenen → anlaşılan */}
                  {(i.proposed_fee !== null || i.client_offer !== null) && (
                    <p className="text-xs text-gray-600 mt-2">
                      <span className="text-gray-400">{t('proposedVsAgreed') ?? ''}</span>
                      {i.proposed_fee !== null && <span className="font-medium">{money(i.proposed_fee, i.currency)}</span>}
                      {i.proposed_fee !== null && i.client_offer !== null && <span className="text-gray-300"> → </span>}
                      {i.client_offer !== null && (
                        <span className="font-semibold text-gray-900">{money(i.client_offer, i.currency)}</span>
                      )}
                      {i.fee_type && <span className="text-gray-400"> · {t(`feeTypes.${i.fee_type}`)}</span>}
                    </p>
                  )}

                  {i.client_feedback && (
                    <p className="text-xs text-gray-400 italic mt-1">{i.client_feedback}</p>
                  )}

                  {conflicts.length > 0 && brandCategory && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-red-500 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
                      <div>
                        {conflicts.map(c => (
                          <p key={c.bookingId}>
                            {t('exclusivityConflictDetail', {
                              client: c.clientName,
                              category: tcl(`brandCategories.${c.category}`),
                              date: new Date(c.endDate).toLocaleDateString('tr-TR'),
                            })}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mt-2.5">
                    <select
                      value={i.status}
                      disabled={isPending || i.booking_id !== null}
                      onChange={e => handleStatus(i.id, e.target.value)}
                      className={`text-xs font-medium px-2 py-1 rounded-lg cursor-pointer appearance-none border-0 disabled:opacity-60 ${STATUS_STYLES[i.status]}`}
                    >
                      {['onerildi', 'on_elemede', 'geri_cagrildi', 'secildi', 'elendi', 'geri_cekildi'].map(s => (
                        <option key={s} value={s}>{t(`statuses.${s}`)}</option>
                      ))}
                    </select>

                    {i.booking_id ? (
                      <Link
                        href={`/oyuncular/${i.talent_id}`}
                        className="flex items-center gap-1 text-xs text-green-600 font-medium hover:text-green-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> {t('converted')}
                      </Link>
                    ) : i.status === 'secildi' ? (
                      <button
                        onClick={() => handleConvert(i.id)}
                        disabled={isPending}
                        title={t('convertHint')}
                        className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-60"
                      >
                        {convertingId === i.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <ArrowRightLeft className="w-3.5 h-3.5" />}
                        {t('convertToBooking')}
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <PitchItemModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingItem={editing}
          talents={editing ? talents : availableTalents}
          brandCategory={brandCategory}
          conflictsByTalent={conflictsByTalent}
          onClose={closeModal}
        />
      )}
    </>
  )
}
