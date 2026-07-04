'use client'

import { useState, useCallback } from 'react'
import { Pencil } from 'lucide-react'
import { updateRol } from '@/app/actions/projects'
import { RolModal } from '../../projeler/[id]/RolModal'
import type { ProjectRole } from '@/types/database'
import { useTranslations } from 'next-intl'

interface Props {
  role: ProjectRole & { project_id: string }
}

export function RolDuzenleButton({ role }: Props) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('roles')
  const action = updateRol.bind(null, role.id)
  const handleClose = useCallback(() => setOpen(false), [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
        {t('editRole')}
      </button>
      {open && (
        <RolModal
          projectId={role.project_id}
          editingRole={role}
          action={action}
          onClose={handleClose}
        />
      )}
    </>
  )
}
