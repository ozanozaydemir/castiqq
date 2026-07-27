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

export async function createRepresentationPeriod(talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const startDate = str(formData.get('start_date'))
  if (!startDate) return { error: 'Başlangıç tarihi zorunludur.' }

  const { error } = await supabase.from('talent_representation_history').insert({
    organization_id: orgId,
    talent_id: talentId,
    start_date: startDate,
    end_date: str(formData.get('end_date')),
    commission_rate: num(formData.get('commission_rate')),
    notes: str(formData.get('notes')),
  })

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function updateRepresentationPeriod(periodId: string, talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const startDate = str(formData.get('start_date'))
  if (!startDate) return { error: 'Başlangıç tarihi zorunludur.' }

  const { error } = await supabase.from('talent_representation_history').update({
    start_date: startDate,
    end_date: str(formData.get('end_date')),
    commission_rate: num(formData.get('commission_rate')),
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', periodId)

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function deleteRepresentationPeriod(periodId: string, talentId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('talent_representation_history').delete().eq('id', periodId)
  revalidatePath(`/oyuncular/${talentId}`)
}
