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

  return {
    metadataBase: new URL(SITE_URL),
    title: { absolute: t('homeTitle') },
    description: t('homeDescription'),
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      title: t('homeTitle'),
      description: t('homeDescription'),
      url: SITE_URL,
      locale: 'tr_TR',
      siteName: 'Castiqq',
      type: 'website',
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
  if (!hasLocale(routing.locales, locale)) notFound()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PostHogProvider>
        {children}
      </PostHogProvider>
    </NextIntlClientProvider>
  )
}
