'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

export async function createTask(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Başlık zorunludur.' }

  const { error } = await supabase.from('agency_tasks').insert({
    organization_id: orgId,
    talent_id: str(formData.get('talent_id')),
    title,
    due_date: str(formData.get('due_date')),
    is_done: false,
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath('/gorevler')
  revalidatePath('/genel-bakis')
  if (formData.get('talent_id')) revalidatePath(`/oyuncular/${formData.get('talent_id')}`)
  return { success: true }
}

export async function toggleTaskDone(taskId: string, isDone: boolean, talentId?: string | null) {
  const { supabase } = await requireOrg()
  await supabase.from('agency_tasks').update({ is_done: isDone, updated_at: new Date().toISOString() }).eq('id', taskId)
  revalidatePath('/gorevler')
  revalidatePath('/genel-bakis')
  if (talentId) revalidatePath(`/oyuncular/${talentId}`)
}

export async function deleteTask(taskId: string, talentId?: string | null) {
  const { supabase } = await requireOrg()
  await supabase.from('agency_tasks').delete().eq('id', taskId)
  revalidatePath('/gorevler')
  revalidatePath('/genel-bakis')
  if (talentId) revalidatePath(`/oyuncular/${talentId}`)
}
