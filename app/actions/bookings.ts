'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v)
  return v && !isNaN(n) ? n : null
}

export async function createBooking(talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const clientName = (formData.get('client_name') as string)?.trim()
  const workDate = str(formData.get('work_date'))
  const grossAmount = num(formData.get('gross_amount'))
  if (!clientName) return { error: 'Müşteri/yapım adı zorunludur.' }
  if (!workDate) return { error: 'Çalışma tarihi zorunludur.' }
  if (grossAmount === null) return { error: 'Ücret zorunludur.' }

  const { data: talent } = await supabase
    .from('talent')
    .select('commission_rate')
    .eq('id', talentId)
    .single()

  const commissionRate = talent?.commission_rate ?? null
  const commissionAmount = commissionRate !== null ? Math.round(grossAmount * (commissionRate / 100) * 100) / 100 : null

  const { error } = await supabase.from('bookings').insert({
    organization_id: orgId,
    talent_id: talentId,
    client_name: clientName,
    job_type: (formData.get('job_type') as string) || 'diger',
    title: str(formData.get('title')),
    work_date: workDate,
    work_date_end: str(formData.get('work_date_end')),
    gross_amount: grossAmount,
    currency: str(formData.get('currency')) ?? 'TRY',
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    payment_due_date: str(formData.get('payment_due_date')),
    payment_status: (formData.get('payment_status') as string) || 'pending',
    notes: str(formData.get('notes')),
    created_by: userId,
  })

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function updateBooking(bookingId: string, talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const clientName = (formData.get('client_name') as string)?.trim()
  const workDate = str(formData.get('work_date'))
  const grossAmount = num(formData.get('gross_amount'))
  if (!clientName) return { error: 'Müşteri/yapım adı zorunludur.' }
  if (!workDate) return { error: 'Çalışma tarihi zorunludur.' }
  if (grossAmount === null) return { error: 'Ücret zorunludur.' }

  const { data: existing } = await supabase
    .from('bookings')
    .select('commission_rate')
    .eq('id', bookingId)
    .single()

  const commissionRate = existing?.commission_rate ?? null
  const commissionAmount = commissionRate !== null ? Math.round(grossAmount * (commissionRate / 100) * 100) / 100 : null

  const { error } = await supabase.from('bookings').update({
    client_name: clientName,
    job_type: (formData.get('job_type') as string) || 'diger',
    title: str(formData.get('title')),
    work_date: workDate,
    work_date_end: str(formData.get('work_date_end')),
    gross_amount: grossAmount,
    currency: str(formData.get('currency')) ?? 'TRY',
    commission_amount: commissionAmount,
    payment_due_date: str(formData.get('payment_due_date')),
    payment_status: (formData.get('payment_status') as string) || 'pending',
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId)

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)
  return { success: true }
}

export async function deleteBooking(bookingId: string, talentId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('bookings').delete().eq('id', bookingId)
  revalidatePath(`/oyuncular/${talentId}`)
}

export async function updateBookingPaymentStatus(bookingId: string, talentId: string, paymentStatus: string) {
  const { supabase } = await requireOrg()
  await supabase.from('bookings').update({ payment_status: paymentStatus, updated_at: new Date().toISOString() }).eq('id', bookingId)
  revalidatePath(`/oyuncular/${talentId}`)
  revalidatePath('/oyuncular')
}
