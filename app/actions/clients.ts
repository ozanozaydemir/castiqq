'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function findOrCreateClient(supabase: any, orgId: string, name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', orgId)
    .ilike('name', trimmed)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created } = await supabase
    .from('clients')
    .insert({ organization_id: orgId, name: trimmed })
    .select('id')
    .single()

  return created?.id ?? null
}

export async function createClientRecord(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Müşteri adı zorunludur.' }

  const { error } = await supabase.from('clients').insert({
    organization_id: orgId,
    name,
    client_type: (formData.get('client_type') as string) || 'diger',
    contact_name: str(formData.get('contact_name')),
    phone: str(formData.get('phone')),
    email: str(formData.get('email')),
    notes: str(formData.get('notes')),
  })

  if (error) return { error: error.message }
  revalidatePath('/musteriler')
  return { success: true }
}

export async function updateClient(clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Müşteri adı zorunludur.' }

  const { error } = await supabase.from('clients').update({
    name,
    client_type: (formData.get('client_type') as string) || 'diger',
    contact_name: str(formData.get('contact_name')),
    phone: str(formData.get('phone')),
    email: str(formData.get('email')),
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/musteriler')
  revalidatePath('/isler')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('clients').delete().eq('id', clientId)
  revalidatePath('/musteriler')
}
