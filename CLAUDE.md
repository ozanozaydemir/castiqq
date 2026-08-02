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
- **next-intl 4.13.1** — i18n. **Şu an yalnızca TR yayında**; EN hazır ama kapalı (aşağıya bak)
- **@polar-sh/nextjs** — ödeme & abonelik (Merchant of Record)
- **resend** — transaksiyonel email
- **next-sitemap** — `postbuild`'de sitemap.xml + robots.txt üretimi
- **posthog-js** — analytics (EU Cloud, GDPR-uyumlu)
- **googleapis** — Google Sheets (oyuncu içe/dışa aktarım) + Calendar (booking senkronu)
- **pdf-lib** — senaryo PDF'lerine oyuncu adı filigranı basma
- **zod** — server action girdi doğrulama

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
- `i18n/routing.ts` — **`locales: ['tr']`, `localePrefix: 'never'`**. EN bilinçli olarak kapalı: `/en/...` adresleri 404 döner, bu bir hata değil. Açmak için `locales`'e `'en'` eklenip `localePrefix` `'as-needed'` yapılır (TR prefix'siz kalır, EN `/en/` alır)
- `i18n/request.ts` — `getRequestConfig`, mesaj dosyalarını yükler
- `i18n/navigation.ts` — locale-aware `Link`, `redirect`, `useRouter`, `usePathname`
- `middleware.ts` — next-intl middleware, locale tespiti + yönlendirme
- `messages/tr.json` + `messages/en.json` — tüm UI metinleri. EN yayında olmasa da **senkron tutuluyor**; açılacağı gün iki dosya ayrışmış olmasın diye
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
    cast-direktorleri/    ← SEO landing (production segmenti)
    menajerlik-ajanslari/ ← SEO landing (agency segmenti)
    kurulum/              ← Signup trigger'ı başarısızsa fallback org oluşturma
    plan-sec/             ← Aboneliksiz kullanıcı buraya zorunlu yönlendirilir
    payment/processing/   ← Checkout sonrası abonelik aktifleşmesini yoklar (45 sn timeout)
    ── Public, token'la erişilen sayfalar (auth yok) ──
    oyuncu/[token]/       ← Video yükleme (auditions.token)
    oyuncu-profil/[token]/← Oyuncu self-servis profil düzenleme (talent.self_service_token)
    basvur/[roleToken]/   ← Genel rol başvurusu (project_roles.public_token)
    paylasim/[shareToken]/← Yazdırılabilir liste paylaşımı (collections.share_token)
    (app)/                ← Auth guard, AppShell, OrgProvider
      layout.tsx          ← Auth check + fallback org creation
      dashboard/
      projeler/           ← [id] detayında ?tab=iliskiler (rol ilişki haritası)
      roller/             ← [id] detayı: aday tablosu, video modal, paylaşım
      oyuncular/
      listeler/           ← Özel oyuncu listeleri (collections)
      gelen-roller/       ← Başka org'un paylaştığı roller + öneri gönderme
      oneri-yazdir/[submissionId]/ ← Yazdırılabilir öneri formu
      ── Yalnızca org_type='agency' (aksi halde /dashboard'a yönlenir) ──
      genel-bakis/        ← Ajans özeti: sözleşme/belge süreleri, tahsilat, komisyon
      musteriler/         ← B2B CRM: müşteri, kontak, etkileşim, risk skoru
      teklifler/          ← Teklif pipeline'ı (Kanban) + teklif kalemleri
      isler/              ← Booking/iş listesi + CSV dışa aktarım
      gorevler/           ← Görev & hatırlatıcılar
      takvim/             ← Booking'lerin aylık takvimi
      ayarlar/
        page.tsx          ← PlanCard, retention, paylaşım slug'ı, Google Sheets
        ekip/             ← Ekip davet & yönetimi
  auth/callback/          ← Email confirm + code exchange
  api/
    checkout/             ← Polar checkout session
    portal/               ← Polar customer portal redirect
    webhook/polar/        ← Polar webhook handler
    upload-url/           ← R2 presigned URL üretme (max 3 video/audition)
    video-complete/       ← Video yükleme tamamlama + storage sayacı
    talent-video/         ← Oyuncunun kendi videosunu silmesi (KVKK/GDPR)
    video-url/            ← İmzalı video GET URL'i (auth gerekli)
    script/[token]/[scriptId]/ ← Senaryo indirme (filigranlı)
    shared-script/[shareId]/   ← Paylaşılan rolün senaryosu (partner org)
    public-photo-url/     ← Genel başvuruda fotoğraf yükleme
    export/bookings/      ← CSV (yalnızca agency)
    google/connect/       ← Google OAuth başlat
    google/callback/      ← OAuth dönüş (state cookie ile doğrulanır)
    cron/video-retention/ ← Saklama süresi dolmuş videoları siler (03:00)
    cron/agency-digest/   ← Ajans günlük özeti
    cron/share-expiry-check/ ← Süresi dolan rol paylaşımları
```

**Cron rotaları `Bearer CRON_SECRET` ile korunur** — secret yoksa/yanlışsa 401.

### Server Action'lar (`app/actions/`)
Hepsi `requireOrg()` üzerinden geçer.

| Dosya | Kapsam |
|---|---|
| `auth.ts` | login, register, logout, selectPlan |
| `onboarding.ts` | completeOrgSetup (`/kurulum` fallback'i) |
| `projects.ts` | proje CRUD + arşiv, rol CRUD + durum + `toggleRolePublic` |
| `talent.ts` | oyuncu CRUD, `updateAvailability` |
| `auditions.ts` | aday ekleme, durum/puan/not, video silme, dnd sıralama, toplu durum |
| `audition-tags.ts` | etiket ekle/kaldır |
| `collections.ts` | liste CRUD, oyuncu ekle/çıkar, toplu ekleme |
| `video-notes.ts` | timestamp notu ekle/sil |
| `scripts.ts` | rol senaryosu ekle/sil/sırala (10 dosya, 20 MB sınırı) |
| `team.ts` | ekip daveti (plan kullanıcı limitini uygular), rol değiştirme, çıkarma |
| `settings.ts` | org, profil, paylaşım slug'ı, saklama süresi |
| `role-relationships.ts` | ilişki CRUD, düğüm konumu kaydetme |
| `roleShares.ts` | ajans arama, paylaşım oluştur/iptal/listele |
| `roleShareSubmissions.ts` | öneri paketi hazırla, gönder, karar ver |
| `public-apply.ts` | genel başvuru (public, rate-limited, email+rol ile dedupe) |
| `selfService.ts` | oyuncunun kendi profilini güncellemesi (public, token'lı) |
| `clients.ts` · `clientContacts.ts` · `clientInteractions.ts` | CRM müşteri tarafı |
| `pitches.ts` | teklif + kalem CRUD, aşama değişimi, booking'e çevirme |
| `bookings.ts` · `advances.ts` · `documents.ts` · `representationHistory.ts` | ajans finans/belge |
| `agencyTasks.ts` | görevler |
| `notifications.ts` | uygulama içi bildirimler |
| `google.ts` · `googleSheets.ts` | Google bağlantısı, Sheets içe/dışa aktarım |
| `email.ts` | audition daveti gönderme |
| `language.ts` | dil tercihi |

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
  - `org_type` TEXT CHECK: `production|agency` (migration 029) — **ürünün iki ayrı yüzünü ayıran kolon**. Ajans modülünün tamamı buna bakar; production org bu sayfalara girerse `/dashboard`'a yönlenir
  - `subscription_plan` TEXT CHECK: `NULL|pro|agency` — NULL = henüz abone olunmamış (deneme/ilk kayıt). DEFAULT yok
  - `subscription_status` TEXT CHECK: `active|trialing|canceled|past_due|unpaid|incomplete|incomplete_expired` — **Polar'ın gerçek enum'u** (migration 027; öncesinde `trial`/`cancelled` yazıyordu ve her webhook UPDATE'i sessizce reddediliyordu)
  - `public_slug` TEXT CHECK: `^[a-z0-9-]{3,40}$` — ajanslar arası paylaşımda org'u bulmak için
  - `default_retention_days` INT CHECK: NULL veya 1–3650 (varsayılan 180)
  - `polar_customer_id` TEXT — Polar müşteri ID'si
  - `polar_subscription_id` TEXT — aktif abonelik ID'si
  - `subscription_ends_at` TIMESTAMPTZ
  - `storage_used_bytes` BIGINT DEFAULT 0 — toplam video depolama (migration 021)
- `profiles` — user ↔ org, role: admin|member|viewer
  - `preferred_language` TEXT CHECK: `tr|en` (migration 022)
- `projects` — casting projeleri
- `project_roles` — proje içindeki roller/karakterler
  - `public_token` UUID UNIQUE (migration 023) + `is_public` BOOL (025) — genel başvuru sayfası
  - Eşleştirme kriterleri (migration 045) — rol eşleştirme motoru için
- `talent` — oyuncu veritabanı
  - `self_service_token` UUID (migration 042) — oyuncunun kendi profilini düzenlemesi
  - `assigned_to` (migration 034) — çoklu menajerli ajanslarda oyuncu ataması. **RLS'i etkiler** (043): `member` yalnızca kendine atanan + atanmamış oyuncuları görür, `admin` hepsini. Production org'larda hep NULL olduğu için etkisiz
  - Vergi/stopaj durumu (033), sendika üyeliği (038)
- `auditions` — rol+oyuncu başvuruları
  - `notes_updated_by` / `notes_updated_at` — not yazar takibi (migration 015)
  - `rating` SMALLINT CHECK 1–5 — yıldız puanı (migration 019)
- `audition_videos` — audition videoları
  - `duration_seconds` — client'ta `HTMLVideoElement.duration` ile okunur
  - `file_size_bytes` BIGINT — depolama takibi için (migration 021)
- `tags` — org bazlı serbest etiketler (migration 016)
- `audition_tags` — audition ↔ tag çoka-çok (migration 016)
- `collections` — direktörün oluşturduğu özel oyuncu listeleri (migration 017)
  - `share_token` UUID UNIQUE (migration 024) — `/paylasim/[shareToken]` public sayfası
- `collection_items` — collection ↔ talent çoka-çok (migration 017)
- `video_notes` — video timestamp'e bağlı notlar (migration 018)
- `role_scripts` — rol başına senaryo havuzu (migration 059). Tek `script_url` kolonunun yerini aldı; etiket, sıra ve boyut taşıyor
- `audition_scripts` — davet başına senaryo seçimi. **Yetkilendirme sınırı burası:** `/api/script/[token]/[scriptId]` senaryonun role ait olmasına değil, o davete gönderilmiş olmasına bakar
- `video_purge_queue` — R2 silme kuyruğu. DB ile nesne deposu arasındaki sıralama tuzağını çözüyor: yol önce kuyruğa yazılır, DB satırı silinir, R2 en son temizlenir; başarısızlar yeniden denenir
- `role_relationships` — roller arası tipli graf kenarları (migration 058)
  - `type`: `spouse|partner|sibling|friend|rival` (simetrik) + `parent|manager|other` (yönlü)
  - Simetrik tipler **tek satır** olarak saklanır; `canonicalize_role_relationship()` trigger'ı uçları `from < to` sırasına sokar, unique index ters yönlü kopyayı da yakalar
  - Düğüm konumları `project_roles.diagram_x` / `diagram_y` (NULL = otomatik yerleşim)
- `google_connections` — Google Sheets/Drive/Calendar OAuth token'ları, org başına tek satır (migration 028). **Supabase Auth'un Google sign-in'inden bağımsız bir akış.** Yalnızca admin client yazar; authenticated için insert/update politikası yok, RLS varsayılan reddeder

#### Ajans (menajerlik) tabloları — yalnızca `org_type='agency'`
- `talent_representation_history` — geçmiş temsil dönemleri (038). `commission_rate` CHECK 0–100
- `talent_documents` — kimlik, sağlık raporu, çalışma izni, pasaport, vize, veli izni, diğer (032) + son geçerlilik tarihi. Private `talent-documents` bucket'ı
- `talent_advances` — `type` CHECK: `avans|masraf` (040)
- `bookings` — iş/ödeme takibi (031, finansallar 035, süregelen işler 037)
  - `job_type` CHECK: `dizi|reklam|film|sunuculuk|seslendirme|etkinlik|diger`
  - `payment_status` CHECK: `pending|partial|paid`
  - `payment_flow` CHECK: `client_to_agency|client_to_talent` (039) — komisyonun kimden tahsil edildiği
  - `withholding_rate` NUMERIC CHECK 0–100 (stopaj), `exclusivity_category` 16 sektörlük liste (reklam yasağı takibi)
- `clients` — B2B müşteri (yapım şirketi/reklam ajansı/marka) CRM'i (036, genişletme 047)
  - `client_type`: `yapim_sirketi|reklam_ajansi|marka|casting_ajansi|pr_ajansi|diger`
  - `working_status`: `aktif|potansiyel|gecmis|kara_liste` · `tier`: `tier_1|tier_2|tier_3`
  - `payment_rating`: `belirsiz|guvenilir|gecikmeli|riskli` · `payment_terms`: `avans|net_15|net_30|net_60|net_90|yayin_sonrasi`
  - `industry_segments` / `exclusivity_categories` — dizi tipi kolonlar, `<@` ile izinli değer listesine kısıtlı
- `client_contacts` — müşterideki kişiler; `role` 8 değerlik sektör listesi (uygulayıcı yapımcı, casting direktörü, yönetmen, marka müdürü…)
- `client_interactions` — görüşme geçmişi (046); `interaction_type`: tanışma, telefon, toplantı, oyuncu önerisi, audition talebi, okuma/kostüm provası, deneme çekimi, sözleşme görüşmesi, diğer
- `pitches` — teklif pipeline'ı (047). `stage` CHECK: `brief|oyuncu_onerildi|opsiyon|sozlesme|kazanildi|kaybedildi`
- `pitch_items` — teklife önerilen oyuncular. `status` CHECK: `onerildi|on_elemede|geri_cagrildi|secildi|elendi|geri_cekildi`; `fee_type`: `daily|weekly|per_episode|monthly|per_project|hourly`. Kalem booking'e çevrilebilir
- `agency_tasks` — görev/hatırlatıcı (041)

#### Ajanslar arası rol paylaşımı (migration 048–051)
İki org birbirinin tenant tablosuna doğrudan erişmez; paylaşım bu tablolar üzerinden yürür.
- `org_partners` — org çiftleri, unique `(organization_id, partner_organization_id)`
- `role_shares` — production org'un bir rolü belirli bir ajansa açması. `status` CHECK: `active|revoked|role_closed|expired`; `reminder_sent` (049) uyarının bir kez gitmesini sağlar
- `role_share_submissions` — ajansın gönderdiği öneri paketi. `status` CHECK: `taslak|gonderildi|incelendi|kismen_kabul|kabul|red`
- `role_share_submission_items` — önerilen oyuncular; **oyuncu profilinin snapshot'ını taşır** (050, 051: eğitim, self-tape linkleri, ağırlık, saç/göz rengi) — CD karşı org'un `talent` tablosunu okumadan karar verebilsin diye. `cd_decision` CHECK: `beklemede|begenildi|reddedildi`, unique `(submission_id, source_talent_id)`
- `notifications` — uygulama içi bildirim. `type` CHECK: `role_shared|submission_received|submission_decided|share_revoked|share_expiring`

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
24. `supabase/migrations/022_preferred_language.sql` — profiles.preferred_language (tr|en)
25. `supabase/migrations/023_public_role_token.sql` — project_roles.public_token (genel başvuru linki)
26. `supabase/migrations/024_collection_share_token.sql` — collections.share_token (liste paylaşımı)
27. `supabase/migrations/025_role_is_public.sql` — rol başvuru sayfasını aç/kapat toggle'ı
28. `supabase/migrations/026_security_fixes.sql` — tehlikeli anon RLS politikaları kaldırıldı (`token IS NOT NULL` koşulu **tüm satırları** kapsıyordu); duplicate unique index temizliği; `projects.created_by` FK → SET NULL
29. `supabase/migrations/027_fix_subscription_status_values.sql` — status CHECK'i Polar'ın gerçek enum'una hizaladı (`trial`→`trialing`, `cancelled`→`canceled`). **Öncesinde her webhook UPDATE'i constraint violation ile reddediliyor, supabase-js fırlatmadığı için sessizce yutuluyordu** — 052/webhook olayının birebir aynısı
30. `supabase/migrations/028_google_connections.sql` — Google OAuth token'ları (Sheets/Drive)
31. `supabase/migrations/029_org_type_agency.sql` — **`organizations.org_type` (`production|agency`)**; kayıt trigger'ı `user_metadata.org_type`'ı okur. Ajans modülünün başlangıcı
32. `supabase/migrations/030_talent_representation.sql` — temsil/sözleşme takibi + private `contracts` bucket
33. `supabase/migrations/031_bookings.sql` — iş/ödeme takibi (booking log)
34. `supabase/migrations/032_talent_documents.sql` — belge takibi + son geçerlilik + private `talent-documents` bucket
35. `supabase/migrations/033_talent_tax_status.sql` — vergi/stopaj durumu
36. `supabase/migrations/034_talent_assigned_to.sql` — çoklu menajerli ajanslarda oyuncu ataması
37. `supabase/migrations/035_bookings_financials.sql` — stopaj/net hesap, kısmi ödeme, reklam yasağı (exclusivity)
38. `supabase/migrations/036_clients.sql` — müşteri CRM'i; booking'lerdeki serbest metin müşteri adları tabloya taşındı
39. `supabase/migrations/037_bookings_ongoing.sql` — sezonu süren dizi anlaşmaları (bitiş tarihi yok)
40. `supabase/migrations/038_union_and_representation_history.sql` — sendika üyeliği + geçmiş temsil dönemleri
41. `supabase/migrations/039_payment_flow.sql` — komisyon tahsilat yönü (`client_to_agency|client_to_talent`)
42. `supabase/migrations/040_talent_advances.sql` — avans/masraf takibi
43. `supabase/migrations/041_agency_tasks.sql` — görev/hatırlatıcı sistemi
44. `supabase/migrations/042_talent_self_service.sql` — oyuncu self-servis profil güncelleme token'ı
45. `supabase/migrations/043_talent_visibility_rls.sql` — ekip görünürlüğü: `member` yalnızca kendine atanan + atanmamış oyuncuları görür, `admin` hepsini
46. `supabase/migrations/044_google_calendar_sync.sql` — booking'lerin Google Calendar senkronu
47. `supabase/migrations/045_role_matching_criteria.sql` — rol eşleştirme motoru kriterleri
48. `supabase/migrations/046_client_interactions.sql` — müşteri etkileşim geçmişi (sektöre özel görüşme türleri)
49. `supabase/migrations/047_agency_crm.sql` — B2B CRM derinleşmesi: `client_contacts`, `pitches`, `pitch_items` + clients'a tier/ödeme/segment kolonları
50. `supabase/migrations/048_agency_role_shares.sql` — **iki org arası rol paylaşımı**: `org_partners`, `role_shares`, `role_share_submissions`, `role_share_submission_items`, `notifications`
51. `supabase/migrations/049_role_shares_reminder.sql` — süre dolumu uyarısı bir kez gitsin diye işaret kolonu
52. `supabase/migrations/050_submission_item_profile.sql` — öneri kalemine oyuncu profili snapshot'ı
53. `supabase/migrations/051_submission_item_more_fields.sql` — snapshot'a eğitim, self-tape linkleri, ağırlık, saç/göz rengi
54. `supabase/migrations/052_remove_starter_plan.sql` — 'starter' plan kaldırıldı; `NOT NULL` düşürüldü, CHECK: `NULL|pro|agency`, DEFAULT kaldırıldı. **2026-08-02'ye kadar hiç uygulanmamıştı ve yazıldığı haliyle çalışamıyordu** — `subscription_plan` `schema.sql`'den beri NOT NULL olduğu için `SET subscription_plan = NULL` satırı 23502 ile patlıyordu. `DROP NOT NULL` eklenip uygulandı
55. `supabase/migrations/053_storage_counter_trigger.sql` — storage_used_bytes sayacı trigger'a taşındı (cascade silmede de doğru çalışır), mevcut sayaçlar yeniden hesaplandı
56. `supabase/migrations/054_profiles_delete_policy.sql` — profiles'a admin DELETE politikası (yoktu; RLS açık + politika yok = silme sessizce engelleniyordu)
57. `supabase/migrations/055_lock_down_storage_functions.sql` — increment_storage kaldırıldı (anon'a açık güvenlik açığı), sync_org_storage REST'ten kapatıldı
58. `supabase/migrations/056_scope_public_bucket_listing.sql` — talent-avatars + org-logos SELECT politikaları org'a kısıtlandı (çapraz kiracı listeleme sızıntısı)
59. `supabase/migrations/057_function_hardening.sql` — search_path sabitleme + trigger fonksiyonlarından EXECUTE revoke
60. `supabase/migrations/058_role_relationships.sql` — rol ilişki haritası: `role_relationships` tablosu + `project_roles.diagram_x/y` + kanonik sıralama trigger'ı
61. `supabase/migrations/059_scripts_and_retention.sql` — çoklu senaryo (`role_scripts` + `audition_scripts`), video saklama süresi, `video_purge_queue`; `project_roles.script_url` düşürüldü
62. `supabase/migrations/060_service_role_grants_scripts.sql` — 059'daki tablolara service_role GRANT'i (eksikliği `/oyuncu/[token]`'ı 404'e düşürüyordu — 012'nin tekrarı)

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
- `share_token` ile `/paylasim/[shareToken]` — giriş gerektirmeyen, yazdırılabilir salt-okunur görünüm

### Ajans (Menajerlik) Modülü
Migration 029–051 arası eklendi. **Tümü `org_type='agency'` gerektirir**; production org bu rotalara girerse `/dashboard`'a yönlenir.

- **`/genel-bakis`** — ajansa özel özet: süresi dolan sözleşme ve belgeler, ödenmemiş işler, eksklüzivite listesi, komisyon/avans toplamları, gecikmiş görevler
- **`/musteriler`** — B2B CRM. Müşteri kartı + kontaklar + etkileşim geçmişi; `lib/crm.ts` ödeme geçmişinden risk skoru çıkarır
- **`/teklifler`** — teklif pipeline'ı, `PipelineBoard` ile Kanban. Teklif kalemi (önerilen oyuncu) **booking'e çevrilebilir**; çevirirken eksklüzivite çakışması kontrol edilir
- **`/isler`** — booking listesi, filtreler, CSV dışa aktarım (`/api/export/bookings`). Stopaj/net hesabı, kısmi ödeme, süregelen dizi anlaşmaları
- **`/gorevler`** — görev/hatırlatıcı listesi
- **`/takvim`** — booking'lerin aylık takvimi, ödeme durumu renk noktalarıyla
- **Oyuncu tarafı eklentileri:** temsil sözleşmesi + geçmiş temsil dönemleri, belge takibi (son geçerlilik uyarılı), avans/masraf, vergi/stopaj durumu, sendika üyeliği, menajer ataması (`assigned_to`)

### Ajanslar Arası Rol Paylaşımı
Cast direktörü bir rolü + senaryo parçasını belirli bir menajerlik org'una açar; ajans kendi roster'ından oyuncu önerir. **İki org birbirinin tenant tablosunu hiç okumaz** — akış `role_shares` / `role_share_submissions` üzerinden yürür.

- Paylaşım `RoleShareModal` ile, karşı org `public_slug` üzerinden bulunur
- Ajans tarafı: `/gelen-roller` → `SubmissionBuilder` ile öneri paketi hazırlar
- **Öneri kalemi oyuncu profilinin snapshot'ını taşır** (migration 050, 051) — CD karşı org'un `talent` tablosuna erişmeden karar verebilsin diye. Snapshot, paylaşım revoke edilse bile kararın dayandığı veriyi korur
- `/oneri-yazdir/[submissionId]` — yazdırılabilir öneri formu
- Bildirimler `notifications` tablosunda; `cron/share-expiry-check` süresi dolanları kapatır, `role_shares.reminder_sent` uyarının bir kez gitmesini sağlar

### Oyuncu Self-Servis
- `/oyuncu-profil/[token]` — `talent.self_service_token` ile şifresiz profil düzenleme
- Oyuncu yalnızca kendi bilgilerini günceller; ücret, not, değerlendirme gibi ajansa ait alanlara dokunamaz
- Link `SelfServiceLinkCard`'dan üretilir/yenilenir

### Google Entegrasyonu
- `/api/google/connect` → OAuth; callback `state` parametresini cookie'ye karşı doğrular (CSRF)
- Token'lar `google_connections`'da, org başına tek satır — **Supabase Auth'un Google sign-in'inden bağımsız**
- Oyuncu listesi Sheets'e dışa/içe aktarılır; booking'ler Calendar'a senkronlanır (migration 044)

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
- **Sitemap & robots:** `app/sitemap.ts` + `app/robots.ts` (Next.js yerel metadata rotaları). Yalnızca TR yolları listelenir. **`next-sitemap` artık kullanılmıyor** — `postbuild` script'i yok, paket `package.json`'da artık bağımlılık olarak duruyor; temizlenebilir
- **OG Image:** `app/[locale]/opengraph-image.tsx` — Edge runtime, 1200×630, indigo gradient
- **JSON-LD:** `components/JsonLd.tsx` — landing'de `SoftwareApplication` şeması
- **hreflang:** **şu an yayınlanmıyor.** EN kapalı olduğu için `alternates` yalnızca `canonical` taşıyor. `cast-direktorleri` sayfası bir süre `en` alternate'i yayınlıyordu ve arama motorunu 404'e yolluyordu — kaldırıldı. EN açıldığında hem `alternates.languages` hem `app/sitemap.ts` birlikte güncellenmeli
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
- **Ajans sayfası eklerken `org_type='agency'` guard'ını koy** — production org girerse `/dashboard`'a yönlendir. Guard yalnızca sayfada değil, ilgili server action ve API rotasında da olmalı; UI'da gizlenen bir şey doğrudan çağrılabilir
- **`requireOrg()` aboneliği de kontrol eder** — `polar_subscription_id` NULL ise `/plan-sec`'e yönlendirir. Yani her server action zaten abonelik kapısının arkasında; ayrıca kontrol etmeye gerek yok
- **Supabase istemcisi hata fırlatmaz, sonuç nesnesinde döndürür.** `await supabase.from(...).update(...)` yazıp `error`'ı kontrol etmemek başarısız yazmayı sessizce yutar. Bu tuzak projede **üç kez** gerçekleşti: migration 027 (status enum uyuşmazlığı), 052/webhook revoke (NOT NULL), 054 (eksik DELETE politikası). Yazma yapan her yerde `error`'ı kontrol et ve Sentry'ye raporla

## Implement Edilmiş (Roadmap'ten Kapatılanlar)
- **Sentry** — `@sentry/nextjs` kurulu, `sentry.server.config.ts` + `sentry.edge.config.ts` + `sentry.client.config.ts` + `instrumentation.ts` mevcut; `NEXT_PUBLIC_SENTRY_DSN` env var gerekli
- **Rate limiting** — `lib/rate-limit.ts` in-memory sliding window; `/api/upload-url`, `/api/checkout`, `/api/video-complete`, `/api/public-photo-url`, `public-apply`, auth action'larında aktif. **Not:** Vercel serverless multi-instance'da per-instance çalışır — production'da Upstash Redis ile değiştirilmeli
- **Onboarding flow** — `OnboardingCard.tsx` ile dashboard'da 3 adımlı checklist; localStorage ile dismiss
- **Resend entegrasyonu** — `lib/resend.ts` eksiksiz (welcome, team invite, audition invite, video notification, agency digest, role share); `sendWelcomeEmail` `auth/callback/route.ts`'ten tetikleniyor
- **DavetModal** — `app/[locale]/(app)/roller/[id]/DavetModal.tsx` mevcut ama hiçbir yerde import edilmiyor (dead code); aktif davet akışı `AdayEkleModal` + `AuditionIsteModal` üzerinden
- **QA test planı** — `docs/QA-ROADMAP.md`: tüm sayfa/rota/action için 21 bölümlük, ID'li senaryo listesi. Yeni özellik eklerken ilgili bölüme test satırı ekle

**Not — `lib/video-cleanup.ts` ve `lib/video-purge.ts` çakışmaz, birbirini tamamlar.** `video-cleanup` cascade silmelerde (proje/rol/audition) R2 yollarını toplar ve `purgeR2` başarısız olursa `queueForPurge`'e devreder; `video-purge` kuyruk mekanizmasının kendisidir (`MAX_PURGE_ATTEMPTS = 5`).

## Roadmap — Henüz Yapılmadı
- **Upstash Redis rate limiter** — mevcut in-memory limiter'ı `@upstash/ratelimit` ile değiştir; `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` env var gerekli
- **Plan enforcement middleware** — pro/agency gerektiren rotalarda plan kontrolü
- **Test coverage** — mevcut testler (`__tests__/`) DB'yi mock'luyor, bu yüzden şema kısıtlarını hiç görmüyor: 052'deki NOT NULL hatası webhook testi yeşilken production'da duruyordu. Gerçek şemaya karşı çalışan entegrasyon testleri gerekli
- **Yetki denetimi** — `/oneri-yazdir/[submissionId]` ve `/api/video-url` için sahiplik kontrolü doğrulanmalı (QA roadmap Z-08, Z-09)
- **Leaked Password Protection** — Supabase dashboard → Authentication → Policies'ten açılmalı
- **Referral programı** — planlı
