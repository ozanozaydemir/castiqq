'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { CookieConsent, type ConsentState } from './CookieConsent'

const PH_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
const PH_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  function handleConsent(consent: ConsentState) {
    if (consent !== 'accepted' || !PH_KEY) return
    if (initialized.current) return
    initialized.current = true

    posthog.init(PH_KEY, {
      api_host: PH_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: false, // privacy-first: no auto DOM capture
    })
  }

  return (
    <>
      {children}
      <CookieConsent onConsent={handleConsent} />
    </>
  )
}
