import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  const roleToken = req.nextUrl.searchParams.get('roleToken')
  if (!roleToken) return NextResponse.json({ error: 'roleToken required' }, { status: 400 })

  const admin = createAdminClient()

  const { data: role } = await admin
    .from('project_roles')
    .select('id, is_public, status, organization_id')
    .eq('public_token', roleToken)
    .single()

  if (!role || !role.is_public) return NextResponse.json({ error: 'Invalid token' }, { status: 403 })
  if (role.status !== 'open' && role.status !== 'casting') {
    return NextResponse.json({ error: 'Closed' }, { status: 403 })
  }

  const ext = req.nextUrl.searchParams.get('ext') ?? 'jpg'
  const path = `${role.organization_id}/${crypto.randomUUID()}.${ext}`

  const { data: signed, error } = await admin.storage
    .from('talent-avatars')
    .createSignedUploadUrl(path)

  if (error || !signed) {
    console.error('public-photo-url signed URL error:', error?.message)
    return NextResponse.json({ error: 'Upload URL could not be generated' }, { status: 500 })
  }

  const { data: { publicUrl } } = admin.storage.from('talent-avatars').getPublicUrl(path)

  return NextResponse.json({ signedUrl: signed.signedUrl, publicUrl })
}
