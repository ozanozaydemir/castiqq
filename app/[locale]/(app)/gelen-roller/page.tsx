import { PageHeader } from '@/components/layout/PageHeader'
import { listIncomingShares } from '@/app/actions/roleShares'
import { Link } from '@/i18n/navigation'
import { Inbox } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-600',
  revoked: 'bg-gray-100 text-gray-500',
  role_closed: 'bg-amber-50 text-amber-600',
  expired: 'bg-gray-100 text-gray-500',
}

export default async function GelenRollerPage() {
  const t = await getTranslations('incomingRoles')
  const shares = await listIncomingShares()

  return (
    <div>
      <PageHeader title={t('title')} description={t('description')} />

      <div className="p-6">
        {shares.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Inbox className="w-8 h-8 text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">{t('empty')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map(s => (
              <Link
                key={s.id}
                href={`/gelen-roller/${s.id}`}
                className="sb-card p-4 flex items-center justify-between border border-transparent hover:border-indigo-200 transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{s.role_title}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {s.sender_organization_name}{s.project_title ? ` · ${s.project_title}` : ''}
                  </p>
                </div>
                <span className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[s.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {t(`status.${s.status}`)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
