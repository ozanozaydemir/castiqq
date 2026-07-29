'use client'

import { useState, useTransition, useRef } from 'react'
import { submitPublicApplication, type LangRow, type ExpRow } from '@/app/actions/public-apply'
import { UploadSection } from '../../oyuncu/[token]/UploadSection'
import { Plus, X, Loader2, ImagePlus, ChevronRight, Video } from 'lucide-react'

interface ApplyFormProps {
  rolePublicToken: string
  roleName: string
  projectTitle: string
  siteUrl: string
  locale: string
}

// ── Constants ────────────────────────────────────────────────────

const SKILLS = [
  'Şarkı', 'Dans', 'At Binme', 'Motosiklet', 'Yüzme',
  'Silah Kullanımı', 'Dövüş Koreografisi', 'Enstrüman', 'Spor',
  'Akrobasi', 'Jimnastik', 'Seslendirme', 'Komedi', 'Doğaçlama',
  'Ehliyet', 'Pasaport',
]
const LICENSE_SET = new Set(['Ehliyet', 'Pasaport', 'Vize'])

const LANG_LEVELS = [
  { value: 'native', label: 'Ana dil' },
  { value: 'C2', label: 'C2' }, { value: 'C1', label: 'C1' },
  { value: 'B2', label: 'B2' }, { value: 'B1', label: 'B1' },
  { value: 'A2', label: 'A2' }, { value: 'A1', label: 'A1' },
]

const ROLE_TYPES = [
  { value: '', label: 'Rol türü seçin' },
  { value: 'lead', label: 'Başrol' }, { value: 'supporting', label: 'Yardımcı Rol' },
  { value: 'guest', label: 'Yan Rol' }, { value: 'cameo', label: 'Konuk' },
  { value: 'ad', label: 'Reklam' }, { value: 'extra', label: 'Figürasyon' },
  { value: 'voiceover', label: 'Seslendirme' },
]

const PROD_TYPES = [
  { value: '', label: 'Tür seçin' },
  { value: 'film', label: 'Film' }, { value: 'dizi', label: 'Dizi' },
  { value: 'reklam', label: 'Reklam' }, { value: 'tiyatro', label: 'Tiyatro' },
  { value: 'diger', label: 'Diğer' },
]

const HAIR_COLORS = ['', 'Siyah', 'Kahverengi', 'Sarı', 'Kızıl', 'Beyaz/Gri', 'Diğer']
const HAIR_LENGTHS = ['', 'Kel/Traşlı', 'Kısa', 'Orta', 'Uzun', 'Çok Uzun']
const EYE_COLORS = ['', 'Kahverengi', 'Siyah', 'Yeşil', 'Mavi', 'Ela', 'Gri']

const GENDERS = [
  { value: '', label: 'Cinsiyet seçin' },
  { value: 'erkek', label: 'Erkek' },
  { value: 'kadin', label: 'Kadın' },
  { value: 'diger', label: 'Diğer' },
]

const FEE_TYPES = [
  { value: '', label: 'Ücret türü seçin' },
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'project', label: 'Proje bazlı' },
]

const CURRENCIES = ['TRY', 'USD', 'EUR']

// ── Sub-components ───────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 pb-2 border-b border-gray-100">
      {children}
    </h3>
  )
}

function Field({ label, required, optional, children }: { label: string; required?: boolean; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {optional && <span className="text-gray-400 font-normal ml-1 text-xs">(isteğe bağlı)</span>}
      </label>
      {children}
    </div>
  )
}

