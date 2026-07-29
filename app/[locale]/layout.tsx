import type { Metadata } from 'next'
import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { getMessages, getTranslations } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import { PostHogProvider } from '@/components/PostHogProvider'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

interface Props {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'seo' })

  const isTr = locale === 'tr'
  const canonical = isTr ? SITE_URL : `${SITE_URL}/en`

  return {
    metadataBase: new URL(SITE_URL),
    // Ana sayfa markayı başta taşısın; alt sayfalar kök layout'taki
    // "%s | Castiqq" şablonunu kullanmaya devam ediyor.
    title: { absolute: t('homeTitle') },
    description: t('homeDescription'),
    alternates: {
      canonical,
      languages: {
        'tr': SITE_URL,
        'en': `${SITE_URL}/en`,
        'x-default': SITE_URL,
      },
    },
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      url: canonical,
      locale: isTr ? 'tr_TR' : 'en_US',
      alternateLocale: isTr ? 'en_US' : 'tr_TR',
      siteName: 'Castiqq',
      type: 'website',
      // images bilerek verilmiyor: opengraph-image.tsx dosya konvansiyonu
      // görseli zaten üretiyor. Burada elle /og-image.png verilmesi onu
      // eziyordu ve o dosya hiç var olmadığı için tüm link önizlemeleri
      // görselsiz kalıyordu.
    },
    twitter: {
      card: 'summary_large_image',
      site: '@castiqq',
      title: t('homeTitle'),
      description: t('homeDescription'),
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
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </NextIntlClientProvider>
  )
}
