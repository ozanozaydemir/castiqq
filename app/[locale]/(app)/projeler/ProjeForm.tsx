'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, ArrowRight } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import type { ActionState } from '@/app/actions/projects'
import type { Project } from '@/types/database'
import { useTranslations } from 'next-intl'

interface ProjeFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  initialData?: Project
  cancelHref?: string
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus()
  const t = useTranslations('projects')
  return (
    <button
      type="submit"
      disabled={pending}
      className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> {t('saving')}</>
      ) : (
        <>{label} <ArrowRight className="w-4 h-4" /></>
      )}
    </button>
  )
}

export function ProjeForm({ action, initialData, cancelHref = '/projeler' }: ProjeFormProps) {
  const [state, formAction] = useActionState(action, null)
  const t = useTranslations('projects')
  const tc = useTranslations('common')

  const PROJECT_TYPES = [
    { value: 'film', label: t('typeFilm') },
    { value: 'dizi', label: t('typeDizi') },
    { value: 'reklam', label: t('typeReklam') },
    { value: 'tiyatro', label: t('typeTiyatro') },
    { value: 'diger', label: t('typeDiger') },
  ]

  return (
    <form action={formAction} className="space-y-8">

      {/* Temel Bilgiler */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('sectionBasic')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t('nameLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              required
              defaultValue={initialData?.title ?? ''}
              placeholder={t('namePlaceholder')}
              className="sb-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t('typeLabel')} <span className="text-red-400">*</span>
            </label>
            <select name="type" required defaultValue={initialData?.type ?? ''} className="sb-input">
              <option value="" disabled>{t('typeSelect')}</option>
              {PROJECT_TYPES.map(pt => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('platformLabel')}</label>
            <input
              name="platform"
              defaultValue={initialData?.platform ?? ''}
              placeholder={t('platformPlaceholder')}
              className="sb-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('directorLabel')}</label>
            <input
              name="director"
              defaultValue={initialData?.director ?? ''}
              placeholder={t('directorPlaceholder')}
              className="sb-input"
            />
          </div>
        </div>
      </div>

      {/* Tarihler */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('sectionDates')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('deadlineLabel')}</label>
            <input
              type="date"
              name="deadline"
              defaultValue={initialData?.deadline ?? ''}
              className="sb-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('shootingStartLabel')}</label>
            <input
              type="date"
              name="shooting_start"
              defaultValue={initialData?.shooting_start ?? ''}
              className="sb-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('shootingEndLabel')}</label>
            <input
              type="date"
              name="shooting_end"
              defaultValue={initialData?.shooting_end ?? ''}
              className="sb-input"
            />
          </div>
        </div>
      </div>

      {/* Lokasyon & Detaylar */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">{t('sectionLocation')}</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('locationLabel')}</label>
            <input
              name="shooting_location"
              defaultValue={initialData?.shooting_location ?? ''}
              placeholder={t('locationPlaceholder')}
              className="sb-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
            <textarea
              name="description"
              defaultValue={initialData?.description ?? ''}
              rows={4}
              placeholder={t('descriptionPlaceholder')}
              className="sb-input resize-none"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {state?.error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
          {state.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <Link href={cancelHref} className="sb-btn-secondary">
          {tc('cancel')}
        </Link>
        <SubmitButton label={initialData ? t('update') : t('create')} />
      </div>
    </form>
  )
}
