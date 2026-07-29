import createMiddleware from 'next-intl/middleware'
import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // /api ve /auth: [locale] segmentinin dışında yaşıyorlar — next-intl'in
  // i18n routing'i bu path'leri locale'li bir sayfa sanıp yanlış rewrite
  // ediyor (404'e yol açıyor). Bu route'larda i18n routing'i tamamen atla.
  const isNonLocaleRoute = pathname.startsWith('/api/') || pathname.startsWith('/auth/')
  const response = isNonLocaleRoute ? NextResponse.next() : handleI18nRouting(request)

  // Step 2: Supabase session refresh — piggyback cookies onto the i18n response
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (supabaseUrl && supabaseKey) {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })
    await supabase.auth.getUser()
  }

  return response
}

export const config = {
  matcher: [
    // Uzantılı her dosyayı (robots.txt, sitemap.xml, görseller, manifest…)
    // ve _next içeriklerini middleware'in tamamen dışında bırak.
    //
    // Eski desen yalnızca birkaç görsel uzantısını hariç tutuyordu; bu
    // yüzden /robots.txt ve /sitemap.xml next-intl tarafından locale'li
    // bir sayfa sanılıp 404 HTML olarak dönüyordu — yani arama motorları
    // ne index kurallarını ne de sitemap'i okuyabiliyordu.
    '/((?!_next/|.*\\..*).*)',
  ],
}
