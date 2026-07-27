'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type SetupActionState = { error?: string } | null

// Bilerek requireOrg() kullanmıyor — bu adımda org henüz abonelik almamış
// olabilir (Google OAuth ile yeni kaydolan kullanıcı için normal durum),
// requireOrg()'un subscription kontrolü burada erken devreye girip
// firma adı hiç kaydedilemeden /plan-sec'e atardı.
export async function completeOrgSetup(_: SetupActionState, formData: FormData): Promise<SetupActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) return { error: 'Organizasyon bulunamadı.' }

  const orgName = (formData.get('org_name') as string)?.trim()
  if (!orgName) return { error: 'Firma adı zorunludur.' }

  const { error } = await supabase
    .from('organizations')
    .update({ name: orgName })
    .eq('id', profile.organization_id)

  if (error) return { error: error.message }

  redirect('/plan-sec')
}
