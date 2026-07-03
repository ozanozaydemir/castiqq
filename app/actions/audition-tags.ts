'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export async function addAuditionTag(
  auditionId: string,
  roleId: string,
  tagName: string,
): Promise<{ error?: string; tag?: { id: string; name: string } }> {
  const { supabase, orgId } = await requireOrg()
  const name = tagName.trim().toLowerCase()
  if (!name) return { error: 'Etiket adı boş olamaz.' }

  const { data: tag, error: tagErr } = await supabase
    .from('tags')
    .upsert({ organization_id: orgId, name }, { onConflict: 'organization_id,name' })
    .select('id, name')
    .single()

  if (tagErr || !tag) return { error: tagErr?.message ?? 'Etiket oluşturulamadı.' }

  const { error: linkErr } = await supabase
    .from('audition_tags')
    .insert({ audition_id: auditionId, tag_id: tag.id })

  // ignore duplicate — tag already on this audition
  if (linkErr && !linkErr.code?.includes('23505')) return { error: linkErr.message }

  revalidatePath(`/roller/${roleId}`)
  return { tag }
}

export async function removeAuditionTag(
  auditionId: string,
  tagId: string,
  roleId: string,
): Promise<void> {
  const { supabase } = await requireOrg()
  await supabase
    .from('audition_tags')
    .delete()
    .eq('audition_id', auditionId)
    .eq('tag_id', tagId)
  revalidatePath(`/roller/${roleId}`)
}
