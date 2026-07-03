import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { R2_PUBLIC_URL } from '@/lib/r2'
import { sendVideoNotificationEmail } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const { auditionId, organizationId, storagePath, duration, fileSizeBytes } = await req.json()

  if (!auditionId || !organizationId || !storagePath) {
    return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
  }

  const admin = createAdminClient()
  const publicUrl = `${R2_PUBLIC_URL}/${storagePath}`
  const now = new Date().toISOString()

  const { data: video, error } = await admin
    .from('audition_videos')
    .insert({
      audition_id: auditionId,
      organization_id: organizationId,
      storage_path: storagePath,
      public_url: publicUrl,
      duration_seconds: duration ?? null,
      file_size_bytes: fileSizeBytes ?? null,
      uploaded_at: now,
    })
    .select('id, uploaded_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Storage sayacını artır
  if (fileSizeBytes) {
    await admin.rpc('increment_storage', {
      org_id: organizationId,
      bytes: fileSizeBytes,
    })
  }

  // submitted_at'i sadece ilk video yüklemesinde set et
  const { data: audition } = await admin
    .from('auditions')
    .select('submitted_at')
    .eq('id', auditionId)
    .single()

  if (!audition?.submitted_at) {
    await admin
      .from('auditions')
      .update({ submitted_at: now, status: 'pending' })
      .eq('id', auditionId)
  }

  // Direktöre yeni video bildirim emaili gönder
  const { data: auditionInfo } = await admin
    .from('auditions')
    .select('talent_name, role_id')
    .eq('id', auditionId)
    .single()

  if (auditionInfo?.role_id) {
    const { data: roleInfo } = await admin
      .from('project_roles')
      .select('title, projects!project_roles_project_id_fkey(title)')
      .eq('id', auditionInfo.role_id)
      .single()

    const { data: adminProfiles } = await admin
      .from('profiles')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('role', 'admin')
      .limit(3)

    if (roleInfo && adminProfiles?.length) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'
      const roleTitle = roleInfo.title ?? ''
      const projectTitle = (roleInfo.projects as unknown as { title: string } | null)?.title ?? ''
      const talentName = auditionInfo.talent_name ?? 'Oyuncu'
      const dashboardUrl = `${siteUrl}/roller/${auditionInfo.role_id}`

      for (const profile of adminProfiles) {
        const { data: authData } = await admin.auth.admin.getUserById(profile.id)
        if (authData?.user?.email) {
          sendVideoNotificationEmail(authData.user.email, talentName, roleTitle, projectTitle, dashboardUrl)
            .catch(err => console.error('Video notification email error:', err.message))
        }
      }
    }
  }

  return NextResponse.json({ success: true, videoId: video.id, uploadedAt: video.uploaded_at })
}
