import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import {
  ArrowRight, Check, Star, Play, Sparkles, Users2, Building2,
  Video, Wand2, Link2, Calculator, Contact, GitBranch, FileCheck2,
  CalendarCheck, Shield, Languages, FileSpreadsheet, UserCog, Share2,
} from 'lucide-react'
import { AnimationInit } from '@/components/AnimationInit'
import { JsonLd } from '@/components/JsonLd'
import { organizationSchema, websiteSchema, softwareApplicationSchema, faqSchema } from '@/lib/schema'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { CastiqqLogo, CastiqqMark } from '@/components/brand/Logo'
import { ModuleShowcase, type ShowcaseTab } from '@/components/landing/ModuleShowcase'
import {
  BrowserFrame, ProductionBoard, AgencyLedger, PitchPipeline,
  ConflictCard, BridgeFlow, SubmissionPreview,
} from '@/components/landing/Mockups'
import { getTranslations } from 'next-intl/server'
import { resolveHomePath } from '@/lib/home-path'

type RawCandidate = { name: string; meta: string; status: string; tags?: string[]; note?: string }
type RawJob = { talent: string; client: string; date: string; gross: string; net: string; status: string; tone: 'paid' | 'partial' | 'pending' | 'overdue' }
type RawCard = { title: string; client: string; value: string; stage: string }
type RawStep = { actor: string; action: string }
type RawBenefit = { title: string; desc: string }
type RawFaq = { q: string; a: string }
type RawRow = { name: string; role: string; fee: string; decision: 'liked' | 'pending' }
type RawHowStep = { title: string; desc: string }
type RawStat = { label: string; value: string }

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(await resolveHomePath(supabase, user.id))

  const t = await getTranslations('landing')

  const tSeo = await getTranslations('seo')
  const faqItems = t.raw('faq.items') as RawFaq[]

  // Tek bir @graph yerine ayrı ayrı veriliyor: her biri kendi @id'siyle
  // birbirine referans veriyor, doğrulayıcılarda daha okunaklı.
  const schemas = [
    organizationSchema(tSeo('homeDescription')),
    websiteSchema(tSeo('homeTitle'), tSeo('homeDescription'), locale),
    softwareApplicationSchema({
      description: tSeo('homeDescription'),
      plans: [
        { name: t('pricing.plans.pro.name'), price: 1999 },
        { name: t('pricing.plans.agency.name'), price: 4999 },
      ],
    }),
    faqSchema(faqItems),
  ]

  // ── Mockup verileri i18n'den geliyor: dil değişince ekranlar da değişiyor,
  //    ekran görüntüsü tazelemek gerekmiyor. ──
  const candidates = (t.raw('mockup.candidates') as RawCandidate[]).map((c, i) => ({
    ...c,
    rating: [5, 3, 0][i] ?? 0,
    statusTone: (['shortlist', 'review', 'pending'] as const)[i] ?? 'pending',
    videos: [2, 1, 1][i],
  }))

  const ledger = t.raw('mockup.ledger') as {
    title: string; subtitle: string; grossLabel: string; netLabel: string
    stats: RawStat[]; jobs: RawJob[]
  }

  const pipelineCards = t.raw('mockup.pipeline.cards') as RawCard[]
  const STAGE_TONES: Record<string, string> = {
    brief: 'bg-gray-100 text-gray-600',
    pitched: 'bg-blue-50 text-blue-600',
    option: 'bg-purple-50 text-purple-600',
    contract: 'bg-indigo-50 text-indigo-600',
  }
  const pipelineColumns = (['brief', 'pitched', 'option', 'contract'] as const).map(stage => ({
    stage: t(`mockup.pipeline.stages.${stage}`),
    tone: STAGE_TONES[stage],
    cards: pipelineCards
      .filter(c => c.stage === stage)
      .map(c => ({ title: c.title, client: c.client, value: c.value })),
  }))

  const prodNav = ['dashboard', 'projects', 'roles', 'talent', 'lists'].map(k => t(`mockup.nav.${k}`))
  const agencyNav = ['overview', 'roster', 'jobs', 'clients', 'pitches'].map(k => t(`mockup.nav.${k}`))

  const productionBoard = (
    <ProductionBoard
      labels={{
        nav: prodNav,
        activeNav: t('mockup.nav.roles'),
        roleTitle: t('mockup.roleTitle'),
        roleSubtitle: t('mockup.roleSubtitle'),
        noteAuthor: t('mockup.noteAuthor'),
        timestampNote: t('mockup.timestampLabel'),
      }}
      candidates={candidates}
    />
  )

  const showcaseTabs: ShowcaseTab[] = [
    {
      key: 'production',
      label: t('modules.production.label'),
      sublabel: t('modules.production.sublabel'),
      headline: t('modules.production.headline'),
      description: t('modules.production.description'),
      features: t.raw('modules.production.features') as string[],
      panel: <BrowserFrame url="castiqq.app/roller/kirik-kanatlar">{productionBoard}</BrowserFrame>,
    },
    {
      key: 'agency',
      label: t('modules.agency.label'),
      sublabel: t('modules.agency.sublabel'),
      headline: t('modules.agency.headline'),
      description: t('modules.agency.description'),
      features: t.raw('modules.agency.features') as string[],
      panel: (
        <BrowserFrame url="castiqq.app/isler">
          <AgencyLedger
            labels={{
              nav: agencyNav,
              activeNav: t('mockup.nav.jobs'),
              title: ledger.title,
              subtitle: ledger.subtitle,
              grossLabel: ledger.grossLabel,
              netLabel: ledger.netLabel,
            }}
            stats={ledger.stats.map((s, i) => ({ ...s, tone: i === 2 ? ('warn' as const) : undefined }))}
            jobs={ledger.jobs}
          />
        </BrowserFrame>
      ),
    },
  ]

  const FEATURES = [
    { key: 'videoReview', icon: Video,           tone: 'bg-indigo-50 text-indigo-500' },
    { key: 'matching',    icon: Wand2,           tone: 'bg-violet-50 text-violet-500' },
    { key: 'publicApply', icon: Link2,           tone: 'bg-blue-50 text-blue-500' },
    { key: 'financials',  icon: Calculator,      tone: 'bg-emerald-50 text-emerald-600' },
    { key: 'crm',         icon: Contact,         tone: 'bg-amber-50 text-amber-600' },
    { key: 'roleShare',   icon: Share2,          tone: 'bg-indigo-50 text-indigo-500' },
    { key: 'pipeline',    icon: GitBranch,       tone: 'bg-purple-50 text-purple-500' },
    { key: 'documents',   icon: FileCheck2,      tone: 'bg-rose-50 text-rose-500' },
    { key: 'calendar',    icon: CalendarCheck,   tone: 'bg-sky-50 text-sky-500' },
    { key: 'team',        icon: UserCog,         tone: 'bg-teal-50 text-teal-500' },
    { key: 'i18n',        icon: Languages,       tone: 'bg-cyan-50 text-cyan-500' },
    { key: 'export',      icon: FileSpreadsheet, tone: 'bg-lime-50 text-lime-600' },
    { key: 'security',    icon: Shield,          tone: 'bg-gray-100 text-gray-500' },
  ]

  const PLANS = [
    { key: 'pro' as const,    price: '₺1.999', icon: Building2 },
    { key: 'agency' as const, price: '₺4.999', icon: Users2 },
  ]

  const navLinks = [
    { label: t('nav.castingDirectors'), href: '/cast-direktorleri', internal: true },
    { label: t('nav.modules'),     href: '#kimler-icin' },
    { label: t('nav.bridge'),      href: '#baglanti' },
    { label: t('nav.features'),    href: '#ozellikler' },
    { label: t('nav.howItWorks'),  href: '#nasil-calisir' },
    { label: t('nav.pricing'),     href: '#fiyatlar' },
  ]

  return (
    <div className="min-h-screen bg-white text-[#11181c] overflow-x-hidden">
      {schemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <AnimationInit />

      {/* ── NAV ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" aria-label="Castiqq">
            <CastiqqLogo size={26} tone="light" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href, internal }) =>
              internal ? (
                <Link
                  key={label}
                  href={href}
                  className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {label}
                </Link>
              ) : (
                <a
                  key={label}
                  href={href}
                  className="px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {label}
                </a>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              href="/giris"
              className="hidden sm:block px-3.5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              href="/kayit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              {t('hero.freeBadge')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="hero-glow pt-36 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600 tracking-wide">{t('hero.badge')}</span>
          </div>

          <h1 className="text-[2.75rem] sm:text-6xl md:text-7xl font-extrabold tracking-[-0.035em] leading-[1.05] mb-6">
            {t('hero.title')}
            <br />
            <span className="gradient-text">{t('hero.titleGradient')}</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed mb-9">{t('hero.subtitle')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kayit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:-translate-y-0.5"
            >
              {t('hero.ctaPrimary')}
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

          <p className="text-xs text-gray-400 mt-5">{t('hero.disclaimer')}</p>
        </div>

        {/* Hero mockup */}
        <div className="max-w-5xl mx-auto mt-16 relative px-2">
          <div className="hidden lg:flex absolute -left-6 top-24 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.ratedLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.ratedSub')}</p>
            </div>
          </div>

          <div className="hidden lg:flex absolute -right-6 top-40 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float-delay">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.uploadedLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.uploadedSub')}</p>
            </div>
          </div>

          <div className="hidden lg:flex absolute -left-4 bottom-16 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float-slow">
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
              <Calculator className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.inviteLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.inviteSub')}</p>
            </div>
          </div>

          <BrowserFrame url="castiqq.app/roller/kirik-kanatlar">{productionBoard}</BrowserFrame>
        </div>
      </section>

      {/* ── MODÜLLER ────────────────────────────────── */}
      <section id="kimler-icin" className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('modules.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-4">{t('modules.title')}</h2>
            <p className="text-gray-500 leading-relaxed">{t('modules.subtitle')}</p>
          </div>

          <ModuleShowcase tabs={showcaseTabs} />
        </div>
      </section>

      {/* ── KÖPRÜ — Castiqq'i ayıran şey, o yüzden modüllerin hemen
              ardında ve koyu zeminde: sayfanın görsel ağırlık merkezi. ── */}
      <section id="baglanti" className="py-28 px-6 bg-[#0f0f1a] relative overflow-hidden">
        <div
          className="absolute -top-52 left-1/2 -translate-x-1/2 w-[760px] h-[520px] rounded-full opacity-20 blur-2xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)' }}
        />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto mb-14" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-[#a5b4fc] mb-3">
              {t('bridge.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-[-0.03em] text-white leading-[1.1] mb-5">
              {t('bridge.title')}
            </h2>
            <p className="text-[#c7c9f5] leading-relaxed text-lg">{t('bridge.subtitle')}</p>
          </div>

          <BridgeFlow
            dark
            steps={(t.raw('bridge.steps') as RawStep[]).map((s, i) => ({
              ...s,
              tone: i === 1 ? ('agency' as const) : ('production' as const),
            }))}
          />

          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] gap-10 items-center mt-16">
            <ul className="space-y-5">
              {(t.raw('bridge.benefits') as RawBenefit[]).map((b, i) => (
                <li key={b.title} className="flex items-start gap-3" data-animate data-delay={String(i + 1)}>
                  <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-[#a5b4fc]" />
                  </span>
                  <div>
                    <p className="text-white font-semibold">{b.title}</p>
                    <p className="text-sm text-white/60 mt-1 leading-relaxed">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div data-animate data-delay="3">
              <SubmissionPreview
                labels={{
                  title: t('bridge.submission.title'),
                  subtitle: t('bridge.submission.subtitle'),
                  pdf: t('bridge.submission.pdf'),
                }}
                rows={t.raw('bridge.submission.rows') as RawRow[]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── TEKLİF PIPELINE'I ───────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-12 items-center">
          <div data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('features.items.pipeline.title')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-tight mb-4">
              {t('modules.agency.headline')}
            </h2>
            <p className="text-gray-500 leading-relaxed">{t('features.items.pipeline.desc')}</p>

            <div className="mt-8 grid sm:grid-cols-2 gap-3">
              {['crm', 'financials'].map((k, i) => (
                <div key={k} className="rounded-2xl border border-gray-200 p-4" data-animate data-delay={String(i + 1)}>
                  <p className="text-sm font-semibold text-gray-900">{t(`features.items.${k}.title`)}</p>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{t(`features.items.${k}.desc`)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0" data-animate data-delay="1">
            <div className="rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-300/20 overflow-hidden bg-white">
              <PitchPipeline columns={pipelineColumns} />
            </div>
          </div>
        </div>
      </section>

      {/* ── ÇAKIŞMA MOTORU ──────────────────────────── */}
      <section className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100 relative overflow-hidden">
        <div
          className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full opacity-10 blur-2xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)' }}
        />
        <div className="max-w-6xl mx-auto relative grid lg:grid-cols-2 gap-14 items-center">
          <div data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('conflict.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] leading-tight mb-5">
              {t('conflict.title')}
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8">{t('conflict.subtitle')}</p>

            <ul className="space-y-3">
              {(t.raw('conflict.points') as string[]).map((p, i) => (
                <li key={p} className="flex items-start gap-2.5" data-animate data-delay={String(i + 1)}>
                  <span className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-indigo-600" />
                  </span>
                  <span className="text-sm text-gray-600">{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end" data-animate data-delay="2">
            <ConflictCard
              talent={t('conflict.cardTalent')}
              role={t('conflict.cardRole')}
              title={t('conflict.cardTitle')}
              detail={t('conflict.cardDetail')}
            />
          </div>
        </div>
      </section>

      {/* ── ÖZELLİKLER ──────────────────────────────── */}
      <section id="ozellikler" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('features.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-4">{t('features.title')}</h2>
            <p className="text-gray-500 leading-relaxed">{t('features.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ key, icon: Icon, tone }, i) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all"
                data-animate
                data-delay={String((i % 6) + 1)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1.5">{t(`features.items.${key}.title`)}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t(`features.items.${key}.desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NASIL ÇALIŞIR ───────────────────────────── */}
      <section id="nasil-calisir" className="py-24 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('howItWorks.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em]">{t('howItWorks.title')}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {(t.raw('howItWorks.steps') as RawHowStep[]).map((s, i) => (
              <div key={s.title} data-animate data-delay={String(i + 1)}>
                <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center font-extrabold text-indigo-500 mb-4 shadow-sm">
                  {i + 1}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FİYATLAR ────────────────────────────────── */}
      <section id="fiyatlar" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-14" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('pricing.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] mb-4">{t('pricing.title')}</h2>
            <p className="text-gray-500 leading-relaxed">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map(({ key, price, icon: Icon }, i) => {
              const include = t.raw(`pricing.plans.${key}.include`) as string[]
              return (
                <div
                  key={key}
                  className="relative rounded-3xl p-7 bg-white border border-gray-200 hover:border-indigo-200 transition-colors"
                  data-animate
                  data-delay={String(i + 1)}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-indigo-500" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 leading-tight">{t(`pricing.plans.${key}.name`)}</h3>
                      <p className="text-xs text-gray-400">{t(`pricing.plans.${key}.desc`)}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold tracking-[-0.03em] text-gray-900">{price}</span>
                    <span className="text-sm text-gray-400">{t('pricing.perMonth')}</span>
                  </div>

                  <Link
                    href="/kayit"
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm transition-all bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  >
                    {t('pricing.trialCta')}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <ul className="mt-7 space-y-2.5">
                    {include.map(f => (
                      <li key={f} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-600">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── REFERANS ────────────────────────────────── */}
      <section className="py-20 px-6 bg-[#f8f8f8] border-y border-gray-100">
        <div className="max-w-3xl mx-auto text-center" data-animate>
          <Sparkles className="w-6 h-6 text-indigo-400 mx-auto mb-6" />
          <blockquote className="text-xl sm:text-2xl font-semibold tracking-[-0.02em] text-gray-900 leading-snug">
            “{t('testimonial.quote')}”
          </blockquote>
          <p className="mt-6 text-sm text-gray-500">
            {t('testimonial.author')} · <span className="text-gray-400">{t('testimonial.role')}</span>
          </p>
        </div>
      </section>

      {/* ── SSS ─────────────────────────────────────────
          İçerik açılır-kapanır değil, doğrudan DOM'da: hem arama motoru
          hem de yapay zekâ asistanları gizlenmemiş metni güvenilir
          okuyor. FAQPage şeması bu içerikle birebir aynı. ── */}
      <section id="sss" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14" data-animate>
            <p className="text-[13px] font-semibold uppercase tracking-[0.05em] text-indigo-600 mb-3">
              {t('faq.sectionLabel')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em]">{t('faq.title')}</h2>
          </div>

          <dl className="divide-y divide-gray-100 border-y border-gray-100">
            {faqItems.map((item, i) => (
              <div key={item.q} className="py-6" data-animate data-delay={String((i % 6) + 1)}>
                <dt className="text-base font-bold text-gray-900 mb-2">{item.q}</dt>
                <dd className="text-[15px] text-gray-600 leading-relaxed">{item.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0f0f1a] relative overflow-hidden">
        <div
          className="absolute -bottom-40 -right-32 w-[520px] h-[520px] rounded-full opacity-20 blur-2xl"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6,#a78bfa)' }}
        />
        <div className="max-w-2xl mx-auto text-center relative" data-animate>
          <CastiqqMark size={44} tone="dark" className="mx-auto mb-7" />
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-[-0.03em] text-white leading-tight mb-4">
            {t('cta.title')}
          </h2>
          <p className="text-[#c7c9f5] leading-relaxed mb-9">{t('cta.subtitle')}</p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/kayit"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-2xl transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              {t('cta.primary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/giris"
              className="w-full sm:w-auto flex items-center justify-center px-7 py-3.5 border border-white/15 hover:border-white/30 text-white font-semibold rounded-2xl transition-colors"
            >
              {t('cta.secondary')}
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="bg-[#0f0f1a] border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="max-w-xs">
              <CastiqqLogo size={24} tone="dark" />
              <p className="text-sm text-white/40 mt-3 leading-relaxed">{t('footer.tagline')}</p>
            </div>

            <div className="flex gap-14">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/30 mb-3">
                  {t('footer.product')}
                </p>
                <ul className="space-y-2">
                  {navLinks.map(l => (
                    <li key={l.label}>
                      {l.internal ? (
                        <Link href={l.href} className="text-sm text-white/50 hover:text-white/80 transition-colors">
                          {l.label}
                        </Link>
                      ) : (
                        <a href={l.href} className="text-sm text-white/50 hover:text-white/80 transition-colors">
                          {l.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-white/30 mb-3">
                  {t('footer.legal')}
                </p>
                <ul className="space-y-2">
                  <li>
                    <Link href="/gizlilik" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                      {t('footer.privacy')}
                    </Link>
                  </li>
                  <li>
                    <Link href="/kullanim-kosullari" className="text-sm text-white/50 hover:text-white/80 transition-colors">
                      {t('footer.terms')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} Castiqq. {t('footer.rights')}
            </p>
            <p className="text-xs text-white/30">castiqq.app</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
