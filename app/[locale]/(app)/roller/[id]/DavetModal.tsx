'use client'

import { useState, useTransition } from 'react'
import { X, Search, UserPlus, MessageCircle, Copy, Check, Loader2 } from 'lucide-react'
import { createAudition } from '@/app/actions/auditions'
import { useTranslations } from 'next-intl'

type Talent = { id: string; full_name: string; phone: string | null; email: string | null }

interface DavetModalProps {
  roleId: string
  roleName: string
  talents: Talent[]
  siteUrl: string
  onClose: () => void
}

export function DavetModal({ roleId, roleName, talents, siteUrl, onClose }: DavetModalProps) {
  const t = useTranslations('auditions')
  const tc = useTranslations('common')
  const [tab, setTab] = useState<'havuz' | 'manuel'>('havuz')
  const [search, setSearch] = useState('')
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [invitePhone, setInvitePhone] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = talents.filter(tl =>
    tl.full_name.toLowerCase().includes(search.toLowerCase())
  )

  const inviteUrl = token ? `${siteUrl}/oyuncu/${token}` : null

  const phone = tab === 'havuz'
    ? (invitePhone || selectedTalent?.phone || '')
    : (manualPhone || '')

  const waLink = inviteUrl && phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
        `Merhaba! "${roleName}" rolü için casting davetiniz hazır. Lütfen aşağıdaki bağlantıya tıklayarak videonu yükle:\n${inviteUrl}`
      )}`
    : null

  function handleSubmit() {
    setError(null)
    const talentId   = tab === 'havuz' ? (selectedTalent?.id ?? null) : null
    const talentName = tab === 'havuz' ? (selectedTalent?.full_name ?? '') : manualName
    const talentEmail = tab === 'havuz' ? (selectedTalent?.email ?? null) : manualEmail || null
    const ph = tab === 'havuz' ? invitePhone || null : manualPhone || null

    if (!talentName.trim()) { setError('İsim zorunludur.'); return }

    startTransition(async () => {
      const result = await createAudition(roleId, talentId, talentName, talentEmail, ph)
      if (result?.error) { setError(result.error); return }
      if (result?.token) setToken(result.token)
    })
  }

  function copyLink() {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (token) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-900">{t('inviteReady')}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
          </div>

          <p className="text-sm text-gray-500 mb-4">
            {t('inviteReadyHint')}
          </p>

          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
            <span className="text-xs text-gray-600 flex-1 truncate">{inviteUrl}</span>
            <button onClick={copyLink} className="flex-shrink-0 text-indigo-500 hover:text-indigo-700">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors mb-3"
            >
              <MessageCircle className="w-4 h-4" />
              {t('whatsappSend')}
            </a>
          )}

          <button onClick={onClose} className="w-full sb-btn-secondary text-sm">{tc('close')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('inviteTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('havuz')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'havuz' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabFromPool')}
          </button>
          <button
            onClick={() => setTab('manuel')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'manuel' ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('tabManual')}
          </button>
        </div>

        <div className="p-6 space-y-4">
          {tab === 'havuz' ? (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="sb-input pl-9"
                  placeholder={t('searchTalent')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1 -mx-1">
                {filtered.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">{t('noTalentFound')}</p>
                )}
                {filtered.map(tl => (
                  <button
                    key={tl.id}
                    onClick={() => setSelectedTalent(tl)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-between ${
                      selectedTalent?.id === tl.id
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span>{tl.full_name}</span>
                    {tl.phone && <span className="text-xs text-gray-400">{tl.phone}</span>}
                  </button>
                ))}
              </div>

              {selectedTalent && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-600">
                    {t('whatsappNumber')} {selectedTalent.phone ? `(${selectedTalent.phone})` : ''}
                  </label>
                  <input
                    className="sb-input"
                    placeholder={selectedTalent.phone ?? t('whatsappPlaceholder')}
                    value={invitePhone}
                    onChange={e => setInvitePhone(e.target.value)}
                  />
                  <p className="text-xs text-gray-400">{t('whatsappNumberHint')}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t('manualName')}</label>
                <input className="sb-input" placeholder={t('manualNamePlaceholder')} value={manualName} onChange={e => setManualName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t('manualPhone')}</label>
                <input className="sb-input" placeholder={t('whatsappPlaceholder')} value={manualPhone} onChange={e => setManualPhone(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-600">{t('manualEmail')}</label>
                <input className="sb-input" type="email" placeholder="oyuncu@example.com" value={manualEmail} onChange={e => setManualEmail(e.target.value)} />
              </div>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={isPending || (tab === 'havuz' && !selectedTalent)}
            className="sb-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {t('creating')}</>
            ) : (
              <><UserPlus className="w-4 h-4" /> {t('inviteCreate')}</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
