'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export async function listNotifications(limit = 20) {
  const { supabase } = await requireOrg()
  const { data } = await supabase
    .from('notifications')
    .select('id, type, title, body, link_url, related_id, read_at, created_at')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getUnreadNotificationCount() {
  const { supabase, orgId } = await requireOrg()
  const { count } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('read_at', null)
  return count ?? 0
}

export async function markNotificationRead(id: string) {
  const { supabase } = await requireOrg()
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null)
  revalidatePath('/', 'layout')
}

export async function markAllNotificationsRead() {
  const { supabase } = await requireOrg()
  await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
  revalidatePath('/', 'layout')
}
