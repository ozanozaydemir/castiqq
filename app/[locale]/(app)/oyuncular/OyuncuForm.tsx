'use client'

import { useState, useCallback, useRef } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, ArrowRight, Plus, X, GripVertical, ImagePlus } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useOrgId } from '@/lib/org-context'
import { useTranslations } from 'next-intl'
import type { ActionState } from '@/app/actions/talent'
import type { TalentWithRelations } from '@/types/database'

// ── Option lists ────────────────────────────────────────────────

const SKILLS = [
  'Şarkı', 'Dans', 'At Binme', 'Motosiklet', 'Yüzme',
  'Silah Kullanımı', 'Dövüş Koreografisi', 'Enstrüman', 'Spor',
  'Akrobasi', 'Jimnastik', 'Seslendirme', 'Komedi', 'Doğaçlama',
]
const LICENSES = ['Ehliyet', 'Pasaport', 'Vize']
const LANG_LEVELS = [
  { value: 'native', label: 'Ana dil' },
  { value: 'C2', label: 'C2' }, { value: 'C1', label: 'C1' },
  { value: 'B2', label: 'B2' }, { value: 'B1', label: 'B1' },
  { value: 'A2', label: 'A2' }, { value: 'A1', label: 'A1' },
]
const ROLE_TYPES = [
  { value: 'lead', label: 'Başrol' }, { value: 'supporting', label: 'Yardımcı Rol' },
  { value: 'guest', label: 'Yan Rol' }, { value: 'cameo', label: 'Konuk' },
  { value: 'ad', label: 'Reklam' }, { value: 'extra', label: 'Figürasyon' },
  { value: 'voiceover', label: 'Seslendirme' },
]
const PROD_TYPES = [
  { value: 'film', label: 'Film' }, { value: 'dizi', label: 'Dizi' },
  { value: 'reklam', label: 'Reklam' }, { value: 'tiyatro', label: 'Tiyatro' },
  { value: 'diger', label: 'Diğer' },
]
const HAIR_COLORS = ['Siyah', 'Kahverengi', 'Sarı', 'Kızıl', 'Beyaz/Gri', 'Diğer']
const HAIR_LENGTHS = ['Kel/Traşlı', 'Kısa', 'Orta', 'Uzun', 'Çok Uzun']
const EYE_COLORS = ['Kahverengi', 'Siyah', 'Yeşil', 'Mavi', 'Ela', 'Gri']

// ── Sub-types ────────────────────────────────────────────────────

type LangRow = { language: string; level: string; accents: string }
type ExpRow = { project_name: string; year: string; role_name: string; role_type: string; production_type: string; director: string; production_company: string }
type EduRow = { school: string; program: string; year: string }

// ── Helpers ──────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
      {children}
    </h3>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function SubmitButton({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending}
      className="sb-btn-primary disabled:opacity-60 disabled:cursor-not-allowed">
      {pending
        ? <><Loader2 className="w-4 h-4 animate-spin" /> {savingLabel}</>
        : <>{label} <ArrowRight className="w-4 h-4" /></>}
    </button>
  )
}

