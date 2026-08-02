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
- **@xyflow/react** — rol ilişki diyagramı canvas'ı (yalnızca ilgili tab'da dynamic import, `ssr: false`)
- **dagre** — diyagramda otomatik hiyerarşik yerleşim (aile ağacı / org şeması)
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
  - `subscription_plan` TEXT CHECK: `pro|agency` — NULL = henüz abone olunmamış (deneme/ilk kayıt)
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
- `role_scripts` — rol başına senaryo havuzu (migration 059). Tek `script_url` kolonunun yerini aldı; etiket, sıra ve boyut taşıyor
- `audition_scripts` — davet başına senaryo seçimi. **Yetkilendirme sınırı burası:** `/api/script/[token]/[scriptId]` senaryonun role ait olmasına değil, o davete gönderilmiş olmasına bakar
- `video_purge_queue` — R2 silme kuyruğu. DB ile nesne deposu arasındaki sıralama tuzağını çözüyor: yol önce kuyruğa yazılır, DB satırı silinir, R2 en son temizlenir; başarısızlar yeniden denenir
- `role_relationships` — roller arası tipli graf kenarları (migration 058)
  - `type`: `spouse|partner|sibling|friend|rival` (simetrik) + `parent|manager|other` (yönlü)
  - Simetrik tipler **tek satır** olarak saklanır; `canonicalize_role_relationship()` trigger'ı uçları `from < to` sırasına sokar, unique index ters yönlü kopyayı da yakalar
  - Düğüm konumları `project_roles.diagram_x` / `diagram_y` (NULL = otomatik yerleşim)

### Supabase RPC Fonksiyonları
- `get_user_org_id()` — RLS helper, her tabloda kullanılır
- `increment_storage(...)` — **KALDIRILDI** (migration 055). SECURITY DEFINER + `anon`'a açıktı; kimliksiz biri herhangi bir org'un sayacını şişirip o hesabı upload'a kilitleyebiliyordu. Sayaç 053'te trigger'a taşındığı için tamamen silindi.
- `sync_org_storage()` — `audition_videos` üzerindeki INSERT/UPDATE/DELETE trigger'ı, `organizations.storage_used_bytes`'ı senkron tutar (SECURITY DEFINER, migration 053). Cascade silmede de çalışır — `org_update` RLS politikası admin şartı koştuğu için SECURITY DEFINER zorunlu. REST API'den çağrılamaz (055'te EXECUTE revoke edildi).

