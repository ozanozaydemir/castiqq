import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { ProjeForm } from '../../ProjeForm'
import { updateProje } from '@/app/actions/projects'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function DuzenleProje({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const t = await getTranslations('projects')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) notFound()

  const boundAction = updateProje.bind(null, project.id)

  return (
    <div>
      <PageHeader
        title={t('editTitle')}
        description={project.title}
      />

      <div className="p-6">
        <Link href={`/projeler/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backToProject')}
        </Link>

        <div className="sb-card p-6">
          <ProjeForm action={boundAction} initialData={project} cancelHref={`/projeler/${id}`} />
        </div>
      </div>
    </div>
  )
}
