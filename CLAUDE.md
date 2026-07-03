# CastFlow — Claude Çalışma Kılavuzu

## Ürün
Yapım şirketleri, casting ajansları ve serbest cast direktörlerinin kullandığı casting yönetim platformu.

**Temel akış:** Cast direktörü → Proje açar → Rol tanımlar → Oyuncuları davet eder → Oyuncular video yükler → Ekip izler ve karar verir → Final seçim

**Domain:** `castiqq.app`
**GitHub:** `github.com/ozanozaydemir/castiqq` (main branch)

## Teknoloji Stack
- **Next.js 16** App Router (Turbopack)
- **React 19**
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` block)
- **Supabase** (auth + db + storage)
  - `@supabase/ssr` — server/client helpers
  - RLS ile multi-tenant tenant isolation
- **TypeScript** strict mode
- **lucide-react** — ikonlar
- **date-fns** — tarih formatlama (`tr` locale)
- **@dnd-kit** — audition tablosunda sürükle-bırak sıralama
- **next-intl 4.13.1** — i18n (TR varsayılan, EN `/en/` prefix'li)
- **@polar-sh/nextjs** — ödeme & abonelik (Merchant of Record)
- **resend** — transaksiyonel email
- **next-sitemap** — `postbuild`'de sitemap.xml + robots.txt üretimi
- **posthog-js** — analytics (EU Cloud, GDPR-uyumlu)

## Mimari

### Multi-tenant
- Her kayıt olan kullanıcı bir `organization` oluşturur
- DB trigger (`handle_new_auth_user`) signup'ta otomatik org+profile yaratır
- RLS: `get_user_org_id()` helper ile her tablo kendi tenant verisini izole eder

### Auth Akışı
1. `/kayit` → `supabase.auth.signUp()` + `org_name` + `full_name` metadata
2. DB trigger → org INSERT → profile INSERT (admin)
3. Email doğrulama linki → `/auth/callback` → session exchange → `/dashboard`
4. `/giris` → password login → `/dashboard`

### Supabase Clients
- `lib/supabase/server.ts` — Server Components & Route Handlers
- `lib/supabase/client.ts` — Client Components
- `lib/supabase/admin.ts` — Service role (davet, fallback org oluşturma)

### `requireOrg()` Helper
`lib/require-org.ts` — tüm server action'larda kullanılır, `{ supabase, userId, orgId }` döner.

### i18n Yapısı
- `i18n/routing.ts` — `localePrefix: 'as-needed'`, TR default (prefix yok), EN `/en/` prefix alır
- `i18n/request.ts` — `getRequestConfig`, mesaj dosyalarını yükler
- `i18n/navigation.ts` — locale-aware `Link`, `redirect`, `useRouter`, `usePathname`
- `middleware.ts` — next-intl middleware, locale tespiti + yönlendirme
- `messages/tr.json` + `messages/en.json` — tüm UI metinleri
- Server'da `getTranslations('namespace')`, client'ta `useTranslations('namespace')`
- **Yeni sayfa eklerken:** `@/i18n/navigation`'dan `Link`/`redirect` kullan, `next/navigation`'dan değil

### Route Yapısı
```
app/
  layout.tsx              ← <html lang={locale}>, PostHogProvider
  [locale]/
    layout.tsx            ← NextIntlClientProvider, generateMetadata (hreflang+OG)
    opengraph-image.tsx   ← Edge runtime, 1200×630 OG görseli
    page.tsx              ← Landing page (JSON-LD SoftwareApplication)
    giris/
    kayit/
    sifremi-unuttum/
    sifremi-sifirla/
    gizlilik/             ← KVKK + GDPR gizlilik politikası (TR+EN)
    kullanim-kosullari/   ← Kullanım koşulları (TR+EN)
    oyuncu/
      layout.tsx
      [token]/            ← Public video yükleme sayfası
        page.tsx
        UploadSection.tsx ← Client component
    (app)/                ← Auth guard, AppShell, OrgProvider
      layout.tsx          ← Auth check + fallback org creation
      dashboard/
      projeler/
      roller/
      oyuncular/
      listeler/           ← Özel oyuncu listeleri (collections)
      ayarlar/
        page.tsx          ← PlanCard + org/profil/şifre formları
        ekip/             ← Ekip davet & yönetimi
  auth/callback/          ← Email confirm + code exchange
  api/
    checkout/             ← Polar checkout session
    portal/               ← Polar customer portal redirect
    webhook/polar/        ← Polar webhook handler
    upload-url/           ← R2 presigned URL üretme
    video-complete/       ← Video yükleme tamamlama + storage sayacı
    script/[token]/       ← Senaryo indirme
