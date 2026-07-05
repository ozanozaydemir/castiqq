'use client'

import { useState, useActionState, useTransition } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import { inviteTeamMember, updateMemberRole, removeMember, cancelInvite } from '@/app/actions/team'
import {
  UserPlus, Trash2, ChevronDown, X, Loader2, CheckCircle2, Mail, Clock,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────

type Member = {
  id: string
  full_name: string
  role: string
  email: string
  confirmed?: boolean
}

const ROLE_COLORS: Record<string, string> = {
  admin:  'bg-indigo-50 text-indigo-700',
  member: 'bg-gray-100 text-gray-600',
  viewer: 'bg-gray-50 text-gray-400',
}

// ── Invite form ───────────────────────────────────────────────────

function InviteSubmitBtn() {
  const { pending } = useFormStatus()
  const t = useTranslations('settings')
  return (
    <button type="submit" disabled={pending} className="sb-btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
      {pending
        ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('team.inviting')}</>
        : <><Mail className="w-4 h-4" /> {t('team.inviteCta')}</>}
    </button>
  )
}

function InviteForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations('settings')
  const tc = useTranslations('common')
  const [state, action] = useActionState(inviteTeamMember, null)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm">{t('team.invite')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form action={action} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('team.emailLabel')}</label>
            <input name="email" type="email" className="sb-input" placeholder={t('team.emailPlaceholder')} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-600">{t('team.roleLabel')}</label>
            <select name="role" className="sb-input">
              <option value="member">{t('team.roleMember')}</option>
              <option value="viewer">{t('team.roleViewer')}</option>
              <option value="admin">{t('team.roleAdmin')}</option>
            </select>
          </div>
          {state?.error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{state.error}</p>
          )}
          {state?.success && (
            <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {t('team.inviteSent')}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="sb-btn-secondary flex-1">{tc('cancel')}</button>
            <div className="flex-1"><InviteSubmitBtn /></div>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Member row ────────────────────────────────────────────────────

function MemberRow({ member, currentUserId, isAdmin }: {
  member: Member; currentUserId: string; isAdmin: boolean
}) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [, startTransition] = useTransition()
  const isSelf = member.id === currentUserId

  const ROLE_LABELS: Record<string, string> = {
    admin:  t('team.admin'),
    member: t('team.member'),
    viewer: t('team.viewer'),
  }

  function handleRoleChange(role: string) {
    startTransition(async () => {
      await updateMemberRole(member.id, role)
      router.refresh()
    })
  }

  function handleRemove() {
    if (!confirm(t('team.removeConfirm', { name: member.full_name }))) return
    startTransition(async () => {
      await removeMember(member.id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-indigo-600">
          {member.full_name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {member.full_name}
          {isSelf && <span className="ml-1.5 text-xs text-gray-400">({t('team.self')})</span>}
        </p>
        <p className="text-xs text-gray-400 truncate">{member.email}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isAdmin && !isSelf ? (
          <div className="relative inline-flex items-center gap-1 cursor-pointer">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}>
              {ROLE_LABELS[member.role] ?? member.role}
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400 pointer-events-none" />
            <select
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
              value={member.role}
              onChange={e => handleRoleChange(e.target.value)}
            >
              <option value="admin">{t('team.admin')}</option>
              <option value="member">{t('team.member')}</option>
              <option value="viewer">{t('team.viewer')}</option>
            </select>
          </div>
        ) : (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_COLORS[member.role] ?? ROLE_COLORS.member}`}>
            {ROLE_LABELS[member.role] ?? member.role}
          </span>
        )}
        {isAdmin && !isSelf && (
          <button
            onClick={handleRemove}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors"
            title={t('team.remove')}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────

function PendingInviteRow({ member, isAdmin }: { member: Member; isAdmin: boolean }) {
  const t = useTranslations('settings')
  const router = useRouter()
  const [, startTransition] = useTransition()

  function handleCancel() {
    if (!confirm(t('team.cancelInviteConfirm', { email: member.email }))) return
    startTransition(async () => {
      await cancelInvite(member.id)
      router.refresh()
    })
  }

  return (
    <div className="flex items-center gap-3 py-3 px-5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 truncate">{member.email}</p>
        <p className="text-xs text-amber-500">{t('team.pendingInviteHint')}</p>
      </div>
      {isAdmin && (
        <button
          onClick={handleCancel}
          className="flex-shrink-0 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          title={t('team.cancelInvite')}
        >
          {t('team.cancelInvite')}
        </button>
      )}
    </div>
  )
}

export function EkipClient({ members, pendingInvites, currentUserId, isAdmin }: {
  members: Member[]
  pendingInvites: Member[]
  currentUserId: string
  isAdmin: boolean
}) {
  const t = useTranslations('settings')
  const [showInvite, setShowInvite] = useState(false)

  return (
    <>
      <div className="sb-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('team.members')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('team.memberCount', { count: members.length })}</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowInvite(true)}
              className="sb-btn-primary text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {t('team.inviteBtn')}
            </button>
          )}
        </div>

        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserPlus className="w-8 h-8 text-gray-200 mb-2" />
            <p className="text-sm text-gray-400">{t('team.empty')}</p>
          </div>
        ) : (
          <div>
            {members.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {pendingInvites.length > 0 && (
        <div className="sb-card overflow-hidden mt-4">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">{t('team.pendingInvites')}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{t('team.pendingInviteCount', { count: pendingInvites.length })}</p>
          </div>
          <div>
            {pendingInvites.map(m => (
              <PendingInviteRow key={m.id} member={m} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}

      {showInvite && <InviteForm onClose={() => setShowInvite(false)} />}
    </>
  )
}
