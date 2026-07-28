import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function csvEscape(value: string | number | boolean | null): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, talent(full_name)')
    .order('work_date', { ascending: false })

  const rows = (bookings ?? []) as Array<Record<string, unknown> & { talent: { full_name: string } | null }>

  const headers = [
    'Oyuncu', 'Musteri', 'Is Turu', 'Aciklama', 'Baslangic Tarihi', 'Bitis Tarihi', 'Devam Ediyor',
    'Brut Tutar', 'Para Birimi', 'Stopaj Orani (%)', 'Stopaj Tutari', 'Net Tutar',
    'Komisyon Orani (%)', 'Komisyon Tutari', 'Odeme Akisi', 'Komisyon Tahsil Edildi',
    'Odenen Tutar', 'Odeme Durumu', 'Odeme Vadesi', 'Notlar',
  ]

  const lines = [headers.join(',')]
  for (const b of rows) {
    lines.push([
      csvEscape(b.talent?.full_name ?? ''),
      csvEscape(b.client_name as string),
      csvEscape(b.job_type as string),
      csvEscape(b.title as string | null),
      csvEscape(b.work_date as string),
      csvEscape(b.work_date_end as string | null),
      csvEscape(b.is_ongoing ? 'Evet' : 'Hayır'),
      csvEscape(b.gross_amount as number),
      csvEscape(b.currency as string),
      csvEscape(b.withholding_rate as number),
      csvEscape(b.withholding_amount as number),
      csvEscape(b.net_amount as number),
      csvEscape(b.commission_rate as number | null),
      csvEscape(b.commission_amount as number | null),
      csvEscape(b.payment_flow === 'client_to_talent' ? 'Yapim -> Oyuncu' : 'Yapim -> Ajans'),
      csvEscape(b.commission_collected ? 'Evet' : 'Hayır'),
      csvEscape(b.amount_paid as number),
      csvEscape(b.payment_status as string),
      csvEscape(b.payment_due_date as string | null),
      csvEscape(b.notes as string | null),
    ].join(','))
  }

  const csv = '﻿' + lines.join('\n')
  const filename = `isler-${new Date().toISOString().split('T')[0]}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
