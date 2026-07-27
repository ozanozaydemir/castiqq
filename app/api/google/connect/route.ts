import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { requireOrg } from '@/lib/require-org'
import { createGoogleOAuthClient, GOOGLE_SHEETS_SCOPES } from '@/lib/google'

export async function GET() {
  await requireOrg()

  const oauth2Client = createGoogleOAuthClient()
  const state = randomBytes(16).toString('hex')

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GOOGLE_SHEETS_SCOPES,
    state,
  })

  const response = NextResponse.redirect(url)
  response.cookies.set('google_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
