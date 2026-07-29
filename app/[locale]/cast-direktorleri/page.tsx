import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import { getTranslations } from 'next-intl/server'
import {
  ArrowRight, Check, Play, Wand2, Share2, AlertTriangle,
  FolderKanban, Link2, Star, ListChecks,
} from 'lucide-react'
import { AnimationInit } from '@/components/AnimationInit'
import { JsonLd } from '@/components/JsonLd'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { CastiqqLogo, CastiqqMark } from '@/components/brand/Logo'
import { BrowserFrame, ProductionBoard, SubmissionPreview } from '@/components/landing/Mockups'
import { faqSchema } from '@/lib/schema'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

type Props = { params: Promise<{ locale: string }> }
type Item = { title: string; desc: string }
type Faq = { q: string; a: string }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'castingDirectors.seo' })

  const isTr = locale !== 'en'
  const path = '/cast-direktorleri'
  const canonical = isTr ? `${SITE_URL}${path}` : `${SITE_URL}/en${path}`

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical,
      languages: {
        tr: `${SITE_URL}${path}`,
        en: `${SITE_URL}/en${path}`,
        'x-default': `${SITE_URL}${path}`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: canonical,
      type: 'website',
      siteName: 'Castiqq',
    },
  }
}

function SectionHead({ label, title, desc }: { label: string; title: string; desc?: string }) {
  return (
    <div className="max-w-2xl mb-12" data-animate>
      <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">{label}</p>
      <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-tight mb-4">{title}</h2>
      {desc && <p className="text-gray-500 leading-relaxed text-[17px]">{desc}</p>}
    </div>
  )
}

