'use client'

import { useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { submitPublicApplication } from '@/app/actions/public-apply'

interface ApplyFormProps {
  rolePublicToken: string
  roleName: string
  projectTitle: string
  siteUrl: string
  locale: string
}

export function ApplyForm({ rolePublicToken, siteUrl, locale }: ApplyFormProps) {
  const t = useTranslations('applyForm')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadToken, setUploadToken] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError(t('name') + ' zorunludur.')
      return
    }

    startTransition(async () => {
      const result = await submitPublicApplication(rolePublicToken, {
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
      })
      if ('error' in result) {
        setError(result.error)
        return
      }
      setUploadToken(result.uploadToken)
    })
  }

  if (uploadToken) {
    const uploadUrl = `${siteUrl}/oyuncu/${uploadToken}`
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">{t('success')}</h2>
        <p className="text-sm text-gray-500">{t('successDesc')}</p>
        <a
          href={uploadUrl}
          className="inline-block bg-indigo-600 text-white text-sm font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
        >
          {t('uploadVideo')}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('name')} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder={t('namePlaceholder')}
          required
          className="sb-input w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="sb-input w-full"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('phone')}</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          className="sb-input w-full"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full sb-btn-primary py-3 disabled:opacity-60"
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
      <p className="text-xs text-gray-400 text-center">
        {t('gdprNote')}{' '}
        <a
          href={locale === 'en' ? '/en/gizlilik' : '/gizlilik'}
          className="underline hover:text-gray-600"
        >
          {t('privacyPolicy')}
        </a>
      </p>
    </form>
  )
}
