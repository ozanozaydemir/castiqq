'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, start]    = useTransition()

  const goTo = useCallback((p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    p > 1 ? params.set('page', String(p)) : params.delete('page')
    start(() => router.push(`${pathname}?${params.toString()}`))
  }, [searchParams, pathname, router])

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page <= 1}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Önceki sayfa"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <span className="text-xs text-gray-400 px-2 tabular-nums">
        Sayfa {page} / {totalPages}
      </span>

      <button
        onClick={() => goTo(page + 1)}
        disabled={page >= totalPages}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
        aria-label="Sonraki sayfa"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}
