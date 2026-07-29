import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanSecClient } from './PlanSecClient'

export default async function PlanSecPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  return <PlanSecClient />
}
