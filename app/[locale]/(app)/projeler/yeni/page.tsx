import { PageHeader } from '@/components/layout/PageHeader'
import { ProjeForm } from '../ProjeForm'
import { createProje } from '@/app/actions/projects'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function YeniProjePage() {
  const t = await getTranslations('projects')

  return (
    <div>
      <PageHeader
        title={t('new')}
        description={t('description')}
      />

      <div className="p-6">
        <Link href="/projeler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t('backToList')}
        </Link>

        <div className="sb-card p-6">
          <ProjeForm action={createProje} cancelHref="/projeler" />
        </div>
      </div>
    </div>
  )
}
