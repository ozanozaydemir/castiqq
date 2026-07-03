'use client'

import { Menu, Clapperboard } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface MobileHeaderProps {
  orgName?: string
  onMenuOpen: () => void
}

export function MobileHeader({ orgName = 'CastFlow', onMenuOpen }: MobileHeaderProps) {
  const t = useTranslations('nav')
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Clapperboard className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-base truncate max-w-[160px]">{orgName}</span>
      </div>
      <button
        onClick={onMenuOpen}
        className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label={t('openMenu')}
      >
        <Menu className="w-5 h-5" />
      </button>
    </header>
  )
}
