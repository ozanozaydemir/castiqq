'use server'

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { retentionDateFromDays } from '@/lib/retention'
import { rateLimit } from '@/lib/rate-limit'

export type PublicApplyResult =
  | { success: true; uploadToken: string; isExisting?: boolean }
  | { error: string }

export type LangRow = { language: string; level: string }
export type ExpRow = {
  project_name: string
  year: string
  role_name: string
  role_type: string
  production_type: string
  director: string
  production_company: string
}

export type PublicApplyData = {
  full_name: string
  email: string | null
  phone: string | null
  birth_year?: number | null
  gender?: string | null
  city?: string | null
  height_cm?: number | null
  weight_kg?: number | null
  hair_color?: string | null
  hair_length?: string | null
  eye_color?: string | null
  skills?: string[]
  licenses?: string[]
  languages?: LangRow[]
  experiences?: ExpRow[]
  avatar_url?: string | null
  fee_type?: string | null
  fee_amount?: number | null
  fee_currency?: string | null
}

export async function submitPublicApplication(
  rolePublicToken: string,
  data: PublicApplyData,
): Promise<PublicApplyResult> {
  const hdrs = await headers()
  const ip = hdrs.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  const rl = rateLimit(`public-apply:${ip}`, 10, 60_000)
  if (!rl.ok) return { error: 'Çok fazla istek. Lütfen bir dakika bekleyin.' }

  if (!data.full_name.trim()) return { error: 'İsim zorunludur.' }

  const admin = createAdminClient()

  const { data: role } = await admin
    .from('project_roles')
    .select('id, name, organization_id, status, is_public')
    .eq('public_token', rolePublicToken)
    .single()

  if (!role) return { error: 'Rol bulunamadı.' }
  if (!role.is_public) return { error: 'Bu rol için başvuru kapalı.' }
  if (role.status !== 'open' && role.status !== 'casting') {
    return { error: 'Bu rol için başvuru kapalı.' }
  }

  // Public başvurularda da org varsayılanı uygulanıyor; aksi halde bu yoldan
  // gelen videolar saklama politikasının tamamen dışında kalırdı.
  const { data: org } = await admin
    .from('organizations')
    .select('default_retention_days')
    .eq('id', role.organization_id)
    .single()
  const retentionUntil = org?.default_retention_days == null
    ? null
    : retentionDateFromDays(org.default_retention_days).toISOString()

  // Duplicate detection — same email for same role returns existing token and updates talent
  if (data.email) {
    const { data: existing } = await admin
      .from('auditions')
      .select('token, talent_id')
      .eq('role_id', role.id)
      .eq('talent_email', data.email.trim())
      .maybeSingle()

    if (existing?.token) {
      if (existing.talent_id) {
        await admin
          .from('talent')
          .update(buildTalentPayload(data))
          .eq('id', existing.talent_id)
        await upsertRelated(admin, existing.talent_id, role.organization_id, data)
      }
      return { success: true, uploadToken: existing.token, isExisting: true }
    }
  }

  const { data: talent, error: talentError } = await admin
    .from('talent')
    .insert({
      organization_id: role.organization_id,
      availability: 'available',
      visibility: 'private',
      ...buildTalentPayload(data),
    })
    .select('id')
    .single()

  if (talentError) {
    console.error('Public apply talent error:', talentError.message, talentError.code, talentError.hint)
    return { error: 'Başvuru oluşturulamadı.' }
  }

  await upsertRelated(admin, talent.id, role.organization_id, data)

  const { data: audition, error: auditionError } = await admin
    .from('auditions')
    .insert({
      organization_id: role.organization_id,
      role_id: role.id,
      talent_id: talent.id,
      talent_name: data.full_name.trim(),
      talent_email: data.email?.trim() || null,
      invite_phone: data.phone?.trim() || null,
      status: 'pending',
      retention_until: retentionUntil,
    })
    .select('token')
    .single()

  if (auditionError) {
    console.error('Public apply audition error:', auditionError.message, auditionError.code, auditionError.hint)
    return { error: 'Başvuru oluşturulamadı.' }
  }

  return { success: true, uploadToken: audition.token }
}

// Builds the payload for the `talent` table only — languages/experiences go to separate tables
function buildTalentPayload(data: PublicApplyData) {
  return {
    full_name: data.full_name.trim(),
    email: data.email?.trim() || null,
    phone: data.phone?.trim() || null,
    birth_year: data.birth_year || null,
    gender: data.gender || null,
    city: data.city?.trim() || null,
    height_cm: data.height_cm || null,
    weight_kg: data.weight_kg || null,
    hair_color: data.hair_color || null,
    hair_length: data.hair_length || null,
    eye_color: data.eye_color || null,
    skills: data.skills?.length ? data.skills : null,
    licenses: data.licenses?.length ? data.licenses : null,
    avatar_url: data.avatar_url || null,
    fee_type: data.fee_type || null,
    fee_amount: data.fee_amount || null,
    fee_currency: data.fee_currency || 'TRY',
  }
}

async function upsertRelated(
  admin: ReturnType<typeof createAdminClient>,
  talentId: string,
  orgId: string,
  data: PublicApplyData,
) {
  await admin.from('talent_languages').delete().eq('talent_id', talentId)
  await admin.from('talent_experiences').delete().eq('talent_id', talentId)

  const langs = (data.languages ?? []).filter(l => l.language.trim())
  if (langs.length > 0) {
    await admin.from('talent_languages').insert(
      langs.map((l, i) => ({ language: l.language, level: l.level, accents: '', talent_id: talentId, organization_id: orgId, sort_order: i }))
    )
  }

  const exps = (data.experiences ?? []).filter(e => e.project_name.trim())
  if (exps.length > 0) {
    await admin.from('talent_experiences').insert(
      exps.map((e, i) => ({ ...e, talent_id: talentId, organization_id: orgId, sort_order: i }))
    )
  }
}
