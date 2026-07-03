import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { AyarlarTabs } from './AyarlarTabs'

export default async function AyarlarLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('settings')

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="px-6 pt-4">
        <AyarlarTabs />
        {children}
      </div>
    </div>
  )
}
