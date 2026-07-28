'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { paymentTermsToDays } from '@/lib/crm'
import type { PaymentTerms } from '@/types/database'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  return (v as string | null)?.trim() || null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v)
  return v && !isNaN(n) ? n : null
}

// ═══ Teklif (pitch) ═══

export async function createPitch(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const title = (formData.get('title') as string)?.trim()
  const clientId = str(formData.get('client_id'))
  if (!title) return { error: 'Teklif başlığı zorunludur.' }
  if (!clientId) return { error: 'Müşteri seçimi zorunludur.' }

  const projectType = (formData.get('project_type') as string) || 'diger'

  const { data, error } = await supabase.from('pitches').insert({
    organization_id: orgId,
    client_id: clientId,
    title,
    project_type: projectType,
    stage: (formData.get('stage') as string) || 'brief',
    // Marka kategorisi yalnızca reklam işlerinde anlamlı — yasak takibinin girdisi.
    brand_category: projectType === 'reklam' ? str(formData.get('brand_category')) : null,
    expected_start_date: str(formData.get('expected_start_date')),
    decision_due_date: str(formData.get('decision_due_date')),
    estimated_value: num(formData.get('estimated_value')),
    currency: str(formData.get('currency')) ?? 'TRY',
    owner_id: str(formData.get('owner_id')),
    notes: str(formData.get('notes')),
    created_by: userId,
  }).select('id').single()

  if (error) return { error: error.message }

  revalidatePath('/teklifler')
  revalidatePath(`/musteriler/${clientId}`)
  return { success: true, ...(data ? {} : {}) }
}

export async function updatePitch(pitchId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const title = (formData.get('title') as string)?.trim()
  const clientId = str(formData.get('client_id'))
  if (!title) return { error: 'Teklif başlığı zorunludur.' }
  if (!clientId) return { error: 'Müşteri seçimi zorunludur.' }

  const projectType = (formData.get('project_type') as string) || 'diger'
  const stage = (formData.get('stage') as string) || 'brief'

  const { error } = await supabase.from('pitches').update({
    client_id: clientId,
    title,
    project_type: projectType,
    stage,
    brand_category: projectType === 'reklam' ? str(formData.get('brand_category')) : null,
    expected_start_date: str(formData.get('expected_start_date')),
    decision_due_date: str(formData.get('decision_due_date')),
    estimated_value: num(formData.get('estimated_value')),
    currency: str(formData.get('currency')) ?? 'TRY',
    owner_id: str(formData.get('owner_id')),
    lost_reason: stage === 'kaybedildi' ? str(formData.get('lost_reason')) : null,
    notes: str(formData.get('notes')),
  }).eq('id', pitchId)

  if (error) return { error: error.message }

  revalidatePath('/teklifler')
  revalidatePath(`/teklifler/${pitchId}`)
  revalidatePath(`/musteriler/${clientId}`)
  return { success: true }
}

/** Pipeline board'da sürükle-bırak / dropdown ile aşama değişimi. */
export async function updatePitchStage(pitchId: string, stage: string) {
  const { supabase } = await requireOrg()
  await supabase.from('pitches').update({ stage }).eq('id', pitchId)
  revalidatePath('/teklifler')
  revalidatePath(`/teklifler/${pitchId}`)
}

export async function deletePitch(pitchId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('pitches').delete().eq('id', pitchId)
  revalidatePath('/teklifler')
}

// ═══ Teklif kalemi (hangi oyuncu → hangi rol → hangi kaşe) ═══

export async function createPitchItem(pitchId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const talentId = str(formData.get('talent_id'))
  if (!talentId) return { error: 'Oyuncu seçimi zorunludur.' }

  const { error } = await supabase.from('pitch_items').insert({
    organization_id: orgId,
    pitch_id: pitchId,
    talent_id: talentId,
    role_name: str(formData.get('role_name')),
    status: (formData.get('status') as string) || 'onerildi',
    proposed_fee: num(formData.get('proposed_fee')),
    client_offer: num(formData.get('client_offer')),
    fee_type: str(formData.get('fee_type')),
    currency: str(formData.get('currency')) ?? 'TRY',
    client_feedback: str(formData.get('client_feedback')),
    created_by: userId,
  })

  if (error) {
    // UNIQUE (pitch_id, talent_id) — aynı oyuncu bir teklife iki kez eklenemez
    if (error.code === '23505') return { error: 'Bu oyuncu zaten bu teklife eklenmiş.' }
    return { error: error.message }
  }

  revalidatePath(`/teklifler/${pitchId}`)
  return { success: true }
}

export async function updatePitchItem(itemId: string, pitchId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const { error } = await supabase.from('pitch_items').update({
    role_name: str(formData.get('role_name')),
    status: (formData.get('status') as string) || 'onerildi',
    proposed_fee: num(formData.get('proposed_fee')),
    client_offer: num(formData.get('client_offer')),
    fee_type: str(formData.get('fee_type')),
    currency: str(formData.get('currency')) ?? 'TRY',
    client_feedback: str(formData.get('client_feedback')),
  }).eq('id', itemId)

  if (error) return { error: error.message }
  revalidatePath(`/teklifler/${pitchId}`)
  return { success: true }
}

