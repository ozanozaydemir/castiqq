'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, Circle, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface OnboardingCardProps {
  hasProjects: boolean
  hasTalent: boolean
  hasAuditions: boolean
}

export function OnboardingCard({ hasProjects, hasTalent, hasAuditions }: OnboardingCardProps) {
  const t = useTranslations('onboarding')
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    const v = localStorage.getItem('castiqq_onboarding_dismissed')
    if (v !== 'true') setDismissed(false)
  }, [])

  if (dismissed) return null

  const allDone = hasProjects && hasTalent && hasAuditions

  const steps = [
    { done: hasProjects,  label: t('step1'), desc: t('step1Desc'), href: '/projeler/yeni' },
    { done: hasTalent,    label: t('step2'), desc: t('step2Desc'), href: '/oyuncular/yeni' },
    { done: hasAuditions, label: t('step3'), desc: t('step3Desc'), href: '/roller' },
  ]

  function dismiss() {
    localStorage.setItem('castiqq_onboarding_dismissed', 'true')
    setDismissed(true)
  }

  return (
    <div className="sb-card p-5 border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">{t('title')}</h2>
          {!allDone && <p className="text-xs text-gray-500 mt-0.5">{t('subtitle')}</p>}
        </div>
        <button
          onClick={dismiss}
          className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0"
          title={t('dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {allDone ? (
        <p className="text-sm text-indigo-600 font-medium">{t('allDone')}</p>
      ) : (
        <ul className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              {step.done ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                {step.done ? (
                  <p className="text-sm text-gray-400 line-through">{step.label}</p>
                ) : (
                  <Link href={step.href} className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors">
                    {step.label} →
                  </Link>
                )}
                {!step.done && <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <button onClick={dismiss} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          {t('dismiss')}
        </button>
      </div>
    </div>
  )
}
