'use client'

import { useState, useTransition } from 'react'
import { useRouter, Link } from '@/i18n/navigation'
import { Plus, Trash2, CheckSquare, Square, ListTodo } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { TaskModal } from './TaskModal'
import { toggleTaskDone, deleteTask } from '@/app/actions/agencyTasks'
import type { AgencyTask } from '@/types/database'

export type TaskRow = AgencyTask & { talent: { full_name: string } | null }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('tr-TR')
}

export function TasksListClient({ tasks, talents }: { tasks: TaskRow[]; talents: { id: string; full_name: string }[] }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const t = useTranslations('tasks')

  const today = new Date().toISOString().split('T')[0]
  const pending = tasks.filter(tk => !tk.is_done)
  const done = tasks.filter(tk => tk.is_done)

  function closeModal() { setModalOpen(false); router.refresh() }

  function handleToggle(id: string, current: boolean, talentId: string | null) {
    startTransition(async () => { await toggleTaskDone(id, !current, talentId); router.refresh() })
  }

  function handleDelete(id: string, talentId: string | null) {
    startTransition(async () => { await deleteTask(id, talentId); router.refresh() })
  }

  function TaskRowItem({ tk }: { tk: TaskRow }) {
    const overdue = !tk.is_done && tk.due_date !== null && tk.due_date < today
    return (
      <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
        <button onClick={() => handleToggle(tk.id, tk.is_done, tk.talent_id)} disabled={isPending} className="mt-0.5 flex-shrink-0 text-gray-400 hover:text-indigo-600 transition-colors">
          {tk.is_done ? <CheckSquare className="w-4 h-4 text-indigo-500" /> : <Square className="w-4 h-4" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-medium ${tk.is_done ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{tk.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {tk.due_date && (
              <span className={`text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                {overdue ? t('overdue', { date: formatDate(tk.due_date) }) : formatDate(tk.due_date)}
              </span>
            )}
            {tk.talent && (
              <Link href={`/oyuncular/${tk.talent_id}`} className="text-xs text-indigo-500 hover:text-indigo-700 hover:underline">
                {tk.talent.full_name}
              </Link>
            )}
          </div>
        </div>
        <button onClick={() => handleDelete(tk.id, tk.talent_id)} disabled={isPending} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModalOpen(true)} className="sb-btn-primary">
          <Plus className="w-4 h-4" /> {t('addTask')}
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="w-10 h-10 text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('pendingSection', { count: pending.length })}</p>
            {pending.length === 0 ? (
              <p className="text-sm text-gray-400 py-2">{t('noPending')}</p>
            ) : (
              <div className="space-y-2">{pending.map(tk => <TaskRowItem key={tk.id} tk={tk} />)}</div>
            )}
          </div>

          {done.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('doneSection', { count: done.length })}</p>
              <div className="space-y-2">{done.map(tk => <TaskRowItem key={tk.id} tk={tk} />)}</div>
            </div>
          )}
        </div>
      )}

      {modalOpen && <TaskModal talents={talents} onClose={closeModal} />}
    </>
  )
}
