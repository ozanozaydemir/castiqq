import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { getLocale } from 'next-intl/server'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'
const SITE_NAME = 'Castiqq'
const DEFAULT_TITLE = 'Castiqq — Casting Yönetim Platformu'
// Yalnızca [locale] layout'unun devralmadığı rotalar için yedek açıklama;
// ana sayfa kendi locale'li metnini generateMetadata'dan alıyor.
const DEFAULT_DESCRIPTION =
  'Cast direktörleri ve menajerlik ajansları için casting yönetim platformu. Audition videoları, kadro yönetimi, iş ve tahsilat takibi tek sistemde.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: 'Castiqq', url: SITE_URL }],
  creator: 'Castiqq',
  robots: { index: true, follow: true },
  verification: {
    google: '-C7injvyVWAYHEbTLO4p7vImefpaE8cHVvIRwXrdVFE',
  },
}

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  // Yakınlaştırma kısıtlanmıyor: maximumScale/userScalable ile zoom'u
  // kapatmak erişilebilirlik ihlali ve Lighthouse SEO denetiminde hata.
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  return (
    <html lang={locale} className={`h-full ${plusJakartaSans.variable}`}>
      <body className={`h-full antialiased ${plusJakartaSans.className}`}>
        {children}
      </body>
    </html>
  )
}
