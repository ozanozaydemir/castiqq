'use client'

import { useActionState, useEffect, useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { X, Loader2, FileText, Upload, Trash2, CheckCircle2 } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useOrgId } from '@/lib/org-context'
import type { ActionState } from '@/app/actions/projects'
import { addRoleScript, deleteRoleScript, updateRoleScriptLabel } from '@/app/actions/scripts'
import { MAX_SCRIPTS_PER_ROLE, MAX_SCRIPT_BYTES } from '@/lib/scripts'
import type { ProjectRole } from '@/types/database'
import { useTranslations } from 'next-intl'

const SKILLS = [
  'Şarkı', 'Dans', 'At Binme', 'Motosiklet', 'Yüzme',
  'Silah Kullanımı', 'Dövüş Koreografisi', 'Enstrüman', 'Spor',
  'Akrobasi', 'Jimnastik', 'Seslendirme', 'Komedi', 'Doğaçlama',
]

interface RolModalProps {
  projectId: string
  editingRole?: ProjectRole | null
  /** Düzenleme modunda rolün mevcut senaryoları. */
  existingScripts?: DraftScript[]
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

export type DraftScript = {
  /** Kayıtlı senaryolarda role_scripts.id; henüz bağlanmamışlarda null. */
  id: string | null
  storagePath: string
  originalName: string
  label: string
  fileSizeBytes: number | null
}

/**
 * Rolün senaryo havuzu.
 *
 * Yeni rol oluştururken henüz role_id yok, bu yüzden dosyalar Storage'a
 * yüklenip listede *bekletiliyor*; rol kaydedilince RolModal bunları
 * addRoleScript ile bağlıyor. Düzenleme modunda ise yükleme anında bağlanıyor.
 */
function ScriptManager({
  orgId, roleId, scripts, onChange,
}: {
  orgId: string
  roleId: string | null
  scripts: DraftScript[]
  onChange: (next: DraftScript[]) => void
}) {
  const t = useTranslations('roles')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleFiles(files: FileList) {
    setError(null)
    const room = MAX_SCRIPTS_PER_ROLE - scripts.length
    if (room <= 0) { setError(t('scriptLimit', { max: MAX_SCRIPTS_PER_ROLE })); return }

    const picked = Array.from(files).slice(0, room)
    setUploading(true)
    const added: DraftScript[] = []

    for (const file of picked) {
      if (file.type !== 'application/pdf') { setError(t('scriptOnlyPdf')); continue }
      if (file.size > MAX_SCRIPT_BYTES) { setError(t('scriptTooLarge', { name: file.name })); continue }

      const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('scripts').upload(path, file)
      if (upErr) { setError(upErr.message); continue }

      const draft: DraftScript = {
        id: null, storagePath: path, originalName: file.name,
        label: '', fileSizeBytes: file.size,
      }

      if (roleId) {
        const res = await addRoleScript(roleId, path, file.name, file.size, null)
        if (res.error) {
          // Kayıt olmadıysa yüklenen dosyayı geri al, Storage'da yetim kalmasın.
          await supabase.storage.from('scripts').remove([path])
          setError(res.error)
          continue
        }
        draft.id = res.scriptId ?? null
      }
      added.push(draft)
    }

    setUploading(false)
    if (added.length > 0) onChange([...scripts, ...added])
  }

  async function remove(index: number) {
    const target = scripts[index]
    if (target.id) {
      const res = await deleteRoleScript(target.id)
      if (res.error) { setError(res.error); return }
    } else {
      await supabase.storage.from('scripts').remove([target.storagePath])
    }
    onChange(scripts.filter((_, i) => i !== index))
  }

  function setLabel(index: number, label: string) {
    onChange(scripts.map((s, i) => (i === index ? { ...s, label } : s)))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">{t('scriptLabel')}</label>
        <span className="text-xs text-gray-400">{scripts.length}/{MAX_SCRIPTS_PER_ROLE}</span>
      </div>

      {scripts.length > 0 && (
        <div className="space-y-1.5">
          {scripts.map((s, i) => (
            <div key={s.storagePath} className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <input
                  value={s.label}
                  onChange={e => setLabel(i, e.target.value)}
                  onBlur={() => { if (s.id) void updateRoleScriptLabel(s.id, s.label) }}
                  placeholder={t('scriptLabelPlaceholder')}
                  className="w-full bg-transparent text-sm text-indigo-800 placeholder:text-indigo-300 focus:outline-none"
                  maxLength={60}
                />
                <p className="text-[11px] text-indigo-400 truncate">{s.originalName}</p>
              </div>
              <button
                type="button"
                onClick={() => void remove(i)}
                className="text-indigo-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {scripts.length < MAX_SCRIPTS_PER_ROLE && (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-gray-200 hover:border-indigo-300 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            : <Upload className="w-4 h-4 flex-shrink-0" />}
          {uploading ? t('scriptUploading') : scripts.length > 0 ? t('scriptAddMore') : t('scriptUpload')}
          <span className="ml-auto text-xs text-gray-400">{t('scriptMaxSize')}</span>
        </button>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) void handleFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}

export function RolModal({ projectId, editingRole, existingScripts, action, onClose }: RolModalProps) {
  const [state, formAction] = useActionState(action, null)
  const [scripts, setScripts] = useState<DraftScript[]>(existingScripts ?? [])
  const [requiredSkills, setRequiredSkills] = useState<string[]>(editingRole?.required_skills ?? [])
  const [attaching, setAttaching] = useState(false)
  const orgId = useOrgId()
  const t = useTranslations('roles')
  const tc = useTranslations('common')

  function toggleSkill(skill: string) {
    setRequiredSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])
  }

  const GENDERS = [
    { value: '', label: t('genderAny') },
    { value: 'erkek', label: t('gender.erkek') },
    { value: 'kadin', label: t('gender.kadin') },
  ]

  // existingScripts modal açıldıktan SONRA (async sorgu) geliyor; useState
  // başlangıç değeri bir kez okunduğu için senkronize etmezsek kayıtlı
  // senaryolar hiç görünmezdi. Kullanıcının bu arada eklediği bekleyen
  // yüklemeleri koruyoruz.
  useEffect(() => {
    if (!existingScripts || existingScripts.length === 0) return
    setScripts(prev => {
      const pending = prev.filter(s => s.id === null)
      return [...existingScripts, ...pending]
    })
  }, [existingScripts])

  // Yeni rol kaydedildikten sonra, oluşturma sırasında yüklenmiş ama henüz
  // bağlanmamış senaryoları role bağla. Bağlama bitmeden modalı kapatmıyoruz,
  // aksi halde kullanıcı senaryoları eklendi sanıp kaybederdi.
  useEffect(() => {
    if (!state?.success) return
    const pending = scripts.filter(s => s.id === null)
    if (!state.roleId || pending.length === 0) { onClose(); return }

    let cancelled = false
    setAttaching(true)
    ;(async () => {
      for (const s of pending) {
        await addRoleScript(state.roleId!, s.storagePath, s.originalName, s.fileSizeBytes, s.label || null)
      }
      if (!cancelled) { setAttaching(false); onClose() }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success, state?.roleId])

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

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('minHeightLabel')}</label>
              <input type="number" name="min_height_cm" defaultValue={editingRole?.min_height_cm ?? ''} min={100} max={250} placeholder="165" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('maxHeightLabel')}</label>
              <input type="number" name="max_height_cm" defaultValue={editingRole?.max_height_cm ?? ''} min={100} max={250} placeholder="185" className="sb-input" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">{t('cityLabel')}</label>
              <input name="city" defaultValue={editingRole?.city ?? ''} placeholder="İstanbul" className="sb-input" />
            </div>
          </div>

          <input type="hidden" name="required_skills_json" value={JSON.stringify(requiredSkills)} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{t('requiredSkillsLabel')}</label>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    requiredSkills.includes(skill)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {skill}
                </button>
              ))}
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

          {/* Senaryolar — rol başına havuz, davette seçilerek gönderilir */}
          <ScriptManager
            orgId={orgId}
            roleId={editingRole?.id ?? null}
            scripts={scripts}
            onChange={setScripts}
          />

          {!editingRole && scripts.length > 0 && (
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" /> {t('scriptAttachOnSave')}
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
            {attaching
              ? <span className="sb-btn-primary opacity-70 pointer-events-none">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('scriptAttaching')}
                </span>
              : <SubmitButton />}
          </div>
        </form>
      </div>
    </div>
  )
}
