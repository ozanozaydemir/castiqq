'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { ALL_TYPES } from '@/lib/role-relationships'
import type { RelationshipType } from '@/types/database'

export type RelActionState = { error?: string; success?: boolean }

function revalidateProject(projectId: string) {
  revalidatePath(`/[locale]/projeler/${projectId}`, 'page')
  revalidatePath('/[locale]/roller/[id]', 'page')
}

/**
 * Her iki rolün de çağıranın org'una VE aynı projeye ait olduğunu doğrular.
 *
 * RLS yalnızca organization_id'yi koruyor; onsuz aynı org içindeki başka bir
 * projenin rolüne kenar çekilebilirdi ve diyagram sessizce bozulurdu.
 */
async function assertRolesInProject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any, projectId: string, roleIds: string[],
): Promise<boolean> {
  const unique = [...new Set(roleIds)]
  const { data } = await supabase
    .from('project_roles')
    .select('id')
    .eq('project_id', projectId)
    .in('id', unique)
  return (data?.length ?? 0) === unique.length
}

export async function createRelationship(
  projectId: string,
  fromRoleId: string,
  toRoleId: string,
  type: RelationshipType,
  label?: string | null,
): Promise<RelActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  if (fromRoleId === toRoleId) return { error: 'Bir rol kendisiyle ilişkilendirilemez.' }
  if (!ALL_TYPES.includes(type)) return { error: 'Geçersiz ilişki tipi.' }
  if (!(await assertRolesInProject(supabase, projectId, [fromRoleId, toRoleId]))) {
    return { error: 'Roller bu projeye ait değil.' }
  }

  const { error } = await supabase.from('role_relationships').insert({
    organization_id: orgId,
    project_id:      projectId,
    from_role_id:    fromRoleId,
    to_role_id:      toRoleId,
    type,
    label:           label?.trim() || null,
    created_by:      userId,
  })

  if (error) {
    // Kanonik sıralama trigger'ı simetrik tipleri tek yöne indirdiği için
    // "Ayşe–Ahmet evli" zaten varken "Ahmet–Ayşe evli" de bu hataya düşer.
    if (error.code === '23505') return { error: 'Bu ilişki zaten tanımlı.' }
    console.error('[createRelationship]', error.message, error.code, error.hint)
    return { error: error.message }
  }

  revalidateProject(projectId)
  return { success: true }
}

export async function updateRelationship(
  id: string,
  projectId: string,
  type: RelationshipType,
  label?: string | null,
): Promise<RelActionState> {
  const { supabase } = await requireOrg()

  if (!ALL_TYPES.includes(type)) return { error: 'Geçersiz ilişki tipi.' }

  const { error } = await supabase
    .from('role_relationships')
    .update({ type, label: label?.trim() || null })
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    if (error.code === '23505') return { error: 'Bu ilişki zaten tanımlı.' }
    console.error('[updateRelationship]', error.message, error.code)
    return { error: error.message }
  }

  revalidateProject(projectId)
  return { success: true }
}

export async function deleteRelationship(id: string, projectId: string): Promise<RelActionState> {
  const { supabase } = await requireOrg()

  const { error } = await supabase
    .from('role_relationships')
    .delete()
    .eq('id', id)
    .eq('project_id', projectId)

  if (error) {
    console.error('[deleteRelationship]', error.message, error.code)
    return { error: error.message }
  }

  revalidateProject(projectId)
  return { success: true }
}

/**
 * Diyagramdaki düğüm konumlarını topluca kaydeder (sürükleme sonrası).
 *
 * Konumlar project_roles üzerinde tutuluyor; her rol kendi projesinin
 * diyagramında bir kez göründüğü için ayrı tabloya gerek yok.
 */
export async function saveNodePositions(
  projectId: string,
  positions: { roleId: string; x: number; y: number }[],
): Promise<RelActionState> {
  const { supabase } = await requireOrg()
  if (positions.length === 0) return { success: true }

  if (!(await assertRolesInProject(supabase, projectId, positions.map(p => p.roleId)))) {
    return { error: 'Roller bu projeye ait değil.' }
  }

  const results = await Promise.all(
    positions.map(p =>
      supabase
        .from('project_roles')
        .update({ diagram_x: p.x, diagram_y: p.y })
        .eq('id', p.roleId)
        .eq('project_id', projectId),
    ),
  )

  const failed = results.find(r => r.error)
  if (failed?.error) {
    console.error('[saveNodePositions]', failed.error.message, failed.error.code)
    return { error: failed.error.message }
  }

  // Konum kaydı sayfayı yeniden doğrulamaz: kullanıcı sürüklerken canvas zaten
  // güncel, revalidate etmek sürüklemeyi geri sektirirdi.
  return { success: true }
}

/** Rolü diyagramdan çıkarır (rolün kendisini silmez). */
export async function removeRoleFromDiagram(roleId: string, projectId: string): Promise<RelActionState> {
  const { supabase } = await requireOrg()

  const { error } = await supabase
    .from('project_roles')
    .update({ diagram_x: null, diagram_y: null })
    .eq('id', roleId)
    .eq('project_id', projectId)

  if (error) {
    console.error('[removeRoleFromDiagram]', error.message, error.code)
    return { error: error.message }
  }

  revalidateProject(projectId)
  return { success: true }
}
