'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

export async function updateOrg(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Organizasyon adı zorunludur.' }
  const { error } = await supabase.from('organizations').update({ name }).eq('id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/ayarlar')
  return { success: true }
}

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireOrg()
  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Ad soyad zorunludur.' }
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/ayarlar')
  return { success: true }
}
