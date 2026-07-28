'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Users, Mail, Phone, Star } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ContactModal } from './ContactModal'
import { createClientContact, updateClientContact, deleteClientContact } from '@/app/actions/clientContacts'
import type { ClientContact } from '@/types/database'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('tr-TR')
}

export function ContactsSection({ clientId, contacts }: { clientId: string; contacts: ClientContact[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<ClientContact | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('clients.contacts')

  function openNew() { setEditing(null); setModalOpen(true) }
  function openEdit(c: ClientContact) { setEditing(c); setModalOpen(true) }
  function closeModal() { setModalOpen(false); router.refresh() }

  function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    startTransition(async () => { await deleteClientContact(id, clientId); router.refresh() })
  }

  const boundCreate = createClientContact.bind(null, clientId)
  const boundUpdate = editing ? updateClientContact.bind(null, editing.id, clientId) : null

  return (
    <>
      <div className="sb-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">{t('sectionTitle')}</h3>
          </div>
          <button onClick={openNew} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {t('addContact')}
          </button>
        </div>

        {contacts.length === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400">{t('empty')}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{t('emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {contacts.map(c => (
              <div key={c.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{c.full_name}</p>
                      {c.is_primary && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                          <Star className="w-2.5 h-2.5" /> {t('primaryBadge')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-indigo-500 font-medium mt-0.5">
                      {t(`roles.${c.role}`)}{c.title && <span className="text-gray-400 font-normal"> · {c.title}</span>}
                    </p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                      {c.email && (
                        <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:text-gray-700">
                          <Mail className="w-3 h-3" />{c.email}
                        </a>
                      )}
                      {c.phone && (
                        <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-gray-700">
                          <Phone className="w-3 h-3" />{c.phone}
                        </a>
                      )}
                    </div>
                    {c.last_contacted_at && (
                      <p className="text-xs text-gray-400 mt-1">{t('lastContacted')}: {formatDate(c.last_contacted_at)}</p>
                    )}
                    {c.notes && <p className="text-xs text-gray-400 italic mt-1">{c.notes}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(c)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(c.id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <ContactModal
          action={editing && boundUpdate ? boundUpdate : boundCreate}
          editingContact={editing}
          onClose={closeModal}
        />
      )}
    </>
  )
}
