import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/layout/PageHeader'
import { ListelerClient } from './ListelerClient'
import { getTranslations } from 'next-intl/server'

export default async function ListelerPage() {
  const supabase = await createClient()
  const tc = await getTranslations('collections')

  const { data: rawCols } = await supabase
    .from('collections')
    .select('id, name, description, created_at, collection_items(count)')
    .order('created_at', { ascending: false })

  type RawCol = { id: string; name: string; description: string | null; created_at: string; collection_items: unknown }
  const collections = ((rawCols ?? []) as RawCol[]).map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    created_at: c.created_at,
    item_count: (c.collection_items as unknown as { count: number }[])[0]?.count ?? 0,
  }))

  return (
    <div>
      <PageHeader title={tc('title')} description={tc('pageDesc')} />
      <div className="p-6">
        <ListelerClient collections={collections} />
      </div>
    </div>
  )
}
