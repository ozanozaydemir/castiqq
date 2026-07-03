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

  // Fallback: aynı layout'taki gibi, profil/org yoksa oluştur
  if (!profile?.organization_id) {
    console.log('[requireOrg] FALLBACK: creating org for user', user.id)
    const adminClient = createAdminClient()
    const meta = user.user_metadata ?? {}
    const org_name = (meta.org_name as string) ?? 'Organizasyon'
    const full_name = (meta.full_name as string) ?? user.email ?? ''

    const { data: org, error: orgError } = await adminClient
      .from('organizations')
      .insert({ name: org_name })
      .select('id')
      .single()

    console.log('[requireOrg] org insert:', org, 'error:', orgError?.message ?? null)

    if (org) {
      const { error: profileUpsertError } = await adminClient.from('profiles').upsert({
        id: user.id,
        organization_id: org.id,
        full_name,
        role: 'admin',
      })
      console.log('[requireOrg] profile upsert error:', profileUpsertError?.message ?? null)
      return { supabase, userId: user.id, orgId: org.id as string }
    }

    console.log('[requireOrg] REDIRECT to /giris — fallback failed')
    redirect('/giris')
  }

  return { supabase, userId: user.id, orgId: profile.organization_id as string }
}
