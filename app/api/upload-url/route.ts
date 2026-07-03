import { NextRequest, NextResponse } from 'next/server'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createAdminClient } from '@/lib/supabase/admin'
import { r2, R2_BUCKET } from '@/lib/r2'

export async function POST(req: NextRequest) {
  const { token, fileName, fileType } = await req.json()

  if (!token || !fileName || !fileType) {
    return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: audition } = await admin
    .from('auditions')
    .select('id, organization_id, submitted_at')
    .eq('token', token)
    .single()

  if (!audition) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 404 })
  }

  if (audition.submitted_at) {
    return NextResponse.json({ error: 'Bu audition zaten tamamlandı' }, { status: 409 })
  }

  const ext = fileName.split('.').pop()
  const storagePath = `${token}/${Date.now()}.${ext}`

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: storagePath,
    ContentType: fileType,
  })

  const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 })

  return NextResponse.json({
    presignedUrl,
    storagePath,
    auditionId: audition.id,
    organizationId: audition.organization_id,
  })
}
