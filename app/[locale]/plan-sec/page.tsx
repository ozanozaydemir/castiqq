import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanSecClient } from './PlanSecClient'

export default async function PlanSecPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  const { data: org } = await supabase
    .from('organizations')
    .select('org_type')
    .eq('id', profile?.organization_id ?? '')
    .single()

  const orgType = org?.org_type === 'agency' ? 'agency' : 'production'

  return <PlanSecClient orgType={orgType} />
}
