'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

export async function createDocument(talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { error } = await supabase.from('talent_documents').insert({
    organization_id: orgId,
    talent_id: talentId,
    document_type: (formData.get('document_type') as string) || 'diger',
    file_path: str(formData.get('file_path')),
    expiry_date: str(formData.get('expiry_date')),
    notes: str(formData.get('notes')),
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function updateDocument(documentId: string, talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const { error } = await supabase.from('talent_documents').update({
    document_type: (formData.get('document_type') as string) || 'diger',
    file_path: str(formData.get('file_path')),
    expiry_date: str(formData.get('expiry_date')),
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', documentId)

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function deleteDocument(documentId: string, talentId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('talent_documents').delete().eq('id', documentId)
  revalidatePath(`/oyuncular/${talentId}`)
}