```

### Org Context
`lib/org-context.tsx` — `OrgProvider` + `useOrgId()` hook

### CSS Kalıpları
- `.sb-input` — form input
- `.sb-btn-primary` — ana buton (indigo)
- `.sb-btn-secondary` — ikincil buton
- `.sb-card` — kart container
- `.sb-table` — tablo stili
- Brand: `#6366f1` (indigo-500)

### DB Tabloları
- `organizations` — tenant root
  - `subscription_plan` TEXT CHECK: `starter|pro|agency|trial`
  - `subscription_status` TEXT CHECK: `active|canceled|past_due|incomplete`
  - `polar_customer_id` TEXT — Polar müşteri ID'si
  - `polar_subscription_id` TEXT — aktif abonelik ID'si
  - `subscription_ends_at` TIMESTAMPTZ
  - `storage_used_bytes` BIGINT DEFAULT 0 — toplam video depolama (migration 021)
- `profiles` — user ↔ org, role: admin|member|viewer
- `projects` — casting projeleri
- `project_roles` — proje içindeki roller/karakterler
- `talent` — oyuncu veritabanı
- `auditions` — rol+oyuncu başvuruları
  - `notes_updated_by` / `notes_updated_at` — not yazar takibi (migration 015)
  - `rating` SMALLINT CHECK 1–5 — yıldız puanı (migration 019)
- `audition_videos` — audition videoları
  - `duration_seconds` — client'ta `HTMLVideoElement.duration` ile okunur
  - `file_size_bytes` BIGINT — depolama takibi için (migration 021)
- `tags` — org bazlı serbest etiketler (migration 016)
- `audition_tags` — audition ↔ tag çoka-çok (migration 016)
- `collections` — direktörün oluşturduğu özel oyuncu listeleri (migration 017)
- `collection_items` — collection ↔ talent çoka-çok (migration 017)
- `video_notes` — video timestamp'e bağlı notlar (migration 018)

### Supabase RPC Fonksiyonları
- `get_user_org_id()` — RLS helper, her tabloda kullanılır
- `increment_storage(org_id UUID, bytes BIGINT)` — atomic depolama sayacı (SECURITY DEFINER, migration 021)

## Supabase Migration Sırası
1. `supabase/schema.sql` — temel tablolar + RLS
2. `supabase/migrations/001_auth_trigger.sql` — auth trigger (yeni kayıtta org+profile)
3. `supabase/storage.sql` — storage bucket + policy
4. `supabase/migrations/002_proje_module.sql`
5. `supabase/migrations/003_talent_module.sql`
6. `supabase/migrations/004_grants.sql`
7. `supabase/migrations/005_audition_tokens.sql`
8. `supabase/migrations/006_audition_sort_order.sql`
9. `supabase/migrations/007_scripts_bucket.sql`
10. `supabase/migrations/008_talent_photos.sql`
11. `supabase/migrations/009_candidate_status.sql`
12. `supabase/migrations/010_talent_fee.sql`
13. `supabase/migrations/011_fix_role_status.sql` — status: open|casting|filled|cancelled
14. `supabase/migrations/012_service_role_grants.sql`
15. `supabase/migrations/013_fix_submitted_at_default.sql`
16. `supabase/migrations/014_invite_trigger.sql` — ekip davetinde doğru org'a yerleştir
17. `supabase/migrations/015_audition_notes_author.sql` — not yazar takibi FK
18. `supabase/migrations/016_tags.sql` — tags + audition_tags tabloları
19. `supabase/migrations/017_collections.sql` — collections + collection_items tabloları
20. `supabase/migrations/018_video_notes.sql` — video_notes tablosu
21. `supabase/migrations/019_audition_rating.sql` — auditions.rating (1–5 yıldız)
22. `supabase/migrations/020_polar_billing.sql` — Polar kolonları + subscription plan/status CHECK güncelleme
23. `supabase/migrations/021_storage_tracking.sql` — file_size_bytes + storage_used_bytes + increment_storage()

