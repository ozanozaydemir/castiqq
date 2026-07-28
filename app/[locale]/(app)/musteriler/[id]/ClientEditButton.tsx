'use client'

import { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Pencil } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { ClientModal } from '../ClientModal'
import { updateClient } from '@/app/actions/clients'
import type { Client } from '@/types/database'

export function ClientEditButton({ client }: { client: Client }) {
  const [open, setOpen] = useState(false)
  const [teamMembers, setTeamMembers] = useState<{ id: string; full_name: string }[]>([])
  const [allClients, setAllClients] = useState<{ id: string; name: string }[]>([])
  const router = useRouter()
  const t = useTranslations('clients')

  // Sorumlu menajer ve üst grup seçenekleri yalnızca modal açıldığında
  // gerekiyor — sayfa yüklenirken boşuna çekmiyoruz.
  useEffect(() => {
    if (!open || teamMembers.length > 0) return
    const supabase = createClient()
    Promise.all([
      supabase.from('profiles').select('id, full_name').order('full_name'),
      supabase.from('clients').select('id, name').order('name'),
    ]).then(([m, c]) => {
      setTeamMembers((m.data ?? []) as { id: string; full_name: string }[])
      setAllClients((c.data ?? []) as { id: string; name: string }[])
    })
  }, [open, teamMembers.length])

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
          teamMembers={teamMembers}
          allClients={allClients}
          onClose={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
