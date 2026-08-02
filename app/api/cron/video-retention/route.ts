import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { queueForPurge, processPurgeQueue, stuckPurgeCount } from '@/lib/video-purge'
import { sendRetentionWarningEmail } from '@/lib/resend'

export const maxDuration = 60

/** Silmeden kaç gün önce direktöre haber verilsin. */
const WARN_DAYS = 3

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const nowIso = now.toISOString()
  const warnIso = new Date(now.getTime() + WARN_DAYS * 86_400_000).toISOString()

  // ── 1. Süresi dolmuş videoları sil ────────────────────────────────────────
  const { data: expiredAuditions } = await admin
    .from('auditions')
    .select('id, organization_id')
    .not('retention_until', 'is', null)
    .lt('retention_until', nowIso)

  const auditionIds = (expiredAuditions ?? []).map((a: { id: string }) => a.id)
  let purged = 0

  if (auditionIds.length > 0) {
    const { data: videos } = await admin
      .from('audition_videos')
      .select('id, storage_path, organization_id')
      .in('audition_id', auditionIds)

    const rows = (videos ?? []) as { id: string; storage_path: string; organization_id: string }[]

    if (rows.length > 0) {
      // Sıra kritik: önce kuyruk, sonra DB. Tersi olsaydı DB silinip R2
      // patladığında storage_path'i sonsuza kadar kaybederdik.
      const byOrg = new Map<string, string[]>()
      for (const v of rows) {
        byOrg.set(v.organization_id, [...(byOrg.get(v.organization_id) ?? []), v.storage_path])
      }
      for (const [orgId, paths] of byOrg) {
        await queueForPurge(admin, paths, 'retention', orgId)
      }

      // DB satırları gidince migration 053 trigger'ı storage_used_bytes'ı düşürüyor.
      const { error } = await admin
        .from('audition_videos')
        .delete()
        .in('id', rows.map(v => v.id))

      if (error) {
        console.error('[video-retention] DB silme başarısız', error.message)
      } else {
        purged = rows.length
      }
    }
  }

  // ── 2. Kuyruğu işle (bu turun + önceki turlardan kalanlar) ────────────────
  const purgeResult = await processPurgeQueue(admin)

  // ── 3. Yaklaşan silmeler için direktöre uyarı ─────────────────────────────
  const { data: soon } = await admin
    .from('auditions')
    .select('id, organization_id, talent_name, retention_until, role_id')
    .not('retention_until', 'is', null)
    .gt('retention_until', nowIso)
    .lte('retention_until', warnIso)

  const upcoming = (soon ?? []) as {
    id: string; organization_id: string; talent_name: string | null
    retention_until: string; role_id: string
  }[]

  // Org başına tek email — 40 audition için 40 mail atmak spam olurdu.
  const byOrg = new Map<string, typeof upcoming>()
  for (const a of upcoming) {
    // Videosu olmayan audition için uyarı anlamsız.
    byOrg.set(a.organization_id, [...(byOrg.get(a.organization_id) ?? []), a])
  }

  let warned = 0
  for (const [orgId, list] of byOrg) {
    const { count } = await admin
      .from('audition_videos')
      .select('*', { count: 'exact', head: true })
      .in('audition_id', list.map(a => a.id))
    if (!count) continue

    const { data: admins } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', orgId)
      .eq('role', 'admin')
      .limit(3)

    const soonest = list
      .map(a => a.retention_until)
      .sort()[0]

    for (const p of admins ?? []) {
      const { data: authData } = await admin.auth.admin.getUserById(p.id)
      const email = authData?.user?.email
      if (!email) continue
      await sendRetentionWarningEmail(email, count, soonest).catch(err =>
        console.error('[video-retention] uyarı emaili gönderilemedi', err.message),
      )
      warned++
    }
  }

  const stuck = await stuckPurgeCount(admin)
  if (stuck > 0) {
    console.error(`[video-retention] ${stuck} nesne silinemiyor, elle inceleme gerekiyor`)
  }

  return NextResponse.json({
    ok: true,
    expiredAuditions: auditionIds.length,
    videosDeleted: purged,
    r2Deleted: purgeResult.deleted,
    r2Failed: purgeResult.failed,
    warningsSent: warned,
    stuckInQueue: stuck,
  })
}