function PhotosUpload({ orgId, initial = [], coverLabel, photoHint }: { orgId: string; initial?: string[]; coverLabel: string; photoHint: string }) {
  const [photos, setPhotos] = useState<string[]>(initial)
  const [uploading, setUploading] = useState<number | null>(null)
  const [activeSlot, setActiveSlot] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)
  const MAX = 4

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleFile(file: File, slot: number) {
    if (!file.type.startsWith('image/')) return
    setUploading(slot)
    const ext = file.name.split('.').pop() ?? 'jpg'
    const path = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage
      .from('talent-avatars')
      .upload(path, file, { upsert: true })
    setUploading(null)
    if (error) return
    const { data } = supabase.storage.from('talent-avatars').getPublicUrl(path)
    setPhotos(prev => {
      const next = [...prev]
      next[slot] = data.publicUrl
      return next.filter(Boolean)
    })
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
  }

  const slots = Array.from({ length: MAX }, (_, i) => photos[i] ?? null)

  return (
    <div className="space-y-2">
      <input type="hidden" name="photos_json" value={JSON.stringify(photos)} />
      <div className="grid grid-cols-4 gap-2">
        {slots.map((url, i) => (
          <div key={i} className="relative aspect-[2/3] rounded-xl overflow-hidden border border-gray-100">
            {url ? (
              <>
                <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-semibold text-white/80 bg-black/40 px-1.5 py-0.5 rounded-md">
                    {coverLabel}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={uploading !== null}
                onClick={() => { setActiveSlot(i); fileRef.current?.click() }}
                className="absolute inset-0 w-full h-full bg-gray-50 hover:bg-indigo-50/40 border-2 border-dashed border-gray-200 hover:border-indigo-300 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50"
              >
                {uploading === i
                  ? <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                  : <ImagePlus className="w-4 h-4 text-gray-300" />}
                {i === 0 && uploading !== i && (
                  <span className="text-[9px] text-gray-400 font-medium">{coverLabel}</span>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f, activeSlot)
          e.target.value = ''
        }}
      />
      <p className="text-xs text-gray-400">{photoHint}</p>
    </div>
  )
}

// ── Props ────────────────────────────────────────────────────────

interface OyuncuFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>
  initialData?: TalentWithRelations
  cancelHref?: string
}

// ── Main Component ───────────────────────────────────────────────

export function OyuncuForm({ action, initialData, cancelHref = '/oyuncular' }: OyuncuFormProps) {
  const [state, formAction] = useActionState(action, null)
  const orgId = useOrgId()
  const tf = useTranslations('talent.form')
  const ta = useTranslations('talent.availability')

  // Checkbox state
  const [skills, setSkills] = useState<string[]>(initialData?.skills ?? [])
  const [licenses, setLicenses] = useState<string[]>(initialData?.licenses ?? [])

  // Dynamic rows
  const [languages, setLanguages] = useState<LangRow[]>(
    initialData?.languages?.map(l => ({ language: l.language, level: l.level, accents: l.accents ?? '' })) ?? []
  )
  const [experiences, setExperiences] = useState<ExpRow[]>(
    initialData?.experiences?.map(e => ({
      project_name: e.project_name, year: String(e.year ?? ''),
      role_name: e.role_name ?? '', role_type: e.role_type ?? '',
      production_type: e.production_type ?? '', director: e.director ?? '',
      production_company: e.production_company ?? '',
    })) ?? []
  )
  const [education, setEducation] = useState<EduRow[]>(
    initialData?.education?.map(e => ({ school: e.school, program: e.program ?? '', year: String(e.year ?? '') })) ?? []
  )

  // Toggle helpers
  const toggleSkill = useCallback((s: string) => {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }, [])
  const toggleLicense = useCallback((l: string) => {
    setLicenses(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l])
  }, [])

  // Lang helpers
  const addLang = () => setLanguages(prev => [...prev, { language: '', level: 'native', accents: '' }])
  const removeLang = (i: number) => setLanguages(prev => prev.filter((_, idx) => idx !== i))
  const updateLang = (i: number, field: keyof LangRow, value: string) =>
    setLanguages(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  // Exp helpers
  const addExp = () => {
    if (experiences.length >= 10) return
    setExperiences(prev => [...prev, { project_name: '', year: '', role_name: '', role_type: '', production_type: '', director: '', production_company: '' }])
  }
  const removeExp = (i: number) => setExperiences(prev => prev.filter((_, idx) => idx !== i))
  const updateExp = (i: number, field: keyof ExpRow, value: string) =>
    setExperiences(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  // Edu helpers
  const addEdu = () => setEducation(prev => [...prev, { school: '', program: '', year: '' }])
  const removeEdu = (i: number) => setEducation(prev => prev.filter((_, idx) => idx !== i))
  const updateEdu = (i: number, field: keyof EduRow, value: string) =>
    setEducation(prev => prev.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  return (
    <form action={formAction} className="space-y-10">
      {/* Hidden JSON inputs */}
      <input type="hidden" name="skills_json" value={JSON.stringify(skills)} />
      <input type="hidden" name="licenses_json" value={JSON.stringify(licenses)} />
      <input type="hidden" name="languages_json" value={JSON.stringify(languages)} />
      <input type="hidden" name="experiences_json" value={JSON.stringify(experiences)} />
      <input type="hidden" name="education_json" value={JSON.stringify(education)} />

      {/* ── 0. Fotoğraflar ── */}
      <section>
        <SectionTitle>{tf('photos')}</SectionTitle>
        <PhotosUpload
          orgId={orgId}
          initial={initialData?.photos ?? []}
          coverLabel={tf('coverLabel')}
          photoHint={tf('photoHint')}
        />
      </section>

      {/* ── 1. Kimlik & İletişim ── */}
      <section>
        <SectionTitle>{tf('identity')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={tf('fullName')} required>
              <input name="full_name" required defaultValue={initialData?.full_name ?? ''} placeholder="Ayşe Kaya" className="sb-input" />
            </Field>
          </div>
          <Field label={tf('birthYear')}>
            <input type="number" name="birth_year" defaultValue={initialData?.birth_year ?? ''} min={1920} max={2010} placeholder="1992" className="sb-input" />
          </Field>
          <Field label={tf('city')}>
            <input name="city" defaultValue={initialData?.city ?? ''} placeholder="İstanbul" className="sb-input" />
          </Field>
          <Field label={tf('phone')}>
            <input name="phone" defaultValue={initialData?.phone ?? ''} placeholder="+90 532 000 00 00" className="sb-input" />
          </Field>
          <Field label={tf('email')}>
            <input type="email" name="email" defaultValue={initialData?.email ?? ''} placeholder="oyuncu@mail.com" className="sb-input" />
          </Field>
          <Field label={tf('manager')}>
            <input name="manager_name" defaultValue={initialData?.manager_name ?? ''} placeholder="Menajer adı" className="sb-input" />
          </Field>
          <Field label={tf('agency')}>
            <input name="agency_name" defaultValue={initialData?.agency_name ?? ''} placeholder="Ajans adı" className="sb-input" />
          </Field>
          <Field label={tf('visibility')}>
            <select name="visibility" defaultValue={initialData?.visibility ?? 'private'} className="sb-input">
              <option value="private">{tf('visibilityPrivate')}</option>
              <option value="public">{tf('visibilityPublic')}</option>
            </select>
          </Field>
          <Field label={tf('availability')}>
            <select name="availability" defaultValue={initialData?.availability ?? 'available'} className="sb-input">
              <option value="available">{ta('available')}</option>
              <option value="busy">{ta('busy')}</option>
              <option value="unavailable">{ta('unavailable')}</option>
            </select>
          </Field>
        </div>
      </section>

      {/* ── 2. Casting Özellikleri ── */}
      <section>
        <SectionTitle>{tf('castingTraits')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={tf('gender')}>
            <select name="gender" defaultValue={initialData?.gender ?? ''} className="sb-input">
              <option value="">{tf('genderUnspecified')}</option>
              <option value="erkek">{tf('genderMale')}</option>
              <option value="kadin">{tf('genderFemale')}</option>
              <option value="diger">{tf('genderOther')}</option>
            </select>
          </Field>
          <Field label={tf('playableAgeMin')}>
            <input type="number" name="playable_age_min" defaultValue={initialData?.playable_age_min ?? ''} min={0} max={120} placeholder="18" className="sb-input" />
          </Field>
          <Field label={tf('playableAgeMax')}>
            <input type="number" name="playable_age_max" defaultValue={initialData?.playable_age_max ?? ''} min={0} max={120} placeholder="35" className="sb-input" />
          </Field>
          <Field label={tf('heightCm')}>
            <input type="number" name="height_cm" defaultValue={initialData?.height_cm ?? ''} min={100} max={250} placeholder="175" className="sb-input" />
          </Field>
          <Field label={tf('weightKg')}>
            <input type="number" name="weight_kg" defaultValue={initialData?.weight_kg ?? ''} min={30} max={200} placeholder="70" className="sb-input" />
          </Field>
          <Field label={tf('eyeColor')}>
            <select name="eye_color" defaultValue={initialData?.eye_color ?? ''} className="sb-input">
              <option value="">—</option>
              {EYE_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={tf('hairColor')}>
            <select name="hair_color" defaultValue={initialData?.hair_color ?? ''} className="sb-input">
              <option value="">—</option>
              {HAIR_COLORS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={tf('hairLength')}>
            <select name="hair_length" defaultValue={initialData?.hair_length ?? ''} className="sb-input">
              <option value="">—</option>
              {HAIR_LENGTHS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </Field>
        </div>
      </section>

      {/* ── 3. Diller ── */}
      <section>
        <SectionTitle>{tf('languages')}</SectionTitle>
        <div className="space-y-3">
          {languages.map((lang, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
              <GripVertical className="w-4 h-4 text-gray-300 mt-2.5 flex-shrink-0" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <input
                  value={lang.language}
                  onChange={e => updateLang(i, 'language', e.target.value)}
                  placeholder={tf('langPlaceholder')}
                  className="sb-input"
                />
                <select
                  value={lang.level}
                  onChange={e => updateLang(i, 'level', e.target.value)}
                  className="sb-input"
                >
                  {LANG_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <input
                  value={lang.accents}
                  onChange={e => updateLang(i, 'accents', e.target.value)}
                  placeholder={tf('accentPlaceholder')}
                  className="sb-input"
                />
              </div>
              <button type="button" onClick={() => removeLang(i)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors mt-1.5 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addLang}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {tf('addLanguage')}
          </button>
        </div>
      </section>

      {/* ── 4. Yetenekler & Lisanslar ── */}
      <section>
        <SectionTitle>{tf('skillsAndLicenses')}</SectionTitle>
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">{tf('skills')}</p>
            <div className="flex flex-wrap gap-2">
              {SKILLS.map(skill => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    skills.includes(skill)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">{tf('licenses')}</p>
            <div className="flex flex-wrap gap-2">
              {LICENSES.map(lic => (
                <button
                  key={lic}
                  type="button"
                  onClick={() => toggleLicense(lic)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    licenses.includes(lic)
                      ? 'bg-indigo-500 text-white border-indigo-500'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {lic}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Deneyim ── */}
      <section>
        <SectionTitle>{tf('experience')} {experiences.length > 0 && <span className="text-gray-300 normal-case tracking-normal font-normal">({experiences.length}/10)</span>}</SectionTitle>
        <div className="space-y-3">
          {experiences.map((exp, i) => (
            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{tf('projectLabel', { num: i + 1 })}</span>
                <button type="button" onClick={() => removeExp(i)}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <input value={exp.project_name} onChange={e => updateExp(i, 'project_name', e.target.value)}
                    placeholder={tf('projectName')} className="sb-input w-full" />
                </div>
                <input type="number" value={exp.year} onChange={e => updateExp(i, 'year', e.target.value)}
                  placeholder={tf('year')} min={1960} max={2030} className="sb-input" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={exp.role_name} onChange={e => updateExp(i, 'role_name', e.target.value)}
                  placeholder={tf('roleName')} className="sb-input" />
                <select value={exp.role_type} onChange={e => updateExp(i, 'role_type', e.target.value)} className="sb-input">
                  <option value="">{tf('roleType')}</option>
                  {ROLE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                <select value={exp.production_type} onChange={e => updateExp(i, 'production_type', e.target.value)} className="sb-input">
                  <option value="">{tf('productionType')}</option>
                  {PROD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input value={exp.director} onChange={e => updateExp(i, 'director', e.target.value)}
                  placeholder={tf('director')} className="sb-input" />
                <input value={exp.production_company} onChange={e => updateExp(i, 'production_company', e.target.value)}
                  placeholder={tf('productionCompany')} className="sb-input" />
              </div>
            </div>
          ))}
          {experiences.length < 10 && (
            <button type="button" onClick={addExp}
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              <Plus className="w-4 h-4" /> {tf('addExperience')}
            </button>
          )}
        </div>
      </section>

      {/* ── 6. Eğitim ── */}
      <section>
        <SectionTitle>{tf('education')}</SectionTitle>
        <div className="space-y-3">
          {education.map((edu, i) => (
            <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                <input value={edu.school} onChange={e => updateEdu(i, 'school', e.target.value)}
                  placeholder={tf('school')} className="sb-input" />
                <input value={edu.program} onChange={e => updateEdu(i, 'program', e.target.value)}
                  placeholder={tf('program')} className="sb-input" />
                <input type="number" value={edu.year} onChange={e => updateEdu(i, 'year', e.target.value)}
                  placeholder={tf('year')} min={1970} max={2030} className="sb-input" />
              </div>
              <button type="button" onClick={() => removeEdu(i)}
                className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addEdu}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            <Plus className="w-4 h-4" /> {tf('addEducation')}
          </button>
        </div>
      </section>

      {/* ── 7. Medya ── */}
      <section>
        <SectionTitle>{tf('mediaLinks')}</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={tf('showreel')}>
            <input name="showreel_url" type="url" defaultValue={initialData?.showreel_url ?? ''} placeholder="https://vimeo.com/..." className="sb-input" />
          </Field>
          <Field label={tf('voiceSample')}>
            <input name="voice_sample_url" type="url" defaultValue={initialData?.voice_sample_url ?? ''} placeholder="https://..." className="sb-input" />
          </Field>
          <Field label={tf('selftapeDrama')}>
            <input name="selftape_drama_url" type="url" defaultValue={initialData?.selftape_drama_url ?? ''} placeholder="https://..." className="sb-input" />
          </Field>
          <Field label={tf('selftapeComedy')}>
            <input name="selftape_comedy_url" type="url" defaultValue={initialData?.selftape_comedy_url ?? ''} placeholder="https://..." className="sb-input" />
          </Field>
          <Field label={tf('selftapeAd')}>
            <input name="selftape_ad_url" type="url" defaultValue={initialData?.selftape_ad_url ?? ''} placeholder="https://..." className="sb-input" />
          </Field>
        </div>
      </section>

      {/* ── 8. Ücret ── */}
      <section>
        <SectionTitle>{tf('feeInfo')}</SectionTitle>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label={tf('feeType')}>
              <select name="fee_type" defaultValue={initialData?.fee_type ?? ''} className="sb-input">
                <option value="">{tf('feeTypeUnspecified')}</option>
                <option value="daily">{tf('feeTypeDaily')}</option>
                <option value="weekly">{tf('feeTypeWeekly')}</option>
                <option value="per_episode">{tf('feeTypeEpisode')}</option>
                <option value="monthly">{tf('feeTypeMonthly')}</option>
                <option value="per_project">{tf('feeTypeProject')}</option>
                <option value="hourly">{tf('feeTypeHourly')}</option>
              </select>
            </Field>
            <Field label={tf('feeAmount')}>
              <input
                type="number"
                name="fee_amount"
                defaultValue={initialData?.fee_amount ?? ''}
                min={0}
                step="0.01"
                placeholder="0"
                className="sb-input"
              />
            </Field>
            <Field label={tf('feeCurrency')}>
              <select name="fee_currency" defaultValue={initialData?.fee_currency ?? 'TRY'} className="sb-input">
                <option value="TRY">TRY — Türk Lirası</option>
                <option value="USD">USD — Dolar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </Field>
          </div>
          <Field label={tf('feeNotes')}>
            <textarea
              name="fee_notes"
              defaultValue={initialData?.fee_notes ?? ''}
              rows={2}
              placeholder={tf('feeNotesPlaceholder')}
              className="sb-input resize-none"
            />
          </Field>
        </div>
      </section>

      {/* ── Notlar ── */}
      <section>
        <SectionTitle>{tf('internalNotes')}</SectionTitle>
        <textarea name="notes" defaultValue={initialData?.notes ?? ''} rows={3}
          placeholder={tf('internalNotesPlaceholder')}
          className="sb-input resize-none w-full" />
      </section>

      {/* Error */}
      {state?.error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
          {state.error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <Link href={cancelHref} className="sb-btn-secondary">{tf('cancel')}</Link>
        <SubmitButton
          label={initialData ? tf('update') : tf('create')}
          savingLabel={tf('saving')}
        />
      </div>
    </form>
  )
}
