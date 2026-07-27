'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, Upload, Trash2, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useOrgId } from '@/lib/org-context'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/documents'
import type { TalentDocument } from '@/types/database'

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {savingLabel}</> : label}
    </button>
  )
}

function DocumentUpload({
  orgId,
  currentPath,
  onChange,
  label,
  uploadLabel,
  uploadingLabel,
  currentLabel,
  hint,
}: {
  orgId: string
  currentPath: string | null
  onChange: (path: string | null) => void
  label: string
  uploadLabel: string
  uploadingLabel: string
  currentLabel: string
  hint: string
}) {
  const [uploading, setUploading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleFile(file: File) {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (!file || !allowed.includes(file.type)) return
    setUploading(true)
    const ext = file.name.split('.').pop() ?? 'pdf'
    const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('talent-documents').upload(path, file, { upsert: true })
    setUploading(false)
    if (!error) {
      setFileName(file.name)
      onChange(path)
    }
  }

  const hasFile = currentPath || fileName

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">{label}</label>

      {hasFile ? (
        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2.5">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span className="text-sm text-indigo-700 flex-1 truncate">{fileName ?? currentLabel}</span>
          <button type="button" onClick={() => { onChange(null); setFileName(null) }} className="text-indigo-400 hover:text-red-500 transition-colors">
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
          {uploading ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : <Upload className="w-4 h-4 flex-shrink-0" />}
          {uploading ? uploadingLabel : uploadLabel}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  )
}

export function DocumentModal({
  action,
  editingDocument,
  onClose,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  editingDocument?: TalentDocument | null
  onClose: () => void
}) {
  const [state, formAction] = useActionState(action, null)
  const [filePath, setFilePath] = useState<string | null>(editingDocument?.file_path ?? null)
  const orgId = useOrgId()
  const t = useTranslations('talent.documents')
  const tc = useTranslations('common')

  useEffect(() => {
    if (state?.success) onClose()
  }, [state?.success, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{editingDocument ? t('editTitle') : t('newTitle')}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form action={formAction} className="p-5 space-y-4">
          <input type="hidden" name="file_path" value={filePath ?? ''} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('documentType')}</label>
            <select name="document_type" defaultValue={editingDocument?.document_type ?? 'kimlik'} className="sb-input">
              <option value="kimlik">{t('types.kimlik')}</option>
              <option value="saglik_raporu">{t('types.saglik_raporu')}</option>
              <option value="calisma_izni">{t('types.calisma_izni')}</option>
              <option value="pasaport">{t('types.pasaport')}</option>
              <option value="vize">{t('types.vize')}</option>
              <option value="veli_izni">{t('types.veli_izni')}</option>
              <option value="diger">{t('types.diger')}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('expiryDate')}</label>
            <input type="date" name="expiry_date" defaultValue={editingDocument?.expiry_date ?? ''} className="sb-input" />
          </div>

          <DocumentUpload
            orgId={orgId}
            currentPath={editingDocument?.file_path ?? null}
            onChange={setFilePath}
            label={t('file')}
            uploadLabel={t('uploadFile')}
            uploadingLabel={t('uploading')}
            currentLabel={t('fileCurrent')}
            hint={t('fileHint')}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('notes')}</label>
            <textarea name="notes" defaultValue={editingDocument?.notes ?? ''} rows={2} placeholder={t('notesPlaceholder')} className="sb-input resize-none w-full" />
          </div>

          {state?.error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
              {state.error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="sb-btn-secondary">{tc('cancel')}</button>
            <SubmitButton label={editingDocument ? t('update') : t('create')} savingLabel={t('saving')} />
          </div>
        </form>
      </div>
    </div>
  )
}
