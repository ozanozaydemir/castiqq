'use client'

import { useState, useTransition } from 'react'
import { Check, Loader2, Film, Users2 } from 'lucide-react'
import { Link } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { logout, selectPlan } from '@/app/actions/auth'
import { CastiqqLogo } from '@/components/brand/Logo'

type Plan = {
  key: 'production' | 'agency'
  name: { tr: string; en: string }
  tagline: { tr: string; en: string }
  price: string
  icon: React.ElementType
  features: { tr: string[]; en: string[] }
}

const PLANS: Plan[] = [
  {
    key: 'production',
    name: { tr: 'Cast Direktörü', en: 'Casting Director' },
    tagline: { tr: 'Yapım şirketleri ve serbest çalışan cast direktörleri için.', en: 'For production companies and freelance casting directors.' },
    price: '₺1.999',
    icon: Film,
    features: {
      tr: ['3 kullanıcı', '200 GB video depolama', 'Sınırsız proje & rol', 'Audition video toplama', '5 yıldız puanlama', 'Etiket & koleksiyonlar', 'Zaman damgalı notlar', 'WhatsApp entegrasyonu'],
      en: ['3 users', '200 GB video storage', 'Unlimited projects & roles', 'Audition video collection', '5-star rating', 'Tags & collections', 'Timestamp notes', 'WhatsApp integration'],
    },
  },
  {
    key: 'agency',
    name: { tr: 'Menajerlik Ajansı', en: 'Talent Agency' },
    tagline: { tr: 'Oyuncu temsil eden menajerlik ajansları için.', en: 'For talent agencies managing their roster.' },
    price: '₺4.999',
    icon: Users2,
    features: {
      tr: ['5 kullanıcı', '100 GB depolama', '250 oyuncu kadrosu', 'Sözleşme & komisyon takibi', 'Müşteri CRM\'i', 'Teklif pipeline\'ı', 'Çakışma kontrolü', 'Google Takvim entegrasyonu'],
      en: ['5 users', '100 GB storage', '250-talent roster', 'Contract & commission tracking', 'Client CRM', 'Offer pipeline', 'Conflict detection', 'Google Calendar integration'],
    },
  },
]

function PlanCard({ plan, onSelect, loading }: { plan: Plan; onSelect: () => void; loading: boolean }) {
  const locale = useLocale()
  const isTr = locale === 'tr'
  const Icon = plan.icon

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-md hover:border-indigo-200">
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-base leading-tight">
              {isTr ? plan.name.tr : plan.name.en}
            </h2>
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          {isTr ? plan.tagline.tr : plan.tagline.en}
        </p>

        <div className="flex items-baseline gap-1 mb-5">
          <span className="text-3xl font-black text-gray-900">{plan.price}</span>
          <span className="text-sm text-gray-400">{isTr ? '/ay' : '/mo'}</span>
        </div>

        <ul className="space-y-2 mb-6 flex-1">
          {(isTr ? plan.features.tr : plan.features.en).map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="w-4 h-4 text-indigo-500 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <button
          onClick={onSelect}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-colors shadow-sm shadow-indigo-500/20"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {isTr ? '14 Gün Ücretsiz Dene' : 'Try Free for 14 Days'}
        </button>
      </div>
    </div>
  )
}

export function PlanSecClient() {
  const locale = useLocale()
  const isTr = locale === 'tr'
  const [pendingKey, setPendingKey] = useState<'production' | 'agency' | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSelect(plan: Plan) {
    const productId = plan.key === 'production'
      ? process.env.NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID
      : process.env.NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID
    if (!productId) return
    setPendingKey(plan.key)
    startTransition(async () => {
      await selectPlan(plan.key, productId)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="mb-10">
        <CastiqqLogo tone="light" size={28} />
      </Link>

      {/* Header */}
      <div className="text-center mb-10 max-w-lg">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">
          {isTr ? 'Hesap türünüzü seçin' : 'Choose your account type'}
        </h1>
        <p className="text-sm text-gray-500">
          {isTr
            ? '14 gün ücretsiz deneyin. İstediğiniz zaman iptal edebilirsiniz.'
            : 'Try free for 14 days. Cancel anytime.'}
        </p>
      </div>

      {/* Plan cards */}
      <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-5">
        {PLANS.map(plan => (
          <PlanCard
            key={plan.key}
            plan={plan}
            onSelect={() => handleSelect(plan)}
            loading={isPending && pendingKey === plan.key}
          />
        ))}
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
