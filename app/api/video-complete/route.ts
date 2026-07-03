import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { R2_PUBLIC_URL } from '@/lib/r2'

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

  return NextResponse.json({ success: true, videoId: video.id, uploadedAt: video.uploaded_at })
}
