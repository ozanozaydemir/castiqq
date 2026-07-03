'use client'

import { useTransition } from 'react'
import { removeFromCollection } from '@/app/actions/collections'
import { useRouter, Link } from '@/i18n/navigation'
import { UserMinus, MapPin, Phone, Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

type Member = {
  talent_id: string
  added_at: string
  note: string | null
  talent: {
    id: string
    full_name: string
    city: string | null
    phone: string | null
    email: string | null
    availability: string
  } | null
}

interface Props {
  collectionId: string
  members: Member[]
}

const AVAIL_DOTS: Record<string, string> = {
  available: 'bg-green-400',
  busy: 'bg-amber-400',
  unavailable: 'bg-gray-300',
}

function MemberRow({ member, collectionId }: { member: Member; collectionId: string }) {
  const [isPending, start] = useTransition()
  const router = useRouter()
  const tc = useTranslations('collections')
  const ta = useTranslations('talent.availability')
  const talent = member.talent
  if (!talent) return null

  const dot = AVAIL_DOTS[talent.availability] ?? AVAIL_DOTS.unavailable
  const availLabel = ta(talent.availability as 'available' | 'busy' | 'unavailable')

  function handleRemove() {
    if (!confirm(tc('removeConfirm', { name: talent!.full_name }))) return
    start(async () => {
      await removeFromCollection(collectionId, talent!.id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0 group">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} title={availLabel} />
      <div className="flex-1 min-w-0">
        <Link href={`/oyuncular/${talent.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors block truncate">
          {talent.full_name}
        </Link>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
          {talent.city && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{talent.city}</span>}
          {talent.phone && <a href={`tel:${talent.phone}`} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><Phone className="w-3 h-3" />{talent.phone}</a>}
          {talent.email && <a href={`mailto:${talent.email}`} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"><Mail className="w-3 h-3" />{talent.email}</a>}
        </div>
        {member.note && <p className="text-xs text-gray-400 italic mt-0.5">{member.note}</p>}
      </div>
      <button
        onClick={handleRemove}
        disabled={isPending}
        className="flex-shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
        title={tc('removeFromList')}
      >
        <UserMinus className="w-4 h-4" />
      </button>
    </div>
  )
}

export function CollectionDetailClient({ collectionId, members }: Props) {
  const tc = useTranslations('collections')

  if (members.length === 0) {
    return (
      <div className="sb-card p-10 text-center text-gray-300">
        <p className="text-sm">{tc('noTalentInList')}</p>
        <p className="text-xs mt-1">{tc('noTalentInListHint')}</p>
      </div>
    )
  }

  return (
    <div className="sb-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-800">{tc('talentCount', { count: members.length })}</p>
      </div>
      <div className="px-5">
        {members.map(m => (
          <MemberRow key={m.talent_id} member={m} collectionId={collectionId} />
        ))}
      </div>
    </div>
  )
}
