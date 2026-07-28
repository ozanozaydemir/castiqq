'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v)
  return v && !isNaN(n) ? n : null
}

/**
 * Çoklu seçim alanları (sektör, marka kategorisi) form'da aynı isimle
 * birden fazla checkbox olarak geliyor — TEXT[] kolonuna diziye çevir.
 */
function arr(formData: FormData, key: string): string[] {
  return formData.getAll(key).map(v => (v as string).trim()).filter(Boolean)
}

/** Formdan gelen tüm CRM alanlarını tek yerde topla — create/update aynı şekli kullanıyor. */
function crmFields(formData: FormData) {
  return {
    client_type: (formData.get('client_type') as string) || 'diger',
    contact_name: str(formData.get('contact_name')),
    phone: str(formData.get('phone')),
    email: str(formData.get('email')),
    notes: str(formData.get('notes')),
    industry_segments: arr(formData, 'industry_segments'),
    parent_client_id: str(formData.get('parent_client_id')),
    tier: (formData.get('tier') as string) || 'tier_3',
    website: str(formData.get('website')),
    address: str(formData.get('address')),
    tax_office: str(formData.get('tax_office')),
    tax_number: str(formData.get('tax_number')),
    payment_terms: (formData.get('payment_terms') as string) || 'net_30',
    payment_rating: (formData.get('payment_rating') as string) || 'belirsiz',
    credit_limit: num(formData.get('credit_limit')),
    billing_email: str(formData.get('billing_email')),
    account_manager_id: str(formData.get('account_manager_id')),
    exclusivity_categories: arr(formData, 'exclusivity_categories'),
    preferred_pitch_styles: str(formData.get('preferred_pitch_styles')),
    budget_range: str(formData.get('budget_range')),
    working_status: (formData.get('working_status') as string) || 'aktif',
  }
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
    ...crmFields(formData),
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
    ...crmFields(formData),
  }).eq('id', clientId)

  if (error) return { error: error.message }
  revalidatePath('/musteriler')
  revalidatePath(`/musteriler/${clientId}`)
  revalidatePath('/isler')
  return { success: true }
}

export async function deleteClient(clientId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('clients').delete().eq('id', clientId)
  revalidatePath('/musteriler')
}
