'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, FileCheck2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { DocumentModal } from './DocumentModal'
import { DocumentDownloadButton } from './DocumentDownloadButton'
import { createDocument, updateDocument, deleteDocument } from '@/app/actions/documents'
import type { TalentDocument } from '@/types/database'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('tr-TR')
}

export function DocumentsSection({ talentId, documents }: { talentId: string; documents: TalentDocument[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<TalentDocument | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('talent.documents')

  const TYPE_LABELS: Record<string, string> = {
    kimlik: t('types.kimlik'), saglik_raporu: t('types.saglik_raporu'), calisma_izni: t('types.calisma_izni'),
    pasaport: t('types.pasaport'), vize: t('types.vize'), veli_izni: t('types.veli_izni'), diger: t('types.diger'),
  }

  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(d: TalentDocument) { setEditing(d); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    startTransition(async () => { await deleteDocument(id, talentId); router.refresh() })
  }

  const boundCreate = createDocument.bind(null, talentId)
  const boundUpdate = editing ? updateDocument.bind(null, editing.id, talentId) : null

  return (
    <>
      <div className="sb-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addDocument')}
          </button>
        </div>

        {documents.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('empty')}</p>
        ) : (
          <div className="space-y-2">
            {documents.map(d => {
              const expired = d.expiry_date !== null && d.expiry_date < today
              const expiringSoon = !expired && d.expiry_date !== null && d.expiry_date <= thirtyDaysLater
              return (
                <div key={d.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">{TYPE_LABELS[d.document_type] ?? d.document_type}</p>
                      {expired && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">{t('expired')}</span>}
                      {expiringSoon && <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600">{t('expiringSoon')}</span>}
                    </div>
                    {d.expiry_date && (
                      <p className="text-xs text-gray-500 mt-0.5">{t('expiryDate')}: {formatDate(d.expiry_date)}</p>
                    )}
                    {d.notes && <p className="text-xs text-gray-400 italic mt-0.5">{d.notes}</p>}
                    {d.file_path && (
                      <div className="mt-1.5">
                        <DocumentDownloadButton path={d.file_path} label={t('viewFile')} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(d)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(d.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <DocumentModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingDocument={editing}
          onClose={closeModal}
        />
      )}
    </>
  )
}
