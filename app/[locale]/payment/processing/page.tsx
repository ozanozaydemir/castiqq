'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { Clapperboard, CheckCircle, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const POLL_INTERVAL_MS = 2000
const MAX_WAIT_MS = 45_000

type Status = 'waiting' | 'ready' | 'timeout'

async function subscriptionIsActive(): Promise<boolean> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return false

  const { data: org } = await supabase
    .from('organizations')
    .select('polar_subscription_id')
    .eq('id', profile.organization_id)
    .single()

  return !!org?.polar_subscription_id
}

export default function PaymentProcessingPage() {
  const router = useRouter()
  const locale = useLocale()
  const isTr = locale === 'tr'
  const [status, setStatus] = useState<Status>('waiting')
  const startedAtRef = useRef(Date.now())
  const cancelledRef = useRef(false)

  const poll = useCallback(async () => {
    if (cancelledRef.current) return

    const active = await subscriptionIsActive()
    if (cancelledRef.current) return

    if (active) {
      setStatus('ready')
      return
    }

    if (Date.now() - startedAtRef.current >= MAX_WAIT_MS) {
      setStatus('timeout')
      return
    }

    setTimeout(poll, POLL_INTERVAL_MS)
  }, [])

  useEffect(() => {
    cancelledRef.current = false
    poll()
    return () => { cancelledRef.current = true }
  }, [poll])

  useEffect(() => {
    if (status !== 'ready') return
    const t = setTimeout(() => router.replace('/dashboard'), 600)
    return () => clearTimeout(t)
  }, [status, router])

  function retry() {
    startedAtRef.current = Date.now()
    setStatus('waiting')
    cancelledRef.current = false
    poll()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </div>

      <div className="w-full max-w-sm text-center">
        {status !== 'timeout' ? (
          <>
            <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isTr ? 'Ödeme alındı!' : 'Payment received!'}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {isTr
                ? 'Hesabınız aktifleştiriliyor. Bu birkaç saniye sürebilir.'
                : 'Your account is being activated. This may take a few seconds.'}
            </p>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {status === 'ready'
                ? (isTr ? "Dashboard'a yönlendiriliyor..." : 'Redirecting to dashboard...')
                : (isTr ? 'Aktifleştirme bekleniyor...' : 'Waiting for activation...')}
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isTr ? 'Bu normalden uzun sürüyor' : 'This is taking longer than usual'}
            </h1>
            <p className="text-sm text-gray-500 mb-8">
              {isTr
                ? 'Ödemeniz alındı ancak hesabınızın aktifleşmesi bekleniyor. Bir sorun yoksa birkaç dakika içinde e-posta ile bilgilendirileceksiniz.'
                : "Your payment was received, but your account is still activating. If there's no issue, you'll get an email confirmation within a few minutes."}
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={retry}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
              >
                {isTr ? 'Tekrar Kontrol Et' : 'Check Again'}
              </button>
              <a
                href="mailto:support@castiqq.app"
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                {isTr ? 'Sorun devam ediyorsa: support@castiqq.app' : "Still stuck? support@castiqq.app"}
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
