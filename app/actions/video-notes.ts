'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export async function addVideoNote(
  videoId: string,
  roleId: string,
  timestampSeconds: number,
  note: string,
): Promise<{ error?: string; id?: string }> {
  const { supabase, orgId, userId } = await requireOrg()
  const text = note.trim()
  if (!text) return { error: 'Not boş olamaz.' }

  const { data, error } = await supabase
    .from('video_notes')
    .insert({
      organization_id: orgId,
      audition_video_id: videoId,
      user_id: userId,
      timestamp_seconds: Math.round(timestampSeconds),
      note: text,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath(`/roller/${roleId}`)
  return { id: data.id }
}

export async function deleteVideoNote(noteId: string, roleId: string): Promise<void> {
  const { supabase } = await requireOrg()
  await supabase.from('video_notes').delete().eq('id', noteId)
  revalidatePath(`/roller/${roleId}`)
}