function PhotoUpload({ rolePublicToken, value, onChange }: { rolePublicToken: string; value: string | null; onChange: (url: string | null) => void }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const res = await fetch(`/api/public-photo-url?roleToken=${encodeURIComponent(rolePublicToken)}&ext=${ext}`)
      if (!res.ok) { setUploading(false); return }
      const { signedUrl, publicUrl } = await res.json()
      const upload = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (upload.ok) onChange(publicUrl)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-start gap-4">
      <div
        className="w-24 h-32 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 flex items-center justify-center cursor-pointer overflow-hidden transition-colors flex-shrink-0"
        onClick={() => fileRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Profil fotoğrafı" className="w-full h-full object-cover" />
        ) : uploading ? (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
        ) : (
          <ImagePlus className="w-6 h-6 text-gray-300" />
        )}
      </div>
      <div className="flex-1 pt-1">
        <p className="text-sm text-gray-600 mb-1">Profil fotoğrafınızı ekleyin</p>
        <p className="text-xs text-gray-400 mb-3">JPG veya PNG · 5MB'a kadar</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="text-xs text-indigo-600 border border-indigo-200 hover:border-indigo-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploading ? 'Yükleniyor...' : 'Fotoğraf Seç'}
          </button>
          {value && (
            <button type="button" onClick={() => onChange(null)} className="text-xs text-gray-400 hover:text-red-400 transition-colors">
              Kaldır
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ── Main Form ────────────────────────────────────────────────────

export function ApplyForm({ rolePublicToken, locale }: ApplyFormProps) {
  // Basic
  const [name, setName]   = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [city, setCity] = useState('')

  // Physical
  const [heightCm, setHeightCm] = useState('')
  const [weightKg, setWeightKg] = useState('')
  const [hairColor, setHairColor] = useState('')
  const [hairLength, setHairLength] = useState('')
  const [eyeColor, setEyeColor] = useState('')

  // Skills
  const [skills, setSkills] = useState<string[]>([])

  // Languages
  const [languages, setLanguages] = useState<LangRow[]>([])

  // Experiences
  const [experiences, setExperiences] = useState<ExpRow[]>([])

  // Photo
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Fee
  const [feeType, setFeeType] = useState('')
  const [feeAmount, setFeeAmount] = useState('')
  const [feeCurrency, setFeeCurrency] = useState('TRY')

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [uploadToken, setUploadToken] = useState<string | null>(null)
  const [isExisting, setIsExisting] = useState(false)
  const [isPending, startTransition] = useTransition()

  function toggleSkill(s: string) {
    setSkills(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  function addLanguage() {
    setLanguages(prev => [...prev, { language: '', level: 'native' }])
  }
  function updateLanguage(i: number, field: keyof LangRow, val: string) {
    setLanguages(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function removeLanguage(i: number) {
    setLanguages(prev => prev.filter((_, idx) => idx !== i))
  }

  function addExperience() {
    setExperiences(prev => [...prev, { project_name: '', year: '', role_name: '', role_type: '', production_type: '', director: '', production_company: '' }])
  }
  function updateExperience(i: number, field: keyof ExpRow, val: string) {
    setExperiences(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  function removeExperience(i: number) {
    setExperiences(prev => prev.filter((_, idx) => idx !== i))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) { setError('Ad Soyad zorunludur.'); return }

    startTransition(async () => {
      const result = await submitPublicApplication(rolePublicToken, {
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        birth_year: birthYear ? parseInt(birthYear) : null,
        gender: gender || null,
        city: city.trim() || null,
        height_cm: heightCm ? parseInt(heightCm) : null,
        weight_kg: weightKg ? parseInt(weightKg) : null,
        hair_color: hairColor || null,
        hair_length: hairLength || null,
        eye_color: eyeColor || null,
        skills: skills.filter(s => !LICENSE_SET.has(s)),
        licenses: skills.filter(s => LICENSE_SET.has(s)),
        languages: languages.filter(l => l.language.trim()),
        experiences: experiences.filter(e => e.project_name.trim()),
        avatar_url: avatarUrl,
        fee_type: feeType || null,
        fee_amount: feeAmount ? parseFloat(feeAmount) : null,
        fee_currency: feeType ? feeCurrency : null,
      })
      if ('error' in result) { setError(result.error); return }
      setIsExisting(result.isExisting ?? false)
      setUploadToken(result.uploadToken)
    })
  }

  // ── Step 2: video upload ─────────────────────────────────────

  if (uploadToken) {
    return (
      <div className="space-y-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1.5 text-gray-400 line-through">
            <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 no-underline">
              <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-green-700 no-underline" style={{ textDecoration: 'none' }}>Profil Bilgileri</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <div className="flex items-center gap-1.5 font-semibold text-gray-900">
            <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            Audition Videosu
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-start gap-4">
          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {isExisting ? 'Başvurunuz zaten mevcut' : 'Profiliniz kaydedildi!'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isExisting
                ? 'Daha önce başvurdunuz. Ek video yükleyebilirsiniz.'
                : 'Şimdi audition videonuzu yükleyebilirsiniz.'}
            </p>
          </div>
        </div>

        <UploadSection token={uploadToken} initialVideos={[]} />
      </div>
    )
  }

  // ── Step 1: full profile form ────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1.5 font-semibold text-gray-900">
          <span className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
          Profil Bilgileri
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <div className="flex items-center gap-1.5 text-gray-400">
          <span className="w-6 h-6 rounded-full border-2 border-gray-200 flex items-center justify-center text-xs font-medium flex-shrink-0">2</span>
          Audition Videosu
        </div>
      </div>

      {/* Temel Bilgiler */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Temel Bilgiler</SectionTitle>
        <div className="grid grid-cols-1 gap-4">
          <Field label="Ad Soyad" required>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Adınız ve soyadınız" required className="sb-input w-full" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="E-posta" optional>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@mail.com" className="sb-input w-full" />
            </Field>
            <Field label="Telefon" optional>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+90 5xx xxx xx xx" className="sb-input w-full" />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Doğum Yılı" optional>
              <input type="number" value={birthYear} onChange={e => setBirthYear(e.target.value)}
                placeholder="1990" min="1930" max={new Date().getFullYear()}
                className="sb-input w-full" />
            </Field>
            <Field label="Cinsiyet" optional>
              <select value={gender} onChange={e => setGender(e.target.value)} className="sb-input w-full">
                {GENDERS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </Field>
            <Field label="Şehir" optional>
              <input type="text" value={city} onChange={e => setCity(e.target.value)}
                placeholder="İstanbul" className="sb-input w-full" />
            </Field>
          </div>
        </div>
      </div>

      {/* Fotoğraf */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Fotoğraf <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        <PhotoUpload rolePublicToken={rolePublicToken} value={avatarUrl} onChange={setAvatarUrl} />
      </div>

      {/* Fiziksel Özellikler */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Fiziksel Özellikler <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Boy (cm)">
            <input type="number" value={heightCm} onChange={e => setHeightCm(e.target.value)}
              placeholder="175" min="100" max="250" className="sb-input w-full" />
          </Field>
          <Field label="Kilo (kg)">
            <input type="number" value={weightKg} onChange={e => setWeightKg(e.target.value)}
              placeholder="70" min="30" max="250" className="sb-input w-full" />
          </Field>
          <Field label="Saç Rengi">
            <select value={hairColor} onChange={e => setHairColor(e.target.value)} className="sb-input w-full">
              <option value="">Seçin</option>
              {HAIR_COLORS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Saç Uzunluğu">
            <select value={hairLength} onChange={e => setHairLength(e.target.value)} className="sb-input w-full">
              <option value="">Seçin</option>
              {HAIR_LENGTHS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Göz Rengi">
            <select value={eyeColor} onChange={e => setEyeColor(e.target.value)} className="sb-input w-full">
              <option value="">Seçin</option>
              {EYE_COLORS.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Yetenekler */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Yetenekler &amp; Lisanslar <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        <div className="flex flex-wrap gap-2">
          {SKILLS.map(s => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSkill(s)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                skills.includes(s)
                  ? 'bg-indigo-500 text-white border-indigo-500'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Diller */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Diller <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        {languages.map((lang, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={lang.language}
              onChange={e => updateLanguage(i, 'language', e.target.value)}
              placeholder="Türkçe, İngilizce..."
              className="sb-input flex-1"
            />
            <select
              value={lang.level}
              onChange={e => updateLanguage(i, 'level', e.target.value)}
              className="sb-input w-32 flex-shrink-0"
            >
              {LANG_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
            <button type="button" onClick={() => removeLanguage(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button type="button" onClick={addLanguage}
          className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> Dil Ekle
        </button>
      </div>

      {/* Deneyim */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Deneyim <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        {experiences.map((exp, i) => (
          <div key={i} className="p-4 bg-gray-50 rounded-xl space-y-3 relative">
            <button type="button" onClick={() => removeExperience(i)}
              className="absolute top-3 right-3 text-gray-300 hover:text-red-400">
              <X className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <input type="text" value={exp.project_name}
                  onChange={e => updateExperience(i, 'project_name', e.target.value)}
                  placeholder="Proje / Yapım adı" className="sb-input w-full text-sm" />
              </div>
              <div>
                <input type="text" value={exp.year}
                  onChange={e => updateExperience(i, 'year', e.target.value)}
                  placeholder="Yıl (2023)" className="sb-input w-full text-sm" />
              </div>
              <div>
                <input type="text" value={exp.role_name}
                  onChange={e => updateExperience(i, 'role_name', e.target.value)}
                  placeholder="Rol adı" className="sb-input w-full text-sm" />
              </div>
              <div>
                <select value={exp.role_type}
                  onChange={e => updateExperience(i, 'role_type', e.target.value)}
                  className="sb-input w-full text-sm">
                  {ROLE_TYPES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <select value={exp.production_type}
                  onChange={e => updateExperience(i, 'production_type', e.target.value)}
                  className="sb-input w-full text-sm">
                  {PROD_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
            </div>
          </div>
        ))}
        {experiences.length < 10 && (
          <button type="button" onClick={addExperience}
            className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> Deneyim Ekle
          </button>
        )}
      </div>

      {/* Ücret */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <SectionTitle>Ücret Bilgisi <span className="text-gray-300 normal-case tracking-normal font-normal">(isteğe bağlı)</span></SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Ücret Türü">
            <select value={feeType} onChange={e => setFeeType(e.target.value)} className="sb-input w-full">
              {FEE_TYPES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </Field>
          <Field label="Tutar">
            <input type="number" value={feeAmount} onChange={e => setFeeAmount(e.target.value)}
              placeholder="0" min="0" className="sb-input w-full" disabled={!feeType} />
          </Field>
          <Field label="Para Birimi">
            <select value={feeCurrency} onChange={e => setFeeCurrency(e.target.value)}
              className="sb-input w-full" disabled={!feeType}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      {/* Next step hint */}
      <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
        <Video className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        <p className="text-sm text-indigo-700">
          Sonraki adımda audition videonuzu yükleyebilirsiniz.
        </p>
      </div>

      {/* Submit */}
      <button type="submit" disabled={isPending}
        className="w-full sb-btn-primary py-3 disabled:opacity-60 flex items-center justify-center gap-2">
        {isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
          : <><ChevronRight className="w-4 h-4" /> Devam Et</>}
      </button>

      <p className="text-xs text-gray-400 text-center">
        Bilgileriniz yalnızca bu başvuru için kullanılacaktır.{' '}
        <a href={locale === 'en' ? '/en/gizlilik' : '/gizlilik'}
          className="underline hover:text-gray-600">
          Gizlilik Politikası
        </a>
      </p>
    </form>
  )
}
