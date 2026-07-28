import { Resend } from 'resend'

// Lazy init — build sırasında RESEND_API_KEY olmadığında hata fırlatmaz
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '')
  return _resend
}
export const resend = { emails: { send: (...args: Parameters<Resend['emails']['send']>) => getResend().emails.send(...args) } }

const FROM = 'Castiqq <support@castiqq.app>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

// ── Hoş Geldin ──────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string, locale: 'tr' | 'en' = 'tr') {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en' ? `Welcome to Castiqq 🎬` : `Castiqq'a hoş geldiniz 🎬`,
    html: locale === 'en' ? welcomeHtmlEN(name, SITE_URL) : welcomeHtml(name, SITE_URL),
  })
}

// ── Ekip Daveti ─────────────────────────────────────────────────────
export async function sendTeamInviteEmail(to: string, orgName: string, inviteUrl: string, locale: 'tr' | 'en' = 'tr') {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `${orgName} invited you to Castiqq`
      : `${orgName} sizi Castiqq'a davet etti`,
    html: locale === 'en' ? teamInviteHtmlEN(orgName, inviteUrl, SITE_URL) : teamInviteHtml(orgName, inviteUrl, SITE_URL),
  })
}

// ── Audition Daveti (oyuncuya) ───────────────────────────────────────
export async function sendAuditionInviteEmail(
  to: string,
  talentName: string,
  roleName: string,
  projectTitle: string,
  uploadUrl: string,
  locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `Video upload invitation for the "${roleName}" role`
      : `"${roleName}" rolü için video yükleme daveti`,
    html: locale === 'en'
      ? auditionInviteHtmlEN(talentName, roleName, projectTitle, uploadUrl)
      : auditionInviteHtml(talentName, roleName, projectTitle, uploadUrl, SITE_URL),
  })
}

// ── HTML Template'leri ───────────────────────────────────────────────

