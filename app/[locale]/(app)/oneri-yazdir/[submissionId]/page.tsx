import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PrintButton } from './PrintButton'
import { MapPin, Banknote } from 'lucide-react'

export default async function OneriYazdirPage({ params }: { params: Promise<{ submissionId: string }> }) {
  const { submissionId } = await params
  const t = await getTranslations('incomingRoles')
  const supabase = await createClient()

  const { data: submission } = await supabase
    .from('role_share_submissions')
    .select('id, created_at, role_shares(role_title, project_title), role_share_submission_items(id, full_name, photo_url, age, height_cm, city, reel_url, proposed_fee, currency, agency_notes)')
    .eq('id', submissionId)
    .single()

  if (!submission) notFound()

  const roleShare = submission.role_shares as unknown as { role_title: string; project_title: string | null } | null
  const items = submission.role_share_submission_items as unknown as {
    id: string; full_name: string; photo_url: string | null; age: number | null
    height_cm: number | null; city: string | null; reel_url: string | null
    proposed_fee: number | null; currency: string; agency_notes: string | null
  }[]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 print:bg-white print:py-4">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-card { break-inside: avoid; }
        }
      `}</style>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between no-print">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{roleShare?.role_title}</h1>
            {roleShare?.project_title && <p className="text-sm text-gray-500">{roleShare.project_title}</p>}
          </div>
          <PrintButton />
        </div>

        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold text-gray-900">{roleShare?.role_title}</h1>
          {roleShare?.project_title && <p className="text-sm text-gray-500">{roleShare.project_title}</p>}
        </div>

        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className="print-card bg-white rounded-2xl border border-gray-200 overflow-hidden flex">
              {item.photo_url && (
                <img src={item.photo_url} alt="" className="w-32 h-32 object-cover flex-shrink-0" />
              )}
              <div className="p-4 flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{item.full_name}</p>
                <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-gray-500">
                  {item.age && <span>{item.age} yaş</span>}
                  {item.height_cm && <span>{item.height_cm} cm</span>}
                  {item.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{item.city}</span>}
                  {item.proposed_fee && <span className="flex items-center gap-1"><Banknote className="w-3 h-3" />{item.proposed_fee.toLocaleString('tr-TR')} {item.currency}</span>}
                </div>
                {item.reel_url && (
                  <a href={item.reel_url} target="_blank" rel="noopener noreferrer" className="no-print text-xs text-indigo-500 hover:text-indigo-700 mt-1.5 inline-block">
                    {item.reel_url}
                  </a>
                )}
                {item.agency_notes && <p className="text-sm text-gray-600 mt-2">{item.agency_notes}</p>}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 no-print">{t('printHint')}</p>
      </div>
    </div>
  )
}
