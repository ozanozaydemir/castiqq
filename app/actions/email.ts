'use server'

import { sendAuditionInviteEmail } from '@/lib/resend'
import { getLocale } from 'next-intl/server'

export async function sendAuditionEmailAction(
  to: string,
  talentName: string,
  roleName: string,
  projectTitle: string,
  uploadUrl: string,
): Promise<void> {
  const locale = await getLocale()
  await sendAuditionInviteEmail(to, talentName, roleName, projectTitle, uploadUrl, locale as 'tr' | 'en')
    .catch(err => console.error('Audition invite email error:', err.message))
}
