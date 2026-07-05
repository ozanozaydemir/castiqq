import { Resend } from 'resend'

// Lazy init — build sırasında RESEND_API_KEY olmadığında hata fırlatmaz
let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY ?? '')
  return _resend
}
export const resend = { emails: { send: (...args: Parameters<Resend['emails']['send']>) => getResend().emails.send(...args) } }

const FROM = 'Castiqq <noreply@castiqq.app>'
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
    <div class="header"><a class="logo" href="${SITE_URL}">🎬 Castiqq</a></div>
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
