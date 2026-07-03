'use client'

import { useState, useTransition } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useTranslations } from 'next-intl'
import { Lock, Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'

export function SifreForm() {
  const t = useTranslations('settings')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setResult({ error: t('form.passwordMismatch') }); return }
    if (password.length < 6)  { setResult({ error: t('form.passwordTooShort') }); return }
    setResult(null)
    startTransition(async () => {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) { setResult({ error: error.message }); return }
      setResult({ success: true })
      setPassword('')
      setConfirm('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <input
          type={showPwd ? 'text' : 'password'}
          placeholder={t('form.newPassword')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="sb-input pr-10"
          required
          minLength={6}
        />
        <button
          type="button"
          onClick={() => setShowPwd(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <input
        type={showPwd ? 'text' : 'password'}
        placeholder={t('form.confirmPassword')}
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        className="sb-input"
        required
      />
      {result?.error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{result.error}</p>
      )}
      {result?.success && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {t('form.passwordUpdated')}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || !password || !confirm}
        className="sb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('form.updating')}</>
          : <><Lock className="w-4 h-4" /> {t('form.updatePassword')}</>}
      </button>
    </form>
  )
}
