import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

/**
 * Native Next.js robots route.
 *
 * Daha önce next-sitemap postbuild'de public/robots.txt üretiyordu; dosya
 * sürüm kontrolünde olmadığı ve middleware tarafından yutulduğu için canlıda
 * 404 dönüyordu. Burada üretilince hem repoda duruyor hem de rota olarak
 * garanti servis ediliyor.
 */

/** Giriş gerektiren ya da tekil token taşıyan, indexlenmemesi gereken alanlar. */
const PRIVATE_PATHS = [
  '/dashboard', '/genel-bakis', '/projeler', '/roller', '/oyuncular',
  '/listeler', '/ayarlar', '/isler', '/takvim', '/musteriler', '/teklifler',
  '/gorevler', '/auditions', '/kurulum', '/plan-sec', '/oneri-yazdir',
  // Token'lı public sayfalar: herkese açık ama arama sonucunda çıkmamalı
  '/oyuncu/', '/oyuncu-profil/', '/rol/', '/liste/',
  // Kimlik doğrulama sayfalarının arama değeri yok
  '/giris', '/kayit', '/sifremi-unuttum', '/sifremi-sifirla',
]

const DISALLOW = [
  '/api/',
  '/auth/',
  ...PRIVATE_PATHS,
  ...PRIVATE_PATHS.map(p => `/en${p}`),
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
