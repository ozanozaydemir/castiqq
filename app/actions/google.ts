'use server'

import { revalidatePath } from 'next/cache'
import { requireOrg } from '@/lib/require-org'

export async function disconnectGoogle() {
  const { supabase, orgId } = await requireOrg()
  await supabase.from('google_connections').delete().eq('organization_id', orgId)
  revalidatePath('/ayarlar')
}
