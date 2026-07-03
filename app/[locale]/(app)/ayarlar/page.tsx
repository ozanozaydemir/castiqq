import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { OrgForm } from './OrgForm'
import { ProfilForm } from './ProfilForm'
import { SifreForm } from './SifreForm'
import { PlanCard } from './PlanCard'
import { Building2, User, Lock, Globe } from 'lucide-react'
import { LanguageForm } from './LanguageForm'

function SettingsCard({ title, icon, children }: {
  title: string; icon: React.ReactNode; children: React.ReactNode
}) {
  return (
    <div className="sb-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-gray-400">{icon}</span>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default async function AyarlarPage() {
  const t = await getTranslations('settings')
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user!.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, subscription_plan, subscription_status, subscription_ends_at, polar_customer_id')
    .eq('id', profile?.organization_id ?? '')
    .single()

  return (
    <div className="space-y-5 max-w-2xl pb-8">
      <PlanCard
        plan={org?.subscription_plan ?? 'starter'}
        status={org?.subscription_status ?? 'active'}
        endsAt={org?.subscription_ends_at ?? null}
        hasPortal={!!org?.polar_customer_id}
        orgId={profile?.organization_id ?? ''}
      />

      <SettingsCard title={t('sectionOrg')} icon={<Building2 className="w-4 h-4" />}>
        <OrgForm initialName={org?.name ?? ''} />
      </SettingsCard>

      <SettingsCard title={t('sectionAccount')} icon={<User className="w-4 h-4" />}>
        <ProfilForm
          initialName={profile?.full_name ?? ''}
          email={user?.email ?? ''}
        />
      </SettingsCard>

      <SettingsCard title={t('sectionPassword')} icon={<Lock className="w-4 h-4" />}>
        <SifreForm />
      </SettingsCard>

      <SettingsCard title={t('language.title')} icon={<Globe className="w-4 h-4" />}>
        <LanguageForm currentLocale={locale} />
      </SettingsCard>
    </div>
  )
}
