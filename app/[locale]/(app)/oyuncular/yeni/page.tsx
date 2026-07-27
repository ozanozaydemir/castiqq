import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { OyuncuForm } from '../OyuncuForm'
import { createOyuncu } from '@/app/actions/talent'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function YeniOyuncuPage() {
  const t = await getTranslations('talent')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  const isAgency = org?.org_type === 'agency'
  const { data: teamMembers } = isAgency
    ? await supabase.from('profiles').select('id, full_name').eq('organization_id', profile?.organization_id ?? '')
    : { data: [] }

  return (
    <div>
      <PageHeader title={t('addPage')} description={t('addPageDesc')} />

      <div className="p-6">
        <Link href="/oyuncular" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('backToPool')}
        </Link>

        <div className="sb-card p-6">
          <OyuncuForm action={createOyuncu} cancelHref="/oyuncular" orgType={isAgency ? 'agency' : 'production'} teamMembers={teamMembers ?? []} />
        </div>
      </div>
    </div>
  )
}
