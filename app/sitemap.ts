import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '',                         priority: 1.0, changeFrequency: 'weekly' },
  { path: '/cast-direktorleri',       priority: 0.9, changeFrequency: 'monthly' },
  { path: '/menajerlik-ajanslari',    priority: 0.9, changeFrequency: 'monthly' },
  { path: '/gizlilik',                priority: 0.3, changeFrequency: 'yearly' },
  { path: '/kullanim-kosullari',      priority: 0.3, changeFrequency: 'yearly' },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }))
}
