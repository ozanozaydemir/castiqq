'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

export async function createInteraction(clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const interactionDate = str(formData.get('interaction_date'))
  if (!interactionDate) return { error: 'Tarih zorunludur.' }

  const { error } = await supabase.from('client_interactions').insert({
    organization_id: orgId,
    client_id: clientId,
    talent_id: str(formData.get('talent_id')),
    interaction_type: (formData.get('interaction_type') as string) || 'diger',
    interaction_date: interactionDate,
    notes: str(formData.get('notes')),
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath(`/musteriler/${clientId}`)
  return { success: true }
}

export async function updateInteraction(interactionId: string, clientId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const interactionDate = str(formData.get('interaction_date'))
  if (!interactionDate) return { error: 'Tarih zorunludur.' }

  const { error } = await supabase.from('client_interactions').update({
    talent_id: str(formData.get('talent_id')),
    interaction_type: (formData.get('interaction_type') as string) || 'diger',
    interaction_date: interactionDate,
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', interactionId)

  if (error) return { error: error.message }
  revalidatePath(`/musteriler/${clientId}`)
  return { success: true }
}

export async function deleteInteraction(interactionId: string, clientId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('client_interactions').delete().eq('id', interactionId)
  revalidatePath(`/musteriler/${clientId}`)
}
