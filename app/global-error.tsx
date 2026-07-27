'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: 24,
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Bir şeyler ters gitti</h1>
          <p style={{ color: '#666', marginBottom: 16 }}>Beklenmedik bir hata oluştu. Ekibimiz bilgilendirildi.</p>
          <a href="/" style={{ color: '#6366f1', fontWeight: 600 }}>Ana sayfaya dön</a>
        </div>
      </body>
    </html>
  )
}
