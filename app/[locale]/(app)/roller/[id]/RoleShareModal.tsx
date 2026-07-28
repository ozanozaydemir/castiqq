'use client'

import { useActionState, useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Share2, Loader2, CheckCircle2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { createRoleShare, lookupAgencyBySlug, listOrgPartners } from '@/app/actions/roleShares'

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()
  const t = useTranslations('roles.share')
  return (
    <button type="submit" disabled={disabled || pending} className="sb-btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('sending')}</> : <><Share2 className="w-4 h-4" /> {t('submitCta')}</>}
    </button>
  )
}

export function RoleShareModal({ projectRoleId, hasScript, onClose }: {
  projectRoleId: string; hasScript: boolean; onClose: () => void
}) {
  const t = useTranslations('roles.share')
  const [partners, setPartners] = useState<{ id: string; name: string }[]>([])
  const [slug, setSlug] = useState('')
  const [resolved, setResolved] = useState<{ id: string; name: string } | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookingUp, setLookingUp] = useState(false)
  const [state, action] = useActionState(createRoleShare.bind(null, projectRoleId), null)

  useEffect(() => { listOrgPartners().then(setPartners) }, [])
  useEffect(() => { if (state?.success) onClose() }, [state, onClose])

  async function handleLookup() {
    setLookingUp(true)
    setLookupError(null)
    const result = await lookupAgencyBySlug(slug)
    setLookingUp(false)
    if ('error' in result) { setLookupError(result.error); setResolved(null) }
    else setResolved(result)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('modalTitle')}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>

        <form action={action} className="p-6 space-y-4">
          {partners.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">{t('quickSelectLabel')}</label>
              <select
                className="sb-input"
                defaultValue=""
                onChange={e => {
                  const p = partners.find(x => x.id === e.target.value)
                  if (p) { setResolved(p); setSlug('') }
                }}
              >
                <option value="">{t('quickSelectPlaceholder')}</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('slugLabel')}</label>
            <div className="flex gap-2">
              <input
                value={slug}
                onChange={e => { setSlug(e.target.value); setResolved(null) }}
                placeholder={t('slugPlaceholder')}
                className="sb-input flex-1"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={!slug.trim() || lookingUp}
                className="sb-btn-secondary whitespace-nowrap disabled:opacity-50"
              >
                {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : t('findBtn')}
              </button>
            </div>
            {lookupError && <p className="text-xs text-red-500">{lookupError}</p>}
            {resolved && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> {resolved.name}
              </p>
            )}
          </div>

          <input type="hidden" name="target_organization_id" value={resolved?.id ?? ''} />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('messageLabel')}</label>
            <textarea name="message" rows={3} placeholder={t('messagePlaceholder')} className="sb-input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">{t('deadlineLabel')}</label>
              <input type="date" name="submission_deadline" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-600">{t('expiresLabel')}</label>
              <select name="expires_in_days" defaultValue="30" className="sb-input">
                <option value="7">{t('expires7')}</option>
                <option value="14">{t('expires14')}</option>
                <option value="30">{t('expires30')}</option>
              </select>
            </div>
          </div>

          {hasScript && (
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" name="include_script" className="accent-indigo-500 w-4 h-4" />
              <span className="text-sm text-gray-700">{t('includeScript')}</span>
            </label>
          )}

          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}

          <SubmitBtn disabled={!resolved} />
        </form>
      </div>
    </div>
  )
}
