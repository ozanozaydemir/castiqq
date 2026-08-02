'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyRoleShared, notifyShareRevoked } from '@/lib/notify'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  return (v as string | null)?.trim() || null
}

/**
 * Slug ile tam eşleşme — agency org'ları taramaya (directory ifşasına)
 * izin vermemek için yalnızca tam slug girildiğinde tek sonuç döner.
 * Normal client organizations tablosunda başka org'u göremediği için
 * admin client kullanılıyor; sonuç yalnızca id+name'e indirgeniyor.
 */
export async function lookupAgencyBySlug(slug: string): Promise<{ id: string; name: string } | { error: string }> {
  await requireOrg()
  const cleanSlug = slug.trim().toLowerCase()
  if (!cleanSlug) return { error: 'Slug girilmedi.' }

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organizations')
    .select('id, name, org_type, accepts_external_shares')
    .eq('public_slug', cleanSlug)
    .single()

  if (!org) return { error: 'Bu slug ile eşleşen bir menajerlik bulunamadı.' }
  if (org.org_type !== 'agency') return { error: 'Bu slug bir menajerlik hesabına ait değil.' }
  if (!org.accepts_external_shares) return { error: 'Bu menajerlik şu an dış paylaşım kabul etmiyor.' }

  return { id: org.id, name: org.name }
}

/** Daha önce paylaşım yaptığın menajerlikler — hızlı seçim için adres defteri. */
export async function listOrgPartners(): Promise<{ id: string; name: string }[]> {
  const { orgId } = await requireOrg()
  const admin = createAdminClient()

  const { data: partners } = await admin
    .from('org_partners')
    .select('partner_organization_id')
    .eq('organization_id', orgId)

  const partnerIds = (partners ?? []).map(p => p.partner_organization_id)
  if (partnerIds.length === 0) return []

  const { data: orgs } = await admin.from('organizations').select('id, name').in('id', partnerIds)
  return orgs ?? []
}

export async function createRoleShare(projectRoleId: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId, userId } = await requireOrg()

  const { data: org } = await supabase.from('organizations').select('org_type, name').eq('id', orgId).single()
  if (org?.org_type !== 'production') return { error: 'Yalnızca yapım şirketleri rol paylaşabilir.' }

  const targetOrgId = str(formData.get('target_organization_id'))
  if (!targetOrgId) return { error: 'Hedef menajerlik seçilmedi.' }

  const { data: role } = await supabase
    .from('project_roles')
    .select('id, name, description, gender, age_min, age_max, min_height_cm, max_height_cm, required_skills, city, status, projects(title)')
    .eq('id', projectRoleId)
    .single()

  if (!role) return { error: 'Rol bulunamadı.' }
  if (role.status === 'filled' || role.status === 'cancelled') return { error: 'Kapanmış bir rol paylaşılamaz.' }

  const includeScript = formData.get('include_script') === 'on'

  // role_shares tek bir senaryo yolu saklıyor (paylaşım anındaki snapshot).
  // Rol artık birden fazla senaryo taşıyabildiği için havuzdaki ilkini
  // gönderiyoruz — ajans paylaşımı bugünkü davranışını koruyor.
  let sharedScriptPath: string | null = null
  if (includeScript) {
    const { data: firstScript } = await supabase
      .from('role_scripts')
      .select('storage_path')
      .eq('role_id', projectRoleId)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()
    sharedScriptPath = firstScript?.storage_path ?? null
  }
  const deadlineDays = Number(formData.get('expires_in_days')) || 30
  const expiresAt = new Date(Date.now() + deadlineDays * 86400000).toISOString()
  const project = role.projects as unknown as { title: string } | null

  const { data: share, error } = await supabase.from('role_shares').insert({
    organization_id: orgId,
    project_role_id: role.id,
    target_organization_id: targetOrgId,
    role_title: role.name,
    role_description: role.description,
    project_title: project?.title ?? null,
    gender: role.gender,
    age_min: role.age_min,
    age_max: role.age_max,
    height_min: role.min_height_cm,
    height_max: role.max_height_cm,
    required_skills: role.required_skills ?? [],
    city: role.city,
    submission_deadline: str(formData.get('submission_deadline')),
    script_asset_path: sharedScriptPath,
    message: str(formData.get('message')),
    expires_at: expiresAt,
    created_by: userId,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') return { error: 'Bu rol zaten bu menajerlikle paylaşılmış.' }
    return { error: error.message }
  }

  // Adres defterine ekle (iki yönlü, çakışmada sessizce geç)
  const admin = createAdminClient()
  await admin.from('org_partners').upsert(
    [{ organization_id: orgId, partner_organization_id: targetOrgId }],
    { onConflict: 'organization_id,partner_organization_id', ignoreDuplicates: true },
  )
  await admin.from('org_partners').upsert(
    [{ organization_id: targetOrgId, partner_organization_id: orgId }],
    { onConflict: 'organization_id,partner_organization_id', ignoreDuplicates: true },
  )

  await notifyRoleShared(targetOrgId, org.name, role.name, share.id)

  revalidatePath(`/roller/${projectRoleId}`)
  return { success: true }
}

