# CastFlow — QA Test Roadmap

Tüm sayfalar, özellikler ve edge case'ler. Test ID'leri (`A-01` gibi) hata raporlarken referans olarak kullanılır.

**Durum kolonu:** ⬜ test edilmedi · ✅ geçti · ❌ hata · ⏭️ kapsam dışı

---

## 0. Ön Hazırlık

### 0.1 Ortam Doğrulama

| ID | Kontrol | Beklenen |
|---|---|---|
| P-01 | `.env.local` tüm değişkenler dolu | Eksik yok |
| P-02 | `POLAR_SERVER` değeri | `sandbox` (test için) |
| P-03 | Polar sandbox ürün ID'leri `NEXT_PUBLIC_*` ile eşleşiyor | Eşleşiyor |
| P-04 | `CRON_SECRET` tanımlı | Cron route testleri için gerekli |
| P-05 | `NEXT_PUBLIC_SENTRY_DSN` tanımlı | Hata yakalama aktif |
| P-06 | DB migration durumu | ✅ 052 düzeltilip uygulandı — aşağıdaki nota bak |

> **✅ P-06 — Çözüldü (2026-08-02).** Migration `052_remove_starter_plan.sql` diskte vardı ama production'a **hiç uygulanmamıştı**; DB, migration 020'nin bıraktığı halde duruyordu (`DEFAULT 'starter'`, CHECK `starter|pro|agency|trial`).
>
> Dahası 052 yazıldığı haliyle **çalışamazdı**: `subscription_plan` `schema.sql`'den beri `NOT NULL`'dı ve 052 bunu hiç düşürmüyordu, dolayısıyla ilk `UPDATE ... SET subscription_plan = NULL` satırı 23502 ile patlardı.
>
> Bunun canlı koddaki sonucu ciddiydi: `app/api/webhook/polar/route.ts` revoke handler'ı `subscription_plan: null` yazıyor, UPDATE komple düşüyor, `error` kontrol edilmediği için webhook Polar'a 200 dönüyordu. **Revoke edilen abonelikler ücretli planlarıyla açık kalıyordu** — sessizce, log'suz.
>
> Yapılanlar: 052'ye `DROP NOT NULL` eklendi, CHECK `IS NULL OR (pro|agency)` olarak yazıldı, migration uygulandı; hata kontrolü `lib/polar-sync.ts` içindeki tek yazma noktasına (`applyOrgPatch`) taşındı ve Sentry'ye raporlanır hale getirildi. Revoke yazımı DB'ye karşı doğrulandı.

### 0.2 Test Hesapları

En az 3 hesap gerekiyor. Multi-tenant izolasyon testlerinin çoğu ikinci org olmadan yapılamaz.

| ID | Hesap | Kurulum |
|---|---|---|
| P-10 | **Hesap A** — `org_type = production` | Cast direktörü akışları |
| P-11 | **Hesap B** — `org_type = agency` | Ajans CRM akışları (müşteriler, teklifler, işler, görevler, takvim, genel bakış) |
| P-12 | **Hesap C** — ikinci production org | Çapraz kiracı (cross-tenant) sızıntı testleri |
| P-13 | Hesap A'ya `member` rolünde 2. kullanıcı | Rol bazlı yetki testleri |
| P-14 | Hesap A'ya `viewer` rolünde 3. kullanıcı | Salt-okunur yetki testleri |

### 0.3 Test Dosyaları

| ID | Dosya | Amaç |
|---|---|---|
| P-20 | Küçük video (~5 MB, .mp4) | Hızlı upload turu |
| P-21 | Büyük video (~500 MB) | Upload progress, timeout, depolama sayacı |
| P-22 | Video olmayan dosya (.pdf uzantısı .mp4 yapılmış) | MIME doğrulama |
| P-23 | PDF senaryo < 20 MB | Normal senaryo yükleme |
| P-24 | PDF senaryo tam 20 MB ve 20 MB + 1 byte | Sınır testi |
| P-25 | Bozuk/0 byte dosya | Hata yönetimi |
| P-26 | Çok büyük fotoğraf (>10 MB) + türkçe karakterli dosya adı | Avatar upload + isim sanitize |

---

## 1. Kimlik Doğrulama ve Onboarding

### 1.1 Kayıt — `/kayit`

| ID | Senaryo | Beklenen |
|---|---|---|
| A-01 | Geçerli bilgilerle kayıt | Org + profile oluşur, doğrulama maili gider |
| A-02 | Zaten kayıtlı email ile kayıt | Net hata mesajı, kullanıcı sızdırılmaz |
| A-03 | Geçersiz email formatı | Client + server tarafında yakalanır |
| A-04 | 6 karakterden kısa şifre | Reddedilir |
| A-05 | Boş org adı | Reddedilir |
| A-06 | Org adında emoji / türkçe karakter / 500 karakter | Bozulmadan kaydedilir veya sınırlanır |
| A-07 | Org adında `<script>alert(1)</script>` | XSS çalışmaz, escape edilir |
| A-08 | Kayıt sonrası hoş geldin maili | `sendWelcomeEmail` tetiklenir |
| A-09 | Trigger başarısız olursa | `/kurulum` fallback sayfası devreye girer |
| A-10 | Aynı anda çift submit (çift tık) | Tek org oluşur, duplicate yok |

### 1.2 Email Doğrulama — `/auth/callback`

| ID | Senaryo | Beklenen |
|---|---|---|
| A-15 | Geçerli doğrulama linki | Session açılır → dashboard |
| A-16 | Süresi dolmuş link | Anlaşılır hata, yeniden gönderme yolu |
| A-17 | Aynı link 2. kez kullanılır | Zarif hata, çökme yok |
| A-18 | Bozulmuş/elle değiştirilmiş `code` parametresi | Reddedilir |

### 1.3 Giriş — `/giris`

| ID | Senaryo | Beklenen |
|---|---|---|
| A-20 | Doğru bilgiler | Dashboard'a yönlenir |
| A-21 | Yanlış şifre | Genel hata (hangi alanın yanlış olduğu sızdırılmaz) |
| A-22 | Var olmayan email | A-21 ile **aynı** mesaj (kullanıcı sayımı engellenir) |
| A-23 | Doğrulanmamış email | Doğrulama uyarısı |
| A-24 | Rate limit — 10+ hızlı deneme | Limit devreye girer |
| A-25 | Giriş yapmışken `/giris`'e gitme | Dashboard'a yönlenir |
| A-26 | Session süresi dolduktan sonra sayfa yenileme | `/giris`'e yönlenir, hata sayfası değil |

