'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

export async function updateOrg(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Organizasyon adı zorunludur.' }
  const { error } = await supabase.from('organizations').update({ name }).eq('id', orgId)
  if (error) return { error: error.message }
  revalidatePath('/ayarlar')
  return { success: true }
}

export async function updateProfile(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, userId } = await requireOrg()
  const full_name = (formData.get('full_name') as string)?.trim()
  if (!full_name) return { error: 'Ad soyad zorunludur.' }
  const { error } = await supabase.from('profiles').update({ full_name }).eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/ayarlar')
  return { success: true }
}

/** Org-arası rol paylaşımı için kimlik: benzersiz slug + dış paylaşım kabul tercihi. */
export async function updateShareSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const rawSlug = (formData.get('public_slug') as string)?.trim().toLowerCase()
  const acceptsExternalShares = formData.get('accepts_external_shares') === 'on'

  if (rawSlug && !/^[a-z0-9-]{3,40}$/.test(rawSlug)) {
    return { error: 'Slug yalnızca küçük harf, rakam ve tire içerebilir (3-40 karakter).' }
  }

  const { error } = await supabase.from('organizations').update({
    public_slug: rawSlug || null,
    accepts_external_shares: acceptsExternalShares,
  }).eq('id', orgId)

  if (error) {
    if (error.code === '23505') return { error: 'Bu slug zaten kullanılıyor, başka bir tane seçin.' }
    return { error: error.message }
  }

  revalidatePath('/ayarlar')
  return { success: true }
}

/**
 * Yeni davetlerde uygulanacak varsayılan video saklama süresi.
 *
 * Mevcut davetlere dokunmuyor: retention_until davet oluşturulurken mutlak
 * tarihe çevrilip snapshot alınıyor, aksi halde bu ayarı kısaltmak yürürlükteki
 * videoları beklenmedik şekilde silinebilir hale getirirdi.
 */
export async function updateRetentionSettings(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()

  const raw = (formData.get('default_retention_days') as string)?.trim()
  let days: number | null = null

  if (raw) {
    days = Number(raw)
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      return { error: 'Saklama süresi 1–3650 gün arasında olmalıdır.' }
    }
  }

  const { error } = await supabase
    .from('organizations')
    .update({ default_retention_days: days })
    .eq('id', orgId)

  if (error) return { error: error.message }
  revalidatePath('/ayarlar')
  return { success: true }
}
