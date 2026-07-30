import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Link } from '@/i18n/navigation'
import { ArrowRight, Film, Briefcase } from 'lucide-react'
import { AnimationInit } from '@/components/AnimationInit'
import { JsonLd } from '@/components/JsonLd'
import { organizationSchema, websiteSchema, softwareApplicationSchema } from '@/lib/schema'
import { CastiqqLogo } from '@/components/brand/Logo'
import { getTranslations } from 'next-intl/server'
import { resolveHomePath } from '@/lib/home-path'

export default async function GatewayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect(await resolveHomePath(supabase, user.id))

  const t = await getTranslations('gateway')
  const tl = await getTranslations('landing')
  const tSeo = await getTranslations('seo')

  const schemas = [
    organizationSchema(tSeo('homeDescription')),
    websiteSchema(tSeo('homeTitle'), tSeo('homeDescription'), locale),
    softwareApplicationSchema({
      description: tSeo('homeDescription'),
      plans: [
        { name: 'Cast Direktörü', price: 1999 },
        { name: 'Menajerlik Ajansı', price: 4999 },
      ],
    }),
  ]

  return (
    <div className="min-h-screen bg-white text-[#11181c] flex flex-col">
      {schemas.map((schema, i) => <JsonLd key={i} data={schema} />)}
      <AnimationInit />

      {/* ── HEADER ── */}
      <header className="px-6 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <CastiqqLogo size={24} tone="light" />
          <Link
            href="/giris"
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            {tl('nav.login')}
          </Link>
        </div>
      </header>

      {/* ── GATEWAY ── */}
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="max-w-4xl mx-auto w-full">
          <div className="text-center mb-14" data-animate>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-xs font-semibold text-indigo-600 tracking-wide">{t('hero.badge')}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-[-0.035em] mb-4">
              {t('hero.title')}
            </h1>
            <p className="text-lg text-gray-500 max-w-md mx-auto leading-relaxed">
              {t('hero.subtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Cast Direktörü */}
            <Link
              href="/cast-direktorleri"
              className="group relative rounded-3xl border-2 border-gray-200 hover:border-indigo-400 bg-white p-8 transition-all hover:shadow-xl hover:shadow-indigo-100/60 hover:-translate-y-1"
              data-animate
              data-delay="1"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
                <Film className="w-6 h-6 text-indigo-500" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-500 mb-2">
                {t('cards.director.sublabel')}
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                {t('cards.director.label')}
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
                {t('cards.director.desc')}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 group-hover:gap-3 transition-all">
                {t('cards.director.cta')}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>

            {/* Menajerlik Ajansı */}
            <Link
              href="/menajerlik-ajanslari"
              className="group relative rounded-3xl border-2 border-gray-200 hover:border-violet-400 bg-white p-8 transition-all hover:shadow-xl hover:shadow-violet-100/60 hover:-translate-y-1"
              data-animate
              data-delay="2"
            >
              <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-violet-500" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-violet-500 mb-2">
                {t('cards.agency.sublabel')}
              </p>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-3">
                {t('cards.agency.label')}
              </h2>
              <p className="text-[15px] text-gray-500 leading-relaxed mb-8">
                {t('cards.agency.desc')}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-violet-600 group-hover:gap-3 transition-all">
                {t('cards.agency.cta')}
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </div>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="px-6 py-6 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Castiqq. {tl('footer.rights')}
          </p>
          <div className="flex items-center gap-4">
            <Link href="/gizlilik" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {tl('footer.privacy')}
            </Link>
            <Link href="/kullanim-kosullari" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {tl('footer.terms')}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
