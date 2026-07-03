import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isTr = locale !== 'en'

  return {
    title: isTr ? 'Kullanım Koşulları — CastFlow' : 'Terms of Service — CastFlow',
    description: isTr
      ? 'CastFlow kullanım koşulları ve hizmet sözleşmesi.'
      : 'CastFlow terms of service and service agreement.',
  }
}

export default async function KullanimKosullariPage({ params }: Props) {
  const { locale } = await params
  const isTr = locale !== 'en'

  if (isTr) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 inline-block">
            ← Ana Sayfaya Dön
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kullanım Koşulları</h1>
          <p className="text-sm text-gray-500 mb-10">Son güncelleme: Haziran 2025</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Taraflar ve Kabul</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu Kullanım Koşulları ("Koşullar"), CastFlow ("CastFlow", "biz") ile castiqq.app
              platformuna erişen veya kullanan bireyler ya da kuruluşlar ("Kullanıcı", "siz")
              arasındaki bağlayıcı sözleşmeyi oluşturur.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platforma kaydolarak veya platformu kullanmaya devam ederek bu koşulları kabul
              etmiş sayılırsınız. Koşulları kabul etmiyorsanız platformu kullanmayınız.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Hesap Oluşturma</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow'u kullanabilmek için geçerli bir e-posta adresiyle hesap oluşturmanız
              gerekmektedir. Hesap oluşturma sırasında sağladığınız bilgilerin doğru ve güncel
              olmasından siz sorumlusunuz.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hesabınızın güvenliğini sağlamakla yükümlüsünüz. Hesabınızda gerçekleşen tüm
              işlemlerden sizin sorumlu olduğunuzu kabul edersiniz. Yetkisiz erişim şüphesi
              durumunda derhal <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">support@castiqq.app</a> adresine bildirmeniz gerekmektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Ödeme ve Abonelik</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow'un ücretli planları, Merchant of Record olarak görev yapan{' '}
              <strong>Polar.sh</strong> aracılığıyla sunulmaktadır. Tüm ödeme işlemleri, vergi
              hesaplamaları ve faturalandırma Polar.sh tarafından yönetilmektedir.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Abonelik ücretleri, seçilen plan dönemine (aylık veya yıllık) göre önceden
              tahsil edilir. Vergi yükümlülükleri Polar.sh tarafından ilgili yargı bölgelerine
              göre otomatik olarak hesaplanır ve tahsil edilir; ayrıca herhangi bir vergi eklemeniz
              gerekmez.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. İptal ve Para İadesi</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Aboneliğinizi istediğiniz zaman iptal edebilirsiniz. İptal işlemi, mevcut ödeme
              döneminin sonunda geçerli olur; ödediğiniz dönem boyunca platforma erişiminiz
              devam eder.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Kısmi dönem ücretleri için para iadesi yapılmamaktadır. Özel durumlar veya teknik
              hatalardan kaynaklanan sorunlar için{' '}
              <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">
                support@castiqq.app
              </a>{' '}
              adresiyle iletişime geçebilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Kabul Edilemez Kullanım</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platformu kullanırken aşağıdaki eylemler kesinlikle yasaktır:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>
                <strong>Telif hakkı ihlali:</strong> İzinsiz üçüncü taraf içerikleri (müzik, video,
                görsel vb.) yüklemek veya paylaşmak
              </li>
              <li>
                <strong>Spam ve kötüye kullanım:</strong> İstenmeyen iletişim göndermek, toplu
                davetiye şikâyetine yol açacak eylemler
              </li>
              <li>
                <strong>Güvenlik ihlali:</strong> Platformun güvenlik mekanizmalarını atlatmaya
                çalışmak, diğer kullanıcıların verilerine yetkisiz erişim sağlamak
              </li>
              <li>
                <strong>Yasadışı içerik:</strong> Türk hukuku veya uluslararası hukuk kapsamında
                yasadışı sayılan içeriklerin yüklenmesi veya iletilmesi
              </li>
              <li>
                <strong>Kişilik hakları ihlali:</strong> Açık rıza alınmadan üçüncü şahıslara ait
                kişisel bilgi veya görüntüleri paylaşmak
              </li>
              <li>
                <strong>Hizmet istikrarını bozma:</strong> Platformu aşırı yükleyecek veya
                hizmetleri aksatacak otomatik erişim araçları kullanmak
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu kurallara aykırı davranış tespit edilmesi durumunda hesabınız önceden bildirim
              yapılmaksızın askıya alınabilir veya sonlandırılabilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Fikri Mülkiyet</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow platformunun yazılımı, tasarımı, logosu ve markası CastFlow'a aittir.
              Platform üzerinde size tanınan lisans; kişisel, devredilemez, münhasır olmayan ve
              sınırlı bir kullanım hakkından ibarettir.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platforma yüklediğiniz içerikler (videolar, fotoğraflar, notlar vb.) size veya
              içeriği oluşturan oyuncuya aittir. CastFlow, bu içerikleri yalnızca hizmeti sunmak
              amacıyla depolar ve işler; başka herhangi bir amaçla kullanmaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Hizmetin Kullanılabilirliği</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow, platformu makul düzeyde kesintisiz ve hatasız sunmaya çalışır; ancak
              %100 kesintisizlik garantisi vermez. Bakım, güncelleme veya teknik sorunlar
              nedeniyle geçici kesintiler yaşanabilir.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Planlanmış bakım çalışmaları mümkün olduğunca önceden duyurulur. Beklenmedik
              kesintiler için yoğun saatler dışında iletişim kanallarımız aracılığıyla
              bilgilendirme yapılır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Sorumluluk Sınırlaması</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Yürürlükteki yasaların izin verdiği azami ölçüde, CastFlow; hizmet kesintileri,
              veri kaybı, kar kaybı veya dolaylı zararlar dahil olmak üzere dolaylı, arızi
              veya sonuç olarak ortaya çıkan zararlardan sorumlu tutulamaz.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow'un herhangi bir olay nedeniyle toplam sorumluluğu, zararın meydana geldiği
              tarihten önceki son 3 (üç) ay içinde ödediğiniz abonelik ücretini aşamaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Koşullardaki Değişiklikler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow, bu Kullanım Koşullarını önceden bildirmek kaydıyla değiştirme hakkını
              saklı tutar. Önemli değişiklikler, yürürlüğe girmeden en az 30 gün önce kayıtlı
              e-posta adresinize bildirilir.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Değişiklik sonrasında platformu kullanmaya devam etmeniz, güncellenen koşulları
              kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Uygulanacak Hukuk ve Yargı Yetkisi</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu Koşullar Türk hukukuna tabidir. Bu Koşullardan doğabilecek her türlü uyuşmazlık
              için Türk mahkemeleri münhasır yargı yetkisine sahiptir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. İletişim</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu Koşullarla ilgili sorularınız için:
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>E-posta:</strong>{' '}
              <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">
                support@castiqq.app
              </a>
            </p>
          </section>

          <div className="mt-12 pt-8 border-t border-gray-100">
            <Link href="/" className="text-sm text-indigo-600 hover:underline">
              ← Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // EN
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 inline-block">
          ← Back to Home
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Parties and Acceptance</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            These Terms of Service ("Terms") constitute a binding agreement between CastFlow
            ("CastFlow", "we", "us") and any individual or organization ("User", "you") accessing
            or using the castiqq.app platform.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            By registering for or continuing to use the platform, you agree to these Terms. If you
            do not accept these Terms, please do not use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Account Creation</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            To use CastFlow, you must create an account with a valid email address. You are
            responsible for ensuring that the information you provide during registration is
            accurate and up to date.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            You are responsible for maintaining the security of your account. You acknowledge that
            you are responsible for all actions taken under your account. If you suspect
            unauthorized access, you must notify us immediately at{' '}
            <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">
              support@castiqq.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Payment and Subscriptions</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CastFlow's paid plans are provided through <strong>Polar.sh</strong>, which acts as the
            Merchant of Record. All payment processing, tax calculations, and invoicing are managed
            by Polar.sh.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Subscription fees are charged in advance according to your selected plan period
            (monthly or annual). Tax obligations are automatically calculated and collected by
            Polar.sh according to the applicable jurisdiction; no additional tax steps are required
            from you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Cancellation and Refunds</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            You may cancel your subscription at any time. Cancellation takes effect at the end of
            the current billing period; you retain access to the platform for the remainder of the
            period you have paid for.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Refunds are not provided for partial billing periods. For exceptional cases or issues
            caused by technical errors, please contact{' '}
            <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">
              support@castiqq.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Prohibited Use</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The following actions are strictly prohibited when using the platform:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>
              <strong>Copyright infringement:</strong> Uploading or sharing third-party content
              (music, video, images, etc.) without authorization
            </li>
            <li>
              <strong>Spam and abuse:</strong> Sending unsolicited communications or taking actions
              that lead to bulk invitation complaints
            </li>
            <li>
              <strong>Security violations:</strong> Attempting to circumvent the platform's security
              mechanisms or gain unauthorized access to other users' data
            </li>
            <li>
              <strong>Illegal content:</strong> Uploading or transmitting content that is unlawful
              under Turkish law or international law
            </li>
            <li>
              <strong>Privacy violations:</strong> Sharing personal information or images of third
              parties without their explicit consent
            </li>
            <li>
              <strong>Service disruption:</strong> Using automated access tools that overload the
              platform or disrupt services
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            If violations of these rules are detected, your account may be suspended or terminated
            without prior notice.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            The CastFlow platform's software, design, logo, and brand belong to CastFlow. The
            license granted to you on the platform constitutes a personal, non-transferable,
            non-exclusive, and limited right of use.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Content you upload to the platform (videos, photos, notes, etc.) belongs to you or to
            the talent who created it. CastFlow stores and processes such content solely for the
            purpose of providing the service and does not use it for any other purpose.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Service Availability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CastFlow endeavors to provide the platform with reasonable continuity and without
            errors, but does not guarantee 100% uptime. Temporary interruptions may occur due to
            maintenance, updates, or technical issues.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Planned maintenance is announced in advance where possible. For unexpected outages,
            users are informed through our communication channels outside peak hours.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            To the maximum extent permitted by applicable law, CastFlow shall not be liable for
            indirect, incidental, or consequential damages, including but not limited to service
            interruptions, data loss, loss of profits, or indirect damages.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            CastFlow's total liability for any event shall not exceed the subscription fees you
            paid in the 3 (three) months immediately preceding the date the damage occurred.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Changes to Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CastFlow reserves the right to modify these Terms of Service with prior notice.
            Material changes will be notified to your registered email address at least 30 days
            before they take effect.
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            Continuing to use the platform after a change constitutes your acceptance of the
            updated Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Governing Law and Jurisdiction</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            These Terms are governed by Turkish law. Turkish courts shall have exclusive
            jurisdiction over any disputes arising from these Terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">11. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For questions about these Terms:
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            <strong>Email:</strong>{' '}
            <a href="mailto:support@castiqq.app" className="text-indigo-600 hover:underline">
              support@castiqq.app
            </a>
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <Link href="/" className="text-sm text-indigo-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
