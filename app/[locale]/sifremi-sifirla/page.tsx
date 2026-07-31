'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clapperboard, Loader2, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { resolveHomePath } from '@/lib/home-path'

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // null = session hâlâ kontrol ediliyor
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  // Hash client oluşturulmadan ÖNCE okunmalı: detectSessionInUrl session'ı
  // kurduktan sonra fragment'ı history.replaceState ile siliyor. useEffect'e
  // bıraksaydık bu silme önce olabilir ve davet metni kaçardı.
  const [isInvite] = useState(
    () => typeof window !== 'undefined' && window.location.hash.includes('type=invite')
  )

  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null)
  if (!supabaseRef.current) supabaseRef.current = createClient()
  const supabase = supabaseRef.current

  useEffect(() => {
    // Davet linki (implicit flow) token'ları `#access_token=...` fragment'ında
    // taşır — sunucu bunu göremez, session'ı browser client kurar. Bu işlem
    // asenkron olduğu için form hazır olmadan submit edilmesin diye bekliyoruz.
    let active = true
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: unknown) => {
        if (active && session) setHasSession(true)
      }
    )

    // getSession() client initialization'ını (fragment ayrıştırma dahil) bekler.
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: unknown } }) => {
      // Listener zaten session bulduysa geri alma.
      if (active) setHasSession(prev => prev === true ? true : !!session)
    })

    return () => { active = false; subscription.unsubscribe() }
  }, [supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }
    if (password.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const homePath = user ? await resolveHomePath(supabase, user.id) : '/dashboard'
    router.push(homePath)
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </Link>
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        {children}
      </div>
      <p className="text-center text-xs text-gray-400 mt-6">
        © {new Date().getFullYear()} {t('copyright')}
      </p>
    </div>
  )

  if (hasSession === null) {
    return shell(
      <div className="flex items-center gap-3 text-sm text-gray-500 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        {t('linkChecking')}
      </div>
    )
  }

  if (hasSession === false) {
    return shell(
      <>
        <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mb-6">
          <AlertCircle className="w-6 h-6 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('linkInvalid')}</h1>
        <p className="text-sm text-gray-500 mb-6">{t('linkInvalidDesc')}</p>
        <Link
          href="/giris"
          className="w-full flex items-center justify-center py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
        >
          {t('backToLogin')}
        </Link>
      </>
    )
  }

  return shell(
    <>
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-6">
          <CheckCircle className="w-6 h-6 text-indigo-500" />
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">
            {isInvite ? t('inviteTitle') : t('newPassword')}
          </h1>
          <p className="text-sm text-gray-500">
            {isInvite ? t('inviteSubtitle') : t('newPasswordSubtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('newPasswordLabel')}</label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder={t('passwordMinPlaceholder')}
                autoComplete="new-password"
                className="sb-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('confirmNewPasswordLabel')}</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                placeholder={t('confirmPasswordPlaceholder')}
                autoComplete="new-password"
                className="sb-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Strength hint */}
          {password.length > 0 && (
            <div className="flex items-center gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  password.length >= (i + 1) * 3
                    ? password.length >= 10 ? 'bg-green-400' : 'bg-indigo-400'
                    : 'bg-gray-100'
                }`} />
              ))}
              <span className="text-xs text-gray-400 w-14 text-right">
                {password.length < 6 ? t('strengthWeak') : password.length < 10 ? t('strengthMedium') : t('strengthStrong')}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
            ) : t('savePassword')}
          </button>
        </form>
    </>
  )
}
