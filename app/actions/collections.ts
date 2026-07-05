'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { redirect } from 'next/navigation'

export type CollectionActionState = { error?: string; id?: string } | null

export async function createCollection(
  _: CollectionActionState,
  formData: FormData,
): Promise<CollectionActionState> {
  const { supabase, orgId, userId } = await requireOrg()
  const name = (formData.get('name') as string | null)?.trim()
  const description = (formData.get('description') as string | null)?.trim() || null
  if (!name) return { error: 'Liste adı zorunludur.' }

  const { data, error } = await supabase
    .from('collections')
    .insert({ organization_id: orgId, name, description, created_by: userId })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/listeler')
  return { id: data.id }
}

export async function deleteCollection(id: string): Promise<void> {
  const { supabase } = await requireOrg()
  await supabase.from('collections').delete().eq('id', id)
  revalidatePath('/listeler')
  redirect('/listeler')
}

export async function addToCollection(
  collectionId: string,
  talentId: string,
): Promise<{ error?: string }> {
  const { supabase, userId } = await requireOrg()
  const { error } = await supabase
    .from('collection_items')
    .insert({ collection_id: collectionId, talent_id: talentId, added_by: userId })

  if (error && !error.code?.includes('23505')) return { error: error.message }
  revalidatePath(`/listeler/${collectionId}`)
  return {}
}

export async function updateCollection(
  id: string,
  name: string,
  description: string | null,
): Promise<CollectionActionState> {
  const { supabase } = await requireOrg()
  const trimmed = name.trim()
  if (!trimmed) return { error: 'Liste adı zorunludur.' }
  const { error } = await supabase
    .from('collections')
    .update({ name: trimmed, description: description?.trim() || null })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath(`/listeler/${id}`)
  revalidatePath('/listeler')
  return {}
}

export async function bulkAddToCollection(
  talentIds: string[],
  collectionId: string,
): Promise<{ error?: string; count?: number }> {
  if (!talentIds.length) return { error: 'Oyuncu seçilmedi.' }
  const { supabase, userId } = await requireOrg()
  const rows = talentIds.map(talentId => ({
    collection_id: collectionId,
    talent_id: talentId,
    added_by: userId,
  }))
  const { error } = await supabase
    .from('collection_items')
    .upsert(rows, { onConflict: 'collection_id,talent_id', ignoreDuplicates: true })
  if (error) return { error: error.message }
  revalidatePath(`/listeler/${collectionId}`)
  return { count: talentIds.length }
}

export async function removeFromCollection(
  collectionId: string,
  talentId: string,
): Promise<void> {
  const { supabase } = await requireOrg()
  await supabase
    .from('collection_items')
    .delete()
    .eq('collection_id', collectionId)
    .eq('talent_id', talentId)
  revalidatePath(`/listeler/${collectionId}`)
}

export async function addToCollectionByName(
  talentId: string,
  collectionName: string,
): Promise<{ error?: string; collectionId?: string }> {
  const { supabase, orgId, userId } = await requireOrg()
  const name = collectionName.trim()
  if (!name) return { error: 'Liste adı zorunludur.' }

  // find or create collection
  let { data: col } = await supabase
    .from('collections')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', name)
    .maybeSingle()

  if (!col) {
    const { data: newCol, error } = await supabase
      .from('collections')
      .insert({ organization_id: orgId, name, created_by: userId })
      .select('id')
      .single()
    if (error || !newCol) return { error: error?.message ?? 'Liste oluşturulamadı.' }
    col = newCol
  }

  const { error: linkErr } = await supabase
    .from('collection_items')
    .insert({ collection_id: col.id, talent_id: talentId, added_by: userId })

  if (linkErr && !linkErr.code?.includes('23505')) return { error: linkErr.message }

  revalidatePath('/listeler')
  revalidatePath(`/listeler/${col.id}`)
  revalidatePath(`/oyuncular/${talentId}`)
  return { collectionId: col.id }
}
