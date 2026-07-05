'use client'

import { useState, useTransition } from 'react'
import { removeFromCollection, updateCollection } from '@/app/actions/collections'
import { useRouter, Link } from '@/i18n/navigation'
import { UserMinus, MapPin, Phone, Mail, Share2, Copy, Check, Pencil, X, Loader2 } from 'lucide-react'
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
  collectionName: string
  collectionDescription: string | null
  members: Member[]
  shareToken: string
}

function EditCollectionModal({ collectionId, initialName, initialDescription, onClose }: {
  collectionId: string
  initialName: string
  initialDescription: string | null
  onClose: () => void
}) {
  const tc = useTranslations('collections')
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription ?? '')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    setError(null)
    if (!name.trim()) { setError(tc('nameRequired')); return }
    startTransition(async () => {
      const result = await updateCollection(collectionId, name, description || null)
      if (result?.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{tc('editTitle')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{tc('nameLabel')}</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="sb-input"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{tc('descriptionLabel')}</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="sb-input resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="sb-btn-secondary flex-1 text-sm">{tc('cancel')}</button>
            <button onClick={handleSave} disabled={isPending} className="sb-btn-primary flex-1 text-sm disabled:opacity-50">
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : tc('save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
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

export function CollectionDetailClient({ collectionId, collectionName, collectionDescription, members, shareToken }: Props) {
  const tc = useTranslations('collections')
  const [copied, setCopied] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/paylasim/${shareToken}`
    : `/paylasim/${shareToken}`

  const shareSection = (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900 flex-1 truncate">{collectionName}</h2>
        <button
          onClick={() => setEditOpen(true)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border border-gray-200 hover:border-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Pencil className="w-3 h-3" /> {tc('editTitle')}
        </button>
      </div>
      {collectionDescription && (
        <p className="text-sm text-gray-500">{collectionDescription}</p>
      )}
      <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center gap-3">
        <Share2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-indigo-700 mb-1">{tc('shareTitle')}</p>
          <p className="text-xs text-indigo-500 truncate">{shareUrl}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(shareUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? tc('copied') : tc('copyLink')}
        </button>
      </div>
    </div>
  )

  const editModal = editOpen && (
    <EditCollectionModal
      collectionId={collectionId}
      initialName={collectionName}
      initialDescription={collectionDescription}
      onClose={() => setEditOpen(false)}
    />
  )

  if (members.length === 0) {
    return (
      <>
        {shareSection}
        <div className="sb-card p-10 text-center text-gray-300">
          <p className="text-sm">{tc('noTalentInList')}</p>
          <p className="text-xs mt-1">{tc('noTalentInListHint')}</p>
        </div>
        {editModal}
      </>
    )
  }

  return (
    <>
      {shareSection}
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
      {editModal}
    </>
  )
}
