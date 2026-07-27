import { google } from 'googleapis'
import { createAdminClient } from '@/lib/supabase/admin'

export const GOOGLE_SHEETS_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  // Bağlı hesabın email'ini "Bağlı hesap: x@gmail.com" olarak göstermek için —
  // bu olmadan userinfo endpoint'i 401 döner ve tüm bağlantı iptal olurdu.
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ')

export function getGoogleRedirectUri() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  return `${siteUrl}/api/google/callback`
}

export function createGoogleOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    getGoogleRedirectUri(),
  )
}

// Org'un kayıtlı Google bağlantısını canlı bir OAuth2 client'a çevirir.
// googleapis SDK, refresh_token varsa access_token'ı gerektiğinde otomatik
// yeniler; yeni token'ı DB'ye geri yazıyoruz ki bir sonraki çağrıda tekrar
// yenilenmeye gerek kalmasın.
export async function getGoogleClientForOrg(orgId: string) {
  const adminClient = createAdminClient()
  const { data: conn } = await adminClient
    .from('google_connections')
    .select('access_token, refresh_token, expires_at')
    .eq('organization_id', orgId)
    .single()

  if (!conn) return null

  const oauth2Client = createGoogleOAuthClient()
  oauth2Client.setCredentials({
    access_token: conn.access_token,
    refresh_token: conn.refresh_token,
    expiry_date: new Date(conn.expires_at).getTime(),
  })

  oauth2Client.on('tokens', (tokens) => {
    if (!tokens.access_token) return
    adminClient
      .from('google_connections')
      .update({
        access_token: tokens.access_token,
        expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString(),
      })
      .eq('organization_id', orgId)
      .then(() => {})
  })

  return oauth2Client
}
