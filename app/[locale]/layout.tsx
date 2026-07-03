import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params

  const isTr = locale === 'tr'
  const canonical = isTr ? SITE_URL : `${SITE_URL}/en`

  return {
    metadataBase: new URL(SITE_URL),
    alternates: {
      canonical,
      languages: {
        'tr': SITE_URL,
        'en': `${SITE_URL}/en`,
        'x-default': SITE_URL,
      },
    },
    openGraph: {
      locale: isTr ? 'tr_TR' : 'en_US',
      alternateLocale: isTr ? 'en_US' : 'tr_TR',
      siteName: 'CastFlow',
      type: 'website',
      images: [
        {
          url: `${SITE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: 'CastFlow — Casting Yönetim Platformu',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@castflowapp',
      images: [`${SITE_URL}/og-image.png`],
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}
