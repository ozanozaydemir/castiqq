import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Giriş yapmalısınız', { status: 401 })

  // RLS zaten organization_id = get_user_org_id() OR target_organization_id = get_user_org_id()
  // ile sınırlıyor — bu satır normal client ile görünmüyorsa erişim yok demektir.
  const { data: share } = await supabase
    .from('role_shares')
    .select('script_asset_path, role_title')
    .eq('id', shareId)
    .single()

  if (!share?.script_asset_path) {
    return new NextResponse('Senaryo bulunamadı', { status: 404 })
  }

  const admin = createAdminClient()
  const { data: fileData, error } = await admin.storage.from('scripts').download(share.script_asset_path)

  if (error || !fileData) {
    return new NextResponse('Senaryo indirilemedi', { status: 404 })
  }

  const bytes = await fileData.arrayBuffer()
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="senaryo.pdf"`,
      'Cache-Control': 'no-store, no-cache',
    },
  })
}
