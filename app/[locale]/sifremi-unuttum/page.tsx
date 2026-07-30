'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ArrowLeft, Send, Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { CastiqqLogo } from '@/components/brand/Logo'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/sifremi-sifirla`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  const bullets = [
    t('loginPanelBullet1'),
    t('loginPanelBullet2'),
    t('loginPanelBullet3'),
  ]

  /* ── Success ── */
  if (done) {
    return (
      <div className="min-h-screen flex">
        <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-violet-500 flex-col items-start justify-between p-12">
          <Link href="/"><CastiqqLogo tone="onBrand" size={28} /></Link>
          <div>
            <h2 className="text-3xl font-black text-white leading-tight mb-6">{t('loginPanelTitle')}</h2>
            <ul className="space-y-4">
              {bullets.map(b => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-white/85 text-sm">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-white/40 text-xs">{t('loginPanelBadge')}</p>
        </div>

        <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
          <Link href="/" className="mb-8 lg:hidden"><CastiqqLogo tone="light" size={28} /></Link>
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-50 border border-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Send className="w-7 h-7 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('emailSent')}</h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              <span className="font-semibold text-gray-700">{email}</span>{' '}
              {t('emailSentSubtitle')}
            </p>
            <Link href="/giris"
              className="inline-flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              {t('backToLogin')}
            </Link>
          </div>
          <p className="text-center text-xs text-gray-400 mt-8">© {new Date().getFullYear()} {t('copyright')}</p>
        </div>
      </div>
    )
  }

  /* ── Form ── */
  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand panel ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-violet-500 flex-col items-start justify-between p-12">
        <Link href="/"><CastiqqLogo tone="onBrand" size={28} /></Link>
        <div>
          <h2 className="text-3xl font-black text-white leading-tight mb-6">{t('loginPanelTitle')}</h2>
          <ul className="space-y-4">
            {bullets.map(b => (
              <li key={b} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/85 text-sm">{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/40 text-xs">{t('loginPanelBadge')}</p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="mb-8 lg:hidden"><CastiqqLogo tone="light" size={28} /></Link>

        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <Link href="/giris"
            className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('goBack')}
          </Link>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('forgotPasswordTitle')}</h1>
            <p className="text-sm text-gray-500">{t('forgotPasswordSubtitle')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('emailLabel')}</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                className="sb-input"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {t('sending')}</>
              ) : t('sendResetLink')}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('hasAccount')}{' '}
            <Link href="/giris" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
              {t('loginInstead')}
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} {t('copyright')}
        </p>
      </div>
    </div>
  )
}
