'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export type ActionState = { error?: string; success?: boolean } | null

function str(v: FormDataEntryValue | null): string | null {
  const s = (v as string | null)
  return s?.trim() || null
}

export async function updateSelfServiceProfile(token: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const admin = createAdminClient()

  const { data: talent } = await admin
    .from('talent')
    .select('id, organization_id, photos')
    .eq('self_service_token', token)
    .single()

  if (!talent) return { error: 'Geçersiz veya süresi dolmuş bağlantı.' }

  let photos = (talent.photos as string[] | null) ?? []
  const file = formData.get('photo') as File | null

  if (file && file.size > 0) {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) return { error: 'Fotoğraf yalnızca JPG, PNG veya WEBP olabilir.' }

    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${talent.organization_id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await admin.storage
      .from('talent-avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) return { error: 'Fotoğraf yüklenemedi.' }

    const { data: pub } = admin.storage.from('talent-avatars').getPublicUrl(path)
    photos = [pub.publicUrl, ...photos.filter(Boolean)].slice(0, 4)
  }

  const { error } = await admin.from('talent').update({
    phone: str(formData.get('phone')),
    email: str(formData.get('email')),
    city: str(formData.get('city')),
    availability: (formData.get('availability') as string) || 'available',
    photos,
    updated_at: new Date().toISOString(),
  }).eq('id', talent.id)

  if (error) return { error: error.message }
  return { success: true }
}