### 1.4 Şifre Sıfırlama

| ID | Senaryo | Beklenen |
|---|---|---|
| A-30 | `/sifremi-unuttum` — kayıtlı email | Mail gider, onay mesajı |
| A-31 | Kayıtlı olmayan email | **Aynı** onay mesajı (enumeration engeli) |
| A-32 | `/sifremi-sifirla` — geçerli token ile yeni şifre | Şifre değişir, giriş yapılabilir |
| A-33 | Token olmadan doğrudan `/sifremi-sifirla` | Hata / yönlendirme |
| A-34 | Süresi dolmuş recovery token | Anlaşılır hata |
| A-35 | Şifre sıfırlandıktan sonra eski şifre | Çalışmaz |

### 1.5 Kurulum & Plan Seçimi

| ID | Senaryo | Beklenen |
|---|---|---|
| A-40 | `/kurulum` — org'suz kullanıcı | Org oluşturma formu |
| A-41 | `/plan-sec` — `polar_subscription_id` NULL | Buraya zorunlu yönlendirme |
| A-42 | Aboneliksizken `/dashboard`'a doğrudan gitme | `/plan-sec`'e yönlenir (`requireOrg()`) |
| A-43 | Aboneliksizken herhangi bir server action | Engellenir |
| A-44 | `/payment/processing` — abonelik aktifleşiyor | Polling başarılı → dashboard |
| A-45 | `/payment/processing` — 45 sn timeout | Zarif timeout mesajı, sonsuz spinner değil |

### 1.6 Çıkış

| ID | Senaryo | Beklenen |
|---|---|---|
| A-50 | Çıkış yap | Session temizlenir |
| A-51 | Çıkıştan sonra geri tuşu | Korumalı sayfa görünmez |

---

## 2. Yetkilendirme & Multi-Tenant İzolasyon

> **Bu bölüm en kritik olanı.** Buradaki bir hata veri sızıntısı demektir.

### 2.1 Çapraz Kiracı (Cross-Tenant)

Her senaryoda: Hesap A ile kaynağın ID'sini al, Hesap C ile eriş.

| ID | Senaryo | Beklenen |
|---|---|---|
| Z-01 | `/projeler/{A'nın proje id}` | 404 |
| Z-02 | `/roller/{A'nın rol id}` | 404 |
| Z-03 | `/oyuncular/{A'nın oyuncu id}` | 404 |
| Z-04 | `/listeler/{A'nın liste id}` | 404 |
| Z-05 | `/musteriler/{B'nin müşteri id}` | 404 / 403 |
| Z-06 | `/teklifler/{B'nin teklif id}` | 404 / 403 |
| Z-07 | `/gelen-roller/{başkasının share id}` | 404 |
| Z-08 | **`/oneri-yazdir/{başka org'un submission id}`** | **404 — ⚠️ envanterde bu sayfada görünür yetki kontrolü yok, öncelikli test** |
| Z-09 | **`/api/video-url?path={başka org'un video yolu}`** | **403/404 — ⚠️ auth var ama sahiplik kontrolü doğrulanmalı** |
| Z-10 | `/api/shared-script/{başka org'un script id}` | RLS engeller |
| Z-11 | `/api/export/bookings` — production org ile | 403 |
| Z-12 | Server action'a başka org'un kayıt ID'si POST'la | Sessizce başarılı olmamalı |

### 2.2 Rol Bazlı Yetki (admin / member / viewer)

| ID | Senaryo | Beklenen |
|---|---|---|
| Z-20 | `viewer` proje oluşturmayı dener | Engellenir |
| Z-21 | `viewer` oyuncu siler | Engellenir |
| Z-22 | `viewer` audition puanı verir | Politikaya göre — tanımlı ve tutarlı olmalı |
| Z-23 | `member` ekip üyesi davet eder | Engellenir (admin işlemi) |
| Z-24 | `member` org ayarlarını değiştirir | Engellenir |
| Z-25 | `member` abonelik yönetimine erişir | Engellenir |
| Z-26 | `admin` kendini org'dan siler | Engellenir veya net uyarı (org sahipsiz kalmamalı) |
| Z-27 | UI'da gizlenen butonun action'ı doğrudan çağrılır | Server tarafında da engellenir |

### 2.3 Org Tipi (`production` / `agency`)

| ID | Senaryo | Beklenen |
|---|---|---|
| Z-30 | Production org → `/genel-bakis` | `/dashboard`'a yönlenir |
| Z-31 | Production org → `/musteriler` | Yönlendirilir |
| Z-32 | Production org → `/teklifler` | Yönlendirilir |
| Z-33 | Production org → `/isler` | Yönlendirilir |
| Z-34 | Production org → `/gorevler` | Yönlendirilir |
| Z-35 | Production org → `/takvim` | Yönlendirilir |
| Z-36 | Agency org → tüm yukarıdakiler | Erişebilir |
| Z-37 | Agency org → production sayfaları (projeler, roller) | Erişebilir (ortak modül) |

---

## 3. Dashboard & Genel Bakış

### 3.1 Dashboard — `/dashboard`

| ID | Senaryo | Beklenen |
|---|---|---|
| D-01 | **Tamamen boş hesap** (yeni kayıt) | Tüm sayaçlar 0, boş-durum mesajları, çökme yok |
| D-02 | 5 stat kartı doğruluğu | Manuel sayımla birebir eşleşir |
| D-03 | Arşivlenmiş proje sayıma dahil mi | "Aktif proje" sayacı arşivlileri saymaz |
| D-04 | 7 günlük deadline banner'ı | Deadline'ı 6 gün sonra olan proje ile görünür |
| D-05 | Deadline **bugün** | Banner'da görünür |
| D-06 | Deadline **geçmiş** | Davranış tanımlı (gizle veya "gecikmiş" göster) |
| D-07 | Depolama progress bar %0 | Doğru render |
| D-08 | Depolama %75 üstü | Sarı |
| D-09 | Depolama %90 üstü | Kırmızı |
| D-10 | Depolama %100 üstü (limit aşımı) | Bar taşmaz, upload engellenir |
| D-11 | `OnboardingCard` 3 adımlı checklist | Adımlar tamamlandıkça işaretlenir |
| D-12 | Onboarding kartını kapat + sayfa yenile | Kapalı kalır (localStorage) |
| D-13 | Son eklenen oyuncular / son projeler panelleri | En yeni 5 kayıt, doğru sırada |

