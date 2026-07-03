'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { MobileHeader } from './MobileHeader'

interface AppShellProps {
  orgName?: string
  logoUrl?: string | null
  children: React.ReactNode
}

export function AppShell({ orgName, children }: AppShellProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#f8f8f8] overflow-hidden">
      <AppSidebar
        orgName={orgName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />

      <div className="flex flex-col flex-1 md:ml-56 min-w-0">
        <MobileHeader orgName={orgName} onMenuOpen={() => setIsOpen(true)} />
        <main
          className="flex-1 overflow-y-auto pb-8 md:pb-0"
          style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
