import { Link } from '@/i18n/navigation'
import { Layers, Share2 } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export type ProjectTab = 'roller' | 'iliskiler'

export async function ProjectTabs({ projectId, active, relationshipCount }: {
  projectId: string
  active: ProjectTab
  relationshipCount: number
}) {
  const t = await getTranslations('projects')

  const tabs: { key: ProjectTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'roller',    label: t('tabRoles'),         icon: <Layers className="w-3.5 h-3.5" /> },
    { key: 'iliskiler', label: t('tabRelationships'), icon: <Share2 className="w-3.5 h-3.5" />, badge: relationshipCount },
  ]

  return (
    <div className="border-b border-gray-200 px-6">
      <div className="flex items-center gap-1">
        {tabs.map(tab => {
          const isActive = tab.key === active
          const href = tab.key === 'roller'
            ? `/projeler/${projectId}`
            : `/projeler/${projectId}?tab=${tab.key}`
          return (
            <Link
              key={tab.key}
              href={href}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-sm border-b-2 -mb-px transition-colors ${
                isActive
                  ? 'border-indigo-500 text-indigo-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
