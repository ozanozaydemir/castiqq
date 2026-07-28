'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Loader2, CheckCircle2, ImagePlus } from 'lucide-react'
import { updateSelfServiceProfile, type ActionState } from '@/app/actions/selfService'

type Talent = {
  full_name: string
  phone: string | null
  email: string | null
  city: string | null
  availability: string
  photos: string[] | null
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed">
      {pending ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</> : 'Kaydet'}
    </button>
  )
}

export function SelfServiceForm({ token, talent }: { token: string; talent: Talent }) {
  const boundAction = updateSelfServiceProfile.bind(null, token)
  const [state, formAction] = useActionState<ActionState, FormData>(boundAction, null)
  const [preview, setPreview] = useState<string | null>(talent.photos?.[0] ?? null)

  if (state?.success) {
    return (
      <div className="sb-card p-6 text-center">
        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
        <p className="text-gray-900 font-semibold">Profilin güncellendi</p>
        <p className="text-sm text-gray-500 mt-1">Bu sayfayı kapatabilirsin.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="sb-card p-6 space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
          {preview ? (
            <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Fotoğraf</label>
          <input
            type="file"
            name="photo"
            accept="image/jpeg,image/png,image/webp"
            className="text-sm"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) setPreview(URL.createObjectURL(f))
            }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Telefon</label>
        <input name="phone" defaultValue={talent.phone ?? ''} placeholder="+90 532 000 00 00" className="sb-input" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">E-posta</label>
        <input type="email" name="email" defaultValue={talent.email ?? ''} placeholder="sen@mail.com" className="sb-input" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Şehir</label>
        <input name="city" defaultValue={talent.city ?? ''} placeholder="İstanbul" className="sb-input" />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">Müsaitlik Durumu</label>
        <select name="availability" defaultValue={talent.availability} className="sb-input">
          <option value="available">Müsait</option>
          <option value="busy">Meşgul</option>
          <option value="unavailable">Uygun Değil</option>
        </select>
      </div>

      {state?.error && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 px-3.5 py-3 rounded-xl text-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
          {state.error}
        </div>
      )}

      <SubmitButton />
    </form>
  )
}
