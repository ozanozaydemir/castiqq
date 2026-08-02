'use client'

import { CreditCard, ExternalLink, Zap } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { PLAN_LIMITS, getActivePlan, formatStorage, getProductIdForPlan, type Plan } from '@/lib/plan'

interface Props {
  plan: string | null
  status: string
  endsAt: string | null
  hasPortal: boolean
  orgId: string
  orgType: 'production' | 'agency'
}

export function PlanCard({ plan, status, endsAt, hasPortal, orgId, orgType }: Props) {
  const t = useTranslations('settings.plan')

  const activePlan = getActivePlan(plan, status, orgType)
  const info = PLAN_LIMITS[activePlan]
  const isCancelled = status === 'canceled'
  const isTrialing = status === 'trialing'
  const hasActivePlan = plan === 'pro' || plan === 'agency'

  // Yeniden abone ol butonu: aktif plan yoksa veya iptal edilmişse göster
  const showSubscribeButton = !hasActivePlan || isCancelled

  const resubPlanKey: Plan = orgType === 'agency' ? 'agency' : 'pro'
  const resubLimits = PLAN_LIMITS[resubPlanKey]

  function goToCheckout() {
    const productId = getProductIdForPlan(resubPlanKey)
    if (!productId) return alert(t('productIdMissing'))
    window.location.href = `/api/checkout?products=${productId}&customerExternalId=${orgId}`
  }

  const planBadgeLabel = hasActivePlan
    ? info.label
    : isTrialing
      ? `${info.label} — ${t('trial')}`
      : t('noActivePlan')

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
            {planBadgeLabel}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {/* Kullanıcı önde: depolama satın alınan şey değil, sadece bir sınır. */}
            {info.maxUsers} {t('users')} · {formatStorage(info.storageGB)} {t('storage')}
          </p>
          {isCancelled && endsAt && (
            <p className="text-xs text-amber-600 mt-1">
              {t('cancelledUntil', { date: new Date(endsAt).toLocaleDateString() })}
            </p>
          )}
        </div>
        {hasPortal && hasActivePlan && (
          <a
            href="/api/portal"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            {t('manageSubscription')} <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Abone ol / Yeniden abone ol */}
      {showSubscribeButton && (
        <div className="border-t border-gray-100 pt-4">
          <button
            onClick={goToCheckout}
            className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700">
                {resubLimits.label}
              </span>
              <span className="text-xs font-medium text-indigo-600">
                {resubPlanKey === 'agency' ? `₺4.999${t('perMonth')}` : `₺1.999${t('perMonth')}`}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              {formatStorage(resubLimits.storageGB)} · {resubLimits.maxUsers} {t('users')}
            </p>
          </button>
        </div>
      )}
    </div>
  )
}
