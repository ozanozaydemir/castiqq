/**
 * Yapılandırılmış veri (JSON-LD) üreticileri.
 *
 * İki amaca birden hizmet ediyor: arama motorlarında zengin sonuç ve
 * yapay zekâ asistanlarının ürünü doğru bilgiyle aktarabilmesi (GEO).
 * Bu yüzden alanlar pazarlama diliyle değil, doğrulanabilir gerçeklerle
 * doldurulmalı — abartılan her ifade yanlış alıntılanma riski taşır.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

export function organizationSchema(description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'Castiqq',
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon.svg`,
    description,
    areaServed: { '@type': 'Country', name: 'Turkey' },
    knowsLanguage: ['tr', 'en'],
  }
}

export function websiteSchema(name: string, description: string, locale: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name,
    description,
    inLanguage: locale === 'en' ? 'en' : 'tr',
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export function softwareApplicationSchema({
  description,
  plans,
}: {
  description: string
  /** Landing'de gösterilen planlarla birebir aynı olmalı. */
  plans: { name: string; price: number }[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#software`,
    name: 'Castiqq',
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Casting & Talent Management',
    operatingSystem: 'Web',
    url: SITE_URL,
    description,
    inLanguage: ['tr', 'en'],
    publisher: { '@id': `${SITE_URL}/#organization` },
    offers: plans.map(p => ({
      '@type': 'Offer',
      name: p.name,
      price: String(p.price),
      priceCurrency: 'TRY',
      category: 'subscription',
      url: `${SITE_URL}/kayit`,
      availability: 'https://schema.org/InStock',
    })),
  }
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_URL}/#faq`,
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
