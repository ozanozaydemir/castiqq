'use client'

import { useTransition } from 'react'
import { useRouter } from '@/i18n/navigation'
import { updateAvailability } from '@/app/actions/talent'
import { useTranslations } from 'next-intl'

export function AvailabilitySelector({ talentId, value }: { talentId: string; value: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const ta = useTranslations('talent.availability')

  const AVAILABILITY_CONFIG: Record<string, { label: string; dot: string; bg: string }> = {
    available:   { label: ta('available'),   dot: 'bg-green-400',  bg: 'bg-green-50 text-green-700 border border-green-200' },
    busy:        { label: ta('busy'),        dot: 'bg-amber-400',  bg: 'bg-amber-50 text-amber-700 border border-amber-200' },
    unavailable: { label: ta('unavailable'), dot: 'bg-gray-300',   bg: 'bg-gray-100 text-gray-500 border border-gray-200' },
  }

  const avail = AVAILABILITY_CONFIG[value] ?? AVAILABILITY_CONFIG.available

  async function handleChange(newValue: string) {
    startTransition(async () => {
      await updateAvailability(talentId, newValue)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${avail.dot}`} />
      <select
        value={value}
        disabled={isPending}
        onChange={e => handleChange(e.target.value)}
        className={`text-xs font-medium px-2.5 py-1 rounded-lg cursor-pointer appearance-none disabled:opacity-60 ${avail.bg}`}
      >
        <option value="available">{ta('available')}</option>
        <option value="busy">{ta('busy')}</option>
        <option value="unavailable">{ta('unavailable')}</option>
      </select>
    </div>
  )
}
