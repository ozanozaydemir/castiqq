# CastFlow — Proje Dokümantasyonu

> Casting yönetim SaaS'ı. Cast direktörleri, yapım şirketleri ve casting ajansları için.  
> Çalışma dizini: `/Users/ozanmacair/Desktop/app projects/castiqq`

---

## İçindekiler

1. [Ürün Özeti](#1-ürün-özeti)
2. [Teknoloji Stack](#2-teknoloji-stack)
3. [Mimari](#3-mimari)
4. [Veritabanı Şeması](#4-veritabanı-şeması)
5. [Route Haritası](#5-route-haritası)
6. [Tamamlanan Özellikler](#6-tamamlanan-özellikler)
7. [Bekleyen Özellikler (Roadmap)](#7-bekleyen-özellikler-roadmap)
8. [Server Actions](#8-server-actions)
9. [Kritik Kurallar & Kalıplar](#9-kritik-kurallar--kalıplar)
10. [Supabase Kurulum Sırası](#10-supabase-kurulum-sırası)
11. [Ortam Değişkenleri](#11-ortam-değişkenleri)
12. [Bilinen Sorunlar & Çözümler](#12-bilinen-sorunlar--çözümler)

---

## 1. Ürün Özeti

**Temel akış:**
```
Cast Direktörü
  → Proje açar (film/dizi/reklam/tiyatro)
  → Proje içinde rol tanımlar (yaş, cinsiyet, açıklama, senaryo)
  → Oyuncu havuzundan aday ekler (status: 'candidate')
  → Adaya "Audition İste" → benzersiz token link oluşur
  → Oyuncu linke girer, video yükler (public, auth gerektirmez)
  → Ekip videoyu izler, status günceller (pending → reviewing → shortlisted → selected/rejected)
```

**Multi-tenant:** Her kayıt olan kullanıcı kendi `organization`'ına sahip. RLS tüm verileri org bazında izole eder.

---

## 2. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 — App Router, Turbopack |
| UI | React 19, Tailwind CSS v4 |
| Backend/DB | Supabase (PostgreSQL + RLS + Storage) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Drag & Drop | `@dnd-kit/core`, `@dnd-kit/sortable` |
| İkonlar | `lucide-react` |
| Dil | TypeScript (strict mode) |

**Tailwind v4 notu:** `@import "tailwindcss"` kullanılır, `tailwind.config.js` yoktur. Tema değişkenleri `globals.css` içinde `@theme {}` bloğunda tanımlanır.  
**Component sınıfları** (`sb-input`, `sb-btn-primary`, vb.) `@layer components {}` içinde tanımlıdır — böylece Tailwind utility sınıfları (pl-8 gibi) bunları override edebilir.

---

## 3. Mimari

### Auth Akışı
```
/kayit → supabase.auth.signUp() (metadata: org_name, full_name)
       → DB trigger (handle_new_auth_user) → organizations INSERT + profiles INSERT (admin rolü)
       → Email doğrulama → /auth/callback → session exchange → /dashboard

/giris → password login → /dashboard
/sifremi-unuttum → reset email → /sifremi-sifirla
```

### Supabase Client'ları
| Dosya | Kullanım |
|-------|----------|
| `lib/supabase/server.ts` | Server Components & Route Handlers |
| `lib/supabase/client.ts` | Client Components (browser) |
| `lib/supabase/admin.ts` | Service role — RLS bypass (davet, public token sayfası) |

### Multi-tenant RLS Kalıbı
Tüm tablolarda:
```sql
-- SELECT policy örneği:
USING (organization_id = get_user_org_id())

-- INSERT policy örneği:
WITH CHECK (organization_id = get_user_org_id() AND get_user_role() IN ('admin', 'member'))
```
`get_user_org_id()` ve `get_user_role()` — `profiles` tablosundan `auth.uid()` ile çeken SQL helper fonksiyonları.

### Org Context (Client)
`lib/org-context.tsx` — `OrgProvider` + `useOrgId()` hook.  
Provider `(app)/layout.tsx` içinde sarmalanmıştır. Fotoğraf yükleme gibi client-side storage işlemlerinde kullanılır.

### Server Action Güvenliği
`lib/require-org.ts` — `requireOrg()`:
```typescript
export async function requireOrg() {
  const supabase = await createClient()
  // auth check + orgId resolve
  return { supabase, orgId }
}
```
Tüm server action'larda `await requireOrg()` ile başlanır.

### Middleware
`middleware.ts` — `/dashboard`, `/projeler`, `/roller`, `/oyuncular`, `/ayarlar` rotalarını auth guard'lar. Token-based public sayfalar (`/oyuncu/[token]`) middleware'den muaf.

---

## 4. Veritabanı Şeması

### Temel tablolar

**`organizations`**
```
id, name, logo_url, subscription_plan ('trial'|'pro'), subscription_status, trial_ends_at, created_at, updated_at
```

**`profiles`**
```
id (→ auth.users), organization_id, full_name, role ('admin'|'member'|'viewer'), avatar_url, created_at, updated_at
```

**`projects`**
```
id, organization_id, title, description,
type ('film'|'dizi'|'reklam'|'tiyatro'|'diger'),
status ('active'|'completed'|'archived'),
deadline (DATE), created_by, created_at, updated_at
```

**`project_roles`**
```
id, project_id, organization_id, name, description,
age_min, age_max, gender, notes, script_url (migration 007),
status ('open'|'casting'|'filled'|'cancelled'),
created_at, updated_at
```

**`talent`**
```
id, organization_id, full_name, email, phone,
birth_year, gender, height_cm, weight_kg,
eye_color, hair_color, hair_length,
playable_age_min, playable_age_max,
city, agency_name, manager_name,
availability ('available'|'busy'|'unavailable'),
skills (text[]), licenses (text[]),
avatar_url,
photos (text[])              -- migration 008
fee_type (text),             -- migration 010
fee_amount (numeric),        -- migration 010
fee_currency (text),         -- migration 010
fee_notes (text),            -- migration 010
showreel_url, voice_sample_url,
selftape_drama_url, selftape_comedy_url, selftape_ad_url,
notes, visibility ('public'|'private'),
created_at, updated_at
```

**`talent_languages`** (ayrı tablo)
```
id, talent_id, language, level (native|C2|C1|B2|B1|A2|A1), accents, sort_order
```

**`talent_experiences`** (ayrı tablo)
```
id, talent_id, project_name, role_name, role_type, production_type, director, production_company, year, sort_order
```

**`talent_education`** (ayrı tablo)
```
id, talent_id, school, program, year, sort_order
```

**`auditions`**
```
id, organization_id, role_id, talent_id,
talent_name, talent_email, invite_phone,
status ('candidate'|'pending'|'reviewing'|'shortlisted'|'rejected'|'selected'),
  -- 'candidate' migration 009 ile eklendi
token (text, unique) -- migration 005 ile eklendi
notes, submitted_at, sort_order, created_at, updated_at
```

**`audition_videos`**
```
id, audition_id, organization_id, storage_path, public_url, duration_seconds, notes, uploaded_at
```

### Storage Bucket'ları
| Bucket | Açıklama | Politika |
|--------|----------|----------|
| `talent-avatars` | Oyuncu fotoğrafları (kapak + galeri) | Public read, org-based write |
| `audition-videos` | Oyuncuların yüklediği videolar | Token bazlı anon write |
| `scripts` | Rol senaryoları (PDF) | migration 007 |

---

## 5. Route Haritası

```
app/
├── (app)/                    ← Auth guard (middleware), AppShell, OrgProvider
│   ├── layout.tsx            ← Auth check + fallback org creation (admin client)
│   ├── dashboard/page.tsx    ← Stats (proje/rol/oyuncu/aday sayıları) + son eklenenler
│   ├── projeler/
│   │   ├── page.tsx          ← Liste: search + durum/tür filtresi + sıralama
│   │   ├── ProjelerFilters.tsx (client)
│   │   ├── ProjeForm.tsx     ← Yeni/Düzenle formu
│   │   ├── actions.ts
│   │   ├── yeni/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx      ← Proje detay + rol listesi
│   │       ├── RollerSection.tsx (client) ← Rol ekleme/silme
│   │       ├── RolModal.tsx  ← Rol form modal
│   │       └── duzenle/page.tsx
│   ├── roller/
│   │   ├── page.tsx          ← Tüm roller listesi: search + durum/cinsiyet filtresi + sıralama
│   │   ├── RollerFilters.tsx (client)
│   │   └── [id]/
│   │       ├── page.tsx      ← Rol detay + aday/audition yönetimi
│   │       ├── RolAuditions.tsx (client) ← Drag-drop sıralama, durum güncelleme
│   │       ├── AdayEkleModal.tsx ← Oyuncu havuzundan çoklu aday seçme
│   │       └── DavetModal.tsx    ← Manuel isim+email ile davet
│   ├── oyuncular/
│   │   ├── page.tsx          ← Fotoğraf kartı grid (2:3), 5-sütun, sidebar filtreli
│   │   ├── OyuncuFilters.tsx (client) ← Geniş sidebar filtresi
│   │   ├── OyuncuForm.tsx    ← Yeni/Düzenle formu + fotoğraf yükleme (4 slot)
│   │   ├── TalentSlideshow.tsx (client) ← Slayt modu + "Role Ekle" dropdown
│   │   ├── actions.ts
│   │   ├── yeni/page.tsx
│   │   └── [id]/
│   │       ├── page.tsx      ← Profil: fotoğraf galerisi, fiziksel özellikler,
│   │       │                    diller, deneyim, eğitim, ücret, medya, adaylıklar
│   │       ├── AvailabilitySelector.tsx (client)
│   │       └── duzenle/page.tsx
│   ├── auditions/
│   │   └── actions.ts        ← createAudition, addCandidate, requestAudition, ...
│   └── ayarlar/page.tsx
├── auth/callback/route.ts    ← Email confirm + code exchange
├── oyuncu/[token]/           ← Public sayfa (auth gerektirmez)
│   ├── layout.tsx            ← Minimal layout (CastFlow logosu)
│   ├── page.tsx              ← Rol bilgisi + senaryo linki + video yükleme
│   └── UploadSection.tsx     ← Drag-drop video upload, progress bar
├── api/script/[token]/route.ts ← Senaryoyu signed URL ile serve eder
├── giris/page.tsx
├── kayit/page.tsx
├── sifremi-unuttum/page.tsx
└── sifremi-sifirla/page.tsx

components/
├── layout/
│   ├── AppShell.tsx     ← Sidebar + content wrapper
│   ├── AppSidebar.tsx   ← Nav linkleri
│   ├── MobileHeader.tsx
│   └── PageHeader.tsx
├── ui/
│   ├── Badge.tsx        ← variant: default|green|yellow|indigo
│   └── Card.tsx
├── ClickableRow.tsx     ← Tablo satırı tıklanabilir wrapper
└── DeleteButton.tsx     ← Confirm + server action

lib/
├── supabase/server.ts, client.ts, admin.ts
├── org-context.tsx
├── require-org.ts
└── utils.ts

types/database.ts        ← TalentLanguage, TalentExperience, TalentEducation types

supabase/
├── schema.sql           ← Canonical schema (tüm tablolar + RLS + trigger)
├── storage.sql          ← Storage bucket + policy
└── migrations/001–010
```

---

## 6. Tamamlanan Özellikler

### Auth & Onboarding
- [x] Kayıt: email + şifre + ad soyad + org adı
- [x] DB trigger ile otomatik org + profile (admin) oluşturma
- [x] Email doğrulama akışı
- [x] Şifre sıfırlama
- [x] Auth guard (middleware + layout double-check)
- [x] Fallback org oluşturma (layout.tsx, admin client)

### Projeler
- [x] CRUD (oluştur, düzenle, sil)
- [x] Tip filtresi (film/dizi/reklam/tiyatro/diğer)
- [x] Durum filtresi (aktif/tamamlandı/arşivlendi)
- [x] Arama (başlık) + sıralama (yeni/eski/A-Z/Z-A/deadline)
- [x] Detay sayfası: proje bilgileri + rol listesi

### Roller
- [x] Proje içinden rol ekleme (modal)
- [x] Rol silme
- [x] Roller listesi sayfası: search (rol/proje adı) + durum/cinsiyet filtresi + sıralama
- [x] Rol detay sayfası
- [x] Senaryo yükleme (PDF, `scripts` bucket)

### Oyuncu Havuzu
- [x] CRUD (oluştur, düzenle, sil)
- [x] Kapsamlı form: kişisel bilgiler, fiziksel özellikler, diller, deneyim, eğitim, medya linkleri, notlar
- [x] Fotoğraf yükleme: 4 slot (2:3 oran, ilki kapak), `talent-avatars` bucket, tam URL DB'de
- [x] Ücret bilgisi: fee_type (günlük/haftalık/bölüm/aylık/proje/saatlik), fee_amount, fee_currency, fee_notes
- [x] Sidebar filtresi: isim, cinsiyet, şehir, yaş aralığı, boy aralığı, yetenek, müsaitlik, ajans
- [x] Fotoğraf-kart grid (2:3 portrait, 5 sütun, gradient fallback)
- [x] **Slayt Modu:** Aktif filtrelere uyan oyuncuları tam ekran dark overlay ile gezme (← → klavye, nokta nav)
  - "Role Ekle" dropdown: proje→rol listesi, searchable, per-rol loading/success/error state
- [x] Profil sayfası: fotoğraf galerisi, tüm bilgiler, **adaylıklar bölümü** (hangi rollerde aday/audition)
- [x] Müsaitlik durumu quick-update (profil sayfası dropdown)

### Aday & Audition Yönetimi
- [x] **Aday (candidate):** Oyuncu havuzundan seçerek role ekle, henüz link paylaşılmaz
- [x] **Audition İste:** Adayı `pending`'e geçir, benzersiz token link oluştur, WhatsApp ile gönder
- [x] Drag-drop sıralama (`@dnd-kit`)
- [x] Durum güncellemeleri: pending → reviewing → shortlisted → rejected / selected
- [x] Sıralama: manuel / isim / durum / yükleme tarihi
- [x] Aday sayısı + aktif audition sayısı header özeti

### Oyuncu Video Yükleme (Public)
- [x] `/oyuncu/[token]` — auth gerektirmez
- [x] Rol bilgisi + açıklama + yönergeler
- [x] Senaryo indirme (signed URL, `api/script/[token]`)
- [x] Video yükleme (drag-drop, progress bar, `audition-videos` bucket)
- [x] Yükleme sonrası `submitted_at` güncelleme
- [x] Tekrar yükleme engeli (already submitted state)

### Dashboard
- [x] Gerçek verilerle 5 stat kartı: Aktif Proje, Açık Rol, Oyuncu, Aday, Bekleyen Audition
- [x] Son eklenen oyuncular listesi (müsaitlik noktası + şehir)
- [x] Son projeler listesi (durum badge'i)
- [x] Hızlı erişim linkleri

### UI / DX
- [x] `@layer components` ile CSS düzeltmesi — `pl-8` gibi utility'ler artık `.sb-input`'u override edebilir (icon+yazı üst üste binmez)
- [x] Modern filter bar tasarımı: pill butonlar (durum), minimal select (tür/cinsiyet), overlay-select sıralama

---

## 7. Bekleyen Özellikler (Roadmap)

### Kritik / Kısa Vadeli
- [ ] **M4 — Video İzleme Paneli:** Rol detay sayfasında yüklenen videoları oynat, ekip yorumları, not ekleme
- [ ] **Çoklu kullanıcı / Ekip davet:** Aynı org'a başka kullanıcıları davet et, rol ata (member/viewer)

### Orta Vadeli
- [ ] **M5 — Shortlist & Toplantı Modu:** Kısa listedeki adayları yan yana compare, ekip oylaması (thumbs up/down)
- [ ] **M6 — Callback & Final:** Callback daveti, final seçim ekranı, seçilen oyuncuya tebrik/ret bildirimi
- [ ] **M7 — Raporlama:** Proje bazlı Excel/CSV export, casting özeti PDF

### Uzun Vadeli
- [ ] **M8 — Abonelik:** İyzico entegrasyonu, plan limitleri (trial: X proje, X oyuncu), upgrade akışı
- [ ] **Bildirimler:** Video yüklendiğinde email/push bildirimi cast direktörüne
- [ ] **Oyuncu portalı genişletme:** Oyuncu kendi profilini güncelleyebilsin (token bazlı veya ayrı auth)
- [ ] **Şirket logosu / beyaz etiket:** Org bazlı marka özelleştirme

---

## 8. Server Actions

### `app/(app)/auditions/actions.ts`
```typescript
createAudition(roleId, talentId|null, talentName, talentEmail, invitePhone)
// talentId null ise yeni talent kaydı oluşturur, ardından audition ekler

addCandidate(roleId, talentId)
// status: 'candidate' — henüz link yok, duplicate kontrolü yapar

requestAudition(auditionId, roleId, invitePhone|null)
// status: 'pending', mevcut token döner — WhatsApp linki için kullanılır

updateAuditionStatus(auditionId, roleId, status)
deleteAudition(auditionId, roleId)
reorderAuditions(roleId, orderedIds[])
```

### `app/(app)/oyuncular/actions.ts`
```typescript
createOyuncu(formData)   // photos_json (JSON array of URLs), fee_* alanları dahil
updateOyuncu(id, formData)
deleteOyuncu(id)
```

### `app/(app)/projeler/actions.ts`
```typescript
createProje(formData)
updateProje(id, formData)
deleteProje(id)
```

### `app/actions/auth.ts`
```typescript
signIn(email, password)
signUp(email, password, fullName, orgName)
signOut()
```

---

## 9. Kritik Kurallar & Kalıplar

### Yeni Sayfa Ekleme
1. Server Component olarak başla, `createClient()` from `lib/supabase/server.ts`
2. Gerekirse Client Component'e (`'use client'`) ayır
3. Middleware koruması `(app)/` grubu altında otomatik

### Yeni Tablo Ekleme
```sql
-- Zorunlu kolonlar:
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()

-- RLS:
ALTER TABLE public.yeni_tablo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "yeni_select" ON public.yeni_tablo FOR SELECT
  USING (organization_id = get_user_org_id());
-- insert/update/delete policy'leri de ekle

-- Trigger:
CREATE TRIGGER yeni_updated_at BEFORE UPDATE ON public.yeni_tablo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### Client-side State & Server Sync
```typescript
// router.refresh() sonrası prop'un güncellenmesi için useEffect:
useEffect(() => {
  setItems([...initial].sort(...))
}, [initial])
```
Bu pattern `RolAuditions.tsx`'te kullanılır — aday eklenince sayfayı yenilemeden listeyi günceller.

### Fotoğraf Yükleme Kalıbı
- Client component'te `createBrowserClient()` ile doğrudan Storage'a yükle
- Path: `{orgId}/{Date.now()}-{random}.{ext}`
- Tam public URL'i DB'ye yaz (array field)
- Form submit'te hidden input (`photos_json`) üzerinden server action'a ilet

### Filter Bar Kalıbı (Projeler/Roller)
URL searchParams tabanlı — `useRouter().push()` ile param güncelle, Server Component param'ı okur.
- Status filtreleri: pill buton array (tıklanabilir, aktif state ring-1 ring-indigo-200)
- Sıralama: overlay-select (görsel label + transparent native select üstüne)
- Temizle: sadece filtre varken görünür

### CSS Utility Override
`.sb-input` ve diğer component sınıfları `@layer components` içinde (`globals.css`).  
Tailwind utilities (`pl-8`, `h-8`, vb.) her zaman component sınıflarını override eder.

### Admin Client Kullanımı
Sadece iki yerde:
1. `(app)/layout.tsx` — fallback org creation (auth trigger başarısızsa)
2. `oyuncu/[token]/page.tsx` — RLS bypass ile token'a ait audition'ı çek

---

## 10. Supabase Kurulum Sırası

Yeni ortamda sıfırdan kurarken:

```
1. supabase/schema.sql          → Tüm tablolar, RLS, helper fonksiyon, trigger, index
2. supabase/migrations/001_auth_trigger.sql → Auth user → org + profile trigger
3. supabase/migrations/002_proje_module.sql
4. supabase/migrations/003_talent_module.sql → Talent genişletilmiş kolonlar
5. supabase/migrations/004_grants.sql
6. supabase/migrations/005_audition_tokens.sql → token kolonu + unique index
7. supabase/migrations/006_audition_sort_order.sql → sort_order kolonu
8. supabase/migrations/007_scripts_bucket.sql → script_url + scripts bucket policy
9. supabase/storage.sql         → talent-avatars + audition-videos bucket
10. supabase/migrations/008_talent_photos.sql
11. supabase/migrations/009_candidate_status.sql
12. supabase/migrations/010_talent_fee.sql
13. supabase/migrations/011_fix_role_status.sql → project_roles status constraint'ini ('open','casting','filled','cancelled') olarak düzeltir (002'nin hatalı değişikliğini geri alır)
14. supabase/migrations/012_service_role_grants.sql → service_role'e tüm tablolarda GRANT verir (admin client hiç GRANT edilmemişti, /oyuncu/[token] hep 404 veriyordu); anon'a auditions UPDATE izni ekler (video yükleme sonrası submitted_at güncellemesi için)
15. supabase/migrations/013_fix_submitted_at_default.sql → auditions.submitted_at'in yanlış DEFAULT NOW() değerini kaldırır ve video yüklenmemiş kayıtlarda geriye dönük NULL'a çeker (her yeni audition anında "yüklendi" görünüyordu)
16. supabase/migrations/014_invite_trigger.sql → handle_new_auth_user trigger'ını günceller; metadata'da organization_id varsa yeni org oluşturmak yerine mevcut org'a profile ekler (ekip daveti akışı için)
17. supabase/migrations/015_audition_notes_author.sql → auditions tablosuna notes_updated_by (FK→profiles) ve notes_updated_at kolonları ekler; not yazarını takip etmek için
```

---

## 11. Ortam Değişkenleri

`.env.local` dosyasında bulunmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # Admin client için
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # WhatsApp link base URL
```

---

## 12. Bilinen Sorunlar & Çözümler

### Slayt modunda "Role Ekle" görünmüyor
**Neden:** Aktif projesi olmayan orglar için `projects` array'i boş döner.  
**Davranış:** Buton disabled + hover tooltip "Aktif proje yok" — bu kasıtlı.

### `UploadSection.tsx` — `organization_id` placeholder
```typescript
organization_id: '00000000-0000-0000-0000-000000000000',
```
Video yükleme public sayfada (anon) gerçekleştiği için RLS bypass'e ihtiyaç var.  
`audition_videos` tablosunda anon insert policy mevcutsa çalışır; değilse `storage.sql`'i kontrol et.

### Oyuncu havuzundan duplicate aday ekleme
`addCandidate` action içinde `maybeSingle()` ile duplicate kontrolü yapılır.  
Aynı oyuncu aynı role zaten ekliyse `{ error: '...' }` döner, slayt modunda "Hata" gösterir.

### Server-side text search (Roller)
Roller sayfasında proje adına göre arama DB'de değil, sonuç array üzerinde yapılır (Supabase join sonrası filtreleme). Performans için büyük data setlerinde `pg_trgm` index eklenebilir.
