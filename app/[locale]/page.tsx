import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import {
  Clapperboard, ArrowRight, Film, Users, Video,
  Check, Zap, Shield, Star, Tag, Bookmark,
  MessageCircle, GripVertical, Clock, Globe,
  UserPlus, BarChart3, X, Play, Layout,
} from 'lucide-react'
import { AnimationInit } from '@/components/AnimationInit'
import { JsonLd } from '@/components/JsonLd'
import { getTranslations } from 'next-intl/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  const t = await getTranslations('landing')
  const ta = await getTranslations('auth')

  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CastFlow',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: 'Casting yönetim platformu — proje, rol ve oyuncu yönetimi tek sistemde.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: '14 gün ücretsiz deneme',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      ratingCount: '47',
    },
  }

  const FEATURES = [
    {
      icon: Film,
      title: t('features.items.projectManagement.title'),
      desc: t('features.items.projectManagement.desc'),
      color: 'bg-indigo-50 text-indigo-500',
    },
    {
      icon: Users,
      title: t('features.items.talentDb.title'),
      desc: t('features.items.talentDb.desc'),
      color: 'bg-violet-50 text-violet-500',
    },
    {
      icon: Video,
      title: t('features.items.multiVideo.title'),
      desc: t('features.items.multiVideo.desc'),
      color: 'bg-blue-50 text-blue-500',
    },
    {
      icon: Star,
      title: t('features.items.starRating.title'),
      desc: t('features.items.starRating.desc'),
      color: 'bg-amber-50 text-amber-500',
    },
    {
      icon: Tag,
      title: t('features.items.tags.title'),
      desc: t('features.items.tags.desc'),
      color: 'bg-orange-50 text-orange-500',
    },
    {
      icon: Bookmark,
      title: t('features.items.collections.title'),
      desc: t('features.items.collections.desc'),
      color: 'bg-pink-50 text-pink-500',
    },
    {
      icon: Clock,
      title: t('features.items.timestampNotes.title'),
      desc: t('features.items.timestampNotes.desc'),
      color: 'bg-teal-50 text-teal-500',
    },
    {
      icon: MessageCircle,
      title: t('features.items.whatsapp.title'),
      desc: t('features.items.whatsapp.desc'),
      color: 'bg-green-50 text-green-500',
    },
    {
      icon: GripVertical,
      title: t('features.items.dnd.title'),
      desc: t('features.items.dnd.desc'),
      color: 'bg-sky-50 text-sky-500',
    },
    {
      icon: UserPlus,
      title: t('features.items.teamAccess.title'),
      desc: t('features.items.teamAccess.desc'),
      color: 'bg-lime-50 text-lime-600',
    },
    {
      icon: Layout,
      title: t('features.items.dashboard.title'),
      desc: t('features.items.dashboard.desc'),
      color: 'bg-cyan-50 text-cyan-500',
    },
    {
      icon: Shield,
      title: t('features.items.security.title'),
      desc: t('features.items.security.desc'),
      color: 'bg-rose-50 text-rose-500',
    },
  ]

  const PLANS = [
    {
      name: t('pricing.plans.starter.name'),
      price: t('pricing.free'),
      period: '',
      desc: t('pricing.plans.starter.desc'),
      cta: t('pricing.cta'),
      href: '/kayit',
      popular: false,
      include: t.raw('pricing.plans.starter.include') as string[],
      exclude: t.raw('pricing.plans.starter.exclude') as string[],
    },
    {
      name: t('pricing.plans.pro.name'),
      price: '$39',
      period: t('pricing.perMonth'),
      desc: t('pricing.plans.pro.desc'),
      cta: t('pricing.trialCta'),
      href: '/kayit',
      popular: true,
      include: t.raw('pricing.plans.pro.include') as string[],
      exclude: t.raw('pricing.plans.pro.exclude') as string[],
    },
    {
      name: t('pricing.plans.agency.name'),
      price: '$99',
      period: t('pricing.perMonth'),
      desc: t('pricing.plans.agency.desc'),
      cta: t('pricing.trialCta'),
      href: '/kayit',
      popular: false,
      include: t.raw('pricing.plans.agency.include') as string[],
      exclude: t.raw('pricing.plans.agency.exclude') as string[],
    },
  ]

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden" style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}>
      <JsonLd data={jsonLd} />
      <AnimationInit />

      {/* ── NAV ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-500/30">
              <Clapperboard className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg tracking-tight">CastFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: t('nav.features'), href: '#ozellikler' },
              { label: t('nav.pricing'),  href: '#fiyatlar' },
              { label: t('nav.howItWorks'), href: '#nasil-calisir' },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/giris"
              className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              {t('nav.login')}
            </Link>
            <Link href="/kayit"
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-indigo-500/25 hover:-translate-y-0.5">
              {t('hero.freeBadge')}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="hero-glow pt-36 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span className="text-xs font-semibold text-indigo-600 tracking-wide">
              {t('hero.badge')}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.04] mb-6">
            {t('hero.title')}
            <br />
            <span className="gradient-text">{t('hero.titleGradient')}</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-500 leading-relaxed max-w-2xl mx-auto mb-10">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
            <Link href="/kayit"
              className="flex items-center gap-2 px-7 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/45 hover:-translate-y-0.5">
              {t('hero.ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="#ozellikler"
              className="flex items-center gap-2 px-7 py-3.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 font-semibold rounded-xl transition-all hover:bg-gray-50">
              {t('hero.ctaSecondary')}
            </a>
          </div>
          <p className="text-sm text-gray-400">{t('hero.disclaimer')}</p>
        </div>

        {/* ── HERO MOCKUP ── */}
        <div className="max-w-5xl mx-auto mt-16 relative px-4">

          {/* Floating badge — rating */}
          <div className="hidden lg:flex absolute -left-8 top-28 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-amber-500 text-lg leading-none">★</span>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.ratedLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.ratedSub')}</p>
            </div>
          </div>

          {/* Floating badge — video uploaded */}
          <div className="hidden lg:flex absolute -right-8 top-44 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float-delay">
            <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <Check className="w-4.5 h-4.5 text-green-500" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.uploadedLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.uploadedSub')}</p>
            </div>
          </div>

          {/* Floating badge — WhatsApp */}
          <div className="hidden lg:flex absolute -left-6 bottom-20 z-20 items-center gap-3 bg-white rounded-2xl px-4 py-2.5 shadow-xl shadow-gray-200/80 border border-gray-100 animate-float-slow">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-gray-900 leading-tight">{t('floatingBadge.inviteLabel')}</p>
              <p className="text-[9px] text-gray-400 mt-0.5">{t('floatingBadge.inviteSub')}</p>
            </div>
          </div>

          {/* Browser frame */}
          <div className="rounded-2xl border border-gray-200/80 shadow-2xl shadow-gray-400/20 overflow-hidden">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-4">
                <div className="bg-white border border-gray-200 rounded-md py-1 px-3 text-[11px] text-gray-400 text-center max-w-64 mx-auto">
                  castiqq.app/roller/kuzey-yildizi
                </div>
              </div>
            </div>

            {/* App UI */}
            <div className="flex bg-white relative overflow-hidden" style={{ height: '520px' }}>

              {/* Sidebar */}
              <div className="hidden sm:flex w-44 border-r border-gray-100 bg-white flex-col p-3 shrink-0">
                <div className="flex items-center gap-2 px-2 py-2 mb-4">
                  <div className="w-5 h-5 bg-indigo-500 rounded-md flex items-center justify-center">
                    <Clapperboard className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-bold text-gray-900">CastFlow</span>
                </div>
                <p className="text-[9px] font-semibold text-gray-300 uppercase tracking-widest px-2 mb-2">{t('mockup.management')}</p>
                {[
                  { label: 'Dashboard', active: false },
                  { label: 'Projeler',  active: false },
                  { label: 'Roller',    active: true },
                  { label: 'Oyuncular', active: false },
                  { label: 'Listeler',  active: false },
                  { label: 'Ayarlar',   active: false },
                ].map(({ label, active }) => (
                  <div key={label}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] mb-0.5 font-medium ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400'}`}>
                    <div className={`w-2 h-2 rounded-sm ${active ? 'bg-indigo-500' : 'bg-gray-200'}`} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Background page (blurred) */}
              <div className="flex-1 bg-[#f8f8f8] p-4 overflow-hidden relative">
                <div className="text-sm font-bold text-gray-900 mb-0.5">{t('mockup.roleTitle')}</div>
                <div className="text-[10px] text-gray-400 mb-3">{t('mockup.roleSubtitle')}</div>
                {[
                  { name: 'Ayşe Kaya',   rating: 4, status: t('mockup.shortlist'),  sc: 'bg-indigo-50 text-indigo-600' },
                  { name: 'Can Demir',   rating: 3, status: t('mockup.reviewing'),  sc: 'bg-yellow-50 text-yellow-700' },
                  { name: 'Zeynep Er',   rating: 0, status: t('mockup.waiting'),    sc: 'bg-gray-100 text-gray-400' },
                  { name: 'Ali Yılmaz',  rating: 0, status: t('mockup.waiting'),    sc: 'bg-gray-100 text-gray-400' },
                  { name: 'Merve Çelik', rating: 2, status: t('mockup.reviewing'),  sc: 'bg-yellow-50 text-yellow-700' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg p-2 mb-1.5 border border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex-shrink-0 flex items-center justify-center">
                      <span className="text-[8px] font-bold text-indigo-600">{a.name[0]}</span>
                    </div>
                    <span className="text-[10px] font-medium text-gray-700 flex-1 truncate">{a.name}</span>
                    <div className="flex gap-0.5 shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-[9px] ${a.rating >= s ? 'text-amber-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <span className={`shrink-0 text-[8px] px-1.5 py-0.5 rounded-md font-medium ${a.sc}`}>{a.status}</span>
                  </div>
                ))}
              </div>

              {/* VIDEO REVIEW MODAL OVERLAY */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-5">
                <div
                  className="bg-[#0f0f11] rounded-2xl flex overflow-hidden border border-white/[0.06] shadow-2xl w-full"
                  style={{ maxWidth: '680px', height: '440px' }}
                >
                  {/* Left: Video */}
                  <div className="flex-1 flex flex-col p-4 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                          <span className="text-[10px] font-bold text-indigo-400">AK</span>
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold text-white leading-tight">Ayşe Kaya</p>
                          <p className="text-[9px] text-white/30 mt-0.5">{t('mockup.candidateOf')}</p>
                        </div>
                      </div>
                      <span className="text-[9px] text-white/25 bg-white/5 px-2 py-1 rounded-lg">{t('mockup.videoCount')}</span>
                    </div>

                    {/* Video tabs */}
                    <div className="flex gap-1.5 mb-3">
                      {['Video 1', 'Video 2', 'Video 3'].map((v, i) => (
                        <div key={v}
                          className={`px-3 py-1 rounded-lg text-[9px] font-semibold cursor-pointer ${
                            i === 0 ? 'bg-indigo-500 text-white' : 'bg-white/8 text-white/30'
                          }`}>
                          {v}
                        </div>
                      ))}
                    </div>

                    {/* Video player */}
                    <div className="flex-1 bg-black rounded-xl flex items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0" style={{
                        background: 'linear-gradient(160deg, rgba(40,20,80,0.6) 0%, rgba(8,8,12,0.95) 100%)',
                      }} />
                      <div className="w-12 h-12 bg-white/15 rounded-full flex items-center justify-center backdrop-blur-sm z-10 border border-white/20">
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 z-10">
                        <div className="flex items-center justify-between text-[8px] text-white/30 mb-1">
                          <span>0:42</span><span>2:15</span>
                        </div>
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: '31%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Review panel */}
                  <div className="w-52 border-l border-white/[0.06] p-4 flex flex-col gap-3 shrink-0">
                    {/* Rating */}
                    <div>
                      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">{t('mockup.ratingLabel')}</p>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(i => (
                          <span key={i} className={`text-base leading-none ${i <= 4 ? 'text-amber-400' : 'text-white/15'}`}>★</span>
                        ))}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">{t('mockup.statusLabel')}</p>
                      <div className="bg-indigo-500/15 border border-indigo-500/25 rounded-lg px-2.5 py-1.5 text-[10px] text-indigo-400 font-medium">
                        {t('mockup.shortlist')} ↓
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">{t('mockup.tagsLabel')}</p>
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/20 rounded-md text-[8px] text-indigo-400">güçlü performans</span>
                        <span className="px-2 py-0.5 bg-indigo-500/15 border border-indigo-500/20 rounded-md text-[8px] text-indigo-400">kamera dostu</span>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">{t('mockup.noteLabel')}</p>
                      <div className="bg-white/[0.04] rounded-lg p-2.5 text-[8px] text-white/50 leading-relaxed">
                        {t('mockup.noteText')}
                      </div>
                    </div>

                    {/* Timestamp note */}
                    <div>
                      <p className="text-[8px] font-semibold text-white/25 uppercase tracking-widest mb-1.5">{t('mockup.timestampLabel')}</p>
                      <div className="flex gap-2 items-start">
                        <span className="text-indigo-400 text-[8px] font-mono shrink-0 mt-px">0:42</span>
                        <span className="text-[8px] text-white/40 leading-relaxed">{t('mockup.timestampNote')}</span>
                      </div>
                    </div>

                    {/* Re-audition */}
                    <div className="mt-auto pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5 px-2.5 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-[9px] text-green-400 font-medium cursor-pointer">
                        <MessageCircle className="w-3 h-3" />
                        {t('mockup.reAuditionBtn')}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Floating tags below */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {[
              t('heroTags.videoReview'),
              t('heroTags.starRating'),
              t('heroTags.timestampNotes'),
              t('heroTags.whatsapp'),
              t('heroTags.teamCollab'),
            ].map(tag => (
              <span key={tag} className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-xs text-gray-500 font-medium">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────── */}
      <section className="border-y border-gray-100 py-14 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '500+',   label: t('stats.activeProductions') },
            { value: '45K+',   label: t('stats.appliedTalent') },
            { value: '8.000+', label: t('stats.definedRoles') },
            { value: '12K+',   label: t('stats.finalSelections') },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-black text-gray-900 mb-1">{value}</div>
              <div className="text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────── */}
      <section id="ozellikler" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16" data-animate>
            <p className="text-sm font-semibold text-indigo-500 tracking-widest uppercase mb-3">{t('features.sectionLabel')}</p>
            <h2 className="text-4xl font-black tracking-tight mb-4">{t('features.title')}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {t('features.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color }, i) => (
              <div key={title}
                data-animate
                data-delay={String((i % 3) + 1)}
                className="feature-card p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200">
                <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── VIDEO REVIEW SPOTLIGHT ───────────────────── */}
      <section className="py-24 px-6 bg-[#09090b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-50"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 25% 50%, rgba(99,102,241,0.25), transparent)' }} />
        <div className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(ellipse 40% 50% at 80% 60%, rgba(139,92,246,0.2), transparent)' }} />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div data-animate>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-6">
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-xs font-semibold text-indigo-400">{t('videoSpotlight.badge')}</span>
              </div>
              <h2 className="text-4xl font-black text-white leading-tight mb-6">
                {t('videoSpotlight.title')}<br />{t('videoSpotlight.titleLine2')}<br />
                <span className="gradient-text">{t('videoSpotlight.titleGradient')}</span>
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-8">
                {t('videoSpotlight.subtitle')}
              </p>
              <ul className="space-y-3.5">
                {[
                  t('videoSpotlight.checkItems.multiVideo'),
                  t('videoSpotlight.checkItems.timestampNote'),
                  t('videoSpotlight.checkItems.starRating'),
                  t('videoSpotlight.checkItems.orgTags'),
                  t('videoSpotlight.checkItems.whatsapp'),
                ].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-indigo-400" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right side mini mockup */}
            <div data-animate data-delay="2">
              <div className="bg-[#141416] rounded-2xl border border-white/[0.07] overflow-hidden shadow-2xl">
                {/* Audition list header */}
                <div className="px-5 py-4 border-b border-white/[0.06]">
                  <p className="text-sm font-semibold text-white">{t('mockup.roleTitle')}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{t('mockup.rankingSubtitle')}</p>
                </div>
                {/* Audition rows */}
                {[
                  { name: 'Ayşe Kaya',   rating: 5, status: t('mockup.shortlist'),  badge: 'text-indigo-400 bg-indigo-500/10' },
                  { name: 'Can Demir',   rating: 4, status: t('mockup.reviewing'),  badge: 'text-yellow-400 bg-yellow-500/10' },
                  { name: 'Zeynep Er',   rating: 3, status: t('mockup.reviewing'),  badge: 'text-yellow-400 bg-yellow-500/10' },
                  { name: 'Merve Çelik', rating: 2, status: t('mockup.waiting'),    badge: 'text-white/30 bg-white/5' },
                  { name: 'Ali Yılmaz',  rating: 1, status: t('mockup.waiting'),    badge: 'text-white/30 bg-white/5' },
                ].map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-5 py-3 border-b border-white/[0.04] last:border-0 ${i === 0 ? 'bg-indigo-500/5' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-white/50">{a.name[0]}{a.name.split(' ')[1][0]}</span>
                    </div>
                    <span className="text-xs font-medium text-white/80 flex-1">{a.name}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <span key={s} className={`text-xs ${s <= a.rating ? 'text-amber-400' : 'text-white/10'}`}>★</span>
                      ))}
                    </div>
                    <span className={`text-[9px] px-2 py-1 rounded-md font-medium ${a.badge}`}>{a.status}</span>
                  </div>
                ))}
                {/* Bottom hint */}
                <div className="px-5 py-3 bg-indigo-500/5 border-t border-indigo-500/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] text-indigo-400">{t('mockup.reAuditionFooter')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────── */}
      <section id="nasil-calisir" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16" data-animate>
            <p className="text-sm font-semibold text-indigo-500 tracking-widest uppercase mb-3">{t('howItWorks.sectionLabel')}</p>
            <h2 className="text-4xl font-black tracking-tight">{t('howItWorks.title')}</h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />
            {(
              [
                t.raw('howItWorks.steps.s1') as { step: string; title: string; desc: string },
                t.raw('howItWorks.steps.s2') as { step: string; title: string; desc: string },
                t.raw('howItWorks.steps.s3') as { step: string; title: string; desc: string },
                t.raw('howItWorks.steps.s4') as { step: string; title: string; desc: string },
              ]
            ).map(({ step, title, desc }, i) => (
              <div key={step} className="text-center relative" data-animate data-delay={String(i + 1)}>
                <div className="w-16 h-16 bg-white border-2 border-indigo-200 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm relative z-10">
                  <span className="text-lg font-black text-indigo-500">{step}</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────── */}
      <section id="fiyatlar" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16" data-animate>
            <p className="text-sm font-semibold text-indigo-500 tracking-widest uppercase mb-3">{t('pricing.sectionLabel')}</p>
            <h2 className="text-4xl font-black tracking-tight mb-4">{t('pricing.title')}</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {PLANS.map(({ name, price, period, desc, cta, href, popular, include, exclude }, i) => (
              <div
                key={name}
                data-animate
                data-delay={String(i + 1)}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  popular
                    ? 'bg-indigo-500 text-white pricing-popular-ring'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-md">
                      {t('pricing.popular')}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className={`text-lg font-bold mb-1 ${popular ? 'text-white' : 'text-gray-900'}`}>{name}</h3>
                  <p className={`text-sm mb-5 ${popular ? 'text-indigo-200' : 'text-gray-400'}`}>{desc}</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-4xl font-black ${popular ? 'text-white' : 'text-gray-900'}`}>{price}</span>
                    {period && <span className={`text-sm mb-1 ${popular ? 'text-indigo-200' : 'text-gray-400'}`}>{period}</span>}
                  </div>
                </div>

                <Link href={href}
                  className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm mb-7 transition-all ${
                    popular
                      ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}>
                  {cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {include.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${popular ? 'text-indigo-200' : 'text-indigo-500'}`} />
                      <span className={popular ? 'text-indigo-100' : 'text-gray-600'}>{item}</span>
                    </li>
                  ))}
                  {exclude.map(item => (
                    <li key={item} className="flex items-start gap-2.5 text-sm">
                      <X className={`w-4 h-4 mt-0.5 shrink-0 ${popular ? 'text-indigo-300/60' : 'text-gray-300'}`} />
                      <span className={popular ? 'text-indigo-200/50' : 'text-gray-300'}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Extra storage note */}
          <p className="text-center text-sm text-gray-400 mt-8" data-animate>
            {t('pricing.extraStorage')}
            <span className="text-gray-600 font-medium"> {t('pricing.extraStorageDetail')}</span>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────── */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center" data-animate>
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-2xl font-semibold text-gray-900 leading-relaxed mb-8">
            &ldquo;{t('testimonial.quote')}{' '}
            <span className="text-indigo-500">{t('testimonial.quoteHighlight')}</span>&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600 text-sm">
              ZY
            </div>
            <div className="text-left">
              <div className="font-semibold text-gray-900 text-sm">{t('testimonial.name')}</div>
              <div className="text-gray-400 text-xs">{t('testimonial.role')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA DARK ────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#09090b] relative overflow-hidden">
        <div className="absolute inset-0 opacity-35"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(99,102,241,0.45), transparent)' }} />
        <div className="max-w-2xl mx-auto text-center relative z-10" data-animate>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            {t('cta.title')}
            <br />
            <span className="gradient-text">{t('cta.titleGradient')}</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10">
            {t('cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/kayit"
              className="flex items-center gap-2 px-8 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:-translate-y-0.5">
              {t('cta.ctaPrimary')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/giris"
              className="px-7 py-3.5 text-gray-400 hover:text-white font-medium rounded-xl transition-colors">
              {t('cta.ctaLogin')}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10">
            {[
              t('cta.items.trial'),
              t('cta.items.noSetup'),
              t('cta.items.cancel'),
            ].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-sm text-gray-500">
                <Check className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────── */}
      <footer className="bg-[#09090b] border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Clapperboard className="w-3 h-3 text-white" />
            </div>
            <span className="font-bold text-white text-sm">CastFlow</span>
          </div>
          <p className="text-gray-600 text-xs">© {new Date().getFullYear()} CastFlow. {t('footer.rights')}</p>
          <div className="flex items-center gap-4">
            {[
              { label: t('footer.privacy'), href: '#' },
              { label: t('footer.terms'), href: '#' },
            ].map(item => (
              <a key={item.label} href={item.href} className="text-xs text-gray-600 hover:text-gray-400 transition-colors">{item.label}</a>
            ))}
          </div>
        </div>
      </footer>

    </div>
  )
}
