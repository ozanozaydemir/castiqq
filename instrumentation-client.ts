import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  debug: false,
  // Local dev hatalarının Sentry'ye hiç gitmemesi için — alert gürültüsünü
  // filtrelemek yerine kaynağında kesiyoruz.
  enabled: process.env.NODE_ENV === 'production',
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
