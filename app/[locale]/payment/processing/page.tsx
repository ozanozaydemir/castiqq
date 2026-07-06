'use client'

import { useEffect, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { Clapperboard, CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentProcessingPage() {
  const router = useRouter()
  const locale = useLocale()
  const isTr = locale === 'tr'
  const [countdown, setCountdown] = useState(6)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval)
          setReady(true)
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (ready) router.replace('/dashboard')
  }, [ready, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </div>

      <div className="w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isTr ? 'Ödeme alındı!' : 'Payment received!'}
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          {isTr
            ? 'Hesabınız aktifleştiriliyor. Birkaç saniye içinde yönlendirileceksiniz.'
            : 'Your account is being activated. You\'ll be redirected in a moment.'}
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          {isTr
            ? `Dashboard'a yönlendiriliyor... (${countdown}s)`
            : `Redirecting to dashboard... (${countdown}s)`}
        </div>
      </div>
    </div>
  )
}
