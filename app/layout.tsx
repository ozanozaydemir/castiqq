import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'
const SITE_NAME = 'CastFlow'
const DEFAULT_TITLE = 'CastFlow — Casting Yönetim Platformu'
const DEFAULT_DESCRIPTION =
  'Yapım şirketleri, casting ajansları ve cast direktörleri için profesyonel casting yönetim platformu. Proje, rol ve oyuncu yönetimi tek sistemde.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: 'CastFlow', url: SITE_URL }],
  creator: 'CastFlow',
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`h-full ${inter.variable}`}>
      <body className={`h-full antialiased ${inter.className}`}>
        {children}
      </body>
    </html>
  )
}