export default async function CastDirektorleriPage({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations('castingDirectors')
  const tl = await getTranslations('landing')

  const problems = t.raw('problem.items') as Item[]
  const steps = t.raw('workflow.steps') as Item[]
  const features = t.raw('features.items') as Item[]
  const faqs = t.raw('faq.items') as Faq[]
  const matchPoints = t.raw('matching.points') as string[]

  const isTr = locale !== 'en'
  const path = '/cast-direktorleri'
  const pageUrl = isTr ? `${SITE_URL}${path}` : `${SITE_URL}/en${path}`

  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Castiqq', item: isTr ? SITE_URL : `${SITE_URL}/en` },
      { '@type': 'ListItem', position: 2, name: t('breadcrumb'), item: pageUrl },
    ],
  }

  const STEP_ICONS = [FolderKanban, Link2, Star, ListChecks]

  const prodNav = ['dashboard', 'projects', 'roles', 'talent', 'lists'].map(k => tl(`mockup.nav.${k}`))
  const candidates = (tl.raw('mockup.candidates') as {
    name: string; meta: string; status: string; tags?: string[]; note?: string
  }[]).map((c, i) => ({
    ...c,
    rating: [5, 3, 0][i] ?? 0,
    statusTone: (['shortlist', 'review', 'pending'] as const)[i] ?? 'pending',
    videos: [2, 1, 1][i],
  }))

  return (
    <div className="min-h-screen bg-white text-[#11181c] overflow-x-hidden">
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqSchema(faqs)} />
      <AnimationInit />

      {/* ── NAV ── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Castiqq">
            <CastiqqLogo size={26} tone="light" />
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link href="/giris" className="hidden sm:block px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {tl('nav.login')}
            </Link>
            <Link
              href="/kayit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              {tl('hero.freeBadge')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-glow pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <nav aria-label="breadcrumb" className="mb-6">
            <ol className="flex items-center justify-center gap-2 text-xs text-gray-400">
              <li><Link href="/" className="hover:text-gray-600">Castiqq</Link></li>
              <li aria-hidden>/</li>
              <li className="text-gray-600 font-medium">{t('breadcrumb')}</li>
            </ol>
          </nav>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600 tracking-wide">{t('hero.label')}</span>
          </div>

          <h1 className="text-[2.5rem] sm:text-5xl md:text-6xl font-extrabold tracking-[-0.035em] leading-[1.06] mb-6">
            {t('hero.title')}
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-9">{t('hero.subtitle')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kayit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              {t('hero.cta')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#nasil-calisir"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-2xl transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              {t('hero.ctaSecondary')}
            </a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-14 px-2" data-animate>
          <BrowserFrame url="castiqq.app/roller/kirik-kanatlar">
            <ProductionBoard
              labels={{
                nav: prodNav,
                activeNav: tl('mockup.nav.roles'),
                roleTitle: tl('mockup.roleTitle'),
                roleSubtitle: tl('mockup.roleSubtitle'),
                noteAuthor: tl('mockup.noteAuthor'),
                timestampNote: tl('mockup.timestampLabel'),
              }}
              candidates={candidates}
            />
          </BrowserFrame>
        </div>
      </section>

      {/* ── PROBLEM ── */}
      <section className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <SectionHead label={t('problem.label')} title={t('problem.title')} desc={t('problem.intro')} />
          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((p, i) => (
              <div key={p.title} className="bg-white rounded-2xl border border-gray-200 p-6" data-animate data-delay={String(i + 1)}>
                <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{p.title}</h3>
                <p className="text-[15px] text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AKIŞ ── */}
      <section id="nasil-calisir" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <SectionHead label={t('workflow.label')} title={t('workflow.title')} />
          <ol className="space-y-10">
            {steps.map((s, i) => {
              const Icon = STEP_ICONS[i] ?? FolderKanban
              return (
                <li key={s.title} className="flex gap-5" data-animate data-delay={String(i + 1)}>
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-indigo-500" />
                    </div>
                    {i < steps.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-2" />}
                  </div>
                  <div className="pb-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">
                      {String(i + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-[15px] text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* ── EŞLEŞTİRME ── */}
      <section className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">{t('matching.label')}</p>
            <h2 className="text-3xl font-extrabold tracking-[-0.03em] leading-tight mb-4">{t('matching.title')}</h2>
            <p className="text-gray-500 leading-relaxed text-[17px] mb-7">{t('matching.desc')}</p>
            <ul className="space-y-3">
              {matchPoints.map((p, i) => (
                <li key={p} className="flex items-start gap-2.5" data-animate data-delay={String(i + 1)}>
                  <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </span>
                  <span className="text-[15px] text-gray-600">{p}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center" data-animate data-delay="2">
            <div className="w-20 h-20 rounded-3xl bg-white border border-gray-200 flex items-center justify-center shadow-lg shadow-gray-200/60">
              <Wand2 className="w-9 h-9 text-indigo-500" />
            </div>
          </div>
        </div>
      </section>

      {/* ── KÖPRÜ ── */}
      <section className="py-24 px-6 bg-[#0f0f1a] relative overflow-hidden">
        <div
          className="absolute -top-40 -right-24 w-[520px] h-[520px] rounded-full opacity-20 blur-2xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)' }}
        />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-2 gap-12 items-center">
          <div data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#a5b4fc] mb-3">{t('bridge.label')}</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white leading-tight mb-5">
              {t('bridge.title')}
            </h2>
            <p className="text-[#c7c9f5] leading-relaxed text-[17px]">{t('bridge.desc')}</p>
            <div className="flex items-start gap-2.5 mt-6 bg-white/[0.06] border border-white/10 rounded-2xl p-4">
              <Share2 className="w-4 h-4 text-[#a5b4fc] shrink-0 mt-0.5" />
              <p className="text-sm text-white/60 leading-relaxed">{t('bridge.note')}</p>
            </div>
          </div>
          <div data-animate data-delay="2">
            <SubmissionPreview
              labels={{
                title: tl('bridge.submission.title'),
                subtitle: tl('bridge.submission.subtitle'),
                pdf: tl('bridge.submission.pdf'),
              }}
              rows={tl.raw('bridge.submission.rows') as { name: string; role: string; fee: string; decision: 'liked' | 'pending' }[]}
            />
          </div>
        </div>
      </section>

      {/* ── ÖZELLİKLER ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <SectionHead label={t('features.label')} title={t('features.title')} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
                data-animate
                data-delay={String((i % 6) + 1)}
              >
                <h3 className="font-bold text-gray-900 mb-1.5">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SSS ── */}
      <section className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-3xl mx-auto">
          <SectionHead label={t('faq.label')} title={t('faq.title')} />
          <dl className="divide-y divide-gray-200 border-y border-gray-200">
            {faqs.map((item, i) => (
              <div key={item.q} className="py-6" data-animate data-delay={String((i % 6) + 1)}>
                <dt className="text-base font-bold text-gray-900 mb-2">{item.q}</dt>
                <dd className="text-[15px] text-gray-600 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 bg-[#0f0f1a] relative overflow-hidden">
        <div
          className="absolute -bottom-40 -left-24 w-[520px] h-[520px] rounded-full opacity-20 blur-2xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)' }}
        />
        <div className="max-w-2xl mx-auto text-center relative" data-animate>
          <CastiqqMark size={44} tone="dark" className="mx-auto mb-7" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white leading-tight mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-[#c7c9f5] leading-relaxed mb-9">{t('cta.desc')}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kayit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              {t('cta.primary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="w-full sm:w-auto flex items-center justify-center px-7 py-3.5 border border-white/15 hover:border-white/30 text-white font-semibold rounded-2xl transition-colors"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0f0f1a] border-t border-white/5 px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <CastiqqLogo size={22} tone="dark" />
          <p className="text-xs text-white/30">© {new Date().getFullYear()} Castiqq. {tl('footer.rights')}</p>
          <div className="flex items-center gap-4">
            <Link href="/gizlilik" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {tl('footer.privacy')}
            </Link>
            <Link href="/kullanim-kosullari" className="text-xs text-white/40 hover:text-white/70 transition-colors">
              {tl('footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
