'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from '@/i18n/navigation'
import { Link } from '@/i18n/navigation'
import { Plus, Pencil, Trash2, Users } from 'lucide-react'
import { RolModal } from './RolModal'
import { createRol, updateRol, updateRolStatus, deleteRol } from '@/app/actions/projects'
import type { ProjectRole } from '@/types/database'
import { useTranslations } from 'next-intl'

interface RollerSectionProps {
  projectId: string
  roles: ProjectRole[]
  auditionCounts: Record<string, number>
}

export function RollerSection({ projectId, roles: initialRoles, auditionCounts }: RollerSectionProps) {
  const t = useTranslations('roles')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState(false)
  const [editingRole, setEditingRole] = useState<ProjectRole | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    open:      { label: t('status.open'),      color: 'bg-green-50 text-green-700 border-green-200' },
    casting:   { label: t('status.casting'),   color: 'bg-blue-50 text-blue-600 border-blue-200' },
    filled:    { label: t('status.filled'),    color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
    cancelled: { label: t('status.cancelled'), color: 'bg-gray-100 text-gray-500 border-gray-200' },
  }

  const GENDER_LABELS: Record<string, string> = {
    erkek: t('gender.erkek'), kadin: t('gender.kadin'),
  }

  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingRole(null)
    startTransition(() => router.refresh())
  }, [router])

  function openCreate() {
    setEditingRole(null)
    setShowModal(true)
  }

  function openEdit(role: ProjectRole) {
    setEditingRole(role)
    setShowModal(true)
  }

  async function handleStatusChange(roleId: string, status: string) {
    startTransition(async () => {
      await updateRolStatus(roleId, projectId, status)
      router.refresh()
    })
  }

  async function handleDelete(roleId: string) {
    if (!confirm(t('deleteRoleConfirm'))) return
    setDeletingId(roleId)
    startTransition(async () => {
      await deleteRol(roleId, projectId)
      router.refresh()
      setDeletingId(null)
    })
  }

  const modalAction = editingRole
    ? updateRol.bind(null, editingRole.id)
    : createRol

  return (
    <>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">{t('title')}</h2>
        <button onClick={openCreate} className="sb-btn-primary">
          <Plus className="w-4 h-4" />
          {t('addRole')}
        </button>
      </div>

      {/* Table or empty */}
      {initialRoles.length === 0 ? (
        <div className="sb-card flex flex-col items-center justify-center py-12 text-center">
          <Users className="w-8 h-8 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">{t('empty')}</p>
          <p className="text-xs text-gray-400 mt-1 mb-4">{t('descriptionLabel')}</p>
          <button onClick={openCreate} className="sb-btn-primary">
            <Plus className="w-4 h-4" />
            {t('addRole')}
          </button>
        </div>
      ) : (
        <div className="sb-card overflow-hidden">
          <table className="sb-table">
            <thead>
              <tr>
                <th>{t('colName')}</th>
                <th>{t('colGender')}</th>
                <th>{t('colAge')}</th>
                <th>{t('colStatus')}</th>
                <th className="text-center">{t('colApplications')}</th>
                <th className="text-right">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody>
              {initialRoles.map(role => {
                const statusCfg = STATUS_CONFIG[role.status] ?? STATUS_CONFIG.open
                const count = auditionCounts[role.id] ?? 0
                const isDeleting = deletingId === role.id

                return (
                  <tr key={role.id} className={isDeleting ? 'opacity-40' : ''}>
                    <td>
                      <Link href={`/roller/${role.id}`} className="block group">
                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{role.name}</p>
                        {role.description && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{role.description}</p>
                        )}
                      </Link>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {GENDER_LABELS[role.gender ?? ''] ?? t('genderAny')}
                    </td>
                    <td className="text-gray-500 text-sm">
                      {role.age_min && role.age_max
                        ? `${role.age_min}–${role.age_max}`
                        : role.age_min
                          ? `${role.age_min}+`
                          : role.age_max
                            ? `≤${role.age_max}`
                            : '—'}
                    </td>
                    <td>
                      <select
                        value={role.status}
                        disabled={isPending}
                        onChange={e => handleStatusChange(role.id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer appearance-none pr-6 ${statusCfg.color} disabled:opacity-60`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                      >
                        <option value="open">{t('status.open')}</option>
                        <option value="casting">{t('status.casting')}</option>
                        <option value="filled">{t('status.filled')}</option>
                        <option value="cancelled">{t('status.cancelled')}</option>
                      </select>
                    </td>
                    <td className="text-center">
                      <span className="text-sm font-medium text-gray-700">{count}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(role)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={t('editRole')}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(role.id)}
                          disabled={isDeleting}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                          title={t('deleteRoleConfirm')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <RolModal
          projectId={projectId}
          editingRole={editingRole}
          action={modalAction}
          onClose={closeModal}
        />
      )}
    </>
  )
}
