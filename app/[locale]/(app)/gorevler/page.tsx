import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { getTranslations } from 'next-intl/server'
import { TasksListClient, type TaskRow } from './TasksListClient'

export default async function GorevlerPage() {
  const supabase = await createClient()
  const t = await getTranslations('tasks')

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user?.id ?? '').single()
  const { data: org } = await supabase.from('organizations').select('org_type').eq('id', profile?.organization_id ?? '').single()
  if (org?.org_type !== 'agency') redirect('/dashboard')

  const [{ data: tasks }, { data: talents }] = await Promise.all([
    supabase.from('agency_tasks').select('*, talent(full_name)').order('due_date', { ascending: true, nullsFirst: false }) as Promise<{ data: TaskRow[] | null }>,
    supabase.from('talent').select('id, full_name').order('full_name') as Promise<{ data: { id: string; full_name: string }[] | null }>,
  ])

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />
      <div className="p-6">
        <TasksListClient tasks={tasks ?? []} talents={talents ?? []} />
      </div>
    </div>
  )
}
