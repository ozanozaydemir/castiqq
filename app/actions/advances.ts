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

export async function createAdvance(talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const amount = num(formData.get('amount'))
  const date = str(formData.get('date'))
  if (amount === null) return { error: 'Tutar zorunludur.' }
  if (!date) return { error: 'Tarih zorunludur.' }

  const { error } = await supabase.from('talent_advances').insert({
    organization_id: orgId,
    talent_id: talentId,
    booking_id: null,
    type: (formData.get('type') as string) || 'avans',
    amount,
    currency: str(formData.get('currency')) ?? 'TRY',
    date,
    description: str(formData.get('description')),
    is_settled: formData.get('is_settled') === 'on',
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function updateAdvance(advanceId: string, talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const amount = num(formData.get('amount'))
  const date = str(formData.get('date'))
  if (amount === null) return { error: 'Tutar zorunludur.' }
  if (!date) return { error: 'Tarih zorunludur.' }

  const { error } = await supabase.from('talent_advances').update({
    type: (formData.get('type') as string) || 'avans',
    amount,
    currency: str(formData.get('currency')) ?? 'TRY',
    date,
    description: str(formData.get('description')),
    is_settled: formData.get('is_settled') === 'on',
    updated_at: new Date().toISOString(),
  }).eq('id', advanceId)

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function deleteAdvance(advanceId: string, talentId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('talent_advances').delete().eq('id', advanceId)
  revalidatePath(`/oyuncular/${talentId}`)
}

export async function toggleAdvanceSettled(advanceId: string, talentId: string, isSettled: boolean) {
  const { supabase } = await requireOrg()
  await supabase.from('talent_advances').update({ is_settled: isSettled, updated_at: new Date().toISOString() }).eq('id', advanceId)
  revalidatePath(`/oyuncular/${talentId}`)
}
