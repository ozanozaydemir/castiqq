'use client'

import { useState, useTransition } from 'react'
import { Globe, GlobeLock, Check, Copy } from 'lucide-react'
import { toggleRolePublic } from '@/app/actions/projects'
import { useTranslations } from 'next-intl'

interface Props {
  roleId: string
  initialIsPublic: boolean
  publicToken: string
  siteUrl: string
}

export function RolPublicToggle({ roleId, initialIsPublic, publicToken, siteUrl }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)
  const t = useTranslations('roles')

  const applyUrl = `${siteUrl}/basvur/${publicToken}`

  function toggle() {
    const next = !isPublic
    setIsPublic(next)
    startTransition(async () => {
      await toggleRolePublic(roleId, next)
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(applyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-3 flex items-center gap-3 flex-wrap">
      <button
        onClick={toggle}
        disabled={isPending}
        className={`inline-flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
          isPublic
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
        }`}
      >
        {isPublic
          ? <Globe className="w-3.5 h-3.5" />
          : <GlobeLock className="w-3.5 h-3.5" />}
        {isPublic ? t('publicOn') : t('publicOff')}
      </button>

      {isPublic && (
        <div className="flex items-center gap-2 min-w-0">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 truncate max-w-[240px]">
            {applyUrl}
          </code>
          <button
            onClick={copyLink}
            className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>
      )}
    </div>
  )
}
