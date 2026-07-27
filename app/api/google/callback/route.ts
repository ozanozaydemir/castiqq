import { NextRequest, NextResponse } from 'next/server'
import { requireOrg } from '@/lib/require-org'
import { createAdminClient } from '@/lib/supabase/admin'
import { createGoogleOAuthClient } from '@/lib/google'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const storedState = req.cookies.get('google_oauth_state')?.value

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL('/ayarlar?google_error=invalid_state', req.url))
  }

  const { userId, orgId } = await requireOrg()
  const oauth2Client = createGoogleOAuthClient()

  try {
    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token || !tokens.refresh_token) {
      return NextResponse.redirect(new URL('/ayarlar?google_error=no_refresh_token', req.url))
    }

    oauth2Client.setCredentials(tokens)
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
    const { data: googleUser } = await oauth2.userinfo.get()

    const adminClient = createAdminClient()
    const { error } = await adminClient.from('google_connections').upsert(
      {
        organization_id: orgId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(tokens.expiry_date ?? Date.now() + 3600_000).toISOString(),
        connected_by: userId,
        google_email: googleUser.email ?? null,
      },
      { onConflict: 'organization_id' },
    )

    if (error) {
      console.error('[google callback] db upsert failed', error.message)
      return NextResponse.redirect(new URL('/ayarlar?google_error=save_failed', req.url))
    }

    const response = NextResponse.redirect(new URL('/ayarlar?google_connected=1', req.url))
    response.cookies.delete('google_oauth_state')
    return response
  } catch (err) {
    console.error('[google callback] token exchange failed', err)
    return NextResponse.redirect(new URL('/ayarlar?google_error=exchange_failed', req.url))
  }
}
