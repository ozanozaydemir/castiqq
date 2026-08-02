import { getTranslations } from 'next-intl/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrgForm } from './OrgForm'
import { ProfilForm } from './ProfilForm'
import { SifreForm } from './SifreForm'
import { PlanCard } from './PlanCard'
import { GoogleSheetsCard } from './GoogleSheetsCard'
import { ShareSettingsForm } from './ShareSettingsForm'
import { StorageCard } from './StorageCard'
import { RetentionForm } from './RetentionForm'
import { Building2, User, Lock, FileSpreadsheet, Share2, HardDrive, ShieldCheck } from 'lucide-react'
import { getActivePlan, PLAN_LIMITS } from '@/lib/plan'

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
    .select('name, subscription_plan, subscription_status, subscription_ends_at, polar_customer_id, org_type, public_slug, accepts_external_shares, storage_used_bytes, default_retention_days')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'
  const isAgency = org?.org_type === 'agency'

  // Per-project storage breakdown (production orgs only)
  let projectStorage: { id: string; name: string; totalBytes: number; videoCount: number }[] = []
  if (!isAgency) {
    const { data: storageData } = await supabase
      .from('projects')
      .select(`id, name, project_roles ( auditions ( audition_videos ( file_size_bytes ) ) )`)
      .order('name')
    type StorageRow = {
      id: string
      name: string
      project_roles?: { auditions?: { audition_videos?: { file_size_bytes?: number | null }[] }[] }[]
    }
    projectStorage = ((storageData ?? []) as StorageRow[]).map(project => {
      let totalBytes = 0
      let videoCount = 0
      for (const role of project.project_roles ?? []) {
        for (const aud of role.auditions ?? []) {
          for (const vid of aud.audition_videos ?? []) {
            totalBytes += vid.file_size_bytes ?? 0
            videoCount++
          }
        }
      }
      return { id: project.id, name: project.name, totalBytes, videoCount }
    }).filter(p => p.videoCount > 0).sort((a, b) => b.totalBytes - a.totalBytes)
  }

  const activePlan = getActivePlan(
    org?.subscription_plan ?? null,
    org?.subscription_status ?? null,
    isAgency ? 'agency' : 'production'
  )
  const limitBytes = PLAN_LIMITS[activePlan].storageGB * 1024 * 1024 * 1024

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

  return (
    <div>
      <div className="p-6 space-y-5">
        <PlanCard
          plan={org?.subscription_plan ?? null}
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

      <SettingsCard title={t('retention.sectionTitle')} icon={<ShieldCheck className="w-4 h-4" />}>
        <RetentionForm initialDays={org?.default_retention_days ?? null} />
      </SettingsCard>

      <SettingsCard title={t('sectionGoogle')} icon={<FileSpreadsheet className="w-4 h-4" />}>
        <GoogleSheetsCard connectedEmail={googleConnection?.google_email ?? null} message={googleMessage} />
      </SettingsCard>

      {!isAgency && (
        <SettingsCard title={t('sectionStorage')} icon={<HardDrive className="w-4 h-4" />}>
          <StorageCard
            usedBytes={org?.storage_used_bytes ?? 0}
            limitBytes={limitBytes}
            projects={projectStorage}
          />
        </SettingsCard>
      )}

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

      </div>
    </div>
  )
}
