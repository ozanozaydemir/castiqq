'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { findOrCreateClient } from '@/app/actions/clients'
import { syncBookingToGoogleCalendar, deleteGoogleCalendarEvent } from '@/lib/googleCalendar'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v)
  return v && !isNaN(n) ? n : null
}

const DEFAULT_WITHHOLDING_RATE: Record<string, number> = {
  serbest_meslek: 20,
}

function computeFinancials(grossAmount: number, withholdingRateInput: number | null, taxStatus: string | null, paymentStatus: string, amountPaidInput: number | null) {
  const withholdingRate = withholdingRateInput ?? DEFAULT_WITHHOLDING_RATE[taxStatus ?? ''] ?? 0
  const withholdingAmount = Math.round(grossAmount * (withholdingRate / 100) * 100) / 100
  const netAmount = Math.round((grossAmount - withholdingAmount) * 100) / 100
  const amountPaid = paymentStatus === 'paid'
    ? (amountPaidInput ?? netAmount)
    : (amountPaidInput ?? 0)
  return { withholdingRate, withholdingAmount, netAmount, amountPaid }
}

export async function createBooking(talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const clientName = (formData.get('client_name') as string)?.trim()
  const workDate = str(formData.get('work_date'))
  const grossAmount = num(formData.get('gross_amount'))
  const jobType = (formData.get('job_type') as string) || 'diger'
  const paymentStatus = (formData.get('payment_status') as string) || 'pending'
  if (!clientName) return { error: 'Müşteri/yapım adı zorunludur.' }
  if (!workDate) return { error: 'Çalışma tarihi zorunludur.' }
  if (grossAmount === null) return { error: 'Ücret zorunludur.' }

  const { data: talent } = await supabase
    .from('talent')
    .select('full_name, commission_rate, tax_status')
    .eq('id', talentId)
    .single()

  const commissionRate = talent?.commission_rate ?? null
  const commissionAmount = commissionRate !== null ? Math.round(grossAmount * (commissionRate / 100) * 100) / 100 : null

  const { withholdingRate, withholdingAmount, netAmount, amountPaid } = computeFinancials(
    grossAmount, num(formData.get('withholding_rate')), talent?.tax_status ?? null, paymentStatus, num(formData.get('amount_paid')),
  )

  const clientId = await findOrCreateClient(supabase, orgId, clientName)
  const isOngoing = formData.get('is_ongoing') === 'on'
  const workDateEnd = isOngoing ? null : str(formData.get('work_date_end'))

  const { data: inserted, error } = await supabase.from('bookings').insert({
    organization_id: orgId,
    talent_id: talentId,
    client_id: clientId,
    client_name: clientName,
    job_type: jobType,
    title: str(formData.get('title')),
    work_date: workDate,
    work_date_end: workDateEnd,
    is_ongoing: isOngoing,
    gross_amount: grossAmount,
    currency: str(formData.get('currency')) ?? 'TRY',
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    withholding_rate: withholdingRate,
    withholding_amount: withholdingAmount,
    net_amount: netAmount,
    amount_paid: amountPaid,
    payment_due_date: str(formData.get('payment_due_date')),
    payment_status: paymentStatus,
    payment_flow: (formData.get('payment_flow') as string) || 'client_to_agency',
    commission_collected: formData.get('commission_collected') === 'on',
    exclusivity_end_date: jobType === 'reklam' ? str(formData.get('exclusivity_end_date')) : null,
    exclusivity_notes: jobType === 'reklam' ? str(formData.get('exclusivity_notes')) : null,
    notes: str(formData.get('notes')),
    created_by: userId,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)

  // Google Calendar senkronizasyonu bağlantı yoksa ya da başarısız olursa
  // booking kaydını engellememeli — best-effort.
  try {
    const googleEventId = await syncBookingToGoogleCalendar(orgId, {
      client_name: clientName, title: str(formData.get('title')), job_type: jobType,
      work_date: workDate, work_date_end: workDateEnd, is_ongoing: isOngoing, google_event_id: null,
    }, talent?.full_name ?? 'Oyuncu')
    if (googleEventId) await supabase.from('bookings').update({ google_event_id: googleEventId }).eq('id', inserted.id)
  } catch (err) {
    console.error('[createBooking] google calendar sync error', (err as Error).message)
  }

  return { success: true }
}

export async function updateBooking(bookingId: string, talentId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const clientName = (formData.get('client_name') as string)?.trim()
  const workDate = str(formData.get('work_date'))
  const grossAmount = num(formData.get('gross_amount'))
  const jobType = (formData.get('job_type') as string) || 'diger'
  const paymentStatus = (formData.get('payment_status') as string) || 'pending'
  if (!clientName) return { error: 'Müşteri/yapım adı zorunludur.' }
  if (!workDate) return { error: 'Çalışma tarihi zorunludur.' }
  if (grossAmount === null) return { error: 'Ücret zorunludur.' }

  const { data: existing } = await supabase
    .from('bookings')
    .select('commission_rate, google_event_id, talent:talent_id(full_name, tax_status)')
    .eq('id', bookingId)
    .single()

  const commissionRate = existing?.commission_rate ?? null
  const commissionAmount = commissionRate !== null ? Math.round(grossAmount * (commissionRate / 100) * 100) / 100 : null
  const talentInfo = existing?.talent as unknown as { full_name: string; tax_status: string } | null
  const taxStatus = talentInfo?.tax_status ?? null

  const { withholdingRate, withholdingAmount, netAmount, amountPaid } = computeFinancials(
    grossAmount, num(formData.get('withholding_rate')), taxStatus, paymentStatus, num(formData.get('amount_paid')),
  )

  const clientId = await findOrCreateClient(supabase, orgId, clientName)
  const isOngoing = formData.get('is_ongoing') === 'on'
  const workDateEnd = isOngoing ? null : str(formData.get('work_date_end'))

  const { error } = await supabase.from('bookings').update({
    client_id: clientId,
    client_name: clientName,
    job_type: jobType,
    title: str(formData.get('title')),
    work_date: workDate,
    work_date_end: workDateEnd,
    is_ongoing: isOngoing,
    gross_amount: grossAmount,
    currency: str(formData.get('currency')) ?? 'TRY',
    commission_amount: commissionAmount,
    withholding_rate: withholdingRate,
    withholding_amount: withholdingAmount,
    net_amount: netAmount,
    amount_paid: amountPaid,
    payment_due_date: str(formData.get('payment_due_date')),
    payment_status: paymentStatus,
    payment_flow: (formData.get('payment_flow') as string) || 'client_to_agency',
    commission_collected: formData.get('commission_collected') === 'on',
    exclusivity_end_date: jobType === 'reklam' ? str(formData.get('exclusivity_end_date')) : null,
    exclusivity_notes: jobType === 'reklam' ? str(formData.get('exclusivity_notes')) : null,
    notes: str(formData.get('notes')),
    updated_at: new Date().toISOString(),
  }).eq('id', bookingId)

  if (error) return { error: error.message }
  revalidatePath(`/oyuncular/${talentId}`)

  try {
    const googleEventId = await syncBookingToGoogleCalendar(orgId, {
      client_name: clientName, title: str(formData.get('title')), job_type: jobType,
      work_date: workDate, work_date_end: workDateEnd, is_ongoing: isOngoing,
      google_event_id: existing?.google_event_id ?? null,
    }, talentInfo?.full_name ?? 'Oyuncu')
    if (googleEventId !== existing?.google_event_id) {
      await supabase.from('bookings').update({ google_event_id: googleEventId }).eq('id', bookingId)
    }
  } catch (err) {
    console.error('[updateBooking] google calendar sync error', (err as Error).message)
  }

  return { success: true }
}

export async function deleteBooking(bookingId: string, talentId: string) {
  const { supabase, orgId } = await requireOrg()

  const { data: booking } = await supabase.from('bookings').select('google_event_id').eq('id', bookingId).single()

  await supabase.from('bookings').delete().eq('id', bookingId)
  revalidatePath(`/oyuncular/${talentId}`)

  if (booking?.google_event_id) {
    try {
      await deleteGoogleCalendarEvent(orgId, booking.google_event_id)
    } catch (err) {
      console.error('[deleteBooking] google calendar delete error', (err as Error).message)
    }
  }
}

export async function updateBookingPaymentStatus(bookingId: string, talentId: string, paymentStatus: string) {
  const { supabase } = await requireOrg()

  const update: Record<string, unknown> = { payment_status: paymentStatus, updated_at: new Date().toISOString() }
  if (paymentStatus === 'paid') {
    const { data: booking } = await supabase.from('bookings').select('net_amount').eq('id', bookingId).single()
    if (booking) update.amount_paid = booking.net_amount
  }

  await supabase.from('bookings').update(update).eq('id', bookingId)
  revalidatePath(`/oyuncular/${talentId}`)
  revalidatePath('/oyuncular')
  revalidatePath('/isler')
}
