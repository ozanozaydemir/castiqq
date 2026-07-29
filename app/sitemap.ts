import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

/**
 * Native Next.js sitemap.
 *
 * Yalnızca herkese açık ve indexlenmesi istenen sayfalar listeleniyor;
 * her biri TR/EN hreflang eşleriyle birlikte veriliyor ki Google iki dilin
 * aynı sayfanın çevirisi olduğunu bilsin ve yanlış dili sıralamasın.
 */

type PublicRoute = {
  /** TR yolundaki path — kök sayfa için boş string */
  path: string
  priority: number
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
}

const ROUTES: PublicRoute[] = [
  { path: '',                    priority: 1.0, changeFrequency: 'weekly' },
  { path: '/cast-direktorleri',  priority: 0.9, changeFrequency: 'monthly' },
  { path: '/gizlilik',           priority: 0.3, changeFrequency: 'yearly' },
  { path: '/kullanim-kosullari', priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return ROUTES.flatMap(({ path, priority, changeFrequency }) => {
    const tr = `${SITE_URL}${path}`
    const en = `${SITE_URL}/en${path}`
    const languages = { tr, en, 'x-default': tr }

    return [
      { url: tr, lastModified, changeFrequency, priority, alternates: { languages } },
      { url: en, lastModified, changeFrequency, priority: priority * 0.9, alternates: { languages } },
    ]
  })
}
