'use client'

import { useState } from 'react'
import { useRouter } from '@/i18n/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clapperboard, Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'

export default function ResetPasswordPage() {
  const router = useRouter()
  const t = useTranslations('auth')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

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
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center mb-6">
          <CheckCircle className="w-6 h-6 text-indigo-500" />
        </div>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900 mb-1.5">{t('newPassword')}</h1>
          <p className="text-sm text-gray-500">{t('newPasswordSubtitle')}</p>
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
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        © {new Date().getFullYear()} {t('copyright')}
      </p>
    </div>
  )
}
