import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyShareExpiring } from '@/lib/notify'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const now = new Date().toISOString()
  const threeDaysLater = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

  // Süresi dolmuş aktif paylaşımları kapat
  const { data: expired } = await admin
    .from('role_shares')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('expires_at', now)
    .select('id')

  // 3 gün içinde dolacak, daha önce hatırlatma gönderilmemiş paylaşımlar
  const { data: expiringSoon } = await admin
    .from('role_shares')
    .select('id, role_title, target_organization_id')
    .eq('status', 'active')
    .is('reminder_sent_at', null)
    .lte('expires_at', threeDaysLater)
    .gt('expires_at', now)

  let remindersSent = 0
  for (const share of expiringSoon ?? []) {
    try {
      await notifyShareExpiring(share.target_organization_id, share.role_title, share.id)
      await admin.from('role_shares').update({ reminder_sent_at: now }).eq('id', share.id)
      remindersSent++
    } catch (err) {
      console.error('[share-expiry-check] reminder error', share.id, (err as Error).message)
    }
  }

  return NextResponse.json({ ok: true, expiredCount: expired?.length ?? 0, remindersSent })
}
