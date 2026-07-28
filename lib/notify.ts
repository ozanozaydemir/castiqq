import { createAdminClient } from '@/lib/supabase/admin'
import {
  sendRoleSharedEmail, sendSubmissionReceivedEmail,
  sendSubmissionDecidedEmail, sendShareRevokedEmail, sendShareExpiringEmail,
} from '@/lib/resend'
import type { NotificationType } from '@/types/database'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

/**
 * Bildirimler her zaman admin client ile yazılır — çünkü çoğu zaman
 * paylaşımı yapan taraf kendi org'unda değil, KARŞI org'un notifications
 * satırına yazıyor (RLS org izolasyonunu normal client için haklı olarak
 * engeller, bu yüzden burada bilinçli olarak bypass edilir).
 */
async function insertNotification(
  organizationId: string, type: NotificationType, title: string,
  body: string | null, linkUrl: string | null, relatedId: string | null,
) {
  const admin = createAdminClient()
  await admin.from('notifications').insert({
    organization_id: organizationId, type, title, body, link_url: linkUrl, related_id: relatedId,
  })
}

/** Admin email'leri — yalnızca org adminlerine email atılır, member'lar sadece in-app görür. */
async function emailAdmins(organizationId: string, send: (email: string) => Promise<unknown>) {
  const admin = createAdminClient()
  const { data: admins } = await admin.from('profiles').select('id').eq('organization_id', organizationId).eq('role', 'admin')
  for (const a of admins ?? []) {
    const { data: authUser } = await admin.auth.admin.getUserById(a.id)
    const email = authUser?.user?.email
    if (!email) continue
    try {
      await send(email)
    } catch (err) {
      console.error('[notify] email error', organizationId, (err as Error).message)
    }
  }
}

export async function notifyRoleShared(
  targetOrgId: string, senderOrgName: string, roleTitle: string, shareId: string, locale: 'tr' | 'en' = 'tr',
) {
  const linkUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/gelen-roller/${shareId}`
  await insertNotification(
    targetOrgId, 'role_shared',
    locale === 'en' ? `${senderOrgName} shared a new role: ${roleTitle}` : `${senderOrgName} yeni bir rol paylaştı: ${roleTitle}`,
    null, linkUrl, shareId,
  )
  await emailAdmins(targetOrgId, email => sendRoleSharedEmail(email, senderOrgName, roleTitle, linkUrl, locale))
}

export async function notifySubmissionReceived(
  productionOrgId: string, agencyOrgName: string, roleTitle: string, projectRoleId: string, locale: 'tr' | 'en' = 'tr',
) {
  const linkUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/roller/${projectRoleId}`
  await insertNotification(
    productionOrgId, 'submission_received',
    locale === 'en' ? `${agencyOrgName} submitted talent for: ${roleTitle}` : `${agencyOrgName} "${roleTitle}" için oyuncu önerdi`,
    null, linkUrl, projectRoleId,
  )
  await emailAdmins(productionOrgId, email => sendSubmissionReceivedEmail(email, agencyOrgName, roleTitle, linkUrl, locale))
}

export async function notifySubmissionDecided(
  agencyOrgId: string, roleTitle: string, decision: 'kabul' | 'kismen_kabul' | 'red', shareId: string, locale: 'tr' | 'en' = 'tr',
) {
  const linkUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/gelen-roller/${shareId}`
  const decisionLabel = decision === 'kabul' ? 'kabul edildi' : decision === 'kismen_kabul' ? 'kısmen kabul edildi' : 'reddedildi'
  await insertNotification(
    agencyOrgId, 'submission_decided',
    locale === 'en' ? `Submission for "${roleTitle}" decided` : `"${roleTitle}" önerisi ${decisionLabel}`,
    null, linkUrl, shareId,
  )
  await emailAdmins(agencyOrgId, email => sendSubmissionDecidedEmail(email, roleTitle, decision, linkUrl, locale))
}

export async function notifyShareRevoked(
  targetOrgId: string, senderOrgName: string, roleTitle: string, locale: 'tr' | 'en' = 'tr',
) {
  await insertNotification(
    targetOrgId, 'share_revoked',
    locale === 'en' ? `${senderOrgName} withdrew the "${roleTitle}" share` : `${senderOrgName} "${roleTitle}" paylaşımını geri çekti`,
    null, null, null,
  )
  await emailAdmins(targetOrgId, email => sendShareRevokedEmail(email, senderOrgName, roleTitle, locale))
}

export async function notifyShareExpiring(
  targetOrgId: string, roleTitle: string, shareId: string, locale: 'tr' | 'en' = 'tr',
) {
  const linkUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/gelen-roller/${shareId}`
  await insertNotification(
    targetOrgId, 'share_expiring',
    locale === 'en' ? `"${roleTitle}" share expires soon` : `"${roleTitle}" paylaşımının süresi doluyor`,
    null, linkUrl, shareId,
  )
  await emailAdmins(targetOrgId, email => sendShareExpiringEmail(email, roleTitle, linkUrl, locale))
}