**Not:** Yeni SECURITY DEFINER fonksiyon eklerken `anon`/`authenticated` EXECUTE yetkisini revoke et — Supabase varsayılan olarak RPC'ye açıyor.

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
24. `supabase/migrations/052_remove_starter_plan.sql` — 'starter' plan kaldırıldı; `NOT NULL` düşürüldü, CHECK: `NULL|pro|agency`, DEFAULT kaldırıldı. **2026-08-02'ye kadar hiç uygulanmamıştı ve yazıldığı haliyle çalışamıyordu** — `subscription_plan` `schema.sql`'den beri NOT NULL olduğu için `SET subscription_plan = NULL` satırı 23502 ile patlıyordu. `DROP NOT NULL` eklenip uygulandı
25. `supabase/migrations/053_storage_counter_trigger.sql` — storage_used_bytes sayacı trigger'a taşındı (cascade silmede de doğru çalışır), mevcut sayaçlar yeniden hesaplandı
26. `supabase/migrations/054_profiles_delete_policy.sql` — profiles'a admin DELETE politikası (yoktu; RLS açık + politika yok = silme sessizce engelleniyordu)
27. `supabase/migrations/055_lock_down_storage_functions.sql` — increment_storage kaldırıldı (anon'a açık güvenlik açığı), sync_org_storage REST'ten kapatıldı
28. `supabase/migrations/056_scope_public_bucket_listing.sql` — talent-avatars + org-logos SELECT politikaları org'a kısıtlandı (çapraz kiracı listeleme sızıntısı)
29. `supabase/migrations/057_function_hardening.sql` — search_path sabitleme + trigger fonksiyonlarından EXECUTE revoke
30. `supabase/migrations/058_role_relationships.sql` — rol ilişki haritası: `role_relationships` tablosu + `project_roles.diagram_x/y` + kanonik sıralama trigger'ı
31. `supabase/migrations/059_scripts_and_retention.sql` — çoklu senaryo (`role_scripts` + `audition_scripts`), video saklama süresi, `video_purge_queue`; `project_roles.script_url` düşürüldü
32. `supabase/migrations/060_service_role_grants_scripts.sql` — 059'daki tablolara service_role GRANT'i (eksikliği `/oyuncu/[token]`'ı 404'e düşürüyordu — 012'nin tekrarı)

### Supabase Security Advisor — bilinçli olarak bırakılanlar
`get_user_org_id()` / `get_user_role()` "anon/authenticated execute edebiliyor" uyarısı veriyor ama **kaldırılamaz**: her RLS politikası bunları çağırıyor ve politika ifadeleri sorguyu çalıştıran rolün yetkisiyle değerlendiriliyor. `PUBLIC`'ten EXECUTE alınınca tüm RLS `permission denied for function get_user_org_id` ile çöküyor (test edildi). Argümansızlar, yalnızca `auth.uid()`'den kendi org/rolünü dönüyorlar — anon çağırınca `null` geliyor, sızıntı yok.

`rls_auto_enable()` de işaretleniyor ama dönüş tipi `event_trigger`; RPC denemesi `cannot display a value of type event_trigger` ile reddediliyor.

**Açık kalan (dashboard'dan yapılmalı):** Leaked Password Protection — Authentication → Policies.

**Uygulama durumu:** 052–060 production'a uygulandı. `supabase_migrations.schema_migrations` tablosu 001–051 için boş (elle uygulanmışlar) — bu yüzden `supabase db push` çalıştırmak eski migration'ları yeniden uygulamayı deneyebilir. Yeni migration'ları MCP `apply_migration` ile uygula.

**Ders:** "elle uygulandı" varsayımı doğrulanmadan yazılmıştı ve 052 için yanlıştı — DB, 020'nin bıraktığı halde kalmıştı. Bir migration'ın uygulandığını varsayma; `pg_constraint` / `information_schema.columns` üzerinden fiilî şemayı kontrol et.

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

### Çoklu Senaryo + Video Saklama Süresi
- **Senaryo modeli:** havuz rolde (`role_scripts`), seçim davette (`audition_scripts`). Direktör farklı adaylara farklı sahne gönderebiliyor. Rol başına 10 dosya, dosya başına 20MB sınırı (`lib/scripts.ts`).
- **Saklama tarihi yalnızca direktör tarafından belirlenir.** Oyuncu tarihe müdahale etmez, ama **istediği an kendi videosunu silebilir** (`/api/talent-video`) — KVKK/GDPR silme hakkı bu yolla karşılanıyor, dolayısıyla bu rota birinci sınıf ve kolay bulunur olmalı.
- `organizations.default_retention_days` (varsayılan 180) davet oluşturulurken **mutlak tarihe çevrilip** `auditions.retention_until`'a snapshot alınır — org ayarı sonradan kısalırsa yürürlükteki davetlerin videoları beklenmedik şekilde silinmesin diye.
- Mevcut audition'lar bilinçli olarak `retention_until = NULL` bırakıldı: yürürlükteki veriye geriye dönük silme tarihi atamak, müşteri onayı olmadan veri imha etmek olurdu.
- **Silme sırası kritik:** kuyruk → DB → R2. Tersi olsaydı DB silinip R2 patladığında `storage_path` kaybolur, nesne sonsuza kadar para yakardı. `lib/video-purge.ts`.
- Video silinince **audition kaydı korunur** — not, puan ve etiketler direktörün kendi değerlendirme emeği.
- Cron: `/api/cron/video-retention` (03:00). Süresi dolanları siler, kuyruğu işler, 3 gün önce direktöre uyarı yollar.

### Rol İlişki Haritası (Karakter Grafiği)
- **Yer:** proje detay → "İlişkiler" tab'ı (`/projeler/[id]?tab=iliskiler`). Rol detayında salt-okunur özet kartı (`RoleRelationshipsCard`).
- **Model:** serbest çizim değil, yapılandırılmış graf. Düğümler `project_roles`, kenarlar `role_relationships`. Veri sistem tarafından anlaşıldığı için doğrulama + casting overlay mümkün.
- **Canvas:** React Flow + dagre. `DiagramLoader` ile `ssr: false` dynamic import — ana bundle etkilenmiyor.
- **Aile ağacı yerleşimi:** düz dagre eşleri yan yana koymaz. `lib/diagram-layout.ts` **union node** tekniği kullanıyor — evliliği temsil eden 1×1 görünmez düğüm; eşler ona bağlanır, çocuklar ondan sarkar.
- **Casting overlay:** düğümlerde `status='selected'` audition'ın oyuncusu (fotoğraf + boy). Çift kenarına tıklayınca **kombinasyon modu** açılır: iki rolün adayları yan yana, ok tuşlarıyla gezinme, boy/yaş farkı hesabı.
- **Uyarılar** (`lib/role-relationships.ts`): ebeveyn–çocuk yaş tutarsızlığı (<16 yıl), `parent` kenarlarında döngü, aynı oyuncunun ilişkili iki role seçilmesi.
- **Mobil:** React Flow mount edilmiyor; `MobileRelationshipList` ile yapılandırılmış liste gösteriliyor.
- **Kapsam dışı bırakılanlar:** serbest çizim araçları (veriyi anlamsızlaştırır), gerçek zamanlı çoklu imleç, çoklu board, senaryodan AI ile ilişki çıkarımı.

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
- `lib/plan.ts` — `Plan` type (`'pro' | 'agency'`), `PLAN_LIMITS` (maxUsers, storageGB, label), `getActivePlan()`, `isSubscriptionActive()`, `formatStorage()`, product ID helpers
- `/api/checkout` — Polar checkout, `customerExternalId=orgId`, success → `/dashboard?upgraded=1`
- `/api/portal` — `polar.customerSessions.create()` → customer portal URL'e redirect
- `/api/webhook/polar` — `subscription.created/updated/canceled/revoked` eventlerini işler
- `lib/polar-sync.ts` — `syncSubscription()`; route ile test aynı kodu paylaşır (test eskiden route mantığını kopyalıyordu, kod değişince sessizce yalan söylüyordu)
- **Tanınmayan ürün ID'si:** `getPlanFromProductId()` eşleşme yoksa `null` döner (eskiden sessizce `'pro'` dönüyordu). `syncSubscription` bu durumda aboneliği kaydeder ama `subscription_plan`'e **dokunmaz** — `getActivePlan()` `org_type`'a düşerek doğru limitleri verir; `'pro'` yazmak ödeme yapan ajansı sessizce düşürürdü. Durum Sentry'ye `error` seviyesinde raporlanır. **Sandbox → production geçişinde ürün ID'leri değişir**, env güncellenmezse Sentry'de bu uyarıyı görürsün.
- Planlar: `pro` (₺1.999/ay, 1 TB, 3 kullanıcı — cast direktörleri), `agency` (₺4.999/ay, 200 GB, 5 kullanıcı — menajerlik ajansları)
- Ücretsiz tier yoktur. Yeni kullanıcılar 14 gün deneme sonrası `pro` veya `agency` planına abone olur.
- `subscription_plan = NULL` → abonelik yok (deneme veya ön-kayıt); `getActivePlan()` bu durumda `org_type`'a bakarak doğru limitleri döner.
- Subscription revoke → `subscription_plan = NULL, subscription_status = 'canceled'`
- **Webhook'un tüm DB yazımları `lib/polar-sync.ts`'teki `applyOrgPatch()` üzerinden geçer.** Route eskiden `canceled`/`revoked` için doğrudan `admin.from(...).update()` çağırıyor ve dönen `error`'ı kontrol etmiyordu. Supabase throw etmediği için başarısız UPDATE yutuluyor, webhook Polar'a 200 dönüyor, Polar bir daha denemiyordu — revoke edilen abonelikler ücretli planlarıyla açık kalıyordu. Webhook'ta yeni bir yazma eklerken `applyOrgPatch()` kullan

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
- **Admin client'ın (service_role) dokunduğu her tabloya ayrıca `GRANT ... TO service_role` gerekiyor.** RLS baypas edilse bile temel tablo yetkisi olmadan sorgu "permission denied" ile düşer ve Supabase istemcisi `data: null` döndürür — bu, public sayfaları sessizce 404'e sokar. Migration 012 ve 060 aynı hatayı düzeltti
- Supabase sorgularında `error`'ı kontrol etmeden `data`'ya güvenme; `notFound()`'a sessizce düşen sayfalar teşhisi çok zorlaştırıyor
- Server action'larda `requireOrg()` kullan — doğrudan `createClient()` değil
- Supabase hata objesi `console.error` ile `{}` gösterir — `error.message`, `error.code`, `error.hint` ayrı logla
- i18n linkleri `next/navigation`'dan değil `@/i18n/navigation`'dan import et
- Yeni UI metni eklerken hem `messages/tr.json` hem `messages/en.json`'a ekle

## Implement Edilmiş (Roadmap'ten Kapatılanlar)
- **Sentry** — `@sentry/nextjs` kurulu, `sentry.server.config.ts` + `sentry.edge.config.ts` + `sentry.client.config.ts` + `instrumentation.ts` mevcut; `NEXT_PUBLIC_SENTRY_DSN` env var gerekli
- **Rate limiting** — `lib/rate-limit.ts` in-memory sliding window; `/api/upload-url`, `/api/checkout`, `/api/video-complete`, `/api/public-photo-url`, `public-apply`, auth action'larında aktif. **Not:** Vercel serverless multi-instance'da per-instance çalışır — production'da Upstash Redis ile değiştirilmeli
- **Onboarding flow** — `OnboardingCard.tsx` ile dashboard'da 3 adımlı checklist; localStorage ile dismiss
- **Resend entegrasyonu** — `lib/resend.ts` eksiksiz (welcome, team invite, audition invite, video notification, agency digest, role share); `sendWelcomeEmail` `auth/callback/route.ts`'ten tetikleniyor
- **DavetModal** — `app/[locale]/(app)/roller/[id]/DavetModal.tsx` mevcut ama hiçbir yerde import edilmiyor (dead code); aktif davet akışı `AdayEkleModal` + `AuditionIsteModal` üzerinden

## Roadmap — Henüz Yapılmadı
- **Upstash Redis rate limiter** — mevcut in-memory limiter'ı `@upstash/ratelimit` ile değiştir; `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env var gerekli
- **Plan enforcement middleware** — pro/agency gerektiren rotalarda plan kontrolü
- **Test coverage** — kritik iş mantığı (billing webhook, public-apply, plan enforcement) için en az temel entegrasyon testleri
- **Referral programı** — planlı