### 3.2 Genel Bakış (Ajans) — `/genel-bakis`

| ID | Senaryo | Beklenen |
|---|---|---|
| D-20 | Boş ajans hesabı | Tüm bloklar boş-durum, çökme yok |
| D-21 | Süresi dolan sözleşmeler bloğu | Doğru tarih filtresi |
| D-22 | Süresi dolan belgeler bloğu | Doğru liste |
| D-23 | Ödenmemiş işler (booking) | `payment_status != paid` olanlar |
| D-24 | Eksklüzivite listesi | Doğru |
| D-25 | Komisyon toplamı | Manuel hesapla eşleşir |
| D-26 | Avans toplamı | Doğru |
| D-27 | Gecikmiş görevler | `due_date < bugün` ve tamamlanmamış |

---

## 4. Projeler

| ID | Senaryo | Beklenen |
|---|---|---|
| PR-01 | `/projeler` boş liste | Boş-durum mesajı + "Yeni proje" CTA |
| PR-02 | `/projeler/yeni` — geçerli proje | Oluşur, listede görünür |
| PR-03 | Boş başlık | Reddedilir |
| PR-04 | 500+ karakter başlık | Sınırlanır veya bozulmadan kaydedilir |
| PR-05 | Başlıkta `<script>` / emoji / türkçe karakter | Escape edilir, bozulmaz |
| PR-06 | Deadline geçmiş tarih | İzin ver veya net uyarı — davranış tanımlı olmalı |
| PR-07 | Deadline çok uzak (2099) | Kabul edilir, UI bozulmaz |
| PR-08 | Proje düzenle (`/projeler/[id]/duzenle`) | Değişiklik kaydolur |
| PR-09 | Proje arşivle | Listede arşiv sekmesine geçer |
| PR-10 | Arşivden geri al ("Aktifleştir") | Aktif listeye döner |
| PR-11 | Rolleri olan projeyi sil | Cascade davranışı doğrulanmalı — roller ve audition'lar ne oluyor? |
| PR-12 | Silmeden önce onay | Onay diyaloğu çıkar |
| PR-13 | Proje detay — rol listesi + audition sayaçları | Sayılar doğru |
| PR-14 | 50+ projeli liste | Sayfalama / performans kabul edilebilir |
| PR-15 | Proje detay `?tab=` geçersiz değer | Varsayılan sekmeye düşer, çökme yok |

---

## 5. Roller

### 5.1 Rol CRUD

| ID | Senaryo | Beklenen |
|---|---|---|
| R-01 | Proje içinde rol oluştur | Oluşur |
| R-02 | Boş rol adı | Reddedilir |
| R-03 | Yaş aralığı: min > max | Reddedilir veya düzeltilir |
| R-04 | Yaş aralığı: negatif / 0 / 200 | Doğrulanır |
| R-05 | Rol durumu değiştir (`open→casting→filled→cancelled`) | `RolStatusSelect` inline çalışır |
| R-06 | Geçersiz durum değeri POST'la | DB CHECK reddeder |
| R-07 | Adayı olan rolü sil | Cascade doğrulanır |
| R-08 | `/roller` — proje filtresi | Doğru filtreler |
| R-09 | Durum + cinsiyet + arama filtreleri birlikte | Kombinasyon doğru çalışır |
| R-10 | Arama — türkçe karakter (`ı`, `ş`, `ğ`) | Eşleşir |
| R-11 | Arama — SQL özel karakterleri (`%`, `_`, `'`) | Enjeksiyon yok, sonuç mantıklı |
| R-12 | Sıralama seçenekleri | Doğru sıralar |
| R-13 | Sayfalama — son sayfa, tek kayıtlı sayfa | Doğru |
| R-14 | Sayfalama — URL'de `?page=9999` | Boş sayfa veya son sayfa, çökme yok |
| R-15 | Roller listesinde "Adaylar" sütunu | Doğru sayı |

### 5.2 Genel Başvuru (Public Apply) — `/basvur/[roleToken]`

| ID | Senaryo | Beklenen |
|---|---|---|
| R-20 | Rolü herkese aç (`is_public = true`) | Public link üretilir |
| R-21 | Public link ile başvuru formu | Giriş gerekmeden açılır |
| R-22 | `is_public = false` iken link | Engellenir |
| R-23 | Rol durumu `filled`/`cancelled` iken link | Engellenir |
| R-24 | Geçersiz/uydurma token | 404 |
| R-25 | Aynı email ile 2. kez başvuru | Dedupe — yeni kayıt açılmaz, mevcut güncellenir |
| R-26 | Rate limit — 10+ başvuru/dk | Limit devreye girer |
| R-27 | Başvuruda XSS payload | Escape edilir |
| R-28 | Başvuru sonrası org retention varsayılanı | `retention_until` snapshot alınır |
| R-29 | Fotoğraf yükleme (`/api/public-photo-url`) | Çalışır; rol kapalıysa 403 |

### 5.3 Rol Paylaşımı (Ajanslar Arası)

| ID | Senaryo | Beklenen |
|---|---|---|
| R-40 | `RoleShareModal` — ajans slug ile ara | Bulur |
| R-41 | Geçersiz slug | Bulunamadı mesajı |
| R-42 | Slug regex sınırı (`^[a-z0-9-]{3,40}$`) | 2 karakter, 41 karakter, büyük harf, `_` → reddedilir |
| R-43 | Aynı partnerle 2. kez paylaşım | Unique constraint — duplicate engellenir |
| R-44 | Paylaşımı iptal et (revoke) | Karşı taraf erişemez |
| R-45 | Karşı tarafta `/gelen-roller` | Paylaşılan rol görünür |
| R-46 | `SubmissionBuilder` ile oyuncu öner | Öneri oluşur |
| R-47 | Aynı oyuncuyu 2 kez ekle | Unique `(submission_id, source_talent_id)` engeller |
| R-48 | Submission durum akışı (`taslak→gonderildi→incelendi→kabul/red/kismen_kabul`) | Geçersiz geçişler engellenir |
| R-49 | Öneri kalemi kararı (`beklemede→begenildi/reddedildi`) | Çalışır |
| R-50 | Gönderilmiş submission'ı düzenlemeye çalış | Engellenir |
| R-51 | `/api/shared-script/[shareId]` — partner erişimi | RLS izin verir |
| R-52 | Revoke sonrası aynı script linki | Erişilemez |

---

## 6. Oyuncular (Talent)

### 6.1 CRUD

