import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { SelfServiceForm } from './SelfServiceForm'

export default async function OyuncuProfilPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: talent } = await admin
    .from('talent')
    .select('full_name, phone, email, city, availability, photos')
    .eq('self_service_token', token)
    .single()

  if (!talent) notFound()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 text-indigo-600 font-bold text-lg mb-4">
            🎬 Castiqq
          </div>
          <h1 className="text-xl font-bold text-gray-900">Merhaba, {talent.full_name.split(' ')[0]}</h1>
          <p className="text-sm text-gray-500 mt-1">Bilgilerini güncel tutmak için aşağıdaki formu kullanabilirsin.</p>
        </div>

        <SelfServiceForm token={token} talent={talent} />

        <p className="text-center text-xs text-gray-400">
          Bu, menajerinin sana özel gönderdiği kişisel bir bağlantıdır — başkalarıyla paylaşma.
        </p>
      </div>
    </div>
  )
}
