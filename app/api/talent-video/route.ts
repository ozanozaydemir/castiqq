import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { queueForPurge, processPurgeQueue } from '@/lib/video-purge'
import { sendTalentDeletedVideoEmail } from '@/lib/resend'
import { rateLimit } from '@/lib/rate-limit'

/**
 * Oyuncunun kendi audition videosunu silmesi.
 *
 * Bu rota, KVKK/GDPR silme hakkının uygulandığı tek yol. Saklama tarihini
 * yalnızca direktör belirlediği için, oyuncunun verisi üzerindeki kontrolü
 * buradan geçiyor — dolayısıyla kolay erişilebilir ve güvenilir olmak zorunda.
 *
 * Yetki: audition token'ı. Videonun o token'a ait audition'a bağlı olduğu
 * doğrulanmadan silme yapılmıyor.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = rateLimit(`talent-video-delete:${ip}`, 10, 60_000)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Çok fazla istek.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    )
  }

  let body: { token?: string; videoId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const { token, videoId } = body
  if (!token || !videoId) {
    return NextResponse.json({ error: 'Eksik parametre.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: audition } = await admin
    .from('auditions')
    .select('id, organization_id, talent_name, role_id, talent(full_name), project_roles(name)')
    .eq('token', token)
    .single()

  if (!audition) {
    return NextResponse.json({ error: 'Geçersiz link.' }, { status: 404 })
  }

  // Videonun gerçekten bu audition'a ait olduğunu doğrula — videoId client'tan
  // geliyor ve bu kontrol olmadan başka bir audition'ın videosu silinebilirdi.
  const { data: video } = await admin
    .from('audition_videos')
    .select('id, storage_path')
    .eq('id', videoId)
    .eq('audition_id', audition.id)
    .maybeSingle()

  if (!video) {
    return NextResponse.json({ error: 'Video bulunamadı.' }, { status: 404 })
  }

  // Sıra: kuyruk → DB → R2. Ters sırada DB silinip R2 patlarsa yolu kaybederdik.
  await queueForPurge(admin, [video.storage_path], 'talent_request', audition.organization_id)

  const { error } = await admin.from('audition_videos').delete().eq('id', video.id)
  if (error) {
    console.error('[talent-video] DB silme başarısız', error.message)
    return NextResponse.json({ error: 'Video silinemedi.' }, { status: 500 })
  }

  // İz bırak: videolar gitse de hakkın kullanıldığı görünür kalsın.
  await admin
    .from('auditions')
    .update({ talent_deleted_video_at: new Date().toISOString() })
    .eq('id', audition.id)

  await processPurgeQueue(admin, 20)

  // Direktöre haber ver — değerlendirme sırasında materyal kaybolduysa
  // bunu fark etmeli.
  const talentName =
    (audition.talent as unknown as { full_name: string } | null)?.full_name
    ?? audition.talent_name ?? 'Oyuncu'
  const roleName = (audition.project_roles as unknown as { name: string } | null)?.name ?? ''

  const { data: admins } = await admin
    .from('profiles')
    .select('id')
    .eq('organization_id', audition.organization_id)
    .eq('role', 'admin')
    .limit(3)

  for (const p of admins ?? []) {
    const { data: authData } = await admin.auth.admin.getUserById(p.id)
    const email = authData?.user?.email
    if (!email) continue
    sendTalentDeletedVideoEmail(email, talentName, roleName).catch(err =>
      console.error('[talent-video] bildirim gönderilemedi', err.message),
    )
  }

  return NextResponse.json({ success: true })
}
