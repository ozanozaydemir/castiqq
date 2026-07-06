import { AppShell } from '@/components/layout/AppShell'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { OrgProvider } from '@/lib/org-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  let { data: profile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single()

  // Fallback: profil veya org yoksa oluştur
  if (!profile || !profile.organization_id) {
    const adminClient = createAdminClient()
    const meta = user.user_metadata ?? {}
    const org_name = meta.org_name ?? 'Organizasyon'
    const full_name = meta.full_name ?? user.email ?? ''

    const { data: org } = await adminClient
      .from('organizations')
      .insert({ name: org_name })
      .select()
      .single()

    if (org) {
      await adminClient.from('profiles').upsert({
        id: user.id,
        organization_id: org.id,
        full_name,
        role: 'admin',
      })
      profile = { role: 'admin', organization_id: org.id }
    }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, logo_url, polar_subscription_id')
    .eq('id', profile?.organization_id ?? '')
    .single()

  // Ödeme zorunlu: aboneliği olmayan kullanıcıları plan seçimine yönlendir
  if (!org?.polar_subscription_id) {
    redirect('/plan-sec')
  }

  return (
    <OrgProvider value={profile?.organization_id ?? ''}>
      <AppShell orgName={org?.name ?? 'Castiqq'} logoUrl={org?.logo_url ?? null}>
        {children}
      </AppShell>
    </OrgProvider>
  )
}
