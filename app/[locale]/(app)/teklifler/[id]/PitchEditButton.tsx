'use client'

import { useState, useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Pencil, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PitchModal } from '../PitchModal'
import { updatePitch, deletePitch } from '@/app/actions/pitches'
import type { Pitch } from '@/types/database'

export function PitchEditButton({
  pitch,
  clients,
  teamMembers,
}: {
  pitch: Pitch
  clients: { id: string; name: string }[]
  teamMembers: { id: string; full_name: string }[]
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('pitches')

  function handleDelete() {
    if (!confirm(t('deleteConfirm'))) return
    startTransition(async () => {
      await deletePitch(pitch.id)
      router.push('/teklifler')
    })
  }

  const boundUpdate = updatePitch.bind(null, pitch.id)

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="sb-btn-secondary text-red-500 hover:text-red-600 disabled:opacity-60"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setOpen(true)} className="sb-btn-primary">
          <Pencil className="w-3.5 h-3.5" /> {t('editTitle')}
        </button>
      </div>

      {open && (
        <PitchModal
          action={boundUpdate}
          editingPitch={pitch}
          clients={clients}
          teamMembers={teamMembers}
          onClose={() => { setOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