| ID | Senaryo | Beklenen |
|---|---|---|
| T-01 | Yeni oyuncu — minimum alanlar | Oluşur |
| T-02 | Yeni oyuncu — tüm alanlar dolu | Hepsi kaydolur |
| T-03 | Boy/kilo: 0, negatif, 999 | Doğrulanır |
| T-04 | Doğum tarihi gelecekte | Reddedilir |
| T-05 | Doğum tarihi 1900 öncesi | Doğrulanır |
| T-06 | Email formatı geçersiz | Reddedilir |
| T-07 | Telefon — uluslararası format, boşluklu, `+90` | Kabul edilir |
| T-08 | Ücret alanı — negatif, çok büyük, ondalık | Doğrulanır |
| T-09 | Diller / deneyim / eğitim ekle-sil | Çalışır |
| T-10 | Aynı isimde 2 oyuncu | İzin verilir (duplicate uyarısı olabilir) |
| T-11 | Oyuncu sil — audition'ları varken | Cascade doğrulanır, onay istenir |
| T-12 | `AvailabilitySelector` (müsait/meşgul/uygun değil) | Kaydolur |
| T-13 | Oyuncu listesi filtreleri + arama | Doğru |
| T-14 | 100+ oyuncu | Performans, sayfalama |

### 6.2 Medya

| ID | Senaryo | Beklenen |
|---|---|---|
| T-20 | Fotoğraf yükle | Galeride görünür |
| T-21 | Kapak fotoğrafı seç | En başta görünür |
| T-22 | Çok büyük fotoğraf (P-26) | Sınır uygulanır veya sıkıştırılır |
| T-23 | Fotoğraf olmayan dosya | Reddedilir |
| T-24 | Türkçe karakterli dosya adı | Bozulmaz |
| T-25 | Fotoğraf sil | Storage'dan da gider (öksüz dosya kalmamalı) |
| T-26 | Belge yükle (`talent_documents`, 7 tip) | Her tip çalışır |
| T-27 | Belge son kullanma tarihi geçmiş | Genel Bakış'ta uyarı çıkar (D-22) |

### 6.3 Self-Service — `/oyuncu-profil/[token]`

| ID | Senaryo | Beklenen |
|---|---|---|
| T-30 | Geçerli self-service token | Profil düzenleme açılır, giriş gerekmez |
| T-31 | Geçersiz token | 404 |
| T-32 | Oyuncu kendi bilgisini günceller | Kaydolur, direktör tarafında görünür |
| T-33 | Token ile **başka** oyuncunun ID'sini göndermeye çalış | Engellenir |
| T-34 | Yetkisi olmayan alanları (ücret, notlar) düzenlemeye çalış | Engellenir |
| T-35 | `SelfServiceLinkCard` — link üret/yenile | Eski link geçersizleşir |

### 6.4 Google Sheets

| ID | Senaryo | Beklenen |
|---|---|---|
| T-40 | `/api/google/connect` → OAuth | Bağlanır |
| T-41 | Callback — state parametresi uyuşmuyor | Reddedilir (CSRF koruması) |
| T-42 | Oyuncuları Sheets'e aktar | Doğru veri |
| T-43 | Sheets'ten içe aktar — bozuk satırlar | Zarif hata, kısmi başarı raporu |
| T-44 | Sheets'ten içe aktar — duplicate | Dedupe davranışı tanımlı |
| T-45 | Bağlantıyı kes | Token temizlenir |
| T-46 | Süresi dolmuş Google token ile aktarım | Yenilenir veya net hata |

---

## 7. Audition / Adaylar

| ID | Senaryo | Beklenen |
|---|---|---|
| AU-01 | `AdayEkleModal` ile aday ekle | Audition oluşur, token üretilir |
| AU-02 | Aynı oyuncuyu aynı role 2. kez ekle | Engellenir veya uyarı |
| AU-03 | Sürükle-bırak sıralama (dnd-kit) | Sıra kaydolur, yenilemede korunur |
| AU-04 | Tek adaylı listede sürükleme | Çökme yok |
| AU-05 | Durum dropdown inline değişimi | Kaydolur |
| AU-06 | Toplu durum güncelleme | Hepsi güncellenir |
| AU-07 | Yıldız puanı 1–5 | Kaydolur |
| AU-08 | Puanı 0 veya 6 POST'la | DB CHECK reddeder |
| AU-09 | Puanı kaldır (null) | Çalışır |
| AU-10 | Not yaz — yazar + zaman damgası | `notes_updated_by/at` doğru |
| AU-11 | Not presetleri (✓ Güçlü performans vb.) | Ekler |
| AU-12 | Çok uzun not (5000+ karakter) | Kaydolur veya sınırlanır |
| AU-13 | Notta XSS payload | Escape edilir |
| AU-14 | Etiket ekle — mevcut etiketten seç | Çalışır |
| AU-15 | Etiket ekle — yeni etiket oluştur | Org bazlı oluşur |
| AU-16 | Aynı etiketi 2 kez ekle | Duplicate olmaz |
| AU-17 | Etiket sil | Kalkar |
| AU-18 | Tablodaki etiket chip'leri | Oyuncu adı altında doğru |
| AU-19 | Not göstergesi ikonu hover | Yazar bilgisi görünür |
| AU-20 | `AuditionIsteModal` → WhatsApp linki | Doğru URL, doğru metin |
| AU-21 | `sendAuditionEmailAction` | Mail gider |
| AU-22 | `KarsilastirModal` — 2+ aday yan yana | Doğru veri |
| AU-23 | Karşılaştırmada videosuz aday | Zarif boş durum |
| AU-24 | Audition sil | Video ve notlar ne oluyor — tanımlı olmalı |

### 7.1 Video Modal & Notlar

| ID | Senaryo | Beklenen |
|---|---|---|
| AU-30 | Video oynatma | Oynar |
| AU-31 | Timestamp notu ekle | Kaydolur |
| AU-32 | Timestamp notuna tıkla | Video o ana atlar |
| AU-33 | Video süresi 0 / okunamıyor | Zarif davranır |
| AU-34 | Timestamp video süresinden büyük | Doğrulanır |
| AU-35 | Timestamp notu sil | Kalkar |
| AU-36 | Aynı anda birden fazla not | Sıralı görünür |
| AU-37 | Videosu silinmiş audition'ın notları | **Korunur** (direktörün değerlendirme emeği) |

---

## 8. Video Yükleme (Public) — `/oyuncu/[token]`

