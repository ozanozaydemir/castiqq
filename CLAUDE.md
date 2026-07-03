# CastFlow — Claude Çalışma Kılavuzu

## Ürün
Yapım şirketleri, casting ajansları ve serbest cast direktörlerinin kullandığı casting yönetim platformu.

**Temel akış:** Cast direktörü → Proje açar → Rol tanımlar → Oyuncuları davet eder → Oyuncular video yükler → Ekip izler ve karar verir → Final seçim

## Teknoloji Stack
- **Next.js 16** App Router (Turbopack)
- **React 19**
- **Tailwind CSS v4** (`@import "tailwindcss"` + `@theme` block)
- **Supabase** (auth + db + storage)
  - `@supabase/ssr` — server/client helpers
  - RLS ile multi-tenant tenant isolation
- **TypeScript** strict mode
- **lucide-react** iconlar için
- **date-fns** — tarih formatlama (`tr` locale)
- **@dnd-kit** — audition tablosunda sürükle-bırak sıralama

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

### Route Yapısı
```
app/
  (app)/            ← Auth guard, AppShell, OrgProvider
    layout.tsx      ← Auth check + fallback org creation
    dashboard/
    projeler/
    roller/
    oyuncular/
    listeler/       ← Özel oyuncu listeleri (collections)
    ayarlar/
      ekip/         ← Ekip davet & yönetimi
  auth/callback/    ← Email confirm + code exchange
  giris/
  kayit/
  sifremi-unuttum/
  sifremi-sifirla/
  oyuncu/[token]/   ← Public sayfa: oyuncu video yükleme
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
- `profiles` — user ↔ org, role: admin|member|viewer
- `projects` — casting projeleri
- `project_roles` — proje içindeki roller/karakterler
- `talent` — oyuncu veritabanı
- `auditions` — rol+oyuncu başvuruları
  - `notes_updated_by` / `notes_updated_at` — not yazar takibi (migration 015)
- `audition_videos` — audition videoları (`duration_seconds` client'tan okunur)
- `tags` — org bazlı serbest etiketler (migration 016)
- `audition_tags` — audition ↔ tag çoka-çok (migration 016)
- `collections` — direktörün oluşturduğu özel oyuncu listeleri (migration 017)
- `collection_items` — collection ↔ talent çoka-çok (migration 017)
- `video_notes` — video timestamp'e bağlı notlar (migration 018)

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

**Kritik:** Migration'lar sırayla uygulanmalı. 015 olmadan roller/[id] sayfası `profiles!auditions_notes_author_fkey` join'i nedeniyle tüm auditions sorgusunu kırıyor.

## Implement Edilmiş Özellikler

### Ayarlar
- Org adı düzenleme (`OrgForm`), profil düzenleme (`ProfilForm`), şifre değiştirme (`SifreForm`)
- Ekip yönetimi: `/ayarlar/ekip` — Supabase admin invite API, `EkipClient`

### Dashboard
- 5 stat kartı (aktif proje, açık rol, oyuncu, aday, bekleyen audition)
- Son eklenen oyuncular + son projeler paneli
- 7 günlük deadline uyarı banner'ı

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

## Önemli Kurallar
- Yeni sayfa eklerken Server Component + `createClient()` from server
- RLS her zaman `organization_id = get_user_org_id()` pattern'ini kullan
- Admin işlemler için `createAdminClient()` kullan
- Yeni tablo eklerken `organization_id` foreign key + RLS policy + GRANT TO authenticated zorunlu
- Server action'larda `requireOrg()` kullan — doğrudan `createClient()` değil
- Supabase hata objesi `console.error` ile `{}` gösterir — `error.message`, `error.code`, `error.hint` ayrı logla

## Monetizasyon — Planlanan

### Problem
Kullanıcı başına 1–2 TB video depolama gerekebilir. Supabase Storage'ın egress ücreti ($0.09/GB) video izlemede patlayabilir.

### Acil: Cloudflare R2'ye Geç
- Supabase Storage yerine **Cloudflare R2** (video bucket için)
- R2: $0.015/GB/ay depolama, **$0 egress** — video streaming için ideal
- Fotoğraflar Supabase Storage'da kalabilir

### Plan Yapısı
| Plan | Fiyat | Storage | Kullanıcı |
|------|-------|---------|-----------|
| Başlangıç | Ücretsiz | 10 GB | 1 |
| Pro | $39/ay | 200 GB | 3 |
| Ajans | $99/ay | 1 TB | Sınırsız |

- Ek depolama: +100 GB = $8/ay bloğu
- Video saklama politikası: arşiv projede 90 gün sonra cold storage uyarısı → upsell fırsatı

### Roadmap (Öncelik Sırası)
1. Cloudflare R2 entegrasyonu (videolar için)
2. Stripe entegrasyonu + plan kontrolü middleware
3. Dashboard'a depolama sayacı ("120 GB / 200 GB")
4. Video saklama politikası + otomatik uyarılar
