import { Link } from '@/i18n/navigation'
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const isTr = locale !== 'en'

  return {
    title: isTr ? 'Gizlilik Politikası — CastFlow' : 'Privacy Policy — CastFlow',
    description: isTr
      ? 'CastFlow gizlilik politikası ve kişisel veri işleme hakkında bilgi.'
      : 'CastFlow privacy policy and information about personal data processing.',
  }
}

export default async function GizlilikPage({ params }: Props) {
  const { locale } = await params
  const isTr = locale !== 'en'

  if (isTr) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href="/" className="text-sm text-indigo-600 hover:underline mb-8 inline-block">
            ← Ana Sayfaya Dön
          </Link>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gizlilik Politikası</h1>
          <p className="text-sm text-gray-500 mb-10">Son güncelleme: Haziran 2025</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Veri Sorumlusu</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu gizlilik politikası, CastFlow ("biz", "bizim") tarafından işletilen castflow.app
              platformuna ilişkindir. Veri sorumlusu olarak Türkiye'de faaliyet gösteren CastFlow,
              6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) ve Avrupa Birliği Genel Veri
              Koruma Tüzüğü (GDPR) kapsamındaki yükümlülüklerini yerine getirmeyi taahhüt eder.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Sorularınız için: <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">support@castflow.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Topladığımız Veriler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Platformumuzu kullanırken aşağıdaki kişisel veriler işlenmektedir:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>
                <strong>Kayıt bilgileri:</strong> Ad soyad, e-posta adresi, şirket/ajans adı
              </li>
              <li>
                <strong>Video dosyaları:</strong> Casting direktörlerinin davet ettiği oyuncular
                tarafından yüklenen audition videoları
              </li>
              <li>
                <strong>Oyuncu profil bilgileri:</strong> Platform üzerinden oluşturulan oyuncu
                kayıtlarına ait demografik bilgiler, fotoğraflar ve notlar
              </li>
              <li>
                <strong>Kullanım istatistikleri:</strong> PostHog aracılığıyla anonim olarak
                toplanan kullanım verileri (yalnızca açık rızanızla)
              </li>
              <li>
                <strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi (güvenlik
                ve hizmet kalitesi amaçlı)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Verilerin İşlenme Amaçları</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Topladığımız veriler yalnızca aşağıdaki amaçlarla işlenmektedir:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>Platform hizmetlerinin sunulması ve sürdürülmesi</li>
              <li>Hesap yönetimi ve kimlik doğrulama</li>
              <li>Müşteri desteği sağlanması</li>
              <li>Hizmet kalitesinin ölçülmesi ve iyileştirilmesi</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Verilerinizi üçüncü taraf pazarlama amaçlı paylaşmıyor, satmıyor veya kiralamıyoruz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Veri Saklama ve Silme</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Verileriniz yalnızca hizmetin gerektirdiği süre boyunca saklanır:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>
                <strong>Hesap verileri:</strong> Hesabınızı sildiğinizde tüm kişisel verileriniz
                sistemden kalıcı olarak silinir.
              </li>
              <li>
                <strong>Video dosyaları:</strong> Arşivlenen projelere ait videolar hesap
                silinmesinden itibaren en geç 90 gün içinde kalıcı olarak temizlenir.
              </li>
              <li>
                <strong>Anonim kullanım istatistikleri:</strong> Rıza geri alındığında yeni veri
                toplanması derhal durdurulur; önceki anonim veriler istatistiksel modellerde
                anonimleştirilmiş olarak kalabilir.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Kullandığımız Altyapı ve Veri İşleyenler</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Hizmetimiz aşağıdaki GDPR uyumlu altyapı sağlayıcıları üzerinde çalışmaktadır:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>
                <strong>Supabase</strong> — Veritabanı ve kimlik doğrulama hizmetleri (kullanıcı
                verileri, proje ve oyuncu kayıtları)
              </li>
              <li>
                <strong>Cloudflare R2</strong> — Video dosyası depolama (sıfır egress maliyetiyle
                güvenli ve dayanıklı depolama)
              </li>
              <li>
                <strong>Vercel</strong> — Uygulama barındırma ve dağıtım altyapısı
              </li>
              <li>
                <strong>PostHog</strong> — Anonim kullanım analitiği (yalnızca rıza ile)
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tüm bu hizmet sağlayıcıları, AB Standart Sözleşme Maddeleri (SCC) veya eşdeğer
              veri aktarım güvenceleri kapsamında faaliyet göstermektedir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. KVKK Kapsamındaki Haklarınız</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              6698 sayılı KVKK'nın 11. maddesi kapsamında aşağıdaki haklara sahipsiniz:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
              <li>Eksik veya yanlış işlenmiş verilerinizin düzeltilmesini isteme</li>
              <li>Yasal koşulların oluşması durumunda kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
              <li>İşlenen verilerin münhasıran otomatik sistemler aracılığıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
              <li>Kanuna aykırı işleme nedeniyle zararınızın giderilmesini talep etme</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu haklarınızı kullanmak için <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">support@castflow.app</a> adresine yazabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. GDPR Kapsamındaki Haklarınız (AB Kullanıcıları)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Avrupa Birliği'nde ikamet eden kullanıcılar GDPR kapsamında ek haklara sahiptir:
            </p>
            <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
              <li>Verilerinize erişim hakkı (Madde 15)</li>
              <li>Düzeltme hakkı (Madde 16)</li>
              <li>Silme hakkı / "Unutulma hakkı" (Madde 17)</li>
              <li>İşlemenin kısıtlanması hakkı (Madde 18)</li>
              <li>Veri taşınabilirliği hakkı (Madde 20)</li>
              <li>İtiraz hakkı (Madde 21)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Denetim otoritenize şikâyette bulunma hakkınız saklıdır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Çerezler ve İzleme</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              CastFlow, oturum yönetimi için zorunlu çerezler kullanmaktadır. Analitik amaçlı
              PostHog izlemesi yalnızca açık rızanız alınarak etkinleştirilir. Tarayıcı
              ayarlarınızdan çerezleri yönetebilirsiniz; ancak zorunlu çerezlerin devre dışı
              bırakılması platformun düzgün çalışmasını engelleyebilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Politika Değişiklikleri</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bu politikayı zaman zaman güncelleyebiliriz. Önemli değişiklikler kayıtlı e-posta
              adresinize bildirilir. Güncellenmiş politika, bu sayfada yayımlandığı tarihten
              itibaren geçerli olur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. İletişim</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Gizlilik ile ilgili her türlü soru, talep veya şikâyetiniz için:
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              <strong>E-posta:</strong>{' '}
              <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">
                support@castflow.app
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

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: June 2025</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Data Controller</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            This Privacy Policy applies to the castflow.app platform operated by CastFlow ("we",
            "our", "us"), a company based in Turkey. As the data controller, CastFlow is committed
            to fulfilling its obligations under the Turkish Personal Data Protection Law No. 6698
            (KVKK) and the European Union General Data Protection Regulation (GDPR).
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            For any questions, contact us at:{' '}
            <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">
              support@castflow.app
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Data We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            When you use our platform, the following personal data may be processed:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>
              <strong>Registration data:</strong> Full name, email address, company/agency name
            </li>
            <li>
              <strong>Video files:</strong> Audition videos uploaded by talent invited by casting
              directors
            </li>
            <li>
              <strong>Talent profile data:</strong> Demographic information, photos, and notes
              associated with talent records created on the platform
            </li>
            <li>
              <strong>Usage statistics:</strong> Anonymous usage data collected via PostHog (only
              with your explicit consent)
            </li>
            <li>
              <strong>Technical data:</strong> IP address, browser type, device information (for
              security and service quality purposes)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Purposes of Processing</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Data collected is processed solely for the following purposes:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Providing and maintaining platform services</li>
            <li>Account management and authentication</li>
            <li>Customer support</li>
            <li>Measuring and improving service quality</li>
            <li>Complying with legal obligations</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            We do not share, sell, or rent your data to third parties for marketing purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Data Retention and Deletion</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Your data is retained only for as long as the service requires:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>
              <strong>Account data:</strong> When you delete your account, all associated personal
              data is permanently removed from our systems.
            </li>
            <li>
              <strong>Video files:</strong> Videos from archived projects are permanently deleted
              within 90 days of account deletion.
            </li>
            <li>
              <strong>Anonymous usage statistics:</strong> New data collection stops immediately
              upon consent withdrawal; previously collected anonymous data may persist in
              aggregated statistical models.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Infrastructure and Sub-processors</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Our service runs on the following GDPR-compliant infrastructure providers:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>
              <strong>Supabase</strong> — Database and authentication services (user data, project
              and talent records)
            </li>
            <li>
              <strong>Cloudflare R2</strong> — Video file storage (secure and resilient storage
              with zero egress costs)
            </li>
            <li>
              <strong>Vercel</strong> — Application hosting and deployment infrastructure
            </li>
            <li>
              <strong>PostHog</strong> — Anonymous usage analytics (consent-only)
            </li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            All sub-processors operate under EU Standard Contractual Clauses (SCCs) or equivalent
            data transfer safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Your Rights Under KVKK (Turkish Users)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Under Article 11 of Turkish Law No. 6698 (KVKK), you have the following rights:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>To learn whether your personal data is being processed</li>
            <li>To request information if your data has been processed</li>
            <li>To learn the purpose of processing and whether data is used in accordance with that purpose</li>
            <li>To know third parties to whom data is transferred domestically or abroad</li>
            <li>To request correction of incomplete or inaccurate data</li>
            <li>To request deletion or destruction of personal data where legally required</li>
            <li>To object to a result arising against you through exclusively automated systems</li>
            <li>To claim compensation for damages arising from unlawful processing</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            To exercise these rights, contact us at{' '}
            <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">
              support@castflow.app
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">7. Your Rights Under GDPR (EU Users)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            Users residing in the European Union have additional rights under GDPR:
          </p>
          <ul className="list-disc list-inside text-gray-600 leading-relaxed mb-4 space-y-2">
            <li>Right of access (Article 15)</li>
            <li>Right to rectification (Article 16)</li>
            <li>Right to erasure / "Right to be forgotten" (Article 17)</li>
            <li>Right to restriction of processing (Article 18)</li>
            <li>Right to data portability (Article 20)</li>
            <li>Right to object (Article 21)</li>
          </ul>
          <p className="text-gray-600 leading-relaxed mb-4">
            You also have the right to lodge a complaint with your local supervisory authority.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">8. Cookies and Tracking</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            CastFlow uses essential cookies for session management. PostHog analytics tracking is
            activated only with your explicit consent. You can manage cookies through your browser
            settings; however, disabling essential cookies may prevent the platform from functioning
            correctly.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">9. Policy Updates</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We may update this policy from time to time. Significant changes will be notified to
            your registered email address. The updated policy takes effect from the date it is
            published on this page.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">10. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            For any privacy-related questions, requests, or complaints:
          </p>
          <p className="text-gray-600 leading-relaxed mb-4">
            <strong>Email:</strong>{' '}
            <a href="mailto:support@castflow.app" className="text-indigo-600 hover:underline">
              support@castflow.app
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