| ID | Senaryo | Beklenen |
|---|---|---|
| V-01 | Geçerli token | Sayfa açılır, giriş gerekmez |
| V-02 | Geçersiz/uydurma token | 404 |
| V-03 | Normal video yükle (P-20) | Yüklenir, DB'ye kaydolur |
| V-04 | Büyük video (P-21) | Progress çalışır, timeout yok |
| V-05 | **4. video yüklemeye çalış** | **409 — max 3 video/audition** |
| V-06 | Video olmayan dosya (P-22) | `video/*` MIME kontrolü reddeder |
| V-07 | 0 byte dosya (P-25) | Reddedilir |
| V-08 | Rate limit — 20+ istek/dk | Limit devreye girer |
| V-09 | Depolama limiti dolu org | 403, net mesaj |
| V-10 | Abonelik pasif org | 403 |
| V-11 | `duration_seconds` yazımı | Client'ta okunur, DB'ye doğru yazılır |
| V-12 | `file_size_bytes` yazımı | Doğru |
| V-13 | Depolama sayacı artışı | `sync_org_storage` trigger'ı doğru artırır |
| V-14 | Yükleme sırasında sekmeyi kapat | Yarım kayıt kalmaz veya temizlenir |
| V-15 | İlk yüklemede `submitted_at` + durum | Otomatik set edilir |
| V-16 | Direktöre bildirim maili | Gider |
| V-17 | GDPR notu + gizlilik linki | Sayfada görünür |
| V-18 | Mobil tarayıcıdan yükleme (iOS Safari) | Çalışır |
| V-19 | Presigned URL süresi dolduktan sonra yükleme | Zarif hata |
| V-20 | Aynı dosyayı 2 kez yükle | Duplicate davranışı tanımlı |

### 8.1 Senaryo İndirme

| ID | Senaryo | Beklenen |
|---|---|---|
| V-30 | Davete gönderilen senaryoyu indir | PDF iner, oyuncu adıyla filigranlı |
| V-31 | **Role ait ama bu davete gönderilmemiş** senaryo ID'si | **404 — yetki sınırı `audition_scripts`, rol sahipliği değil** |
| V-32 | Başka role ait senaryo ID'si | 404 |
| V-33 | Geçersiz token + geçerli scriptId | 404 |

### 8.2 Oyuncunun Video Silme Hakkı (KVKK/GDPR)

| ID | Senaryo | Beklenen |
|---|---|---|
| V-40 | Oyuncu kendi videosunu siler | Silinir |
| V-41 | Silme butonu bulunabilirliği | **Birinci sınıf, kolay bulunur olmalı** |
| V-42 | Başka audition'ın video ID'si ile silme | 404 |
| V-43 | Silme sırası: kuyruk → DB → R2 | Doğrulanmalı |
| V-44 | Silme sonrası depolama sayacı | Azalır |
| V-45 | Silme sonrası audition kaydı | **Korunur** (not/puan/etiket kalır) |
| V-46 | Rate limit — 10+ istek/dk | Devreye girer |

---

## 9. Senaryo Yönetimi (Çoklu Senaryo)

| ID | Senaryo | Beklenen |
|---|---|---|
| S-01 | Role senaryo ekle | Eklenir |
| S-02 | **10. senaryo** | Kabul edilir |
| S-03 | **11. senaryo** | **Reddedilir** (`MAX_SCRIPTS_PER_ROLE = 10`) |
| S-04 | **Tam 20 MB dosya** | Kabul edilir |
| S-05 | **20 MB + 1 byte** | **Reddedilir** (`MAX_SCRIPT_BYTES`) |
| S-06 | PDF olmayan dosya | Reddedilir |
| S-07 | Senaryo etiketi düzenle | Kaydolur |
| S-08 | Senaryo sırala | Sıra korunur |
| S-09 | Senaryo sil | Storage'dan da gider |
| S-10 | Davete belirli senaryoları seç | Yalnızca seçilenler gönderilir |
| S-11 | Farklı adaylara farklı senaryo | Her biri kendi setini görür |
| S-12 | Senaryosu silinen davet | Zarif davranır |

---

## 10. Video Saklama Süresi (Retention)

| ID | Senaryo | Beklenen |
|---|---|---|
| RT-01 | Org varsayılan saklama süresi (`/ayarlar`) | Kaydolur (varsayılan 180 gün) |
| RT-02 | 0 gün / 3651 gün | DB CHECK reddeder (1–3650) |
| RT-03 | Davet oluşturulurken snapshot | `retention_until` mutlak tarihe çevrilir |
| RT-04 | **Org ayarı sonradan kısaltılır** | **Yürürlükteki davetlerin tarihi değişmez** |
| RT-05 | Eski (migration öncesi) audition'lar | `retention_until = NULL`, silinmez |
| RT-06 | `/api/cron/video-retention` — doğru `CRON_SECRET` | Çalışır |
| RT-07 | Yanlış/eksik secret | 401 |
| RT-08 | Süresi dolmuş video | Silinir |
| RT-09 | 3 gün kalan video | Direktöre uyarı maili |
| RT-10 | Kuyruk işleme — R2 silme başarısız | Yeniden denenir |
| RT-11 | **5 başarısız deneme** | `MAX_PURGE_ATTEMPTS` — takılı kalır, sonsuz döngü yok |
| RT-12 | Aynı `storage_path` 2 kez kuyruğa | Unique constraint / `ignoreDuplicates` |
| RT-13 | Cron 2 kez üst üste çalışır | İdempotent, çift silme yok |

---

## 11. Listeler (Collections)

| ID | Senaryo | Beklenen |
|---|---|---|
| L-01 | Liste oluştur | Oluşur |
| L-02 | Boş liste adı | Reddedilir |
| L-03 | Aynı isimde 2 liste | Davranış tanımlı |
| L-04 | Oyuncu profilinden listeye ekle | Eklenir |
| L-05 | Yeni liste oluşturarak ekle | Çalışır |
| L-06 | Aynı oyuncuyu 2 kez ekle | Duplicate olmaz |
| L-07 | Toplu ekleme | Hepsi eklenir |
| L-08 | Listeden çıkar | Çıkar, oyuncu kaydı silinmez |
| L-09 | Liste sil | Sadece liste gider, oyuncular kalır |
| L-10 | Boş liste detayı | Boş-durum mesajı |
| L-11 | Paylaşım linki üret (`share_token`) | Link çalışır |
| L-12 | `/paylasim/[shareToken]` — giriş yapmadan | Açılır, salt-okunur |
| L-13 | Geçersiz share token | 404 |
| L-14 | Paylaşım sayfasında yazdır | Düzgün çıktı |
| L-15 | Paylaşımı kapat sonra link | Erişilemez |
| L-16 | Paylaşım sayfasında hassas veri (ücret, özel not) | **Sızmamalı** |

