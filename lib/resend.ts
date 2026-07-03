import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'CastFlow <noreply@castflow.app>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castflow.app'

// ── Hoş Geldin ──────────────────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'CastFlow\'a hoş geldiniz 🎬',
    html: welcomeHtml(name, SITE_URL),
  })
}

// ── Ekip Daveti ─────────────────────────────────────────────────────
export async function sendTeamInviteEmail(to: string, orgName: string, inviteUrl: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `${orgName} sizi CastFlow'a davet etti`,
    html: teamInviteHtml(orgName, inviteUrl, SITE_URL),
  })
}

// ── Audition Daveti (oyuncuya) ───────────────────────────────────────
export async function sendAuditionInviteEmail(
  to: string,
  talentName: string,
  roleName: string,
  projectTitle: string,
  uploadUrl: string,
) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: `"${roleName}" rolü için video yükleme daveti`,
    html: auditionInviteHtml(talentName, roleName, projectTitle, uploadUrl, SITE_URL),
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
    <div class="header"><a class="logo" href="${SITE_URL}">🎬 CastFlow</a></div>
    <div class="body">${content}</div>
    <div class="footer">
      CastFlow · <a href="${SITE_URL}/gizlilik">Gizlilik Politikası</a> · <a href="${SITE_URL}/kullanim-kosullari">Kullanım Koşulları</a><br>
      Bu emaili almak istemiyorsanız hesabınızı silmeniz yeterlidir.
    </div>
  </div>
</div>
</body></html>`
}

function welcomeHtml(name: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">Hoş geldiniz, ${name}! 👋</p>
    <p class="p">CastFlow hesabınız hazır. Hemen ilk projenizi oluşturun ve casting sürecinizi kolaylaştırmaya başlayın.</p>
    <p class="p">
      ✅ Proje ve rol yönetimi<br>
      ✅ Oyuncu veritabanı<br>
      ✅ Video inceleme ve puanlama<br>
      ✅ WhatsApp entegrasyonu
    </p>
    <a class="btn" href="${siteUrl}/dashboard">Dashboard'a Git →</a>
    <p class="p" style="margin-top:24px;font-size:13px;color:#888">
      Sorunuz varsa <a href="mailto:support@castflow.app">support@castflow.app</a> adresinden bize yazabilirsiniz.
    </p>
  `)
}

function teamInviteHtml(orgName: string, inviteUrl: string, siteUrl: string) {
  return baseHtml(`
    <p class="h1">${orgName} sizi davet etti</p>
    <p class="p"><strong>${orgName}</strong> ekibi sizi CastFlow'a katılmaya davet etti. Daveti kabul ederek casting sürecinize katkıda bulunabilirsiniz.</p>
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
