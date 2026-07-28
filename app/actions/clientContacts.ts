'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  return (v as string | null)?.trim() || null
}

/**
 * Bir müşteride yalnızca tek bir birincil kontak olabilir — yenisi
 * işaretlendiğinde diğerlerinin bayrağını düşür.
 */
async function clearOtherPrimaries(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, clientId: string, keepId?: string,
) {
  let q = supabase.from('client_contacts').update({ is_primary: false }).eq('client_id', clientId)
  if (keepId) q = q.neq('id', keepId)
  await q
}

export async function createClientContact(clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return { error: 'Kişi adı zorunludur.' }

  const isPrimary = formData.get('is_primary') === 'on'

  const { error } = await supabase.from('client_contacts').insert({
    organization_id: orgId,
    client_id: clientId,
    full_name: fullName,
    role: (formData.get('role') as string) || 'diger',
    title: str(formData.get('title')),
    email: str(formData.get('email')),
    phone: str(formData.get('phone')),
    is_primary: isPrimary,
    last_contacted_at: str(formData.get('last_contacted_at')),
    notes: str(formData.get('notes')),
    created_by: userId,
  })

  if (error) return { error: error.message }
  if (isPrimary) await clearOtherPrimaries(supabase, clientId)

  revalidatePath(`/musteriler/${clientId}`)
  return { success: true }
}

export async function updateClientContact(contactId: string, clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return { error: 'Kişi adı zorunludur.' }

  const isPrimary = formData.get('is_primary') === 'on'

  const { error } = await supabase.from('client_contacts').update({
    full_name: fullName,
    role: (formData.get('role') as string) || 'diger',
    title: str(formData.get('title')),
    email: str(formData.get('email')),
    phone: str(formData.get('phone')),
    is_primary: isPrimary,
    last_contacted_at: str(formData.get('last_contacted_at')),
    notes: str(formData.get('notes')),
  }).eq('id', contactId)

  if (error) return { error: error.message }
  if (isPrimary) await clearOtherPrimaries(supabase, clientId, contactId)

  revalidatePath(`/musteriler/${clientId}`)
  return { success: true }
}

export async function deleteClientContact(contactId: string, clientId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('client_contacts').delete().eq('id', contactId)
  revalidatePath(`/musteriler/${clientId}`)
}
