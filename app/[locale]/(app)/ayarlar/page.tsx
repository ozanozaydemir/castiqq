import { getTranslations, getLocale } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgForm } from './OrgForm'
import { ProfilForm } from './ProfilForm'
import { SifreForm } from './SifreForm'
import { PlanCard } from './PlanCard'
import { GoogleSheetsCard } from './GoogleSheetsCard'
import { ShareSettingsForm } from './ShareSettingsForm'
import { Building2, User, Lock, Globe, FileSpreadsheet, Share2 } from 'lucide-react'
import { LanguageForm } from './LanguageForm'

const GOOGLE_MESSAGE_KEYS: Record<string, string> = {
  invalid_state: 'errorInvalidState',
  no_refresh_token: 'errorNoRefreshToken',
  save_failed: 'errorSaveFailed',
  exchange_failed: 'errorExchangeFailed',
}

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

export default async function AyarlarPage({
  searchParams,
}: {
  searchParams: Promise<{ google_connected?: string; google_error?: string }>
}) {
  const t = await getTranslations('settings')
  const locale = await getLocale()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const params = await searchParams

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, organization_id')
    .eq('id', user.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('name, subscription_plan, subscription_status, subscription_ends_at, polar_customer_id, org_type, public_slug, accepts_external_shares')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

  const { data: googleConnection } = await supabase
    .from('google_connections')
    .select('google_email')
    .eq('organization_id', profile?.organization_id ?? '')
    .maybeSingle()

  const googleMessage = params.google_connected
    ? 'connectedSuccess'
    : params.google_error
      ? GOOGLE_MESSAGE_KEYS[params.google_error] ?? 'errorExchangeFailed'
      : undefined

  const isAgency = org?.org_type === 'agency'

  return (
    <div>
      <div className="p-6 space-y-5">
        <PlanCard
          plan={org?.subscription_plan ?? 'starter'}
          status={org?.subscription_status ?? 'active'}
          endsAt={org?.subscription_ends_at ?? null}
          hasPortal={!!org?.polar_customer_id}
          orgId={profile?.organization_id ?? ''}
          orgType={org?.org_type === 'agency' ? 'agency' : 'production'}
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

      <SettingsCard title={t('sectionGoogle')} icon={<FileSpreadsheet className="w-4 h-4" />}>
        <GoogleSheetsCard connectedEmail={googleConnection?.google_email ?? null} message={googleMessage} />
      </SettingsCard>

      {isAgency && (
        <SettingsCard title={t('share.sectionTitle')} icon={<Share2 className="w-4 h-4" />}>
          <ShareSettingsForm
            initialSlug={org?.public_slug ?? null}
            initialAccepts={org?.accepts_external_shares ?? true}
            siteUrl={siteUrl}
          />
        </SettingsCard>
      )}

      <SettingsCard title={t('sectionPassword')} icon={<Lock className="w-4 h-4" />}>
        <SifreForm />
      </SettingsCard>

        <SettingsCard title={t('language.title')} icon={<Globe className="w-4 h-4" />}>
          <LanguageForm currentLocale={locale} />
        </SettingsCard>
      </div>
    </div>
  )
}
