'use client'

import { useState } from 'react'
import { Clapperboard, Check, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { logout } from '@/app/actions/auth'

const PLANS = {
  production: {
    name: { tr: 'Production Planı', en: 'Production Plan' },
    price: '₺1.999',
    productIdEnv: 'NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID',
    desc: { tr: 'Cast direktörleri ve yapım şirketleri için.', en: 'For casting directors and production companies.' },
    features: {
      tr: ['3 kullanıcı', '200 GB video depolama', 'Ekip işbirliği', '5 yıldız puanlama', 'Etiket & koleksiyonlar', 'Zaman damgalı notlar', 'WhatsApp entegrasyonu', 'Sürükle-bırak sıralama'],
      en: ['3 users', '200 GB video storage', 'Team collaboration', '5-star rating', 'Tags & collections', 'Timestamp notes', 'WhatsApp integration', 'Drag & drop sorting'],
    },
  },
  agency: {
    name: { tr: 'Menajerlik Planı', en: 'Agency Plan' },
    price: '₺3.999',
    productIdEnv: 'NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID',
    desc: { tr: 'Menajerlik şirketleri ve oyuncu roster yönetimi için.', en: 'For talent agencies managing their roster.' },
    features: {
      tr: ['5 kullanıcı', '250 oyuncu roster kapasitesi', '50 GB depolama', 'Google Sheets entegrasyonu', 'Paylaşılabilir oyuncu listeleri', 'Sözleşme & komisyon takibi'],
      en: ['5 users', '250-talent roster capacity', '50 GB storage', 'Google Sheets integration', 'Shareable talent lists', 'Contract & commission tracking'],
    },
  },
} as const

export function PlanSecClient({ orgType }: { orgType: 'production' | 'agency' }) {
  const locale = useLocale()
  const isTr = locale === 'tr'
  const [loading, setLoading] = useState(false)

  const plan = PLANS[orgType]

  function goToCheckout() {
    const productId = orgType === 'production'
      ? process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID
      : process.env.NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID
    if (!productId) return
    setLoading(true)
    window.location.href = `/api/checkout?products=${productId}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-gray-900 text-xl tracking-tight">Castiqq</span>
      </Link>

      {/* Header */}
      <div className="text-center mb-10 max-w-md">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          {isTr ? 'Devam etmek için planınızı başlatın' : 'Start your plan to continue'}
        </h1>
        <p className="text-sm text-gray-500">
          {isTr
            ? '14 gün ücretsiz deneyin. İstediğiniz zaman iptal edebilirsiniz.'
            : 'Try free for 14 days. Cancel anytime.'}
        </p>
      </div>

      {/* Plan card */}
      <div className="w-full max-w-sm">
        <div className="relative bg-white border-2 border-indigo-500 rounded-2xl shadow-sm overflow-hidden">
          <div className="pt-6 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">{isTr ? plan.name.tr : plan.name.en}</h2>
            <p className="text-xs text-gray-500 mb-4">{isTr ? plan.desc.tr : plan.desc.en}</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-black text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-400">{isTr ? '/ay' : '/mo'}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {(isTr ? plan.features.tr : plan.features.en).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={goToCheckout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isTr ? '14 Gün Ücretsiz Dene' : 'Try Free for 14 Days'}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mt-8">
        {isTr
          ? 'Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. Sorularınız için '
          : 'You can cancel your subscription anytime. For questions: '}
        <a href="mailto:support@castiqq.app" className="text-indigo-500 hover:underline">support@castiqq.app</a>
      </p>

      <div className="mt-4">
        <form action={logout}>
          <button type="submit" className="text-xs text-gray-400 hover:text-gray-600">
            {isTr ? 'Çıkış yap' : 'Log out'}
          </button>
        </form>
      </div>
    </div>
  )
}
