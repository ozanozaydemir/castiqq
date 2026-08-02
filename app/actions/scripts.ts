'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { MAX_SCRIPTS_PER_ROLE, MAX_SCRIPT_BYTES } from '@/lib/scripts'

export type ScriptActionState = { error?: string; success?: boolean; scriptId?: string }

/**
 * Yüklenmiş dosyayı rolün senaryo havuzuna kaydeder.
 *
 * Dosya client'tan doğrudan Storage'a yükleniyor (mevcut desen); burada yalnızca
 * kaydı oluşturuyoruz. Kayıt başarısız olursa client yüklediği dosyayı siliyor,
 * aksi halde Storage'da yetim dosya kalırdı.
 */
export async function addRoleScript(
  roleId: string,
  storagePath: string,
  originalName: string,
  fileSizeBytes: number | null,
  label?: string | null,
): Promise<ScriptActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  if (fileSizeBytes != null && fileSizeBytes > MAX_SCRIPT_BYTES) {
    return { error: `Dosya çok büyük (en fazla ${MAX_SCRIPT_BYTES / 1024 / 1024} MB).` }
  }

  // Rolün bu org'a ait olduğunu doğrula — storagePath client'tan geliyor.
  const { data: role } = await supabase
    .from('project_roles')
    .select('id, project_id')
    .eq('id', roleId)
    .eq('organization_id', orgId)
    .maybeSingle()
  if (!role) return { error: 'Rol bulunamadı.' }

  const { count } = await supabase
    .from('role_scripts')
    .select('*', { count: 'exact', head: true })
    .eq('role_id', roleId)
  if ((count ?? 0) >= MAX_SCRIPTS_PER_ROLE) {
    return { error: `Bir role en fazla ${MAX_SCRIPTS_PER_ROLE} senaryo eklenebilir.` }
  }

  const { data, error } = await supabase
    .from('role_scripts')
    .insert({
      organization_id: orgId,
      role_id: roleId,
      storage_path: storagePath,
      original_name: originalName,
      label: label?.trim() || null,
      sort_order: count ?? 0,
      file_size_bytes: fileSizeBytes,
      created_by: userId,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[addRoleScript]', error.message, error.code)
    return { error: error.message }
  }

  revalidatePath(`/projeler/${role.project_id}`)
  revalidatePath('/roller/[id]', 'page')
  return { success: true, scriptId: data.id }
}

export async function updateRoleScriptLabel(scriptId: string, label: string): Promise<ScriptActionState> {
  const { supabase, orgId } = await requireOrg()

  const { error } = await supabase
    .from('role_scripts')
    .update({ label: label.trim() || null })
    .eq('id', scriptId)
    .eq('organization_id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/roller/[id]', 'page')
  return { success: true }
}

export async function deleteRoleScript(scriptId: string): Promise<ScriptActionState> {
  const { supabase, orgId } = await requireOrg()

  const { data: script } = await supabase
    .from('role_scripts')
    .select('storage_path, role_id')
    .eq('id', scriptId)
    .eq('organization_id', orgId)
    .maybeSingle()
  if (!script) return { error: 'Senaryo bulunamadı.' }

  // Önce DB satırı: Storage silme başarısız olsa bile kullanıcı senaryoyu
  // listede görmeye devam etmemeli. Storage'da kalan dosya erişilemez
  // (private bucket + artık hiçbir audition_scripts kaydı işaret etmiyor).
  const { error } = await supabase.from('role_scripts').delete().eq('id', scriptId)
  if (error) return { error: error.message }

  const { error: storageError } = await supabase.storage.from('scripts').remove([script.storage_path])
  if (storageError) {
    console.error('[deleteRoleScript] storage temizlenemedi', script.storage_path, storageError.message)
  }

  revalidatePath('/roller/[id]', 'page')
  return { success: true }
}

/** Sürükle-bırak sonrası sıralamayı kaydeder. */
export async function reorderRoleScripts(
  roleId: string,
  orderedIds: string[],
): Promise<ScriptActionState> {
  const { supabase, orgId } = await requireOrg()

  const results = await Promise.all(
    orderedIds.map((id, i) =>
      supabase
        .from('role_scripts')
        .update({ sort_order: i })
        .eq('id', id)
        .eq('role_id', roleId)
        .eq('organization_id', orgId),
    ),
  )
  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  revalidatePath('/roller/[id]', 'page')
  return { success: true }
}
