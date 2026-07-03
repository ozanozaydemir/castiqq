'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrg } from '@/lib/require-org'
import type { TalentLanguage, TalentExperience, TalentEducation } from '@/types/database'

export type ActionState = { error?: string; success?: boolean } | null

type LangInput = Pick<TalentLanguage, 'language' | 'level' | 'accents'>
type ExpInput = Pick<TalentExperience, 'project_name' | 'year' | 'role_name' | 'role_type' | 'production_type' | 'director' | 'production_company'>
type EduInput = Pick<TalentEducation, 'school' | 'program' | 'year'>

function parseJson<T>(raw: string | null, fallback: T[]): T[] {
  if (!raw) return fallback
  try { return JSON.parse(raw) as T[] } catch { return fallback }
}

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

function num(v: FormDataEntryValue | null): number | null {
  const n = Number(v)
  return v && !isNaN(n) ? n : null
}

function buildTalentPayload(orgId: string, formData: FormData) {
  return {
    organization_id: orgId,
    full_name: (formData.get('full_name') as string).trim(),
    birth_year: num(formData.get('birth_year')),
    city: str(formData.get('city')),
    phone: str(formData.get('phone')),
    email: str(formData.get('email')),
    manager_name: str(formData.get('manager_name')),
    agency_name: str(formData.get('agency_name')),
    visibility: (formData.get('visibility') as string) || 'private',
    availability: (formData.get('availability') as string) || 'available',
    gender: str(formData.get('gender')),
    playable_age_min: num(formData.get('playable_age_min')),
    playable_age_max: num(formData.get('playable_age_max')),
    height_cm: num(formData.get('height_cm')),
    weight_kg: num(formData.get('weight_kg')),
    hair_color: str(formData.get('hair_color')),
    hair_length: str(formData.get('hair_length')),
    eye_color: str(formData.get('eye_color')),
    skills: parseJson<string>(formData.get('skills_json') as string, []),
    licenses: parseJson<string>(formData.get('licenses_json') as string, []),
    photos: parseJson<string>(formData.get('photos_json') as string, []),
    fee_type: str(formData.get('fee_type')),
    fee_amount: formData.get('fee_amount') ? Number(formData.get('fee_amount')) : null,
    fee_currency: str(formData.get('fee_currency')) ?? 'TRY',
    fee_notes: str(formData.get('fee_notes')),
    notes: str(formData.get('notes')),
    showreel_url: str(formData.get('showreel_url')),
    selftape_drama_url: str(formData.get('selftape_drama_url')),
    selftape_comedy_url: str(formData.get('selftape_comedy_url')),
    selftape_ad_url: str(formData.get('selftape_ad_url')),
    voice_sample_url: str(formData.get('voice_sample_url')),
  }
}

async function upsertRelated(
  supabase: Awaited<ReturnType<typeof requireOrg>>['supabase'],
  talentId: string,
  orgId: string,
  formData: FormData,
) {
  const langs = parseJson<LangInput>(formData.get('languages_json') as string, [])
  const exps = parseJson<ExpInput>(formData.get('experiences_json') as string, [])
  const edus = parseJson<EduInput>(formData.get('education_json') as string, [])

  await supabase.from('talent_languages').delete().eq('talent_id', talentId)
  await supabase.from('talent_experiences').delete().eq('talent_id', talentId)
  await supabase.from('talent_education').delete().eq('talent_id', talentId)

  if (langs.length > 0) {
    await supabase.from('talent_languages').insert(
      langs.map((l, i) => ({ ...l, talent_id: talentId, organization_id: orgId, sort_order: i }))
    )
  }
  if (exps.length > 0) {
    await supabase.from('talent_experiences').insert(
      exps.map((e, i) => ({ ...e, talent_id: talentId, organization_id: orgId, sort_order: i }))
    )
  }
  if (edus.length > 0) {
    await supabase.from('talent_education').insert(
      edus.map((e, i) => ({ ...e, talent_id: talentId, organization_id: orgId, sort_order: i }))
    )
  }
}

export async function createOyuncu(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return { error: 'Ad Soyad zorunludur.' }

  const { data, error } = await supabase
    .from('talent')
    .insert(buildTalentPayload(orgId, formData))
    .select('id')
    .single()

  if (error) return { error: error.message }
  await upsertRelated(supabase, data.id, orgId, formData)
  redirect(`/oyuncular/${data.id}`)
}

export async function updateOyuncu(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const fullName = (formData.get('full_name') as string)?.trim()
  if (!fullName) return { error: 'Ad Soyad zorunludur.' }

  const payload = buildTalentPayload(orgId, formData)
  const { error } = await supabase.from('talent').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await upsertRelated(supabase, id, orgId, formData)
  revalidatePath(`/oyuncular/${id}`)
  redirect(`/oyuncular/${id}`)
}

export async function deleteOyuncu(id: string) {
  const { supabase } = await requireOrg()
  await supabase.from('talent').delete().eq('id', id)
  revalidatePath('/oyuncular')
  redirect('/oyuncular')
}

export async function updateAvailability(id: string, availability: string) {
  const { supabase } = await requireOrg()
  await supabase.from('talent').update({ availability }).eq('id', id)
  revalidatePath(`/oyuncular/${id}`)
  revalidatePath('/oyuncular')
}
