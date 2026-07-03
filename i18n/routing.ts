import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  // Turkish users keep their existing URLs (/dashboard, /roller, etc.)
  // English users get /en/dashboard, /en/roller, etc.
  localePrefix: 'as-needed',
})
