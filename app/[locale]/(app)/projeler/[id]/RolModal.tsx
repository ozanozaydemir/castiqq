'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, FileText, Upload, Trash2, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useOrgId } from '@/lib/org-context'
import type { ActionState } from '@/app/actions/projects'
import type { ProjectRole } from '@/types/database'
import { useTranslations } from 'next-intl'

interface RolModalProps {
  projectId: string
  editingRole?: ProjectRole | null
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  onClose: () => void
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('roles')
  return (
    <button
      type="submit"
      disabled={pending}
      className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('saving')}</> : t('save')}
    </button>
  )
}

function ScriptUpload({
  orgId,
  currentPath,
  onChange,
}: {
  orgId: string
  currentPath: string | null
  onChange: (path: string | null) => void
}) {
  const t = useTranslations('roles')
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleFile(file: File) {
    if (!file || file.type !== 'application/pdf') return
    setUploading(true)
    const path = `${orgId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const { error } = await supabase.storage.from('scripts').upload(path, file, { upsert: true })
    setUploading(false)
    if (!error) {
      setFileName(file.name)
      onChange(path)
    }
  }

  const hasScript = currentPath || fileName

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{t('scriptLabel')}</label>

      {hasScript ? (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="text-sm text-indigo-700 flex-1 truncate">
            {fileName ?? t('scriptCurrent')}
          </span>
          <button
            type="button"
            onClick={() => { onChange(null); setFileName(null) }}
            className="text-indigo-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            : <Upload className="w-4 h-4 flex-shrink-0" />}
          {uploading ? t('scriptUploading') : t('scriptUpload')}
          <span className="ml-auto text-xs text-gray-400">{t('scriptMaxSize')}</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

export function RolModal({ projectId, editingRole, action, onClose }: RolModalProps) {
  const [state, formAction] = useActionState(action, null)
  const [scriptPath, setScriptPath] = useState<string | null>(editingRole?.script_url ?? null)
  const orgId = useOrgId()
  const t = useTranslations('roles')
  const tc = useTranslations('common')

  const GENDERS = [
    { value: '', label: t('genderAny') },
    { value: 'erkek', label: t('gender.erkek') },
    { value: 'kadin', label: t('gender.kadin') },
  ]

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {editingRole ? t('editRole') : t('newRole')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <input type="hidden" name="project_id" value={projectId} />
          <input type="hidden" name="script_url" value={scriptPath ?? ''} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">
              {t('nameLabel')} <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={editingRole?.name ?? ''}
              placeholder={t('namePlaceholder')}
              className="sb-input"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('descriptionLabel')}</label>
            <textarea
              name="description"
              defaultValue={editingRole?.description ?? ''}
              rows={2}
              placeholder={t('descriptionPlaceholder')}
              className="sb-input resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('genderLabel')}</label>
              <select name="gender" defaultValue={editingRole?.gender ?? ''} className="sb-input">
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('ageMinLabel')}</label>
              <input type="number" name="age_min" defaultValue={editingRole?.age_min ?? ''} min={0} max={120} placeholder="18" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('ageMaxLabel')}</label>
              <input type="number" name="age_max" defaultValue={editingRole?.age_max ?? ''} min={0} max={120} placeholder="40" className="sb-input" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notesLabel')}</label>
            <textarea
              name="notes"
              defaultValue={editingRole?.notes ?? ''}
              rows={2}
              placeholder={t('notesPlaceholder')}
              className="sb-input resize-none"
            />
          </div>

          {/* Senaryo PDF */}
          <ScriptUpload
            orgId={orgId}
            currentPath={editingRole?.script_url ?? null}
            onChange={setScriptPath}
          />

          {scriptPath !== (editingRole?.script_url ?? null) && scriptPath === null && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {t('scriptWillRemove')}
            </p>
          )}

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  )
}