---

## 12. Rol İlişki Haritası

| ID | Senaryo | Beklenen |
|---|---|---|
| G-01 | `/projeler/[id]?tab=iliskiler` | Diyagram yüklenir |
| G-02 | Rolsüz proje | Boş-durum, çökme yok |
| G-03 | Tek rollü proje | Tek düğüm |
| G-04 | İlişki ekle — simetrik tip (`spouse` vb.) | **Tek satır** olarak kaydolur |
| G-05 | Ters yönde aynı ilişkiyi ekle | Unique index engeller |
| G-06 | Yönlü tip (`parent`, `manager`) | Yön korunur |
| G-07 | Rolü kendisine bağla | CHECK reddeder |
| G-08 | Geçersiz ilişki tipi POST'la | CHECK reddeder |
| G-09 | İlişki düzenle / sil | Çalışır |
| G-10 | Düğüm konumu sürükle + kaydet | `diagram_x/y` kaydolur |
| G-11 | Konum NULL (yeni rol) | Otomatik yerleşim (dagre) |
| G-12 | Aile ağacı — eşler yan yana | Union node tekniği çalışır |
| G-13 | Çocuk düğümleri | Evlilik düğümünden sarkar |
| G-14 | **Uyarı:** ebeveyn–çocuk yaş farkı < 16 yıl | Uyarı gösterilir (blok değil) |
| G-15 | **Uyarı:** `parent` kenarlarında döngü | Uyarı gösterilir |
| G-16 | **Uyarı:** aynı oyuncu ilişkili 2 rolde seçili | Uyarı gösterilir |
| G-17 | Casting overlay — seçili oyuncu fotoğrafı + boy | Düğümde görünür |
| G-18 | Overlay — oyuncusu fotoğrafsız | Placeholder |
| G-19 | Çift kenarına tıkla → kombinasyon modu | İki rolün adayları yan yana |
| G-20 | Kombinasyon modunda ok tuşları | Gezinme çalışır |
| G-21 | Boy/yaş farkı hesabı | Doğru |
| G-22 | Verisi eksik oyuncu (boy/yaş yok) | Hesap çökmez |
| G-23 | Rolü diyagramdan çıkar | Rol silinmez, sadece diyagramdan kalkar |
| G-24 | **Mobil** — React Flow mount edilmez | `MobileRelationshipList` görünür |
| G-25 | 20+ rollü büyük graf | Performans kabul edilebilir |
| G-26 | Rol detayında `RoleRelationshipsCard` | Salt-okunur özet doğru |
| G-27 | Ana bundle boyutu | React Flow dynamic import — ana bundle'a girmez |

---

## 13. Ajans CRM

> ⚠️ Bu modül `CLAUDE.md`'de belgelenmemiş. Migration 029–051 arası. Tümü `org_type = agency` gerektirir.

### 13.1 Müşteriler — `/musteriler`

| ID | Senaryo | Beklenen |
|---|---|---|
| C-01 | Müşteri oluştur | Oluşur |
| C-02 | `client_type` enum değerleri | Hepsi çalışır, geçersiz reddedilir |
| C-03 | Kontak ekle/düzenle/sil | Çalışır |
| C-04 | Etkileşim (interaction) kaydet | Kaydolur, kronolojik listelenir |
| C-05 | Risk değerlendirmesi (`lib/crm.ts`) | Hesap doğru |
| C-06 | Etkileşimsiz müşteri | Risk hesabı çökmez |
| C-07 | Müşteri sil — teklifleri varken | Cascade tanımlı |

### 13.2 Teklifler — `/teklifler`

| ID | Senaryo | Beklenen |
|---|---|---|
| C-10 | Teklif oluştur | Oluşur |
| C-11 | Pipeline board (Kanban) sürükle-bırak | `stage` güncellenir |
| C-12 | Aşama akışı `brief→oyuncu_onerildi→opsiyon→sozlesme→kazanildi/kaybedildi` | Çalışır |
| C-13 | Geçersiz `stage` POST'la | CHECK reddeder |
| C-14 | Geriye doğru aşama değişimi | İzin/engel tanımlı olmalı |
| C-15 | Teklif kalemi (pitch item) ekle | Eklenir |
| C-16 | **Eksklüzivite çakışması tespiti** | Uyarı verir |
| C-17 | Kalemi işe (booking) çevir | Booking oluşur, veri doğru taşınır |
| C-18 | Aynı kalemi 2 kez çevir | Duplicate booking olmaz |
| C-19 | Teklif sil — kalemleri varken | Cascade tanımlı |

### 13.3 İşler — `/isler`

| ID | Senaryo | Beklenen |
|---|---|---|
| C-30 | Booking oluştur | Oluşur |
| C-31 | `job_type` 7 değerin hepsi | Çalışır |
| C-32 | `payment_status` (`pending/partial/paid`) | Çalışır |
| C-33 | `withholding_rate` 0 / 100 / 101 / negatif | CHECK: 0–100 |
| C-34 | Komisyon hesabı | Manuel hesapla eşleşir |
| C-35 | Ondalıklı/çok büyük tutar | Yuvarlama doğru, taşma yok |
| C-36 | Filtreler | Doğru |
| C-37 | CSV dışa aktar (`/api/export/bookings`) | Doğru veri, türkçe karakter bozulmaz |
| C-38 | CSV — production org | 403 |
| C-39 | CSV — boş liste | Başlık satırı olan boş dosya |
| C-40 | Süregelen (ongoing) iş | Bitiş tarihi yok, doğru render |

### 13.4 Görevler — `/gorevler`

| ID | Senaryo | Beklenen |
|---|---|---|
| C-50 | Görev oluştur | Oluşur |
| C-51 | Tamamlandı işaretle / geri al | Çalışır |
| C-52 | Görev sil | Kalkar |
| C-53 | Vadesi geçmiş görev | Vurgulanır |
| C-54 | Vadesiz görev | Çökmez |

### 13.5 Takvim — `/takvim`

| ID | Senaryo | Beklenen |
|---|---|---|
| C-60 | Ay görünümü | Booking'ler doğru günlerde |
| C-61 | Ay ileri/geri | Çalışır |
| C-62 | Ödeme durumu noktaları | Doğru renk |
| C-63 | Aynı güne 5+ booking | UI taşmaz |
| C-64 | Ay sınırını aşan çok günlü booking | Doğru render |
| C-65 | Boş ay | Boş takvim, çökme yok |