**Kritik:** Migration'lar sırayla uygulanmalı. 015 olmadan roller/[id] sayfası `profiles!auditions_notes_author_fkey` join'i nedeniyle tüm auditions sorgusunu kırıyor.

## Environment Variables (`.env.local`)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Site
NEXT_PUBLIC_SITE_URL=https://castiqq.app   # localhost:3000 for dev

# Cloudflare R2 (video storage)
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET_NAME=castiqq-videos
NEXT_PUBLIC_R2_PUBLIC_URL

# Resend (email)
RESEND_API_KEY

# PostHog Analytics (EU Cloud)
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com

# Polar Billing
POLAR_ACCESS_TOKEN
POLAR_WEBHOOK_SECRET
POLAR_SERVER=sandbox                        # production'da: production
POLAR_PRO_PRODUCT_ID
POLAR_AGENCY_PRODUCT_ID
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID
NEXT_PUBLIC_POLAR_AGENCY_PRODUCT_ID
```

## Implement Edilmiş Özellikler

### Ayarlar
- Org adı düzenleme (`OrgForm`), profil düzenleme (`ProfilForm`), şifre değiştirme (`SifreForm`)
- Ekip yönetimi: `/ayarlar/ekip` — Supabase admin invite API, `EkipClient`
- **Plan kartı (`PlanCard`):** mevcut plan badge'i, depolama bilgisi, Pro/Ajans upgrade butonları (Polar checkout), "Aboneliği Yönet" → `/api/portal`

### Dashboard
- 5 stat kartı (aktif proje, açık rol, oyuncu, aday, bekleyen audition)
- Son eklenen oyuncular + son projeler paneli
- 7 günlük deadline uyarı banner'ı
- **Depolama progress bar:** plan limitine göre renk değiştirir (sarı ≥75%, kırmızı ≥90%)

### Projeler
- CRUD, arşivleme + arşivden geri alma (Aktifleştir butonu)
- Proje detayında rol listesi + audition sayaçları

### Roller
- Rol durumu: `open|casting|filled|cancelled` — `RolStatusSelect` ile inline değişim
- Roller liste sayfasında proje filtresi (dropdown), durum, cinsiyet, arama, sıralama
- Sayfalama (Pagination component)

### Auditions / Adaylar
- Sürükle-bırak sıralama (dnd-kit)
- Status dropdown inline
- **Yıldız puanı (1–5):** `auditions.rating` kolonu, migration 019
- Video izleme modal (`VideoModal`):
  - Not presetleri: ✓ Güçlü performans, ~ Yönlendirmeye açık, ✗ Casting dışı vb.
  - Etiket paneli (tag autocomplete + yeni tag oluşturma, org bazlı)
  - Timestamp notu (videonun o anına bağlı not, tıklanınca video o ana atlar)
  - Not kaydetme (author + timestamp tracking)
- Audition tablosunda tag chip'leri oyuncu adının altında
- Not göstergesi icon (hover'da yazar bilgisi)
- Audition İste modal: WhatsApp linki üretme

### Oyuncu (Talent) Profili
- Fiziksel özellikler, diller, deneyim, eğitim, medya, ücret bilgisi
- Fotoğraf galerisi (kapak fotoğrafı önde)
- Availability selector (müsait/meşgul/uygun değil)
- Audition geçmişi: video sayısı badge + not satırı
- "Listeye Ekle" butonu → mevcut listeden seçme veya yeni liste oluşturma

### Listeler (Collections)
- `/listeler` — özel oyuncu listelerini yönet (oluştur, sil)
- `/listeler/[id]` — liste detayı, oyuncu kaldırma
- Oyuncu profilinden herhangi bir listeye tek tıkla ekleme

### Video Upload (Public)
- `/oyuncu/[token]` — şifresiz public sayfa
- `organization_id` gerçek org'dan geliyor (placeholder UUID yok)
- `duration_seconds` client'ta `HTMLVideoElement.duration` ile okunup DB'ye yazılıyor
- `file_size_bytes` upload sırasında `file.size`'dan alınıp `/api/video-complete`'e gönderilir
- GDPR notu + gizlilik politikası linki sayfada gösterilir

### Billing (Polar)
- `lib/polar.ts` — Polar SDK singleton (`POLAR_ACCESS_TOKEN` + `POLAR_SERVER`)
- `lib/plan.ts` — `Plan` type, `PLAN_LIMITS` (maxUsers, storageGB, label), product ID helpers
- `/api/checkout` — Polar checkout, `customerExternalId=orgId`, success → `/dashboard?upgraded=1`
- `/api/portal` — `polar.customerSessions.create()` → customer portal URL'e redirect
- `/api/webhook/polar` — `subscription.created/updated/canceled/revoked` eventlerini işler, organizations tablosunu günceller
- Planlar: `starter` (ücretsiz, 10GB, 1 kullanıcı), `pro` ($39/ay, 200GB, 3 kullanıcı), `agency` ($99/ay, 1TB, sınırsız)

### Email (Resend)
- `lib/resend.ts` — 3 branded HTML şablonu:
  - `sendWelcomeEmail(to, name)` — signup sonrası hoş geldin
  - `sendTeamInviteEmail(to, orgName, inviteUrl)` — ekip daveti
  - `sendAuditionInviteEmail(to, talentName, roleName, projectTitle, uploadUrl)` — oyuncuya audition daveti
- FROM: `CastFlow <noreply@castiqq.app>`
- Supabase Auth SMTP → Resend SMTP (smtp.resend.com:465) ile bağlanacak

### Analytics (PostHog)
- `components/PostHogProvider.tsx` — EU Cloud init, yalnızca cookie onayı sonrası aktif
- `autocapture: false`, `person_profiles: 'identified_only'`
- `components/CookieConsent.tsx` — GDPR banner, localStorage'da `castflow_cookie_consent` key

### SEO & Altyapı
- **Security headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy (`next.config.ts`)
- **Sitemap:** `next-sitemap.config.js` — `postbuild` script, TR/EN hreflang, `/dashboard` ve tüm app route'ları `disallow`
- **OG Image:** `app/[locale]/opengraph-image.tsx` — Edge runtime, 1200×630, indigo gradient
- **JSON-LD:** `components/JsonLd.tsx` — landing'de `SoftwareApplication` şeması
- **hreflang:** `app/[locale]/layout.tsx`'te `generateMetadata`'dan `alternates.languages`
- **Gizlilik:** `/gizlilik` — KVKK + GDPR (TR+EN, sub-processors: Supabase, R2, Vercel, PostHog)
- **Koşullar:** `/kullanim-kosullari` — Polar MoR (vergi Polar'ın sorumluluğu), Türk hukuku

### Cloudflare R2 (Video Storage)
- Supabase Storage yerine R2: $0.015/GB/ay depolama, **$0 egress**
- Bucket: `castiqq-videos`, public URL: `NEXT_PUBLIC_R2_PUBLIC_URL`
- Upload akışı: client → `/api/upload-url` (presigned URL) → R2 (XHR) → `/api/video-complete` (DB kayıt)
- Fotoğraflar hâlâ Supabase Storage'da

## Önemli Kurallar
- Yeni sayfa eklerken Server Component + `createClient()` from server
- RLS her zaman `organization_id = get_user_org_id()` pattern'ini kullan
- Admin işlemler için `createAdminClient()` kullan
- Yeni tablo eklerken `organization_id` foreign key + RLS policy + GRANT TO authenticated zorunlu
- Server action'larda `requireOrg()` kullan — doğrudan `createClient()` değil
- Supabase hata objesi `console.error` ile `{}` gösterir — `error.message`, `error.code`, `error.hint` ayrı logla
- i18n linkleri `next/navigation`'dan değil `@/i18n/navigation`'dan import et
- Yeni UI metni eklerken hem `messages/tr.json` hem `messages/en.json`'a ekle

## Roadmap — Henüz Yapılmadı
- **Sentry** — `@sentry/nextjs` kurulumu + DSN (Vercel'e env var eklenecek)
- **Plan enforcement middleware** — pro/agency gerektiren rotalarda plan kontrolü
- **Rate limiting** — `/api/upload-url` ve `/api/checkout`'ta (Upstash Redis)
- **Onboarding flow** — ilk girişte hoş geldin checklist'i dashboard'da
- **Resend entegrasyonu** — `sendWelcomeEmail`'i `/kayit` action'ından çağır
- **Referral programı** — planlı
