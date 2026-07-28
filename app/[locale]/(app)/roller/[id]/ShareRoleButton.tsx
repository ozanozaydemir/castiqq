'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { RoleShareModal } from './RoleShareModal'

export function ShareRoleButton({ projectRoleId, hasScript }: { projectRoleId: string; hasScript: boolean }) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('roles.share')

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
      >
        <Share2 className="w-3.5 h-3.5" />
        {t('shareBtn')}
      </button>
      {open && <RoleShareModal projectRoleId={projectRoleId} hasScript={hasScript} onClose={() => setOpen(false)} />}
    </>
  )
}
