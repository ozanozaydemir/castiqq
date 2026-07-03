-- ══════════════════════════════════════════════════════════════════
-- CastFlow — Test Verisi
-- Org ID: 11ec9c4b-b495-490c-9a1e-7ca8b852c8a4
-- Supabase SQL Editor'da çalıştır (önce migrations/011_fix_role_status.sql).
-- Roller projelere bağlı; oyuncular (talent) standalone — auditions
-- tablosuna hiç kayıt atılmıyor, rol eşleştirmesi uygulama üzerinden
-- manuel yapılacak.
-- Idempotent: tüm INSERT'lerde ON CONFLICT (id) DO NOTHING var,
-- güvenle tekrar çalıştırılabilir.
-- ══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────
-- 0. Sabitler
-- ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  -- sadece uuid kontrolü
  PERFORM '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4'::uuid;
END $$;

-- ─────────────────────────────────────────────────────────────────
-- 1. PROJELER
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.projects
  (id, organization_id, title, description, type, status, deadline, created_at)
VALUES

('b0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Gün Batımında',
 'İstanbul''un karanlık sokaklarında geçen bir neo-noir gerilim filmi. Eski bir dedektifin yıllar önce çözemediği bir cinayetle yüzleşmesini anlatıyor.',
 'film', 'active', '2026-09-15', NOW() - INTERVAL '45 days'),

('b0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Şehrin Sırları',
 'Anadolu''nun küçük bir kasabasında görev yapan genç komiserin birbiriyle bağlantılı gizemli olayları çözmesini konu alan dizi. 26 bölüm planlanıyor.',
 'dizi', 'active', '2026-08-01', NOW() - INTERVAL '30 days'),

('b0000003-0000-0000-0000-000000000003',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Leke',
 'Geçmişte işlediği bir suç nedeniyle toplumdan dışlanan bir kadının yeniden hayata tutunma mücadelesini anlatan ödüllü tiyatro oyununun film uyarlaması.',
 'film', 'active', '2026-10-30', NOW() - INTERVAL '20 days'),

('b0000004-0000-0000-0000-000000000004',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Bahar Yağmuru',
 'İki farklı dünyadan gelen iki insanın beklenmedik bir yolculukta birbirini keşfettiği romantik dram. Prime Video için üretiliyor.',
 'dizi', 'active', '2026-07-20', NOW() - INTERVAL '15 days'),

('b0000005-0000-0000-0000-000000000005',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Çakıl Doğal Su',
 'Türkiye''nin önde gelen doğal kaynak suyu markası için çekilecek televizyon reklam filmi serisi. 3 ayrı konsept, 15 ve 30 saniyelik versiyonlar.',
 'reklam', 'active', '2026-08-10', NOW() - INTERVAL '10 days'),

