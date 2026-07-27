import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { SetupForm } from './SetupForm'
import { resolveHomePath } from '@/lib/home-path'

const DEFAULT_ORG_NAME = 'Organizasyon'

export default async function KurulumPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  let { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  // Aynı layout.tsx'teki fallback: trigger her nedense çalışmadıysa burada oluştur
  if (!profile?.organization_id) {
    const adminClient = createAdminClient()
    const meta = user.user_metadata ?? {}
    const full_name = (meta.full_name as string) ?? user.email ?? ''

    const { data: org } = await adminClient
      .from('organizations')
      .insert({ name: DEFAULT_ORG_NAME })
      .select('id')
      .single()

    if (!org) redirect('/giris')

    await adminClient.from('profiles').upsert({
      id: user.id,
      organization_id: org.id,
      full_name,
      role: 'admin',
    })
    profile = { organization_id: org.id }
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', profile.organization_id)
    .single()

  // Firma adı zaten belirlenmiş (şifreli kayıttan ya da önceki bir kurulumdan) — atla.
  // Abonelik kontrolü dashboard/layout guard'ında zaten yapılıyor.
  if (org?.name && org.name !== DEFAULT_ORG_NAME) {
    redirect(await resolveHomePath(supabase, user.id))
  }

  return <SetupForm />
}
