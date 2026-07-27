'use client'

import { Printer } from 'lucide-react'

export function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
    >
      <Printer className="w-4 h-4" /> {label}
    </button>
  )
}