### 13.6 Finansal

| ID | Senaryo | Beklenen |
|---|---|---|
| C-70 | Avans/masraf ekle (`type`: `avans`/`masraf`) | Çalışır |
| C-71 | Negatif tutar | Doğrulanır |
| C-72 | Temsil geçmişi (`representation_history`) | Kaydolur |
| C-73 | `commission_rate` 0 / 100 / 101 | CHECK: 0–100 |
| C-74 | Çakışan temsil dönemleri | Davranış tanımlı |

---

## 14. Ayarlar

| ID | Senaryo | Beklenen |
|---|---|---|
| ST-01 | Org adı değiştir | Kaydolur, her yerde güncellenir |
| ST-02 | Org logosu yükle | Görünür |
| ST-03 | Profil adı değiştir | Kaydolur |
| ST-04 | Şifre değiştir — doğru mevcut şifre | Değişir |
| ST-05 | Şifre değiştir — yanlış mevcut şifre | Reddedilir |
| ST-06 | Şifre değiştikten sonra diğer session'lar | Davranış tanımlı |
| ST-07 | `RetentionForm` (RT-01, RT-02) | Çalışır |
| ST-08 | `ShareSettingsForm` — ajans slug'ı | Regex doğrular (R-42) |
| ST-09 | Slug zaten alınmış | Net hata |
| ST-10 | `StorageCard` — kullanım gösterimi | Gerçek kullanımla eşleşir |
| ST-11 | `GoogleSheetsCard` bağlı/bağlı değil | Doğru durum |
| ST-12 | Dil değiştir (TR/EN) | Anında geçer, kalıcı |

### 14.1 Ekip — `/ayarlar/ekip`

| ID | Senaryo | Beklenen |
|---|---|---|
| ST-20 | Üye davet et | Davet maili gider |
| ST-21 | Zaten üye olan email | Net hata |
| ST-22 | **Plan kullanıcı limiti** (pro: 3, agency: 5) | Limitte davet reddedilir |
| ST-23 | Limitin **tam sınırında** davet | Kabul edilir |
| ST-24 | Davet linki ile kayıt | **Doğru org'a** düşer (migration 014) |
| ST-25 | Süresi dolmuş davet | Zarif hata |
| ST-26 | Daveti iptal et | Link geçersizleşir |
| ST-27 | Üye rolü değiştir | Kaydolur, yetkiler anında değişir |
| ST-28 | Üye çıkar | Çıkar, verileri kalır |
| ST-29 | Son admin'i çıkar/rolünü düşür | Engellenir (Z-26) |
| ST-30 | Çıkarılan üyenin aktif session'ı | Erişimi kesilir |

---

## 15. Faturalama (Polar)

| ID | Senaryo | Beklenen |
|---|---|---|
| B-01 | `PlanCard` — mevcut plan badge'i | Doğru |
| B-02 | Pro'ya yükselt → checkout | Polar'a yönlenir |
| B-03 | Agency'ye yükselt → checkout | Doğru ürün |
| B-04 | `customerExternalId` | `orgId` — sunucuda set edilir, spoof edilemez |
| B-05 | Başarılı ödeme → `/dashboard?upgraded=1` | Plan güncellenir |
| B-06 | Checkout'u iptal et | Plan değişmez |
| B-07 | "Aboneliği Yönet" → `/api/portal` | Portal açılır |
| B-08 | `polar_customer_id` yokken portal | `/ayarlar`'a yönlenir |
| B-09 | Checkout rate limit (10/dk) | Devreye girer |
| B-10 | Webhook `subscription.created` | Plan set edilir |
| B-11 | Webhook `subscription.canceled` | `status = canceled`, plan **korunur** (dönem sonuna kadar erişim) |
| B-11b | Webhook `subscription.revoked` | `plan = NULL`, `status = canceled`, `polar_subscription_id = NULL` — **P-06 regresyonu, mutlaka doğrula** |
| B-11c | Revoke sonrası org'un erişimi | `requireOrg()` `/plan-sec`'e yönlendirir |
| B-12 | **Tanınmayan ürün ID'si** | Abonelik kaydolur ama **`subscription_plan`'e dokunulmaz**; Sentry'ye `error` düşer |
| B-13 | Yeni org'un `subscription_plan` değeri | **NULL** (DEFAULT kaldırıldı) → `getActivePlan()` `org_type`'a düşer |
| B-14 | `subscription_plan = 'starter'` POST'la | CHECK reddeder (artık yalnızca NULL, `pro`, `agency`) |
| B-15 | Webhook imzası geçersiz | Reddedilir |
| B-16 | Aynı webhook 2 kez | İdempotent |
| B-17 | Abonelik pasifken depolama limiti | Upload engellenir |
| B-18 | Plan düşürme — mevcut kullanım yeni limitin üstünde | Davranış tanımlı olmalı |

---

## 16. Bildirimler & Email

| ID | Senaryo | Beklenen |
|---|---|---|
| E-01 | Hoş geldin maili | Gider, branded |
| E-02 | Ekip daveti maili | Doğru link |
| E-03 | Audition daveti maili | Doğru upload linki |
| E-04 | Video yüklendi bildirimi | Admin'lere gider |
| E-05 | Ajans özeti (`cron/agency-digest`) | Yalnızca agency org'lara |
| E-06 | Rol paylaşımı maili | Gider |
| E-07 | Saklama süresi uyarısı (3 gün) | Gider |
| E-08 | Paylaşım süresi (`cron/share-expiry-check`) | Doğru expire |
| E-09 | Tüm maillerde türkçe karakter | Bozulmaz |
| E-10 | Tüm maillerde EN dil desteği | Doğru dil |
| E-11 | Uygulama içi bildirimler (`notifications`) | Görünür, okundu işaretlenir |
| E-12 | Resend hatası | Ana işlem çökmez, Sentry'ye düşer |

---

## 17. i18n (TR / EN)

| ID | Senaryo | Beklenen |
|---|---|---|
| I-01 | Varsayılan TR (prefix yok) | Çalışır |
| I-02 | `/en/` prefix | İngilizce |
| I-03 | **Her sayfada eksik çeviri anahtarı** | Yok — ham anahtar görünmemeli |
| I-04 | Dil değiştirince aynı sayfada kalma | URL doğru çevrilir |
| I-05 | `<html lang>` özniteliği | Doğru |
| I-06 | hreflang etiketleri | TR + EN doğru |
| I-07 | Tarih formatları | TR'de `tr` locale |
| I-08 | Sayı/para formatları | Locale'e uygun |
| I-09 | Public sayfalar (`/oyuncu/[token]`, `/basvur/`) dil | Doğru |
| I-10 | Email dili | Alıcının diline uyar |
| I-11 | Uzun EN metinlerde UI taşması | Yok |