('b0000006-0000-0000-0000-000000000006',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Son Durak',
 'Chekhov''un "Vanya Dayı" oyunundan esinlenerek kaleme alınan çağdaş bir tiyatro prodüksiyonu. Boğaziçi Gösteri Sanatları ile ortak yapım.',
 'tiyatro', 'completed', '2026-06-01', NOW() - INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 2. ROLLER
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.project_roles
  (id, project_id, organization_id, name, description, age_min, age_max, gender, notes, status, created_at)
VALUES

-- Gün Batımında
('c0000001-0000-0000-0000-000000000001',
 'b0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Kerem — Baş Erkek Rol',
 'Emekli olmuş ama geçmişini bir türlü geride bırakamayan eski bir polis dedektifi. Sert, yorgun, bir o kadar da şefkatli. Giysilerindeki ve bakışlarındaki ağırlık hissedilmeli.',
 40, 55, 'erkek',
 'Fiziksel uyum çok önemli. Aksiyon sahneleri var, hafif dövüş koreografisi gerektirebilir. Stunt dublör kullanılabilir ancak yakın çekimler oyuncuya ait olacak.',
 'casting', NOW() - INTERVAL '44 days'),

('c0000002-0000-0000-0000-000000000002',
 'b0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Naz — Baş Kadın Rol',
 'Gazeteci. Kerem''in peşine düştüğü cinayetle bağlantılı. Zeki, bağımsız, bir yandan da kırılgan. 30''lu yaşların başında, modern İstanbul kadını profili.',
 28, 38, 'kadin',
 'İngilizce konuşma sahneleri mevcut (yabancı bir muhabir ile diyalog). B2 üzeri İngilizce gerekiyor.',
 'open', NOW() - INTERVAL '44 days'),

('c0000003-0000-0000-0000-000000000003',
 'b0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Selim — Antagonist',
 'İş dünyasının saygın ismi görünümünün arkasında korkunç sırlar saklayan adam. Karizmatik, çekici, tehlikeli.',
 38, 52, 'erkek',
 'Karizmatik ve manipülatif bir enerji şart. Aksan gerekmez, ancak seslendirme geçmişi artı sayılır.',
 'open', NOW() - INTERVAL '40 days'),

('c0000004-0000-0000-0000-000000000004',
 'b0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Rıza — Kerem''in eski ortağı',
 'Kerem''in yıllar önce ayrıldığı polis ortağı. İçten, sadık ama bazı sırları var. Kısa ama bırakıcı sahneleri olan yan karakter.',
 42, 58, 'erkek',
 NULL,
 'open', NOW() - INTERVAL '38 days'),

-- Şehrin Sırları
('c0000005-0000-0000-0000-000000000005',
 'b0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Komiser Zeynep',
 'Ankara''dan küçük bir Karadeniz kasabasına sürgün edilen genç ve idealist komiser. Sistemle savaşıyor ama aynı zamanda bu kasabaya âşık oluyor.',
 25, 35, 'kadin',
 'Karadeniz aksanı bir artı sayılır ama zorunlu değil. Uzun dönem çekim takvimi (8 ay), İstanbul dışı çekim mekânları.',
 'casting', NOW() - INTERVAL '29 days'),

('c0000006-0000-0000-0000-000000000006',
 'b0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Avukat Mert',
 'Kasabanın en zengin ailesinin avukatı. Zeynep ile geçmişi var. Hem düşman hem müttefik. Belirsizliği koruması gerekiyor.',
 30, 42, 'erkek',
 NULL,
 'open', NOW() - INTERVAL '25 days'),

('c0000007-0000-0000-0000-000000000007',
 'b0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Doktor Hasan',
 'Kasabanın tek doktoru. Sakin, güvenilir görünümlü ama her şeyi biliyor. 50''li yaşlarda, köklü bir kasaba sakini profili.',
 45, 60, 'erkek',
 NULL,
 'open', NOW() - INTERVAL '22 days'),

('c0000008-0000-0000-0000-000000000008',
 'b0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Lara — Gizemli Küçük Kız',
 'Kasabada herkesin çektiği yaramaz ama bir o kadar bilge bir çocuk. Olayların kilit noktası. Gerçek yaşı 8-11 arası.',
 8, 12, 'kadin',
 'Çocuk oyuncu. Aile onayı ve Kültür Bakanlığı izni gerekecek. Çalışma saatleri sınırlı.',
 'open', NOW() - INTERVAL '20 days'),

-- Leke
('c0000009-0000-0000-0000-000000000009',
 'b0000003-0000-0000-0000-000000000003',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ece — Baş Kadın Rol',
 'Yıllar önce işlediği bir suç nedeniyle hapisten yeni çıkmış, hayata yeniden tutunmaya çalışan kadın. Kırılgan ama güçlü, suskun ama patlayıcı.',
 30, 42, 'kadin',
 'Çok katmanlı, zorlu bir rol. Fiziksel dönüşüm gerektirebilir (kilo/saç). Ağır duygusal sahneler içeriyor.',
 'casting', NOW() - INTERVAL '19 days'),

('c0000010-0000-0000-0000-000000000010',
 'b0000003-0000-0000-0000-000000000003',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Harun — Ece''nin ağabeyi',
 'Kız kardeşini hem seven hem de onun geçmişinden utanan biri. İç çatışması yüksek bir karakter.',
 35, 50, 'erkek',
 NULL,
 'open', NOW() - INTERVAL '15 days'),

('c0000011-0000-0000-0000-000000000011',
 'b0000003-0000-0000-0000-000000000003',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Psikolog Deniz',
 'Ece''nin terapisti. Profesyonel sınırları zorlayan sahneleri var. Hikâyenin en gizemli karakterlerinden.',
 32, 45, 'kadin',
 NULL,
 'open', NOW() - INTERVAL '12 days'),

-- Bahar Yağmuru
('c0000012-0000-0000-0000-000000000012',
 'b0000004-0000-0000-0000-000000000004',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Arda — Baş Erkek Rol',
 'Hayatında her şey planlanmış, yolunda giden ama içten içe boğulan genç mimar. Yolculuk sırasında kendini yeniden keşfediyor.',
 26, 36, 'erkek',
 'Atletik görünüm. Dağ yürüyüşü sahneleri var. Fiziksel kondisyon önemli.',
 'open', NOW() - INTERVAL '14 days'),

('c0000013-0000-0000-0000-000000000013',
 'b0000004-0000-0000-0000-000000000004',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Selin — Baş Kadın Rol',
 'Köklü bir ailenin sırlarından kaçan, özgürlük arayan fotoğrafçı. Arda ile zıt kutuplar ama birbirini tamamlıyorlar.',
 24, 34, 'kadin',
 NULL,
 'open', NOW() - INTERVAL '14 days'),

-- Çakıl Doğal Su Reklamı
('c0000014-0000-0000-0000-000000000014',
 'b0000005-0000-0000-0000-000000000005',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Sporcu Adam (Reklam)',
 'Maraton koşucusu. Doğal, enerjik, çekici. Spor sahnesinde ürünü tanıtıyor.',
 22, 35, 'erkek',
 'Gerçekten koşabilen, atletik yapıda biri tercih edilir. Çekimler 2 gün, İstanbul Park Ormanı.',
 'casting', NOW() - INTERVAL '9 days'),

('c0000015-0000-0000-0000-000000000015',
 'b0000005-0000-0000-0000-000000000005',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Aile Annesi (Reklam)',
 'Doğal, sıcak, modern anne profili. Masa başı konsept için gerekli.',
 28, 40, 'kadin',
 'Çekim 1 gün, stüdyo ortamı.',
 'open', NOW() - INTERVAL '9 days'),

-- Son Durak (Tiyatro)
('c0000016-0000-0000-0000-000000000016',
 'b0000006-0000-0000-0000-000000000006',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ahmet — Protagonist',
 'Çökmekte olan bir çiftlikte hayatını sürdürmeye çalışan yorgun adam. Çehov''un Vanya''sından esinlenen ama modern bir yorum.',
 38, 55, 'erkek',
 'Sahne deneyimi şart. 2 saatlik oyun, ağır metin.',
 'filled', NOW() - INTERVAL '58 days'),

('c0000017-0000-0000-0000-000000000017',
 'b0000006-0000-0000-0000-000000000006',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'İpek — Eski Sevgili',
 'Ahmet''in yıllar önce bıraktığı kadın. Şimdi güçlü ve bağımsız. Pişmanlık ve öfke arasında gidip gelen.',
 34, 50, 'kadin',
 'Güçlü sahne varlığı gerekiyor.',
 'filled', NOW() - INTERVAL '55 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 3. OYUNCULAR
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.talent (
  id, organization_id, full_name, email, phone,
  birth_year, gender, height_cm, weight_kg,
  eye_color, hair_color, hair_length,
  playable_age_min, playable_age_max,
  city, agency_name, manager_name,
  availability, visibility,
  skills, licenses,
  notes,
  showreel_url,
  created_at
) VALUES

-- 1
('d0000001-0000-0000-0000-000000000001',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ahmet Kaya', 'ahmet.kaya@gmail.com', '+90 532 111 2233',
 1984, 'erkek', 184, 82,
 'kahverengi', 'siyah', 'kısa',
 35, 52, 'İstanbul', 'Kadrajı Ajansı', NULL,
 'available', 'private',
 ARRAY['Dövüş Koreografisi','At Binme','Motosiklet','Yüzme','Şarkı'],
 ARRAY['B Sınıfı Ehliyeti','Motosiklet Ehliyeti'],
 'Deneyimli karakter oyuncusu. Özellikle thriller ve noir türlerinde güçlü. 15+ yıl sahne ve ekran deneyimi.',
 'https://vimeo.com/ahmetkaya-showreel',
 NOW() - INTERVAL '120 days'),

-- 2
('d0000002-0000-0000-0000-000000000002',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Selin Çelik', 'selin.celik@hotmail.com', '+90 505 222 3344',
 1996, 'kadin', 167, 55,
 'yeşil', 'açık kahverengi', 'uzun',
 22, 32, 'İstanbul', NULL, 'Mehmet Arslan (0532 900 1122)',
 'available', 'private',
 ARRAY['Dans','Şarkı','Piyano','Yoga','Yüzme'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Konservatuvar mezunu. Klasik tiyatro ve modern drama. Müzikal sahne deneyimi var. Çok enerji dolu, genç profiller oynuyor.',
 'https://vimeo.com/selin-showreel',
 NOW() - INTERVAL '90 days'),

-- 3
('d0000003-0000-0000-0000-000000000003',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Mehmet Yıldız', 'mehmet.yildiz@outlook.com', '+90 544 333 4455',
 1978, 'erkek', 178, 88,
 'koyu kahverengi', 'siyah', 'kısa',
 40, 58, 'İzmir', 'Vizyon Talent', NULL,
 'busy', 'private',
 ARRAY['Silah Kullanımı','Dövüş Koreografisi','Tırmanma','Spor'],
 ARRAY['B Sınıfı Ehliyeti','İlkyardım Sertifikası'],
 'Ağır karakter oyuncusu. Polis, asker, baba rolleri. Çekim dolayısıyla Ağustos sonuna kadar müsait değil.',
 NULL,
 NOW() - INTERVAL '85 days'),

-- 4
('d0000004-0000-0000-0000-000000000004',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Zeynep Arslan', 'zeynep.arslan@gmail.com', '+90 533 444 5566',
 2000, 'kadin', 163, 52,
 'mavi', 'sarı', 'orta',
 18, 28, 'Ankara', 'Ankara Sahne', 'Aynur Polat (0542 800 2233)',
 'available', 'private',
 ARRAY['Bale','Çağdaş Dans','Piyano','Keman','İngilizce Şarkı'],
 ARRAY[]::text[],
 'Bilkent Müzik ve Sahne Sanatları mezunu. Bale ve dans geçmişi çok güçlü. Müzikaller için ideal.',
 'https://vimeo.com/zeyneparslan',
 NOW() - INTERVAL '70 days'),

-- 5
('d0000005-0000-0000-0000-000000000005',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Can Doğan', 'can.dogan@gmail.com', '+90 506 555 6677',
 1992, 'erkek', 181, 78,
 'ela', 'kahverengi', 'orta',
 28, 40, 'İstanbul', 'Kadrajı Ajansı', NULL,
 'available', 'private',
 ARRAY['Motosiklet','Yüzme','Tenis','Gitar','Seslendirme'],
 ARRAY['B Sınıfı Ehliyeti','Motosiklet Ehliyeti'],
 'Hem komedi hem drama yapabiliyor. Ses tonu çok etkileyici, seslendirme çalışmaları da var. Reklam ve dizi deneyimi yüksek.',
 'https://vimeo.com/candogan',
 NOW() - INTERVAL '65 days'),

-- 6
('d0000006-0000-0000-0000-000000000006',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ayşe Demir', 'ayse.demir@gmail.com', '+90 507 666 7788',
 1986, 'kadin', 170, 62,
 'koyu kahverengi', 'siyah', 'uzun',
 32, 48, 'Bursa', NULL, NULL,
 'available', 'private',
 ARRAY['Tiyatro','Dövüş Koreografisi','At Binme','Fransızca'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Güçlü sahne varlığı, dramatik roller. Bursa Devlet Tiyatrosu''nda yıllarca çalıştı. Güçlü karakter oyuncusu.',
 NULL,
 NOW() - INTERVAL '60 days'),

-- 7
('d0000007-0000-0000-0000-000000000007',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Emre Şahin', 'emre.sahin@gmail.com', '+90 535 777 8899',
 1998, 'erkek', 176, 72,
 'yeşil', 'açık kahverengi', 'orta',
 20, 32, 'Antalya', 'Akdeniz Talent', NULL,
 'available', 'private',
 ARRAY['Sörf','Dalgıçlık','Spor','Dans','İngilizce'],
 ARRAY['B Sınıfı Ehliyeti','Dalgıçlık Sertifikası (PADI)'],
 'Atletik yapı, outdoor çekimler için ideal. Antalya''da yaşıyor ama İstanbul''a taşınmaya hazır. Genç ve enerjik.',
 'https://vimeo.com/emresahin',
 NOW() - INTERVAL '55 days'),

-- 8
('d0000008-0000-0000-0000-000000000008',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Fatma Kılıç', 'fatma.kilic@gmail.com', '+90 553 888 9900',
 1977, 'kadin', 160, 65,
 'koyu kahverengi', 'siyah', 'kısa',
 42, 60, 'İstanbul', 'Vizyon Talent', 'Kemal Şen (0542 700 3344)',
 'available', 'private',
 ARRAY['Tiyatro','Seslendirme','Şarkı','Piyano'],
 ARRAY[]::text[],
 'Olgun, güçlü anne/büyükanne rolleri. Devlet tiyatrosu geçmişi var. Seslendirme alanında da aktif çalışıyor.',
 NULL,
 NOW() - INTERVAL '50 days'),

-- 9
('d0000009-0000-0000-0000-000000000009',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Burak Aydın', 'burak.aydin@outlook.com', '+90 501 999 0011',
 1990, 'erkek', 185, 85,
 'mavi', 'kahverengi', 'kısa',
 28, 42, 'İzmir', 'Kadrajı Ajansı', NULL,
 'available', 'private',
 ARRAY['Dövüş Koreografisi','Boks','Yüzme','Spor','İngilizce'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Uzun boylu, atletik yapı. Aksiyon ve gerilim türlerinde güçlü. İzmir''de ama İstanbul projelerine çıkıyor.',
 'https://vimeo.com/burakaydin',
 NOW() - INTERVAL '48 days'),

-- 10
('d0000010-0000-0000-0000-000000000010',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Deniz Korkmaz', 'deniz.korkmaz@gmail.com', '+90 536 000 1122',
 2002, 'kadin', 165, 53,
 'ela', 'koyu kahverengi', 'uzun',
 18, 26, 'İstanbul', NULL, NULL,
 'available', 'private',
 ARRAY['Dans','Akrobasi','Jimnastik','Piyano'],
 ARRAY[]::text[],
 'Genç ve yetenekli. MTTB mezunu. Dans ve akrobasi geçmişi çok güçlü. Müzikaller ve enerjik projeler için ideal.',
 'https://vimeo.com/denizkorkmaz',
 NOW() - INTERVAL '45 days'),

-- 11
('d0000011-0000-0000-0000-000000000011',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Serkan Öztürk', 'serkan.ozturk@gmail.com', '+90 505 111 2244',
 1974, 'erkek', 175, 90,
 'koyu kahverengi', 'siyah', 'kısa',
 45, 62, 'Ankara', 'Ankara Sahne', NULL,
 'busy', 'private',
 ARRAY['Tiyatro','Seslendirme','Gitar','Silah Kullanımı'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Usta oyuncu, ağırlıklı olarak TV ve sinema. Ankara''da ikamet ediyor. Şu an dizi çekiminde, kasım ortasına kadar müsait değil.',
 NULL,
 NOW() - INTERVAL '40 days'),

-- 12
('d0000012-0000-0000-0000-000000000012',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Elif Güneş', 'elif.gunes@gmail.com', '+90 537 222 3355',
 1993, 'kadin', 168, 57,
 'yeşil', 'kızıl', 'orta',
 25, 38, 'İstanbul', 'Spotlight TR', 'Baran Yıldız (0533 600 5566)',
 'available', 'private',
 ARRAY['Drama','Komedi','İngilizce','Fransızca','Piyano'],
 ARRAY['B Sınıfı Ehliyeti'],
 'İki dilli (TR/EN). Londra''da 3 yıl eğitim aldı. Hem komedi hem dram yapabilen çok yönlü oyuncu. Kızıl saçı ayırt edici.',
 'https://vimeo.com/elifgunes',
 NOW() - INTERVAL '38 days'),

-- 13
('d0000013-0000-0000-0000-000000000013',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Murat Çetin', 'murat.cetin@gmail.com', '+90 542 333 4466',
 1995, 'erkek', 179, 76,
 'kahverengi', 'siyah', 'orta',
 24, 36, 'Gaziantep', NULL, NULL,
 'available', 'private',
 ARRAY['Güreş','Spor','At Binme','Davul'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Anadolu karakterleri için çok uygun. Gaziantep aksanını gerçekçi kullanabiliyor ama standart Türkçe de akıcı. Güreş ve dövüş sahneleri için ideal.',
 NULL,
 NOW() - INTERVAL '35 days'),

-- 14
('d0000014-0000-0000-0000-000000000014',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Gözde Yılmaz', 'gozde.yilmaz@gmail.com', '+90 503 444 5577',
 1997, 'kadin', 172, 58,
 'mavi', 'sarı', 'uzun',
 22, 32, 'İstanbul', 'Spotlight TR', NULL,
 'available', 'private',
 ARRAY['Tenis','Yoga','İngilizce','Seslendirme','Fotoğrafçılık'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Reklam dünyasında çok aktif. Temiz, modern, çekici profil. Kurumsal ve lifestyle reklamlar için sık tercih ediliyor.',
 'https://vimeo.com/gozdeyilmaz',
 NOW() - INTERVAL '32 days'),

-- 15
('d0000015-0000-0000-0000-000000000015',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Kemal Arslan', 'kemal.arslan@outlook.com', '+90 532 555 6688',
 1969, 'erkek', 172, 86,
 'koyu kahverengi', 'gri/siyah', 'kısa',
 50, 68, 'İstanbul', 'Vizyon Talent', 'Seda Arslan (0533 500 7788)',
 'available', 'private',
 ARRAY['Tiyatro','Seslendirme','Keman','Satranç','Almanca'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Türk sinemasının köklü isimlerinden. 30 yılı aşkın deneyim. Ağır baba, bürokratik figür, patron rolleri. Mütevazı ama etkileyici varlık.',
 'https://vimeo.com/kemalarslan',
 NOW() - INTERVAL '30 days'),

-- 16
('d0000016-0000-0000-0000-000000000016',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Neslihan Erdoğan', 'neslihan.erdogan@gmail.com', '+90 506 666 7799',
 1991, 'kadin', 166, 59,
 'koyu kahverengi', 'siyah', 'uzun',
 28, 42, 'Ankara', 'Ankara Sahne', 'Taner Erdoğan (0542 400 8899)',
 'unavailable', 'private',
 ARRAY['Piyano','Operet','Klasik Şarkı','Drama','İtalyanca'],
 ARRAY[]::text[],
 'Güçlü ses ve sahne varlığı. Operet ve müzikal geçmişi var. Şu an hamile, 2027 başına kadar müsait değil.',
 NULL,
 NOW() - INTERVAL '28 days'),

-- 17
('d0000017-0000-0000-0000-000000000017',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Tolga Uçar', 'tolga.ucar@gmail.com', '+90 544 777 8800',
 1988, 'erkek', 182, 80,
 'ela', 'koyu kahverengi', 'kısa',
 30, 45, 'İzmir', 'Akdeniz Talent', NULL,
 'available', 'private',
 ARRAY['Yelken','Dalgıçlık','Yüzme','Spor','İngilizce'],
 ARRAY['B Sınıfı Ehliyeti','Yelken Sertifikası','Dalgıçlık Sertifikası (CMAS)'],
 'Outdoor ve aksiyon projeleri için mükemmel. Yelken ve deniz çekimlerinde deneyimli. İzmir merkezli ama seyahat esnekliği tam.',
 'https://vimeo.com/tolgaucar',
 NOW() - INTERVAL '25 days'),

-- 18
('d0000018-0000-0000-0000-000000000018',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Aylin Kaya', 'aylin.kaya@gmail.com', '+90 535 888 9911',
 1999, 'kadin', 164, 51,
 'ela', 'açık kahverengi', 'orta',
 20, 30, 'İstanbul', NULL, NULL,
 'available', 'private',
 ARRAY['Dans','Akrobasi','Yüzme','Spor','İngilizce'],
 ARRAY[]::text[],
 'Genç ve dinamik. Reklam ve kısa film çalışmaları var. Atletik yapısıyla spor ve dinamik sahnelerde öne çıkıyor.',
 NULL,
 NOW() - INTERVAL '22 days'),

-- 19
('d0000019-0000-0000-0000-000000000019',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Hakan Çelik', 'hakan.celik@gmail.com', '+90 501 999 1100',
 1982, 'erkek', 180, 83,
 'koyu kahverengi', 'siyah', 'kısa',
 38, 52, 'Trabzon', NULL, NULL,
 'available', 'private',
 ARRAY['Karadeniz Folkloru','Kemençe','At Binme','Avcılık'],
 ARRAY['B Sınıfı Ehliyeti','Avcılık Ruhsatı'],
 'Trabzon aksanı otantik ve doğal. Karadeniz bölgesi projeleri için birebir. İstanbul''a çıkabilir.',
 NULL,
 NOW() - INTERVAL '20 days'),

-- 20
('d0000020-0000-0000-0000-000000000020',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Seda Yıldız', 'seda.yildiz@gmail.com', '+90 537 000 2211',
 1995, 'kadin', 169, 56,
 'kahverengi', 'koyu kahverengi', 'uzun',
 25, 38, 'İstanbul', 'Kadrajı Ajansı', NULL,
 'available', 'private',
 ARRAY['Drama','Komedi','Dans','Voleybol','İspanyolca'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Çok yönlü oyuncu. Komedi zamalaması çok iyi ama ağır dramalarda da başarılı. İki dilli (TR/İspanyolca).',
 'https://vimeo.com/sedayildiz',
 NOW() - INTERVAL '18 days'),

-- 21
('d0000021-0000-0000-0000-000000000021',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Okan Şimşek', 'okan.simsek@gmail.com', '+90 503 111 3322',
 2001, 'erkek', 177, 70,
 'yeşil', 'sarı/açık', 'orta',
 18, 28, 'İstanbul', NULL, NULL,
 'available', 'private',
 ARRAY['Skateboard','Parkur','BMX','Müzik Prodüksiyon'],
 ARRAY[]::text[],
 'Z kuşağı enerjisi. Skateboard ve parkur sahneleri için ideal. Çekici, farklı görünüm. Henüz çok fazla deneyimi yok ama ham yeteneği güçlü.',
 'https://vimeo.com/okansimsek',
 NOW() - INTERVAL '15 days'),

-- 22
('d0000022-0000-0000-0000-000000000022',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Pınar Demir', 'pinar.demir@outlook.com', '+90 532 222 4433',
 1987, 'kadin', 171, 63,
 'koyu kahverengi', 'siyah', 'kısa',
 32, 48, 'Ankara', 'Spotlight TR', 'Cem Demir (0542 300 9900)',
 'available', 'private',
 ARRAY['Hukuk Bilgisi','Tiyatro','Vokal','İngilizce','Almanca'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Hukuk mezunu olduğu için avukat ve savcı rollerinde çok otantik. Tiyatro geçmişi var. Güçlü entelektüel karakter profili.',
 NULL,
 NOW() - INTERVAL '12 days'),

-- 23
('d0000023-0000-0000-0000-000000000023',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Tuncay Avcı', 'tuncay.avci@gmail.com', '+90 505 333 5544',
 1971, 'erkek', 170, 92,
 'koyu kahverengi', 'gri/beyaz', 'kısa',
 50, 68, 'İstanbul', 'Vizyon Talent', NULL,
 'available', 'private',
 ARRAY['Tiyatro','Seslendirme','Akordeon','Balıkçılık'],
 ARRAY['B Sınıfı Ehliyeti','Denizcilik Yeterlilik Belgesi'],
 '30 yılı aşkın kariyer. Güçlü, otoriter baba figürü, işçi ve emekçi rolleri. Ağırlıklı karakter oyuncusu. Balıkçı ve deniz sahneleri için birebir.',
 NULL,
 NOW() - INTERVAL '10 days'),

-- 24
('d0000024-0000-0000-0000-000000000024',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Melisa Koç', 'melisa.koc@gmail.com', '+90 507 444 6655',
 2004, 'kadin', 161, 49,
 'mavi', 'sarı', 'uzun',
 16, 24, 'Bursa', NULL, 'Suna Koç (anne) (0532 100 7766)',
 'available', 'private',
 ARRAY['Bale','Keman','Piyano','Yüzme','İngilizce'],
 ARRAY[]::text[],
 'Çok genç, çok yetenekli. Bursa Devlet Senfoni Orkestrası''nda keman çaldı. Bale eğitimi 10 yıl. Yetişkin olmaya geçiş döneminde roller için uygun.',
 'https://vimeo.com/melisakoc',
 NOW() - INTERVAL '8 days'),

-- 25
('d0000025-0000-0000-0000-000000000025',
 '11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Barış Aslan', 'baris.aslan@gmail.com', '+90 533 555 7766',
 1989, 'erkek', 183, 79,
 'ela', 'koyu kahverengi', 'orta',
 30, 44, 'İstanbul', 'Kadrajı Ajansı', 'Deniz Aslan (0542 200 8877)',
 'available', 'private',
 ARRAY['Tiyatro','Seslendirme','Gitar','Yazarlık','İngilizce','Fransızca'],
 ARRAY['B Sınıfı Ehliyeti'],
 'Hem oyuncu hem yazar. Karmaşık, içe dönük karakterler oynuyor. Sesini kullanma becerisi çok yüksek. Seslendirme sektöründe de aktif.',
 'https://vimeo.com/barisaslan',
 NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 4. DİL BİLGİLERİ
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.talent_languages
  (id, talent_id, organization_id, language, level, accents, sort_order)
VALUES
-- Ahmet Kaya
('e0000001-0000-0000-0000-000000000001','d0000001-0000-0000-0000-000000000001','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000002-0000-0000-0000-000000000002','d0000001-0000-0000-0000-000000000001','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','B2',NULL,1),

-- Selin Çelik
('e0000003-0000-0000-0000-000000000003','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000004-0000-0000-0000-000000000004','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','C1',NULL,1),
('e0000005-0000-0000-0000-000000000005','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Fransızca','A2',NULL,2),

-- Elif Güneş (çok dilli)
('e0000006-0000-0000-0000-000000000006','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000007-0000-0000-0000-000000000007','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','C2','RP (Received Pronunciation)',1),
('e0000008-0000-0000-0000-000000000008','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Fransızca','B1',NULL,2),

-- Kemal Arslan
('e0000009-0000-0000-0000-000000000009','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000010-0000-0000-0000-000000000010','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Almanca','B2',NULL,1),

-- Seda Yıldız
('e0000011-0000-0000-0000-000000000011','d0000020-0000-0000-0000-000000000020','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000012-0000-0000-0000-000000000012','d0000020-0000-0000-0000-000000000020','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İspanyolca','C1',NULL,1),
('e0000013-0000-0000-0000-000000000013','d0000020-0000-0000-0000-000000000020','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','B1',NULL,2),

-- Pınar Demir
('e0000014-0000-0000-0000-000000000014','d0000022-0000-0000-0000-000000000022','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000015-0000-0000-0000-000000000015','d0000022-0000-0000-0000-000000000022','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','C1',NULL,1),
('e0000016-0000-0000-0000-000000000016','d0000022-0000-0000-0000-000000000022','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Almanca','B1',NULL,2),

-- Barış Aslan
('e0000017-0000-0000-0000-000000000017','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Türkçe','native',NULL,0),
('e0000018-0000-0000-0000-000000000018','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','İngilizce','C1',NULL,1),
('e0000019-0000-0000-0000-000000000019','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4','Fransızca','B2',NULL,2)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 5. DENEYİMLER
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.talent_experiences
  (id, talent_id, organization_id, project_name, year, role_name, role_type, production_type, director, production_company, sort_order)
VALUES

-- Ahmet Kaya
('f0000001-0000-0000-0000-000000000001','d0000001-0000-0000-0000-000000000001','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Siyah Gece', 2023, 'Komiser Tarık', 'lead', 'dizi', 'Serhan Aydın', 'Kaleidoskop Film', 0),
('f0000002-0000-0000-0000-000000000002','d0000001-0000-0000-0000-000000000001','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Yarım Kalan Rüya', 2021, 'Baş', 'lead', 'film', 'Onur Ünlü', 'BKM Film', 1),
('f0000003-0000-0000-0000-000000000003','d0000001-0000-0000-0000-000000000001','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'İstanbul Kıyısı', 2019, 'Recep', 'supporting', 'dizi', 'Hakan Algül', 'O3 Medya', 2),

-- Selin Çelik
('f0000004-0000-0000-0000-000000000004','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Sevgili Hayatım', 2024, 'Ayşe', 'lead', 'dizi', 'Hilal Saral', 'MF Yapım', 0),
('f0000005-0000-0000-0000-000000000005','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Aşkın Rengi', 2022, 'Genç Sevgi', 'lead', 'film', 'Ferzan Özpetek', 'İtalyalı Ortak Yapım', 1),

-- Kemal Arslan
('f0000006-0000-0000-0000-000000000006','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Babam ve Oğlum', 2005, 'Köy Muhtarı', 'supporting', 'film', 'Çağan Irmak', 'Avşar Film', 0),
('f0000007-0000-0000-0000-000000000007','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Diriliş: Ertuğrul', 2018, 'Alp Turgut', 'guest', 'dizi', 'Metin Günay', 'Tekden Film', 1),
('f0000008-0000-0000-0000-000000000008','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Yasak Elma', 2022, 'Halit Bey', 'supporting', 'dizi', 'Emre Kabakuşak', 'Ay Yapım', 2),
('f0000009-0000-0000-0000-000000000009','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Hamle', 2023, 'Başkan', 'lead', 'tiyatro', 'Genco Erkal', 'Devekuşu Kabare', 3),

-- Tuncay Avcı
('f0000010-0000-0000-0000-000000000010','d0000023-0000-0000-0000-000000000023','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ay Lav Yu', 2010, 'Nazım Usta', 'supporting', 'film', 'Murat Şeker', 'BKM Film', 0),
('f0000011-0000-0000-0000-000000000011','d0000023-0000-0000-0000-000000000023','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Kuzey Güney', 2011, 'Amca', 'supporting', 'dizi', 'Cansel Elçin', 'Gold Film', 1),
('f0000012-0000-0000-0000-000000000012','d0000023-0000-0000-0000-000000000023','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Balıkçı Mehmet', 2024, 'Mehmet', 'lead', 'tiyatro', 'Gülhan Kadim', 'Şehir Tiyatroları', 2),

-- Elif Güneş
('f0000013-0000-0000-0000-000000000013','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Yakamoz S-245', 2022, 'Dr. Yasemin', 'supporting', 'dizi', 'Yakup Karataş', 'Netflix TR', 0),
('f0000014-0000-0000-0000-000000000014','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Midnight at the Pera Palace', 2022, 'Yardımcı', 'guest', 'dizi', NULL, 'Netflix TR', 1),

-- Barış Aslan
('f0000015-0000-0000-0000-000000000015','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Bir Aşk İki Hayat', 2023, 'Cenk', 'lead', 'dizi', 'Nuran Evren Şit', 'Ay Yapım', 0),
('f0000016-0000-0000-0000-000000000016','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Sessiz', 2021, 'Yazar Kaan', 'lead', 'film', 'Emin Alper', 'Panafilm', 1)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- 6. EĞİTİM
-- ─────────────────────────────────────────────────────────────────
INSERT INTO public.talent_education
  (id, talent_id, organization_id, school, program, year, sort_order)
VALUES
('a0000001-0000-0000-0000-000000000001','d0000002-0000-0000-0000-000000000002','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'MTTB (Mimar Sinan GSÜ)', 'Oyunculuk', 2018, 0),
('a0000002-0000-0000-0000-000000000002','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'LAMDA (London)', 'Acting', 2017, 0),
('a0000003-0000-0000-0000-000000000003','d0000012-0000-0000-0000-000000000012','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Hacettepe Üniversitesi', 'İngiliz Dili ve Edebiyatı', 2015, 1),
('a0000004-0000-0000-0000-000000000004','d0000015-0000-0000-0000-000000000015','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'İstanbul Üniversitesi', 'Tiyatro Bölümü', 1993, 0),
('a0000005-0000-0000-0000-000000000005','d0000022-0000-0000-0000-000000000022','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Ankara Üniversitesi', 'Hukuk Fakültesi', 2010, 0),
('a0000006-0000-0000-0000-000000000006','d0000022-0000-0000-0000-000000000022','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'AST (Ankara Sanat Tiyatrosu)', 'Oyunculuk Atölyesi', 2013, 1),
('a0000007-0000-0000-0000-000000000007','d0000004-0000-0000-0000-000000000004','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Bilkent Güzel Sanatlar Fakültesi', 'Müzik ve Sahne Sanatları', 2022, 0),
('a0000008-0000-0000-0000-000000000008','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Boğaziçi Üniversitesi', 'Batı Dilleri ve Edebiyatı', 2012, 0),
('a0000009-0000-0000-0000-000000000009','d0000025-0000-0000-0000-000000000025','11ec9c4b-b495-490c-9a1e-7ca8b852c8a4',
 'Craft Studio İstanbul', 'Meisner Tekniği — İleri', 2016, 1)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────
-- TAMAMLANDI
-- ─────────────────────────────────────────────────────────────────
-- Özet:
--   6 proje  (film x2, dizi x2, reklam x1, tiyatro x1)
--  17 rol    (projelere bağlı, statüler karışık)
--  25 oyuncu (çoğu alan dolu)
--  19 dil kaydı
--  16 deneyim kaydı
--   9 eğitim kaydı
-- ══════════════════════════════════════════════════════════════════
