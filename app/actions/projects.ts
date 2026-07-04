'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireOrg } from '@/lib/require-org'

export type ActionState = { error?: string; success?: boolean } | null

// ── Projeler ────────────────────────────────────────────────────

export async function createProje(_: ActionState, formData: FormData): Promise<ActionState> {
  console.log('[createProje] called, title:', formData.get('title'))
  const { supabase, userId, orgId } = await requireOrg()
  console.log('[createProje] requireOrg ok, orgId:', orgId)

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Proje adı zorunludur.' }

  const { data, error } = await supabase.from('projects').insert({
    organization_id: orgId,
    title,
    type: formData.get('type') as string,
    platform: (formData.get('platform') as string) || null,
    director: (formData.get('director') as string) || null,
    description: (formData.get('description') as string) || null,
    deadline: (formData.get('deadline') as string) || null,
    shooting_start: (formData.get('shooting_start') as string) || null,
    shooting_end: (formData.get('shooting_end') as string) || null,
    shooting_location: (formData.get('shooting_location') as string) || null,
    created_by: userId,
  }).select('id').single()

  if (error) return { error: error.message }
  redirect(`/projeler/${data.id}`)
}

export async function updateProje(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()

  const title = (formData.get('title') as string)?.trim()
  if (!title) return { error: 'Proje adı zorunludur.' }

  const { error } = await supabase.from('projects').update({
    title,
    type: formData.get('type') as string,
    platform: (formData.get('platform') as string) || null,
    director: (formData.get('director') as string) || null,
    description: (formData.get('description') as string) || null,
    deadline: (formData.get('deadline') as string) || null,
    shooting_start: (formData.get('shooting_start') as string) || null,
    shooting_end: (formData.get('shooting_end') as string) || null,
    shooting_location: (formData.get('shooting_location') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/projeler/${id}`)
  redirect(`/projeler/${id}`)
}

export async function updateProjeStatus(id: string, status: string) {
  const { supabase } = await requireOrg()
  await supabase.from('projects').update({ status }).eq('id', id)
  revalidatePath('/projeler')
  revalidatePath(`/projeler/${id}`)
}

export async function deleteProje(id: string) {
  const { supabase } = await requireOrg()
  await supabase.from('projects').delete().eq('id', id)
  revalidatePath('/projeler')
  redirect('/projeler')
}

// ── Roller ──────────────────────────────────────────────────────

export async function createRol(_: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase, orgId } = await requireOrg()
  const projectId = formData.get('project_id') as string

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Rol adı zorunludur.' }

  const { error } = await supabase.from('project_roles').insert({
    project_id: projectId,
    organization_id: orgId,
    name,
    description: (formData.get('description') as string) || null,
    gender: (formData.get('gender') as string) || null,
    age_min: formData.get('age_min') ? Number(formData.get('age_min')) : null,
    age_max: formData.get('age_max') ? Number(formData.get('age_max')) : null,
    notes: (formData.get('notes') as string) || null,
    script_url: (formData.get('script_url') as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath(`/projeler/${projectId}`)
  return { success: true }
}

export async function updateRol(id: string, _: ActionState, formData: FormData): Promise<ActionState> {
  const { supabase } = await requireOrg()
  const projectId = formData.get('project_id') as string

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Rol adı zorunludur.' }

  const { error } = await supabase.from('project_roles').update({
    name,
    description: (formData.get('description') as string) || null,
    gender: (formData.get('gender') as string) || null,
    age_min: formData.get('age_min') ? Number(formData.get('age_min')) : null,
    age_max: formData.get('age_max') ? Number(formData.get('age_max')) : null,
    notes: (formData.get('notes') as string) || null,
    script_url: (formData.get('script_url') as string) || null,
  }).eq('id', id)

  if (error) return { error: error.message }
  revalidatePath(`/projeler/${projectId}`)
  revalidatePath(`/roller/${id}`)
  return { success: true }
}

export async function toggleRolePublic(roleId: string, isPublic: boolean) {
  const { supabase } = await requireOrg()
  await supabase.from('project_roles').update({ is_public: isPublic }).eq('id', roleId)
  revalidatePath(`/roller/${roleId}`)
}

export async function updateRolStatus(id: string, projectId: string | null, status: string) {
  const { supabase } = await requireOrg()
  await supabase.from('project_roles').update({ status }).eq('id', id)
  revalidatePath(`/roller/${id}`)
  revalidatePath('/roller')
  if (projectId) revalidatePath(`/projeler/${projectId}`)
}

export async function deleteRol(id: string, projectId: string) {
  const { supabase } = await requireOrg()
  await supabase.from('project_roles').delete().eq('id', id)
  revalidatePath(`/projeler/${projectId}`)
}
