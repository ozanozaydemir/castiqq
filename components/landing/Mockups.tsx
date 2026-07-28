import { CastiqqMark } from '@/components/brand/Logo'
import { Star, Check, Play, CalendarCheck, AlertTriangle, ArrowRight, FileText } from 'lucide-react'

/**
 * Landing sayfasındaki uygulama görselleri. Ekran görüntüsü yerine
 * gerçek bileşenlerle yeniden çizilmiş temsiller — böylece her ekranda
 * net kalıyor, dil değişince metin de değişiyor ve ürün geliştikçe
 * ekran görüntüsü tazelemek gerekmiyor.
 */

export function BrowserFrame({
  url,
  children,
  className = '',
}: {
  url: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-400/20 overflow-hidden bg-white ${className}`}>
      <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        <div className="flex-1 mx-4">
          <div className="bg-white border border-gray-200 rounded-md py-1 px-3 text-[11px] text-gray-400 text-center max-w-72 mx-auto truncate">
            {url}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}

function Sidebar({ items, active }: { items: string[]; active: string }) {
  return (
    <div className="hidden sm:flex w-40 border-r border-gray-100 bg-white flex-col p-3 shrink-0">
      <div className="flex items-center gap-2 px-2 py-2 mb-4">
        <CastiqqMark size={16} tone="light" />
        <span className="text-xs font-extrabold tracking-tight text-gray-900">
          Cast<span className="text-indigo-500">iqq</span>
        </span>
      </div>
      {items.map(label => {
        const on = label === active
        return (
          <div
            key={label}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] mb-0.5 font-medium ${
              on ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'
            }`}
          >
            <div className={`w-1.5 h-1.5 rounded-sm ${on ? 'bg-indigo-500' : 'bg-gray-200'}`} />
            {label}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 1. Cast direktörü — karar ekranı
// ─────────────────────────────────────────────────────────────

type Candidate = {
  name: string
  meta: string
  rating: number
  status: string
  statusTone: 'shortlist' | 'review' | 'pending'
  tags?: string[]
  note?: string
  videos?: number
}

const STATUS_TONES: Record<Candidate['statusTone'], string> = {
  shortlist: 'bg-indigo-50 text-indigo-600',
  review: 'bg-amber-50 text-amber-600',
  pending: 'bg-gray-100 text-gray-500',
}

export function ProductionBoard({
  labels,
  candidates,
}: {
  labels: {
    nav: string[]
    activeNav: string
    roleTitle: string
    roleSubtitle: string
    noteAuthor: string
    timestampNote: string
  }
  candidates: Candidate[]
}) {
  return (
    <div className="flex bg-white" style={{ minHeight: 460 }}>
      <Sidebar items={labels.nav} active={labels.activeNav} />

      <div className="flex-1 bg-[#f8f8f8] p-4 sm:p-5 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{labels.roleTitle}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{labels.roleSubtitle}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full bg-white border-2 border-white ring-1 ring-gray-200 -ml-2 first:ml-0" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {candidates.map((c, i) => (
            <div
              key={c.name}
              className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm"
              style={{ animation: `mockRise 0.5s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s both` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-gray-400">{c.meta}</p>
                    {c.tags && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-500 text-[9px] font-medium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={`w-2.5 h-2.5 ${s <= c.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_TONES[c.statusTone]}`}>
                    {c.status}
                  </span>
                  {c.videos && (
                    <span className="flex items-center gap-0.5 text-[9px] text-gray-400">
                      <Play className="w-2 h-2" /> {c.videos}
                    </span>
                  )}
                </div>
              </div>

              {c.note && (
                <div className="mt-2 pt-2 border-t border-gray-50 flex items-start gap-1.5">
                  <span className="text-[9px] font-semibold text-indigo-500 shrink-0 mt-px">
                    {labels.timestampNote}
                  </span>
                  <p className="text-[10px] text-gray-500 italic leading-snug">{c.note}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 2. Menajerlik — iş & tahsilat defteri
// ─────────────────────────────────────────────────────────────

type Job = {
  talent: string
  client: string
  date: string
  gross: string
  net: string
  status: string
  tone: 'paid' | 'partial' | 'pending' | 'overdue'
  synced?: boolean
}

const PAY_TONES: Record<Job['tone'], string> = {
  paid: 'bg-green-50 text-green-700',
  partial: 'bg-blue-50 text-blue-600',
  pending: 'bg-amber-50 text-amber-700',
  overdue: 'bg-red-50 text-red-600',
}

export function AgencyLedger({
  labels,
  jobs,
  stats,
}: {
  labels: {
    nav: string[]
    activeNav: string
    title: string
    subtitle: string
    grossLabel: string
    netLabel: string
  }
  jobs: Job[]
  stats: { label: string; value: string; tone?: 'warn' }[]
}) {
  return (
    <div className="flex bg-white" style={{ minHeight: 460 }}>
      <Sidebar items={labels.nav} active={labels.activeNav} />

      <div className="flex-1 bg-[#f8f8f8] p-4 sm:p-5 min-w-0">
        <p className="text-sm font-bold text-gray-900">{labels.title}</p>
        <p className="text-[11px] text-gray-400 mt-0.5 mb-4">{labels.subtitle}</p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="bg-white rounded-xl border border-gray-100 p-2.5"
              style={{ animation: `mockRise 0.5s cubic-bezier(0.22,1,0.36,1) ${0.06 * i}s both` }}
            >
              <p className={`text-sm font-bold leading-none ${s.tone === 'warn' ? 'text-red-500' : 'text-gray-900'}`}>
                {s.value}
              </p>
              <p className="text-[9px] text-gray-400 mt-1 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {jobs.map((j, i) => (
            <div
              key={j.talent + j.client}
              className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-gray-50 last:border-0"
              style={{ animation: `mockRise 0.5s cubic-bezier(0.22,1,0.36,1) ${0.1 + 0.07 * i}s both` }}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{j.talent}</p>
                  {j.synced && <CalendarCheck className="w-2.5 h-2.5 text-indigo-400 shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-400 truncate">{j.client} · {j.date}</p>
              </div>
              {/* Tutarlar her boyutta görünür: bu mockup'ın anlattığı şey
                  brüt/net farkı, breakpoint arkasına saklanamaz. */}
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-gray-900 leading-none whitespace-nowrap">{j.gross}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5 whitespace-nowrap">{labels.netLabel} {j.net}</p>
                </div>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full whitespace-nowrap ${PAY_TONES[j.tone]}`}>
                  {j.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 3. Teklif pipeline'ı
// ─────────────────────────────────────────────────────────────

export function PitchPipeline({
  columns,
}: {
  columns: { stage: string; tone: string; cards: { title: string; client: string; value?: string; talent?: number }[] }[]
}) {
  return (
    <div className="bg-[#f8f8f8] p-4 sm:p-5 overflow-x-auto">
      <div className="flex gap-3 min-w-max">
        {columns.map((col, ci) => (
          <div key={col.stage} className="w-44 shrink-0">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${col.tone}`}>{col.stage}</span>
              <span className="text-[9px] text-gray-400">{col.cards.length}</span>
            </div>
            <div className="space-y-2">
              {col.cards.map((card, i) => (
                <div
                  key={card.title}
                  className="bg-white rounded-xl border border-gray-100 p-2.5 shadow-sm"
                  style={{ animation: `mockRise 0.55s cubic-bezier(0.22,1,0.36,1) ${0.06 * ci + 0.08 * i}s both` }}
                >
                  <p className="text-[11px] font-semibold text-gray-900 leading-snug">{card.title}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{card.client}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {card.value && <span className="text-[9px] font-medium text-gray-600">{card.value}</span>}
                    {card.talent && (
                      <span className="text-[9px] text-gray-400">{card.talent} 👤</span>
                    )}
                  </div>
                </div>
              ))}
              {col.cards.length === 0 && (
                <div className="border border-dashed border-gray-200 rounded-xl py-5 text-center">
                  <span className="text-[10px] text-gray-300">—</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 4. Reklam yasağı çakışma uyarısı — motorun kendisi
// ─────────────────────────────────────────────────────────────

export function ConflictCard({
  title,
  detail,
  talent,
  role,
}: {
  title: string
  detail: string
  talent: string
  role: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-lg shadow-gray-200/60 max-w-sm">
      <div className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900">{talent}</p>
          <p className="text-[11px] text-gray-400">{role}</p>
        </div>
      </div>
      <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-px" />
        <div>
          <p className="text-[11px] font-semibold text-red-700">{title}</p>
          <p className="text-[10px] text-red-600 mt-0.5 leading-snug">{detail}</p>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 5. İki org arasındaki köprü akışı
// ─────────────────────────────────────────────────────────────

export function BridgeFlow({
  steps,
}: {
  steps: { actor: string; action: string; tone: 'production' | 'agency' }[]
}) {
  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.action} className="flex items-center gap-3 flex-1">
          <div
            className={`flex-1 rounded-2xl border p-4 ${
              s.tone === 'production'
                ? 'bg-white border-gray-200'
                : 'bg-indigo-50/50 border-indigo-100'
            }`}
            data-animate
            data-delay={String(Math.min(i + 1, 6))}
          >
            <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1.5 ${
              s.tone === 'production' ? 'text-gray-400' : 'text-indigo-500'
            }`}>
              {s.actor}
            </p>
            <p className="text-sm font-medium text-gray-800 leading-snug">{s.action}</p>
          </div>
          {i < steps.length - 1 && (
            <ArrowRight className="w-4 h-4 text-gray-300 shrink-0 rotate-90 lg:rotate-0" />
          )}
        </div>
      ))}
    </div>
  )
}

export function SubmissionPreview({
  labels,
  rows,
}: {
  labels: { title: string; subtitle: string; pdf: string }
  rows: { name: string; role: string; fee: string; decision: 'liked' | 'pending' }[]
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-200/60 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-gray-100">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{labels.title}</p>
          <p className="text-[11px] text-gray-400">{labels.subtitle}</p>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
          <FileText className="w-3 h-3" /> {labels.pdf}
        </span>
      </div>
      <div>
        {rows.map((r, i) => (
          <div
            key={r.name}
            className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0"
            style={{ animation: `mockRise 0.5s cubic-bezier(0.22,1,0.36,1) ${0.08 * i}s both` }}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-100 to-violet-100 shrink-0" />
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 truncate">{r.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{r.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] font-medium text-gray-700">{r.fee}</span>
              {r.decision === 'liked' ? (
                <span className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-600" />
                </span>
              ) : (
                <span className="w-5 h-5 rounded-full bg-gray-100" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
