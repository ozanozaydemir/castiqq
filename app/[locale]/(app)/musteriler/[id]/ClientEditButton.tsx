'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ClientModal } from '../ClientModal'
import { updateClient } from '@/app/actions/clients'
import type { Client } from '@/types/database'

export function ClientEditButton({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const t = useTranslations('clients')

  const boundUpdate = updateClient.bind(null, client.id)

  return (
    <>
      <button onClick={() => setOpen(true)} className="sb-btn-secondary">
        <Pencil className="w-3.5 h-3.5" /> {t('editTitle')}
      </button>
      {open && (
        <ClientModal
          action={boundUpdate}
          editingClient={client}
          onClose={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