function baseHtml(content: string) {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body { margin:0; padding:0; background:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  .wrap { max-width:560px; margin:40px auto; }
  .card { background:#fff; border-radius:16px; overflow:hidden; border:1px solid #e4e4e7; }
  .header { background:#6366f1; padding:28px 32px; }
  .logo { color:#fff; font-size:22px; font-weight:800; letter-spacing:-0.5px; text-decoration:none; }
  .body { padding:32px; }
  .h1 { font-size:22px; font-weight:700; color:#111; margin:0 0 12px; }
  .p { font-size:15px; color:#444; line-height:1.6; margin:0 0 16px; }
  .btn { display:inline-block; background:#6366f1; color:#fff!important; text-decoration:none; padding:13px 28px; border-radius:10px; font-weight:600; font-size:15px; }
  .footer { padding:24px 32px; border-top:1px solid #f0f0f0; font-size:12px; color:#999; }
  a { color:#6366f1; }
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <div class="header"><a class="logo" href="${SITE_URL}" style="color:#ffffff !important;">🎬 Castiqq</a></div>
    <div class="body">${content}</div>
    <div class="footer">
      Castiqq · <a href="${SITE_URL}/gizlilik">Gizlilik Politikası</a> · <a href="${SITE_URL}/kullanim-kosullari">Kullanım Koşulları</a><br>
      Bu emaili almak istemiyorsanız hesabınızı silmeniz yeterlidir.
    </div>
  </div>
</div>
</body></html>`
}

function welcomeHtml(name: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">Hoş geldiniz, ${name}! 👋</p>
    <p class="p">Castiqq hesabınız hazır. Hemen ilk projenizi oluşturun ve casting sürecinizi kolaylaştırmaya başlayın.</p>
    <p class="p">
      ✅ Proje ve rol yönetimi<br>
      ✅ Oyuncu veritabanı<br>
      ✅ Video inceleme ve puanlama<br>
      ✅ WhatsApp entegrasyonu
    </p>
    <a class="btn" href="${siteUrl}/dashboard">Dashboard'a Git →</a>
    <p class="p" style="margin-top:24px;font-size:13px;color:#888">
      Sorunuz varsa <a href="mailto:support@castiqq.app">support@castiqq.app</a> adresinden bize yazabilirsiniz.
    </p>
  `)
}

function teamInviteHtml(orgName: string, inviteUrl: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">${orgName} sizi davet etti</p>
    <p class="p"><strong>${orgName}</strong> ekibi sizi Castiqq'a katılmaya davet etti. Daveti kabul ederek casting sürecinize katkıda bulunabilirsiniz.</p>
    <a class="btn" href="${inviteUrl}">Daveti Kabul Et →</a>
    <p class="p" style="margin-top:20px;font-size:13px;color:#888">
      Bu davet 7 gün geçerlidir. Hesap oluşturmak için bir şifre belirlemeniz gerekecektir.<br><br>
      Bu daveti siz talep etmediyseniz bu emaili görmezden gelebilirsiniz.
    </p>
  `)
}

function auditionInviteHtml(
  talentName: string,
  roleName: string,
  projectTitle: string,
  uploadUrl: string,
  _siteUrl: string,
) {
  return baseHtml(`
    <p class="h1">Merhaba, ${talentName}!</p>
    <p class="p"><strong>${projectTitle}</strong> projesi için <strong>"${roleName}"</strong> rolünde sizi değerlendirmek istiyoruz.</p>
    <p class="p">Aşağıdaki bağlantıya tıklayarak performans videonuzu yükleyebilirsiniz:</p>
    <a class="btn" href="${uploadUrl}">Video Yükle →</a>
    <p class="p" style="margin-top:20px;font-size:13px;color:#888">
      Maksimum 3 video yükleyebilirsiniz. Videolar yalnızca casting ekibi tarafından izlenir.<br><br>
      Sorunuz varsa bu emaili yanıtlayabilirsiniz.
    </p>
  `)
}

// ── EN HTML Template'leri ────────────────────────────────────────────

function welcomeHtmlEN(name: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">Welcome, ${name}! 👋</p>
    <p class="p">Your Castiqq account is ready. Create your first project and streamline your casting process.</p>
    <p class="p">
      ✅ Project and role management<br>
      ✅ Talent database<br>
      ✅ Video review and rating<br>
      ✅ WhatsApp integration
    </p>
    <a class="btn" href="${siteUrl}/en/dashboard">Go to Dashboard →</a>
    <p class="p" style="margin-top:24px;font-size:13px;color:#888">
      Questions? Email us at <a href="mailto:support@castiqq.app">support@castiqq.app</a>
    </p>
  `)
}

function teamInviteHtmlEN(orgName: string, inviteUrl: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">${orgName} invited you</p>
    <p class="p"><strong>${orgName}</strong> has invited you to join Castiqq and collaborate on casting projects.</p>
    <a class="btn" href="${inviteUrl}">Accept Invitation →</a>
    <p class="p" style="margin-top:20px;font-size:13px;color:#888">
      This invitation expires in 7 days. You will need to set a password to create your account.<br><br>
      If you did not request this invitation, you can safely ignore this email.
    </p>
  `)
}

function auditionInviteHtmlEN(
  talentName: string,
  roleName: string,
  projectTitle: string,
  uploadUrl: string,
) {
  return baseHtml(`
    <p class="h1">Hello, ${talentName}!</p>
    <p class="p">We'd like to consider you for the <strong>"${roleName}"</strong> role in <strong>${projectTitle}</strong>.</p>
    <p class="p">Click the link below to upload your audition video:</p>
    <a class="btn" href="${uploadUrl}">Upload Video →</a>
    <p class="p" style="margin-top:20px;font-size:13px;color:#888">
      You can upload up to 3 videos. They will only be viewed by the casting team.<br><br>
      If you have any questions, reply to this email.
    </p>
  `)
}

// ── Video Yükleme Bildirimi (direktöre) ─────────────────────────────
export async function sendVideoNotificationEmail(
  to: string,
  talentName: string,
  roleName: string,
  projectTitle: string,
  dashboardUrl: string,
  locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `New video from ${talentName} for "${roleName}"`
      : `"${roleName}" için ${talentName} adlı oyuncudan yeni video`,
    html: locale === 'en'
      ? videoNotifHtmlEN(talentName, roleName, projectTitle, dashboardUrl)
      : videoNotifHtml(talentName, roleName, projectTitle, dashboardUrl),
  })
}

function videoNotifHtml(
  talentName: string,
  roleName: string,
  projectTitle: string,
  dashboardUrl: string,
) {
  return baseHtml(`
    <p class="h1">Yeni video yüklendi 🎬</p>
    <p class="p"><strong>${talentName}</strong> adlı oyuncu <strong>"${roleName}"</strong> rolü için (<strong>${projectTitle}</strong>) yeni bir video yükledi.</p>
    <a class="btn" href="${dashboardUrl}">Videoyu İzle →</a>
  `)
}

function videoNotifHtmlEN(
  talentName: string,
  roleName: string,
  projectTitle: string,
  dashboardUrl: string,
) {
  return baseHtml(`
    <p class="h1">New video uploaded 🎬</p>
    <p class="p"><strong>${talentName}</strong> uploaded a new audition video for the <strong>"${roleName}"</strong> role in <strong>${projectTitle}</strong>.</p>
    <a class="btn" href="${dashboardUrl}">Watch Video →</a>
  `)
}

// ── Ajans Günlük Özet (Genel Bakış uyarıları) ────────────────────────
export type AgencyDigestItem = { label: string; count: number }

export async function sendAgencyDigestEmail(
  to: string,
  orgName: string,
  items: AgencyDigestItem[],
  locale: 'tr' | 'en' = 'tr',
) {
  const overviewUrl = `${SITE_URL}${locale === 'en' ? '/en' : ''}/genel-bakis`
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `${orgName} — daily summary: action needed`
      : `${orgName} — günlük özet: dikkat edilmesi gerekenler`,
    html: locale === 'en' ? agencyDigestHtmlEN(orgName, items, overviewUrl) : agencyDigestHtml(orgName, items, overviewUrl),
  })
}

function agencyDigestHtml(orgName: string, items: AgencyDigestItem[], overviewUrl: string) {
  const rows = items.map(i => `<li style="margin-bottom:6px;">${i.label}: <strong>${i.count}</strong></li>`).join('')
  return baseHtml(`
    <p class="h1">${orgName} için günlük özet</p>
    <p class="p">Genel Bakış'ta dikkat gerektiren maddeler var:</p>
    <ul class="p" style="padding-left:20px;">${rows}</ul>
    <a class="btn" href="${overviewUrl}">Genel Bakış'ı Aç →</a>
  `)
}

function agencyDigestHtmlEN(orgName: string, items: AgencyDigestItem[], overviewUrl: string) {
  const rows = items.map(i => `<li style="margin-bottom:6px;">${i.label}: <strong>${i.count}</strong></li>`).join('')
  return baseHtml(`
    <p class="h1">Daily summary for ${orgName}</p>
    <p class="p">There are items in your Overview that need attention:</p>
    <ul class="p" style="padding-left:20px;">${rows}</ul>
    <a class="btn" href="${overviewUrl}">Open Overview →</a>
  `)
}

// ── Org-arası rol paylaşımı bildirimleri ─────────────────────────────

export async function sendRoleSharedEmail(
  to: string, senderOrgName: string, roleTitle: string, url: string, locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `${senderOrgName} shared a new role with you: "${roleTitle}"`
      : `${senderOrgName} sizinle bir rol paylaştı: "${roleTitle}"`,
    html: baseHtml(locale === 'en' ? `
      <p class="h1">New role shared 🎬</p>
      <p class="p"><strong>${senderOrgName}</strong> shared the <strong>"${roleTitle}"</strong> role with your agency. Review the role and submit matching talent from your roster.</p>
      <a class="btn" href="${url}">View Role →</a>
    ` : `
      <p class="h1">Yeni bir rol paylaşıldı 🎬</p>
      <p class="p"><strong>${senderOrgName}</strong> ajansınızla <strong>"${roleTitle}"</strong> rolünü paylaştı. Rolü inceleyip roster'ınızdan uygun oyuncuları önerebilirsiniz.</p>
      <a class="btn" href="${url}">Rolü Görüntüle →</a>
    `),
  })
}

export async function sendSubmissionReceivedEmail(
  to: string, agencyOrgName: string, roleTitle: string, url: string, locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `${agencyOrgName} submitted talent for "${roleTitle}"`
      : `${agencyOrgName} "${roleTitle}" rolü için oyuncu önerdi`,
    html: baseHtml(locale === 'en' ? `
      <p class="h1">New submission received 📥</p>
      <p class="p"><strong>${agencyOrgName}</strong> proposed talent for your <strong>"${roleTitle}"</strong> role.</p>
      <a class="btn" href="${url}">Review Submission →</a>
    ` : `
      <p class="h1">Yeni öneri geldi 📥</p>
      <p class="p"><strong>${agencyOrgName}</strong>, <strong>"${roleTitle}"</strong> rolünüz için oyuncu önerdi.</p>
      <a class="btn" href="${url}">Öneriyi İncele →</a>
    `),
  })
}

export async function sendSubmissionDecidedEmail(
  to: string, roleTitle: string, decision: 'kabul' | 'kismen_kabul' | 'red', url: string, locale: 'tr' | 'en' = 'tr',
) {
  const decisionLabelTr = decision === 'kabul' ? 'kabul edildi' : decision === 'kismen_kabul' ? 'kısmen kabul edildi' : 'reddedildi'
  const decisionLabelEn = decision === 'kabul' ? 'accepted' : decision === 'kismen_kabul' ? 'partially accepted' : 'declined'
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `Your submission for "${roleTitle}" was ${decisionLabelEn}`
      : `"${roleTitle}" rolü için öneriniz ${decisionLabelTr}`,
    html: baseHtml(locale === 'en' ? `
      <p class="h1">Submission update</p>
      <p class="p">Your submission for the <strong>"${roleTitle}"</strong> role was <strong>${decisionLabelEn}</strong>.</p>
      <a class="btn" href="${url}">View Details →</a>
    ` : `
      <p class="h1">Öneri durumu güncellendi</p>
      <p class="p"><strong>"${roleTitle}"</strong> rolü için gönderdiğiniz öneri <strong>${decisionLabelTr}</strong>.</p>
      <a class="btn" href="${url}">Detayları Gör →</a>
    `),
  })
}

export async function sendShareRevokedEmail(
  to: string, senderOrgName: string, roleTitle: string, locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `${senderOrgName} withdrew the "${roleTitle}" role share`
      : `${senderOrgName} "${roleTitle}" rol paylaşımını geri çekti`,
    html: baseHtml(locale === 'en' ? `
      <p class="h1">Role share withdrawn</p>
      <p class="p"><strong>${senderOrgName}</strong> withdrew the <strong>"${roleTitle}"</strong> role share. No further submissions can be made for this role.</p>
    ` : `
      <p class="h1">Rol paylaşımı geri çekildi</p>
      <p class="p"><strong>${senderOrgName}</strong>, <strong>"${roleTitle}"</strong> rol paylaşımını geri çekti. Bu rol için artık yeni öneri gönderilemez.</p>
    `),
  })
}

export async function sendShareExpiringEmail(
  to: string, roleTitle: string, url: string, locale: 'tr' | 'en' = 'tr',
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: locale === 'en'
      ? `Reminder: "${roleTitle}" role share expires soon`
      : `Hatırlatma: "${roleTitle}" rol paylaşımının süresi doluyor`,
    html: baseHtml(locale === 'en' ? `
      <p class="h1">Share expiring soon ⏰</p>
      <p class="p">The <strong>"${roleTitle}"</strong> role share expires in 3 days. Submit your talent before it closes.</p>
      <a class="btn" href="${url}">View Role →</a>
    ` : `
      <p class="h1">Paylaşımın süresi doluyor ⏰</p>
      <p class="p"><strong>"${roleTitle}"</strong> rol paylaşımının süresi 3 gün içinde doluyor. Kapanmadan önce oyuncu önerinizi gönderin.</p>
      <a class="btn" href="${url}">Rolü Görüntüle →</a>
    `),
  })
}
