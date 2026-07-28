import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAgencyDigestEmail, type AgencyDigestItem } from '@/lib/resend'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data: agencies } = await admin.from('organizations').select('id, name').eq('org_type', 'agency')

  let sentCount = 0

  for (const org of agencies ?? []) {
    const [
      { data: overdueBookings },
      { data: expiringContracts },
      { data: expiringDocuments },
      { data: activeExclusivities },
      { data: uncollectedCommissions },
    ] = await Promise.all([
      admin.from('bookings').select('id').eq('organization_id', org.id).neq('payment_status', 'paid').lt('payment_due_date', today),
      admin.from('talent').select('id').eq('organization_id', org.id).not('representation_end_date', 'is', null).gte('representation_end_date', today).lte('representation_end_date', thirtyDaysLater),
      admin.from('talent_documents').select('id').eq('organization_id', org.id).not('expiry_date', 'is', null).lte('expiry_date', thirtyDaysLater),
      admin.from('bookings').select('id').eq('organization_id', org.id).gte('exclusivity_end_date', today),
      admin.from('bookings').select('id').eq('organization_id', org.id).eq('payment_flow', 'client_to_talent').eq('commission_collected', false).not('commission_amount', 'is', null),
    ])

    const items: AgencyDigestItem[] = [
      { label: 'Gecikmiş ödeme', count: overdueBookings?.length ?? 0 },
      { label: 'Süresi yaklaşan sözleşme', count: expiringContracts?.length ?? 0 },
      { label: 'Süresi yaklaşan/dolan belge', count: expiringDocuments?.length ?? 0 },
      { label: 'Aktif reklam yasağı', count: activeExclusivities?.length ?? 0 },
      { label: 'Tahsil edilmemiş komisyon', count: uncollectedCommissions?.length ?? 0 },
    ].filter(i => i.count > 0)

    if (items.length === 0) continue

    const { data: admins } = await admin.from('profiles').select('id, full_name').eq('organization_id', org.id).eq('role', 'admin')
    if (!admins || admins.length === 0) continue

    for (const adminProfile of admins) {
      const { data: authUser } = await admin.auth.admin.getUserById(adminProfile.id)
      const email = authUser?.user?.email
      if (!email) continue
      try {
        await sendAgencyDigestEmail(email, org.name, items, 'tr')
        sentCount++
      } catch (err) {
        console.error('Agency digest email error:', org.id, (err as Error).message)
      }
    }
  }

  return NextResponse.json({ ok: true, agenciesChecked: agencies?.length ?? 0, emailsSent: sentCount })
}