export async function updatePitchItemStatus(itemId: string, pitchId: string, status: string) {
  const { supabase } = await requireOrg()
  await supabase.from('pitch_items').update({ status }).eq('id', itemId)
  revalidatePath(`/teklifler/${pitchId}`)
}

export async function deletePitchItem(itemId: string, pitchId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('pitch_items').delete().eq('id', itemId)
  revalidatePath(`/teklifler/${pitchId}`)
}

/**
 * Seçilen teklif kalemini gerçek işe (booking) dönüştürür.
 *
 * Pipeline'ın kapanış adımı: anlaşılan kaşe (client_offer, yoksa
 * proposed_fee) brüt tutar olarak alınır, komisyon oyuncunun oranından,
 * stopaj vergi durumundan, ödeme vadesi müşterinin standart vadesinden
 * hesaplanır. Oluşan booking teklif kalemine geri bağlanır — böylece
 * "bu iş hangi tekliften çıktı" izlenebilir kalır.
 */
export async function convertPitchItemToBooking(itemId: string, pitchId: string): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: item } = await supabase
    .from('pitch_items')
    .select('id, talent_id, role_name, proposed_fee, client_offer, fee_type, currency, booking_id')
    .eq('id', itemId)
    .single()

  if (!item) return { error: 'Teklif kalemi bulunamadı.' }
  if (item.booking_id) return { error: 'Bu kalem zaten bir işe dönüştürülmüş.' }

  const grossAmount = Number(item.client_offer ?? item.proposed_fee ?? 0)
  if (grossAmount <= 0) return { error: 'İşe dönüştürmek için anlaşılan kaşe girilmelidir.' }

  const { data: pitch } = await supabase
    .from('pitches')
    .select('title, project_type, brand_category, expected_start_date, client_id, clients(name, payment_terms)')
    .eq('id', pitchId)
    .single()

  if (!pitch) return { error: 'Teklif bulunamadı.' }

  const { data: talent } = await supabase
    .from('talent')
    .select('commission_rate, tax_status')
    .eq('id', item.talent_id)
    .single()

  const commissionRate = talent?.commission_rate ?? null
  const commissionAmount = commissionRate !== null
    ? Math.round(grossAmount * (commissionRate / 100) * 100) / 100
    : null

  // Serbest meslek makbuzu kesen oyuncularda %20 stopaj varsayılanı —
  // createBooking ile aynı kural.
  const withholdingRate = talent?.tax_status === 'serbest_meslek' ? 20 : 0
  const withholdingAmount = Math.round(grossAmount * (withholdingRate / 100) * 100) / 100
  const netAmount = Math.round((grossAmount - withholdingAmount) * 100) / 100

  const workDate = pitch.expected_start_date ?? new Date().toISOString().split('T')[0]

  const client = pitch.clients as unknown as { name: string; payment_terms: PaymentTerms } | null
  const termDays = client ? paymentTermsToDays(client.payment_terms) : null
  const paymentDueDate = termDays !== null
    ? new Date(new Date(workDate).getTime() + termDays * 86400000).toISOString().split('T')[0]
    : null

  // pitches.project_type ile bookings.job_type sözlükleri birebir aynı değil.
  const JOB_TYPE_MAP: Record<string, string> = {
    dizi: 'dizi', reklam: 'reklam', film: 'film', dijital: 'diger',
    tiyatro: 'diger', sunuculuk: 'sunuculuk', seslendirme: 'seslendirme',
    etkinlik: 'etkinlik', diger: 'diger',
  }

  const { data: booking, error } = await supabase.from('bookings').insert({
    organization_id: orgId,
    talent_id: item.talent_id,
    client_id: pitch.client_id,
    client_name: client?.name ?? pitch.title,
    job_type: JOB_TYPE_MAP[pitch.project_type] ?? 'diger',
    title: item.role_name ? `${pitch.title} — ${item.role_name}` : pitch.title,
    work_date: workDate,
    gross_amount: grossAmount,
    currency: item.currency,
    commission_rate: commissionRate,
    commission_amount: commissionAmount,
    withholding_rate: withholdingRate,
    withholding_amount: withholdingAmount,
    net_amount: netAmount,
    amount_paid: 0,
    payment_due_date: paymentDueDate,
    payment_status: 'pending',
    exclusivity_category: pitch.brand_category,
    pitch_item_id: itemId,
    created_by: userId,
  }).select('id').single()

  if (error) return { error: error.message }

  await supabase.from('pitch_items')
    .update({ booking_id: booking.id, status: 'secildi' })
    .eq('id', itemId)

  revalidatePath(`/teklifler/${pitchId}`)
  revalidatePath('/isler')
  revalidatePath(`/oyuncular/${item.talent_id}`)
  return { success: true }
}
