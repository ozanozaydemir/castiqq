import { PageHeader } from '@/components/layout/PageHeader'
import { OyuncuForm } from '../OyuncuForm'
import { createOyuncu } from '@/app/actions/talent'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function YeniOyuncuPage() {
  const t = await getTranslations('talent')

  return (
    <div>
      <PageHeader title={t('addPage')} description={t('addPageDesc')} />

      <div className="p-6">
        <Link href="/oyuncular" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('backToPool')}
        </Link>

        <div className="sb-card p-6">
          <OyuncuForm action={createOyuncu} cancelHref="/oyuncular" />
        </div>
      </div>
    </div>
  )
}
