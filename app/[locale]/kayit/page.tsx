'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Clapperboard, Loader2, Eye, EyeOff, Mail, ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations, useLocale } from 'next-intl'

type Step = 'form' | 'done'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const locale = useLocale()
  const [step, setStep] = useState<Step>('form')
  const [form, setForm] = useState({
    org_name: '',
    full_name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError(t('passwordMismatch'))
      return
    }
    if (form.password.length < 6) {
      setError(t('passwordTooShort'))
      return
    }

    setLoading(true)
    const supabase = createClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?locale=${locale}`,
        data: {
          full_name: form.full_name,
          org_name: form.org_name,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    setStep('done')
    setLoading(false)
  }

  /* ── Email sent screen ──────────────────────────────── */
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-indigo-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('verifyEmail')}</h1>

          <p className="text-gray-500 text-sm leading-relaxed mb-2">
            <span className="font-semibold text-gray-700">{form.email}</span>{' '}
            {t('verifyEmailSentTo')}
          </p>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            {t('verifyEmailHint')}
          </p>

          {/* Steps */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-8 text-left space-y-3">
            {[
              t('verifyStep1'),
              t('verifyStep2'),
              t('verifyStep3'),
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-indigo-500">{i + 1}</span>
                </div>
                <span className="text-sm text-gray-600">{text}</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-400 mb-6">
            {t('noEmailSeen')}
          </p>

          <Link href="/giris"
            className="inline-flex items-center gap-2 text-sm font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    )
  }

  /* ── Registration form ──────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('createAccount')}</h1>
          <p className="text-sm text-gray-500">{t('createAccountSubtitle')}</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">

          {/* Org name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t('orgNameLabel')}
            </label>
            <input
              required
              value={form.org_name}
              onChange={e => set('org_name', e.target.value)}
              placeholder={t('orgNamePlaceholder')}
              className="sb-input"
            />
          </div>

          {/* Full name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('fullNameLabel')}</label>
            <input
              required
              value={form.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder={t('fullNamePlaceholder')}
              className="sb-input"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('emailLabel')}</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder={t('registerEmailPlaceholder')}
              autoComplete="email"
              className="sb-input"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('passwordLabel')}</label>
            <div className="relative">
              <input
                required
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder={t('passwordMinPlaceholder')}
                minLength={6}
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

          {/* Confirm password */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('confirmPasswordLabel')}</label>
            <div className="relative">
              <input
                required
                type={showConfirm ? 'text' : 'password'}
                value={form.confirm}
                onChange={e => set('confirm', e.target.value)}
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

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20 mt-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('creatingAccount')}</>
            ) : t('registerCta')}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-5 leading-relaxed">
          {t('termsText')}{' '}
          <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-2">{t('termsLink')}</a>
          {' '}{t('andText')}{' '}
          <a href="#" className="text-gray-500 hover:text-gray-700 underline underline-offset-2">{t('privacyLink')}</a>
          {t('termsAccept')}
        </p>

        <p className="text-center text-sm text-gray-500 mt-5">
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
  )
}
