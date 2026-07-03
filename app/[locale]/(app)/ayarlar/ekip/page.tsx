import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { EkipClient } from './EkipClient'

export default async function EkipPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: myProfile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', user!.id)
    .single()

  const orgId = myProfile?.organization_id
  const isAdmin = myProfile?.role === 'admin'

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('organization_id', orgId ?? '')
    .order('full_name')

  const members = profiles ?? []

  // Auth'dan e-posta adreslerini çek
  const adminClient = createAdminClient()
  const emailMap: Record<string, string> = {}
  await Promise.all(
    members.map(async (p: { id: string; full_name: string; role: string }) => {
      const { data } = await adminClient.auth.admin.getUserById(p.id)
      emailMap[p.id] = data.user?.email ?? ''
    })
  )

  const enriched = members.map((p: { id: string; full_name: string; role: string }) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    email: emailMap[p.id] ?? '',
  }))

  return (
    <div className="max-w-2xl pb-8">
      <EkipClient
        members={enriched}
        currentUserId={user!.id}
        isAdmin={isAdmin}
      />
    </div>
  )
}