export async function revokeRoleShare(shareId: string, projectRoleId: string) {
  const { supabase, orgId } = await requireOrg()

  const { data: share } = await supabase
    .from('role_shares')
    .select('role_title, target_organization_id, organization_id, organizations!role_shares_organization_id_fkey(name)')
    .eq('id', shareId)
    .single()

  if (!share || share.organization_id !== orgId) return { error: 'Paylaşım bulunamadı.' }

  await supabase.from('role_shares').update({ status: 'revoked' }).eq('id', shareId)

  const senderOrgName = (share.organizations as unknown as { name: string } | null)?.name ?? 'Yapım şirketi'
  await notifyShareRevoked(share.target_organization_id, senderOrgName, share.role_title)

  revalidatePath(`/roller/${projectRoleId}`)
  return { success: true }
}

/** Rol detayında gösterilecek paylaşım + öneri özeti (production tarafı). */
export async function listRoleShares(projectRoleId: string) {
  const { supabase } = await requireOrg()

  const { data: shares } = await supabase
    .from('role_shares')
    .select('id, target_organization_id, status, message, expires_at, created_at, role_share_submissions(id, status, created_at)')
    .eq('project_role_id', projectRoleId)
    .order('created_at', { ascending: false })

  if (!shares || shares.length === 0) return []

  type ShareRow = { id: string; target_organization_id: string; status: string; message: string | null; expires_at: string | null; created_at: string; role_share_submissions: { id: string; status: string; created_at: string }[] }
  const typedShares = shares as unknown as ShareRow[]

  const admin = createAdminClient()
  const targetIds = [...new Set(typedShares.map(s => s.target_organization_id))]
  const { data: orgs } = await admin.from('organizations').select('id, name').in('id', targetIds)
  const orgNames = new Map((orgs ?? []).map(o => [o.id, o.name]))

  return typedShares.map(s => ({ ...s, target_organization_name: orgNames.get(s.target_organization_id) ?? 'Bilinmeyen' }))
}

/** Agency tarafı — kendi org'una hedeflenen tüm paylaşımlar (gönderen org adıyla birlikte). */
export async function listIncomingShares() {
  const { supabase, orgId } = await requireOrg()

  const { data: shares } = await supabase
    .from('role_shares')
    .select('id, organization_id, role_title, project_title, status, submission_deadline, expires_at, created_at')
    .eq('target_organization_id', orgId)
    .order('created_at', { ascending: false })

  if (!shares || shares.length === 0) return []

  type IncomingShareRow = { id: string; organization_id: string; role_title: string; project_title: string | null; status: string; submission_deadline: string | null; expires_at: string | null; created_at: string }
  const typedShares = shares as unknown as IncomingShareRow[]

  const admin = createAdminClient()
  const senderIds = [...new Set(typedShares.map(s => s.organization_id))]
  const { data: orgs } = await admin.from('organizations').select('id, name').in('id', senderIds)
  const orgNames = new Map((orgs ?? []).map(o => [o.id, o.name]))

  return typedShares.map(s => ({ ...s, sender_organization_name: orgNames.get(s.organization_id) ?? 'Bilinmeyen' }))
}

/** Agency tarafı — tek bir paylaşımın detayı (rol kriterleri + gönderen org adı). */
export async function getIncomingShare(shareId: string) {
  const { supabase, orgId } = await requireOrg()

  const { data: share } = await supabase
    .from('role_shares')
    .select('*')
    .eq('id', shareId)
    .eq('target_organization_id', orgId)
    .single()

  if (!share) return null

  const admin = createAdminClient()
  const { data: senderOrg } = await admin.from('organizations').select('name').eq('id', share.organization_id).single()

  return { ...share, sender_organization_name: senderOrg?.name ?? 'Bilinmeyen' }
}
