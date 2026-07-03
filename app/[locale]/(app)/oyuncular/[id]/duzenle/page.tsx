import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { OyuncuForm } from '../../OyuncuForm'
import { updateOyuncu } from '@/app/actions/talent'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import type { TalentWithRelations } from '@/types/database'
import { getTranslations } from 'next-intl/server'

export default async function DuzenleOyuncuPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('talent')

  const { data: talent } = await supabase.from('talent').select('*').eq('id', id).single()
  if (!talent) notFound()

  const [{ data: languages }, { data: experiences }, { data: education }] = await Promise.all([
    supabase.from('talent_languages').select('*').eq('talent_id', id).order('sort_order'),
    supabase.from('talent_experiences').select('*').eq('talent_id', id).order('sort_order'),
    supabase.from('talent_education').select('*').eq('talent_id', id).order('sort_order'),
  ])

  const talentWithRelations: TalentWithRelations = {
    ...talent,
    languages: languages ?? [],
    experiences: experiences ?? [],
    education: education ?? [],
  }

  const boundAction = updateOyuncu.bind(null, id)

  return (
    <div>
      <PageHeader title={t('editPage')} description={talent.full_name} />

      <div className="p-6">
        <Link href={`/oyuncular/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('backToProfile')}
        </Link>

        <div className="sb-card p-6">
          <OyuncuForm action={boundAction} initialData={talentWithRelations} cancelHref={`/oyuncular/${id}`} />
        </div>
      </div>
    </div>
  )
}
