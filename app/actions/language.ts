'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function setLanguage(locale: 'tr' | 'en') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('profiles')
    .update({ preferred_language: locale })
    .eq('id', user.id)

  redirect(locale === 'en' ? '/en/ayarlar' : '/ayarlar')
}
