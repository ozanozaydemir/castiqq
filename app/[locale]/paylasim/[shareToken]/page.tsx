import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MapPin } from 'lucide-react'

const AVAIL: Record<string, { label: string; color: string }> = {
  available: { label: 'Müsait', color: 'bg-green-400' },
  busy:      { label: 'Meşgul', color: 'bg-amber-400' },
  unavailable: { label: 'Uygun Değil', color: 'bg-gray-300' },
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ shareToken: string; locale: string }>
}) {
  const { shareToken } = await params
  const locale = await getLocale()

  const admin = createAdminClient()
  const { data: collection } = await admin
    .from('collections')
    .select('id, name, description')
    .eq('share_token', shareToken)
    .single()

  if (!collection) notFound()

  const { data: rawItems } = await admin
    .from('collection_items')
    .select('talent_id, note, talent(id, full_name, city, availability)')
    .eq('collection_id', collection.id)
    .order('added_at', { ascending: false })

  type ItemRow = {
    talent_id: string
    note: string | null
    talent: { id: string; full_name: string; city: string | null; availability: string } | null
  }
  const members = (rawItems ?? []) as unknown as ItemRow[]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-lg mb-4">
            🎬 Castiqq
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
          {collection.description && (
            <p className="text-sm text-gray-500">{collection.description}</p>
          )}
          <p className="text-xs text-gray-400">{members.length} {locale === 'en' ? 'talent' : 'oyuncu'}</p>
        </div>

        {/* Talent list */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {members.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              {locale === 'en' ? 'No talent in this list.' : 'Bu listede henüz oyuncu yok.'}
            </div>
          ) : (
            <ul className="divide-y divide-gray-50">
              {members.map(item => {
                const talent = item.talent
                if (!talent) return null
                const avail = AVAIL[talent.availability] ?? AVAIL.unavailable
                return (
                  <li key={item.talent_id} className="flex items-center gap-4 px-6 py-4">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${avail.color}`} title={avail.label} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{talent.full_name}</p>
                      {talent.city && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />{talent.city}
                        </p>
                      )}
                      {item.note && <p className="text-xs text-gray-400 italic mt-0.5">{item.note}</p>}
                    </div>
                    <span className="text-xs text-gray-300">{avail.label}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <p className="text-center text-xs text-gray-400">
          {locale === 'en' ? 'Powered by' : 'Teknoloji:'}{' '}
          <a href="https://castiqq.app" className="text-indigo-500 hover:underline">Castiqq</a>
        </p>
      </div>
    </div>
  )
}
