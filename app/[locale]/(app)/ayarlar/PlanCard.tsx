'use client'

import { CreditCard, ExternalLink, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PLAN_LIMITS, getProductIdForPlan, type Plan } from '@/lib/plan'

interface Props {
  plan: string
  status: string
  endsAt: string | null
  hasPortal: boolean
  orgId: string
  orgType: 'production' | 'agency'
}

export function PlanCard({ plan, status, endsAt, hasPortal, orgId, orgType }: Props) {
  const t = useTranslations('settings.plan')
  const info = PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.starter
  const isCancelled = status === 'canceled'

  // Her org_type için artık tek plan var — yükseltme/karşılaştırma değil, tek "yeniden abone ol" seçeneği
  const resubscribePlan = orgType === 'agency'
    ? { plan: 'agency' as const, label: 'Menajerlik Planı', price: `₺3.999${t('perMonth')}`, desc: `50 GB · 5 ${t('users')}` }
    : { plan: 'pro' as const,    label: 'Production Planı', price: `₺1.999${t('perMonth')}`, desc: `200 GB · 3 ${t('users')}` }

  function goToCheckout() {
    const productId = getProductIdForPlan(resubscribePlan.plan)
    if (!productId) return alert(t('productIdMissing'))
    window.location.href = `/api/checkout?products=${productId}&customerExternalId=${orgId}`
  }

  return (
    <div className="sb-card p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-gray-400"><CreditCard className="w-4 h-4" /></span>
        <h2 className="text-sm font-semibold text-gray-900">{t('title')}</h2>
      </div>

      {/* Mevcut plan */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Zap className="w-3 h-3" />
            {info.label}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {info.storageGB} {t('storage')} · {info.maxUsers === Infinity ? t('unlimited') : info.maxUsers} {t('users')}
          </p>
          {isCancelled && endsAt && (
            <p className="text-xs text-amber-600 mt-1">
              {t('cancelledUntil', { date: new Date(endsAt).toLocaleDateString() })}
            </p>
          )}
        </div>
        {hasPortal && (
          <a
            href="/api/portal"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t('manageSubscription')} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Yeniden abone ol — sadece starter veya cancelled durumunda göster */}
      {(plan === 'starter' || isCancelled) && (
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={goToCheckout}
            className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">{resubscribePlan.label}</span>
              <span className="text-xs font-medium text-indigo-600">{resubscribePlan.price}</span>
            </div>
            <p className="text-xs text-gray-500">{resubscribePlan.desc}</p>
          </button>
        </div>
      )}
    </div>
  )
}
