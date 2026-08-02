import { deleteManyFromR2 } from '@/lib/r2'
import { queueForPurge } from '@/lib/video-purge'

// audition_videos, projects → project_roles → auditions zinciri boyunca
// ON DELETE CASCADE ile siliniyor. DB tarafında sayaç trigger'ı (migration
// 053) devrede ama R2 nesneleri otomatik temizlenmiyor — bu yüzden silme
// işleminden ÖNCE storage_path'leri toplamak, sonra R2'dan silmek gerekiyor.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = any

async function pathsForAuditions(supabase: Client, auditionIds: string[]): Promise<string[]> {
  if (auditionIds.length === 0) return []
  const { data } = await supabase
    .from('audition_videos')
    .select('storage_path')
    .in('audition_id', auditionIds)
  return (data ?? []).map((v: { storage_path: string }) => v.storage_path).filter(Boolean)
}

async function auditionIdsForRoles(supabase: Client, roleIds: string[]): Promise<string[]> {
  if (roleIds.length === 0) return []
  const { data } = await supabase
    .from('auditions')
    .select('id')
    .in('role_id', roleIds)
  return (data ?? []).map((a: { id: string }) => a.id)
}

export async function projectVideoPaths(supabase: Client, projectId: string): Promise<string[]> {
  const { data: roles } = await supabase
    .from('project_roles')
    .select('id')
    .eq('project_id', projectId)
  const roleIds = (roles ?? []).map((r: { id: string }) => r.id)
  return pathsForAuditions(supabase, await auditionIdsForRoles(supabase, roleIds))
}

export async function roleVideoPaths(supabase: Client, roleId: string): Promise<string[]> {
  return pathsForAuditions(supabase, await auditionIdsForRoles(supabase, [roleId]))
}

export async function auditionVideoPaths(supabase: Client, auditionId: string): Promise<string[]> {
  return pathsForAuditions(supabase, [auditionId])
}

/**
 * R2 temizliği DB silmesini bloklamamalı. Eskiden hata yutuluyordu ve nesneler
 * kalıcı olarak sızıyordu — artık yollar önce kuyruğa yazılıyor, silme
 * başarısız olursa cron yeniden deniyor.
 */
export async function purgeR2(paths: string[], organizationId?: string | null): Promise<void> {
  if (paths.length === 0) return

  const { createAdminClient } = await import('@/lib/supabase/admin')
  const admin = createAdminClient()

  // Kuyruğa yaz: bu çağrı başarısız olsa bile aşağıdaki denemenin sonucundan
  // bağımsız olarak yol kayıt altında kalsın.
  await queueForPurge(admin, paths, 'cascade', organizationId)

  try {
    await deleteManyFromR2(paths)
    await admin.from('video_purge_queue').delete().in('storage_path', paths)
  } catch (err) {
    console.error(
      '[video-cleanup] R2 silme başarısız, kuyrukta yeniden denenecek:',
      (err as Error).message, `(${paths.length} nesne)`,
    )
  }
}
