'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { login } from '@/app/actions/auth'
import { GoogleButton } from '@/components/auth/GoogleButton'
import { CastiqqLogo } from '@/components/brand/Logo'

function SubmitBtn({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20 mt-2"
    >
      {pending ? (<><Loader2 className="w-4 h-4 animate-spin" /> {loadingLabel}</>) : label}
    </button>
  )
}

export default function LoginPage() {
  const t = useTranslations('auth')
  const [state, action] = useActionState(login, null)
  const [showPass, setShowPass] = useState(false)

  const bullets = [
    t('loginPanelBullet1'),
    t('loginPanelBullet2'),
    t('loginPanelBullet3'),
  ]

  return (
    <div className="min-h-screen flex">

      {/* ── Left: Brand panel (desktop only) ── */}
      <div className="hidden lg:flex w-[440px] flex-shrink-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-violet-500 flex-col items-start justify-between p-12">
        <Link href="/">
          <CastiqqLogo tone="onBrand" size={28} />
        </Link>

        <div>
          <h2 className="text-3xl font-black text-white leading-tight mb-6">
            {t('loginPanelTitle')}
          </h2>
          <ul className="space-y-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/85 text-sm">{bullet}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-xs">{t('loginPanelBadge')}</p>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 bg-gray-50 flex flex-col items-center justify-center px-6 py-12">

        {/* Mobile logo */}
        <Link href="/" className="mb-8 lg:hidden">
          <CastiqqLogo tone="light" size={28} />
        </Link>

        <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('welcomeBack')}</h1>
            <p className="text-sm text-gray-500">{t('loginSubtitle')}</p>
          </div>

          <form action={action} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('emailLabel')}</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder={t('emailPlaceholder')}
                className="sb-input"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">{t('passwordLabel')}</label>
                <Link href="/sifremi-unuttum"
                  className="text-xs font-medium text-indigo-500 hover:text-indigo-600 transition-colors">
                  {t('forgotPasswordLink')}
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder={t('passwordPlaceholder')}
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

            {/* Error */}
            {state?.error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                {state.error}
              </div>
            )}

            <SubmitBtn label={t('loginCta')} loadingLabel={t('loggingIn')} />
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">{t('orDivider')}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <GoogleButton />

          <p className="text-center text-sm text-gray-500 mt-6">
            {t('noAccount')}{' '}
            <Link href="/kayit" className="font-semibold text-indigo-500 hover:text-indigo-600 transition-colors">
              {t('freeStart')}
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
