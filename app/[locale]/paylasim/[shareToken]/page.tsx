import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { MapPin, Phone, Mail, Ruler, Film } from 'lucide-react'
import { PrintButton } from './PrintButton'

const AVAIL: Record<string, { label: string; color: string }> = {
  available: { label: 'Müsait', color: 'bg-green-400' },
  busy:      { label: 'Meşgul', color: 'bg-amber-400' },
  unavailable: { label: 'Uygun Değil', color: 'bg-gray-300' },
}

function InitialsAvatar({ name }: { name: string }) {
  const parts = name.trim().split(' ')
  const initials = parts.length >= 2 ? parts[0][0] + parts[parts.length - 1][0] : parts[0].slice(0, 2)
  return (
    <div className="absolute inset-0 w-full h-full bg-indigo-50 flex items-center justify-center">
      <span className="text-2xl font-bold text-indigo-300">{initials.toUpperCase()}</span>
    </div>
  )
}

export default async function PublicCollectionPage({
  params,
}: {
  params: Promise<{ shareToken: string; locale: string }>
}) {
  const { shareToken } = await params
  const locale = await getLocale()
  const isEn = locale === 'en'

  const admin = createAdminClient()
  const { data: collection } = await admin
    .from('collections')
    .select('id, name, description')
    .eq('share_token', shareToken)
    .single()

  if (!collection) notFound()

  const { data: rawItems } = await admin
    .from('collection_items')
    .select(`
      talent_id, note,
      talent(id, full_name, city, availability, phone, email, photos,
        gender, birth_year, height_cm, showreel_url)
    `)
    .eq('collection_id', collection.id)
    .order('added_at', { ascending: false })

  type TalentRow = {
    id: string; full_name: string; city: string | null; availability: string
    phone: string | null; email: string | null; photos: string[] | null
    gender: string | null; birth_year: number | null; height_cm: number | null
    showreel_url: string | null
  }
  type ItemRow = { talent_id: string; note: string | null; talent: TalentRow | null }
  const members = (rawItems ?? []) as unknown as ItemRow[]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-card { break-inside: avoid; }
          body { background: white; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-lg mb-2">
              🎬 Castiqq
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
            {collection.description && (
              <p className="text-sm text-gray-500 mt-1">{collection.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{members.length} {isEn ? 'talent' : 'oyuncu'}</p>
          </div>
          {members.length > 0 && (
            <PrintButton label={isEn ? 'Save as PDF' : 'PDF Olarak Kaydet'} />
          )}
        </div>

        {/* Talent grid */}
        {members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center text-gray-400 text-sm">
            {isEn ? 'No talent in this list.' : 'Bu listede henüz oyuncu yok.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map(item => {
              const talent = item.talent
              if (!talent) return null
              const avail = AVAIL[talent.availability] ?? AVAIL.unavailable
              const age = talent.birth_year ? new Date().getFullYear() - talent.birth_year : null
              const cover = talent.photos?.[0]

              return (
                <div key={item.talent_id} className="print-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
                  {/* Photo */}
                  <div className="relative w-28 flex-shrink-0">
                    {cover ? (
                      <img src={cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    ) : (
                      <InitialsAvatar name={talent.full_name} />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{talent.full_name}</p>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${avail.color}`} title={avail.label} />
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      {age && <span>{age} {isEn ? 'y/o' : 'yaş'}</span>}
                      {talent.height_cm && (
                        <span className="flex items-center gap-1"><Ruler className="w-3 h-3" />{talent.height_cm} cm</span>
                      )}
                      {talent.city && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{talent.city}</span>
                      )}
                    </div>

                    <div className="flex flex-col gap-0.5 text-xs text-gray-500 pt-1">
                      {talent.phone && (
                        <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{talent.phone}</span>
                      )}
                      {talent.email && (
                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3" />{talent.email}</span>
                      )}
                      {talent.showreel_url && (
                        <a href={talent.showreel_url} target="_blank" rel="noopener noreferrer"
                          className="no-print flex items-center gap-1.5 text-indigo-500 hover:text-indigo-700">
                          <Film className="w-3 h-3" />{isEn ? 'Showreel' : 'Showreel İzle'}
                        </a>
                      )}
                    </div>

                    {item.note && <p className="text-xs text-gray-400 italic pt-1">{item.note}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 no-print">
          {isEn
            ? 'This is a private link containing personal contact information — please do not redistribute publicly.'
            : 'Bu, kişisel iletişim bilgisi içeren özel bir bağlantıdır — lütfen herkese açık şekilde paylaşmayın.'}
        </p>
        <p className="text-center text-xs text-gray-400 no-print">
          {isEn ? 'Powered by' : 'Teknoloji:'}{' '}
          <a href="https://castiqq.app" className="text-indigo-500 hover:underline">Castiqq</a>
        </p>
      </div>
    </div>
  )
}
