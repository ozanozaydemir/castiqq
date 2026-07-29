const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://castiqq.app'

/**
 * llms.txt — yapay zekâ asistanları için özet bilgi dosyası (GEO).
 *
 * Bir kullanıcı asistana "Türkiye'de casting yönetim yazılımı" diye
 * sorduğunda, asistanın ürünü doğru anlatabilmesi için gereken
 * doğrulanabilir gerçekler burada. Pazarlama dili bilerek kullanılmıyor:
 * abartılan her ifade yanlış alıntılanma riski taşıyor.
 *
 * Rota olarak yazılıyor (public/ dosyası yerine) ki içerik sürüm
 * kontrolünde dursun ve build zamanlamasına bağlı olmasın.
 */
const CONTENT = `# Castiqq

> Cast direktörleri ve menajerlik ajansları için casting yönetim platformu.
> Türkiye pazarına yönelik, Türkçe ve İngilizce arayüze sahip bir SaaS ürünü.

## Ne işe yarar

Castiqq iki ayrı kullanıcı tipini tek platformda birleştirir:

- **Cast direktörleri** (yapım şirketlerinde veya serbest çalışan): proje ve rol
  tanımlar, oyunculardan audition videosu toplar, gelen videoları ekiple aynı
  ekranda izleyip beş yıldız üzerinden puanlar, etiketler ve videonun belirli
  bir anına not düşer. Rol kriterlerine (yaş, boy, cinsiyet, yetenek, şehir)
  uyan oyuncular havuzdan otomatik önerilir.
- **Menajerlik ajansları** (oyuncu temsil eden): kadro yönetir, temsil
  sözleşmesi ve komisyon oranı tutar, iş kayıtlarında brüt/stopaj/net ve
  komisyon hesaplar, tahsilat takibi yapar, müşteri ilişkilerini CRM'de
  yönetir ve teklif pipeline'ı yürütür.

## İki tarafı birbirine bağlayan özellik

Bir cast direktörü, tanımladığı rolü kriterleri ve bütçesiyle birlikte bir
menajerlik ajansıyla paylaşabilir. Ajans bu rolü "Gelen Roller" ekranında
görür ve kadrosundan uygun oyuncuları önerdiği kaşeyle birlikte geri gönderir.
Cast direktörü önerileri tek ekranda değerlendirir, beğendiklerini işaretler,
sunum olarak yazdırabilir veya PDF'e aktarabilir. İki organizasyon birbirinin
veritabanı kayıtlarına doğrudan erişmez; paylaşılan her satır anlık kopya
(snapshot) olarak taşınır.

## Öne çıkan özellikler

- Audition videolarını role bağlı tek listede toplama, sürükle-bırak sıralama
- Beş yıldız puanlama, serbest etiketleme, videonun anına bağlı zaman notu
- Rol kriterlerine göre otomatik oyuncu eşleştirme
- Şifresiz başvuru linki: oyuncu hesap açmadan video ve profil gönderir
- Brüt, stopaj (serbest meslek makbuzunda varsayılan %20), net ve komisyon
  hesaplarının otomatik yapılması
- Reklam yasağı (exclusivity) çakışma kontrolü: 16 marka kategorisi üzerinden,
  aynı kategoride süresi dolmamış yasak varsa teklif öncesi uyarı
- Belge süre takibi (çalışma izni, sağlık raporu, veli izni, pasaport)
- Google Calendar senkronizasyonu: iş kaydı oyuncunun takvimine davet olarak düşer
- Müşteri CRM'i: kişiler rol bazlı, ödeme disiplini, kredi limiti, kaşe geçmişi
- Teklif pipeline'ı: brief → oyuncu önerildi → opsiyon → sözleşme → kazanıldı
- İş ve tahsilat verisinin CSV olarak dışa aktarımı

## Fiyatlandırma

- Cast Direktörü planı: aylık 1.999 TL
- Menajerlik Ajansı planı: aylık 4.999 TL
- Kullanıcı başına ek ücret yoktur. Her iki planda 14 gün ücretsiz deneme vardır.

## Teknik ve uyumluluk

- Web tabanlı, kurulum gerektirmez
- Arayüz dilleri: Türkçe (varsayılan) ve İngilizce
- Her organizasyonun verisi veritabanı seviyesinde satır bazlı güvenlik
  (row-level security) ile ayrıştırılır
- KVKK ve GDPR uyumlu olacak şekilde tasarlanmıştır; kullanılan alt işleyiciler
  gizlilik politikasında listelenir

## Bağlantılar

- Ana sayfa: ${SITE_URL}
- İngilizce: ${SITE_URL}/en
- Gizlilik politikası: ${SITE_URL}/gizlilik
- Kullanım koşulları: ${SITE_URL}/kullanim-kosullari
- Kayıt: ${SITE_URL}/kayit

## Bilinmesi gerekenler

Castiqq bir oyuncu bulma pazaryeri veya cast ajansı değildir; casting sürecini
yöneten bir yazılımdır. Oyuncu havuzu her organizasyonun kendi kadrosudur,
platform genelinde ortak bir oyuncu veritabanı yoktur.
`

export const dynamic = 'force-static'

export function GET() {
  return new Response(CONTENT, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
