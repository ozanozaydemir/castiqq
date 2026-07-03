'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clapperboard, Loader2, Eye, EyeOff } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(t('wrongCredentials'))
      setLoading(false)
      return
    }

    if (data.user) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">

      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">CastFlow</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('welcomeBack')}</h1>
          <p className="text-sm text-gray-500">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Email */}
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
                value={password}
                onChange={e => setPassword(e.target.value)}
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
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('loggingIn')}</>
            ) : t('loginCta')}
          </button>
        </form>

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
  )
}
