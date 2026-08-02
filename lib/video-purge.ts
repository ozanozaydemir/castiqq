import { deleteManyFromR2 } from '@/lib/r2'

// R2 silme kuyruğu.
//
// Sıralama tuzağı: önce R2 silinip DB patlarsa sayaç yalan söyler; önce DB
// silinip R2 patlarsa storage_path'i kaybederiz ve nesne sonsuza kadar para
// yakar. Kuyruk bunu çözüyor — yol önce buraya yazılıyor, DB satırı sonra
// siliniyor, R2 en son temizleniyor. Başarısızlar kuyrukta kalıp yeniden
// deneniyor.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = any

export type PurgeReason = 'retention' | 'talent_request' | 'cascade' | 'manual'

/** Kuyruk satırı bu kadar denemeden sonra elle müdahale gerektiriyor sayılır. */
export const MAX_PURGE_ATTEMPTS = 5

/**
 * Yolları kuyruğa ekler. DB satırı silinmeden ÖNCE çağrılmalı.
 * Aynı yol iki kez kuyruğa girerse (ör. hem retention hem cascade) unique
 * index sessizce yutuyor.
 */
export async function queueForPurge(
  admin: Admin,
  paths: string[],
  reason: PurgeReason,
  organizationId?: string | null,
): Promise<void> {
  const clean = paths.filter(Boolean)
  if (clean.length === 0) return

  const { error } = await admin
    .from('video_purge_queue')
    .upsert(
      clean.map(p => ({ storage_path: p, reason, organization_id: organizationId ?? null })),
      { onConflict: 'storage_path', ignoreDuplicates: true },
    )

  if (error) {
    // Kuyruğa yazamadıysak R2 nesnesi yetim kalacak; en azından görünür olsun.
    console.error('[video-purge] kuyruğa eklenemedi', error.message, `(${clean.length} yol)`)
  }
}

/**
 * Kuyruktaki nesneleri R2'den siler, başarılı olanları kuyruktan düşürür.
 * Döngüsel çağrıya uygun: her seferinde sınırlı sayıda işler.
 */
export async function processPurgeQueue(
  admin: Admin,
  limit = 200,
): Promise<{ deleted: number; failed: number }> {
  const { data: rows } = await admin
    .from('video_purge_queue')
    .select('id, storage_path, attempts')
    .lt('attempts', MAX_PURGE_ATTEMPTS)
    .order('created_at', { ascending: true })
    .limit(limit)

  const queue = (rows ?? []) as { id: string; storage_path: string; attempts: number }[]
  if (queue.length === 0) return { deleted: 0, failed: 0 }

  const paths = queue.map(r => r.storage_path)

  try {
    await deleteManyFromR2(paths)
    await admin.from('video_purge_queue').delete().in('id', queue.map(r => r.id))
    return { deleted: queue.length, failed: 0 }
  } catch (err) {
    const message = (err as Error).message
    console.error('[video-purge] R2 silme başarısız', message, `(${paths.length} nesne)`)

    // Toplu silme çöktü: sayaçları artır ki sonsuza kadar denenmesin ve
    // MAX_PURGE_ATTEMPTS'i geçenler elle incelenebilsin.
    await Promise.all(queue.map(r =>
      admin
        .from('video_purge_queue')
        .update({
          attempts: r.attempts + 1,
          last_error: message.slice(0, 500),
          last_attempt_at: new Date().toISOString(),
        })
        .eq('id', r.id),
    ))
    return { deleted: 0, failed: queue.length }
  }
}

/** Elle inceleme bekleyen (deneme hakkı bitmiş) kuyruk satırları. */
export async function stuckPurgeCount(admin: Admin): Promise<number> {
  const { count } = await admin
    .from('video_purge_queue')
    .select('*', { count: 'exact', head: true })
    .gte('attempts', MAX_PURGE_ATTEMPTS)
  return count ?? 0
}
