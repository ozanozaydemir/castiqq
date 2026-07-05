import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { CollectionDetailClient } from './CollectionDetailClient'
import { Link } from '@/i18n/navigation'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const tc = await getTranslations('collections')

  const { data: collection } = await supabase
    .from('collections')
    .select('id, name, description, share_token')
    .eq('id', id)
    .single()

  if (!collection) notFound()

  const { data: rawItems } = await supabase
    .from('collection_items')
    .select('talent_id, added_at, note, talent(id, full_name, city, phone, email, availability)')
    .eq('collection_id', id)
    .order('added_at', { ascending: false })

  type ItemRow = {
    talent_id: string
    added_at: string
    note: string | null
    talent: { id: string; full_name: string; city: string | null; phone: string | null; email: string | null; availability: string } | null
  }
  const members = (rawItems ?? []) as ItemRow[]

  type CollectionRow = { id: string; name: string; description: string | null; share_token: string }
  const col = collection as CollectionRow

  return (
    <div>
      <div className="flex items-center px-6 pt-6 pb-0">
        <Link href="/listeler" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> {tc('backToLists')}
        </Link>
      </div>
      <div className="px-6 pb-8 pt-6">
        <CollectionDetailClient
          collectionId={id}
          collectionName={col.name}
          collectionDescription={col.description ?? null}
          members={members}
          shareToken={col.share_token}
        />
      </div>
    </div>
  )
}
