'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

/**
 * İki modüllü konumlandırmanın landing'deki karşılığı. Ürün tek ama iki
 * ayrı iş akışı var; ziyaretçi kendi tarafını seçip yalnızca kendisini
 * ilgilendiren ekranı görüyor.
 *
 * Panel içerikleri server tarafında render edilip ReactNode olarak
 * geçiliyor — mockup'lar client bundle'ına girmiyor.
 */

export type ShowcaseTab = {
  key: string
  label: string
  sublabel: string
  headline: string
  description: string
  features: string[]
  panel: React.ReactNode
}

export function ModuleShowcase({ tabs }: { tabs: ShowcaseTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  const current = tabs.find(t => t.key === active) ?? tabs[0]

  return (
    <div>
      {/* Sekmeler */}
      <div className="flex justify-center mb-10 px-4">
        <div className="inline-flex bg-gray-100/80 p-1 rounded-2xl gap-1 max-w-full overflow-x-auto">
          {tabs.map(t => {
            const on = t.key === active
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                aria-pressed={on}
                className={`px-4 sm:px-6 py-2.5 rounded-xl text-left transition-all whitespace-nowrap ${
                  on ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                }`}
              >
                <span className={`block text-sm font-semibold ${on ? 'text-gray-900' : 'text-gray-500'}`}>
                  {t.label}
                </span>
                <span className={`block text-[11px] mt-0.5 ${on ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {t.sublabel}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Panel — key değişince yeniden mount olup giriş animasyonu tekrar oynuyor */}
      <div key={current.key} className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-10 lg:gap-12 items-center">
        <div style={{ animation: 'mockFade 0.45s ease-out both' }}>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-[-0.02em] text-gray-900 leading-tight">
            {current.headline}
          </h3>
          <p className="mt-3 text-gray-500 leading-relaxed">{current.description}</p>
          <ul className="mt-6 space-y-2.5">
            {current.features.map((f, i) => (
              <li
                key={f}
                className="flex items-start gap-2.5"
                style={{ animation: `mockRise 0.45s cubic-bezier(0.22,1,0.36,1) ${0.05 * i}s both` }}
              >
                <span className="w-4.5 h-4.5 mt-0.5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-indigo-600" />
                </span>
                <span className="text-sm text-gray-600 leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0" style={{ animation: 'mockFade 0.5s ease-out 0.06s both' }}>
          {current.panel}
        </div>
      </div>
    </div>
  )
}
