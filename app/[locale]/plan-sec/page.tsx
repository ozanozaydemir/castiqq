'use client'

import { useState } from 'react'
import { Clapperboard, Check, Loader2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { logout } from '@/app/actions/auth'

const PLANS = {
  pro: {
    name: 'Pro',
    price: '$39',
    desc: { tr: 'Aktif casting ajansları ve prodüksiyon ekipleri için.', en: 'For active casting agencies and production teams.' },
    features: {
      tr: ['3 kullanıcı', '200 GB video depolama', 'Ekip işbirliği', '5 yıldız puanlama', 'Etiket & koleksiyonlar', 'Zaman damgalı notlar', 'WhatsApp entegrasyonu', 'Sürükle-bırak sıralama'],
      en: ['3 users', '200 GB video storage', 'Team collaboration', '5-star rating', 'Tags & collections', 'Timestamp notes', 'WhatsApp integration', 'Drag & drop sorting'],
    },
  },
  agency: {
    name: 'Ajans',
    price: '$99',
    desc: { tr: 'Büyük yapım şirketleri ve çok ekipli yapılar için.', en: 'For large production companies and multi-team setups.' },
    features: {
      tr: ['Sınırsız kullanıcı', '1 TB video depolama', 'Pro\'daki her şey', 'Öncelikli destek', 'Özel entegrasyonlar', 'SLA garantisi'],
      en: ['Unlimited users', '1 TB video storage', 'Everything in Pro', 'Priority support', 'Custom integrations', 'SLA guarantee'],
    },
  },
}

export default function PlanSecPage() {
  const locale = useLocale()
  const isTr = locale === 'tr'
  const [loading, setLoading] = useState<'pro' | 'agency' | null>(null)

  function goToCheckout(plan: 'pro' | 'agency') {
    const productId = plan === 'pro'
      ? process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID
      : process.env.NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID
    if (!productId) return
    setLoading(plan)
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
          {isTr ? 'Planınızı seçin' : 'Choose your plan'}
        </h1>
        <p className="text-sm text-gray-500">
          {isTr
            ? 'Castiqq\'e erişmek için bir plan seçin. İstediğiniz zaman iptal edebilirsiniz.'
            : 'Select a plan to access Castiqq. Cancel anytime.'}
        </p>
      </div>

      {/* Plan cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Pro */}
        <div className="relative bg-white border-2 border-indigo-500 rounded-2xl shadow-sm overflow-hidden">
          <div className="absolute top-0 inset-x-0 bg-indigo-500 text-white text-xs font-semibold text-center py-1 tracking-wide">
            {isTr ? 'EN POPÜLER' : 'MOST POPULAR'}
          </div>
          <div className="pt-8 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">{PLANS.pro.name}</h2>
            <p className="text-xs text-gray-500 mb-4">{isTr ? PLANS.pro.desc.tr : PLANS.pro.desc.en}</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-black text-gray-900">{PLANS.pro.price}</span>
              <span className="text-sm text-gray-400">{isTr ? '/ay' : '/mo'}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {(isTr ? PLANS.pro.features.tr : PLANS.pro.features.en).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goToCheckout('pro')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
            >
              {loading === 'pro' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isTr ? 'Pro\'yu Seç' : 'Choose Pro'}
            </button>
          </div>
        </div>

        {/* Agency */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-0.5">{isTr ? 'Ajans' : PLANS.agency.name}</h2>
            <p className="text-xs text-gray-500 mb-4">{isTr ? PLANS.agency.desc.tr : PLANS.agency.desc.en}</p>
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-4xl font-black text-gray-900">{PLANS.agency.price}</span>
              <span className="text-sm text-gray-400">{isTr ? '/ay' : '/mo'}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {(isTr ? PLANS.agency.features.tr : PLANS.agency.features.en).map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => goToCheckout('agency')}
              disabled={loading !== null}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors"
            >
              {loading === 'agency' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isTr ? 'Ajans\'ı Seç' : 'Choose Agency'}
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