---

## 18. Responsive & Tarayıcı

| ID | Senaryo | Beklenen |
|---|---|---|
| M-01 | Mobil (375px) — tüm ana sayfalar | Yatay kaydırma yok |
| M-02 | Tablet (768px) | Düzen bozulmaz |
| M-03 | Masaüstü (1280px+) | Doğru |
| M-04 | Mobilde tablolar | Kaydırılabilir veya kart görünümü |
| M-05 | Mobilde modallar | Ekrana sığar, kapatılabilir |
| M-06 | Mobilde sürükle-bırak (AU-03) | Çalışır veya alternatif sunulur |
| M-07 | Mobilde ilişki diyagramı | `MobileRelationshipList` (G-24) |
| M-08 | Safari (macOS + iOS) | Çalışır |
| M-09 | Chrome / Firefox / Edge | Çalışır |
| M-10 | iOS Safari video oynatma | Çalışır |
| M-11 | Karanlık mod (varsa) | Tutarlı |

---

## 19. Performans & Dayanıklılık

| ID | Senaryo | Beklenen |
|---|---|---|
| X-01 | 500+ oyuncu, 100+ proje ile liste sayfaları | Kabul edilebilir süre |
| X-02 | Yavaş ağ (3G throttle) — video upload | Zarif, progress doğru |
| X-03 | Upload sırasında ağ kesintisi | Net hata, yarım kayıt yok |
| X-04 | Supabase erişilemez | Hata sayfası, beyaz ekran değil |
| X-05 | R2 erişilemez | Net hata |
| X-06 | Aynı kaydı 2 sekmede eşzamanlı düzenle | Son yazan kazanır veya çakışma uyarısı |
| X-07 | Hızlı çift tık (tüm submit butonları) | Duplicate kayıt yok |
| X-08 | Tarayıcı geri/ileri tuşu | Durum tutarlı |
| X-09 | Rate limiter — çok instance'lı ortam | **Bilinen sınırlama:** in-memory, instance başına |
| X-10 | Konsol hataları | Ana akışlarda temiz |
| X-11 | Sentry'ye hata düşüyor mu | Bilerek hata üret, doğrula |

---

## 20. Güvenlik

| ID | Senaryo | Beklenen |
|---|---|---|
| SEC-01 | Bölüm 2'nin tamamı | Geçer |
| SEC-02 | Tüm metin alanlarında XSS | Escape edilir |
| SEC-03 | Arama alanlarında SQL enjeksiyonu | Parametrize |
| SEC-04 | Güvenlik header'ları (HSTS, X-Frame-Options, CSP) | `next.config.ts`'teki gibi mevcut |
| SEC-05 | `robots.txt` — app route'ları | Disallow |
| SEC-06 | Public sayfalar arama motorunda | Hassas veri indekslenmez |
| SEC-07 | Token'lar URL'de loglanıyor mu | Sentry/PostHog'a sızmamalı |
| SEC-08 | Cron route'ları secret'sız | 401 |
| SEC-09 | Service role key client bundle'da | **Yok** |
| SEC-10 | Supabase Advisor | Yalnızca bilinen/kabul edilen uyarılar |
| SEC-11 | Leaked Password Protection | **⚠️ Açık — dashboard'dan aktifleştirilmeli** |
| SEC-12 | Storage bucket çapraz-org listeleme | Engellenir (migration 056) |
| SEC-13 | Çerez onayı öncesi PostHog | Veri göndermez |
| SEC-14 | Çerez onayı reddi | Kalıcı, saygı gösterilir |

---

## 21. Yasal & SEO

| ID | Senaryo | Beklenen |
|---|---|---|
| SEO-01 | `/gizlilik` TR + EN | Eksiksiz |
| SEO-02 | `/kullanim-kosullari` TR + EN | Eksiksiz |
| SEO-03 | Landing JSON-LD | Geçerli şema |
| SEO-04 | OG görseli (1200×630) | Üretilir |
| SEO-05 | `sitemap.xml` + `robots.txt` | `postbuild`'de üretilir |
| SEO-06 | Segment landing sayfaları | Doğru içerik |
| SEO-07 | Çerez banner'ı | Görünür, seçim kalıcı |

---

## Kapsam Dışı

| Öğe | Neden |
|---|---|
| `roller/[id]/DavetModal.tsx` | Dead code — hiçbir yerde import edilmiyor |
| Gerçek ödeme akışı | Polar sandbox'ta test edilir |

> **Not:** `lib/video-cleanup.ts` ve `lib/video-purge.ts` **çakışmıyor, birbirini tamamlıyor** — ikisi de canlı. `video-cleanup` cascade silmelerde (proje/rol/audition) R2 yollarını topluyor ve `purgeR2` başarısız olursa `queueForPurge`'e devrediyor; `video-purge` kuyruk mekanizmasının kendisi. Her ikisinin de testi var.

---

## Öncelik Sırası

Zaman kısıtlıysa bu sırayla ilerle:

1. **Bölüm 2** — yetkilendirme & izolasyon (özellikle Z-08, Z-09)
2. **Bölüm 8 + 10** — video yükleme ve saklama (veri kaybı riski)
3. **Bölüm 15** — faturalama (gelir riski)
4. **Bölüm 1** — kimlik doğrulama
5. **Bölüm 20** — güvenlik
6. Kalan fonksiyonel bölümler
7. **Bölüm 17–19** — i18n, responsive, performans

---

## Test Öncesi Yapılacaklar

- [x] Migration `052_remove_starter_plan.sql`'i düzelt + uygula (P-06)
- [x] `lib/video-cleanup.ts` vs `lib/video-purge.ts` — ikisi de canlı, çakışma yok
- [ ] Supabase Leaked Password Protection'ı aç (SEC-11)
- [ ] `CLAUDE.md`'yi güncelle — ajans CRM modülü (migration 029–051) ve migration 022–051 belgelenmemiş
- [ ] **Test boşluğu:** `__tests__/api/webhook-polar.test.ts` DB'yi mock'ladığı için P-06'daki NOT NULL hatasını yakalayamadı. Şema kısıtlarına karşı çalışan bir entegrasyon testi eklenmeli.
