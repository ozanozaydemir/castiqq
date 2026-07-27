import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function requireOrg() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  console.log('[requireOrg] user:', user?.id ?? null, 'authError:', authError?.message ?? null)
  if (!user) redirect('/giris')

  let { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  console.log('[requireOrg] profile:', profile, 'profileError:', profileError?.message ?? null)

  let orgId = profile?.organization_id as string | undefined

  // Fallback: aynı layout'taki gibi, profil/org yoksa oluştur
  if (!orgId) {
    console.log('[requireOrg] FALLBACK: creating org for user', user.id)
    const adminClient = createAdminClient()
    const meta = user.user_metadata ?? {}
    const org_name = (meta.org_name as string) ?? 'Organizasyon'
    const full_name = (meta.full_name as string) ?? user.email ?? ''

    const { data: newOrg, error: orgError } = await adminClient
      .from('organizations')
      .insert({ name: org_name })
      .select('id')
      .single()

    console.log('[requireOrg] org insert:', newOrg, 'error:', orgError?.message ?? null)

    if (!newOrg) {
      console.log('[requireOrg] REDIRECT to /giris — fallback failed')
      redirect('/giris')
    }

    const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
      id: user.id,
      organization_id: newOrg.id,
      full_name,
      role: 'admin',
    })
    console.log('[requireOrg] profile upsert error:', profileUpsertError?.message ?? null)
    orgId = newOrg.id as string
  }

  // Layout guard'ıyla aynı kontrol — server action'lar sayfa render'ından
  // bağımsız çağrılabildiği için abonelik kontrolü burada da tekrarlanmalı.
  const { data: org } = await supabase
    .from('organizations')
    .select('polar_subscription_id')
    .eq('id', orgId)
    .single()

  if (!org?.polar_subscription_id) redirect('/plan-sec')

  return { supabase, userId: user.id, orgId }
}
