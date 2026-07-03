'use client'

import { Link, usePathname } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import {
  LayoutDashboard, Film, Users, UserSearch, Settings, LogOut, Clapperboard, BookMarked,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/app/actions/auth'

interface AppSidebarProps {
  orgName?: string
  logoUrl?: string | null
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ orgName = 'CastFlow', isOpen = false, onClose }: AppSidebarProps) {
  const pathname = usePathname()
  const t = useTranslations('nav')

  const navItems = [
    { href: '/dashboard',  label: t('dashboard'),  icon: LayoutDashboard },
    { href: '/projeler',   label: t('projects'),    icon: Film },
    { href: '/roller',     label: t('roles'),       icon: UserSearch },
    { href: '/oyuncular',  label: t('talent'),      icon: Users },
    { href: '/listeler',   label: t('lists'),       icon: BookMarked },
    { href: '/ayarlar',    label: t('settings'),    icon: Settings },
  ]

  const sidebarContent = (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-200">
        <div className="w-7 h-7 bg-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <Clapperboard className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-gray-900 font-bold text-base tracking-tight truncate">{orgName}</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-2 mb-2">{t('management')}</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-indigo-500/10 text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-indigo-500' : 'text-gray-400')} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        <div className="flex justify-center py-1">
          <LanguageSwitcher />
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4 text-gray-400" />
            {t('logout')}
          </button>
        </form>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-40 w-56">
        {sidebarContent}
      </div>

      {/* Mobile backdrop */}
      <div
        className={cn(
          'md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Mobile drawer */}
      <div
        className={cn(
          'md:hidden fixed left-0 top-0 bottom-0 z-50 w-56 transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
