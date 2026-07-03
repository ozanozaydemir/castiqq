/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://castiqq.app',
  generateRobotsTxt: true,
  robotsTxtOptions: {
    policies: [
      { userAgent: '*', allow: '/' },
      {
        userAgent: '*',
        disallow: [
          '/dashboard',
          '/projeler',
          '/roller',
          '/oyuncular',
          '/listeler',
          '/ayarlar',
          '/api',
          '/en/dashboard',
          '/en/projeler',
          '/en/roller',
          '/en/oyuncular',
          '/en/listeler',
          '/en/ayarlar',
        ],
      },
    ],
  },
  // Auth ve app sayfaları index'e girmesin
  exclude: [
    '/dashboard*',
    '/projeler*',
    '/roller*',
    '/oyuncular*',
    '/listeler*',
    '/ayarlar*',
    '/oyuncu/*',
    '/en/dashboard*',
    '/en/projeler*',
    '/en/roller*',
    '/en/oyuncular*',
    '/en/listeler*',
    '/en/ayarlar*',
    '/en/oyuncu/*',
  ],
  alternateRefs: [
    { href: 'https://castiqq.app', hreflang: 'tr' },
    { href: 'https://castiqq.app/en', hreflang: 'en' },
  ],
}
