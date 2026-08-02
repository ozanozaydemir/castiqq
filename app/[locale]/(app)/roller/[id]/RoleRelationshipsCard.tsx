import { createClient } from '@/lib/supabase/server'
import { Link } from '@/i18n/navigation'
import { Share2, ArrowRight, ArrowLeftRight, Plus } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { TYPE_STYLE, isSymmetric } from '@/lib/role-relationships'
import type { RelationshipType } from '@/types/database'

type Row = {
  id: string
  from_role_id: string
  to_role_id: string
  type: RelationshipType
  label: string | null
}

/**
 * Rol detayındaki salt-okunur ilişki özeti.
 *
 * Düzenleme merkezi burası değil — ilişki grafiği doğası gereği çoklu-rol bir
 * nesne, tek rolün sayfasında tam tuval göstermek yanlış çerçeve olurdu. Bu kart
 * özelliğin varlığını duyurup kullanıcıyı proje diyagramına yönlendiriyor.
 */
export async function RoleRelationshipsCard({ roleId, projectId }: {
  roleId: string
  projectId: string
}) {
  const supabase = await createClient()
  const t = await getTranslations('relationships')

  const { data } = await supabase
    .from('role_relationships')
    .select('id, from_role_id, to_role_id, type, label')
    .or(`from_role_id.eq.${roleId},to_role_id.eq.${roleId}`)

  const rows = (data ?? []) as Row[]

  // Karşı tarafların adları. FK ipucu yerine ayrı sorgu: role_relationships'in
  // project_roles'a iki ayrı FK'si var ve embed sözdizimi kırılgan.
  const otherIds = [...new Set(rows.map(r => r.from_role_id === roleId ? r.to_role_id : r.from_role_id))]
  const { data: others } = otherIds.length > 0
    ? await supabase.from('project_roles').select('id, name').in('id', otherIds)
    : { data: [] }
  const nameById = new Map(((others ?? []) as { id: string; name: string }[]).map(r => [r.id, r.name]))

  const diagramHref = `/projeler/${projectId}?tab=iliskiler`

  return (
    <div className="sb-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" />
          {t('cardTitle')}
        </h3>
        <Link
          href={diagramHref}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          {t('openDiagram')} →
        </Link>
      </div>

      {rows.length === 0 ? (
        <Link
          href={diagramHref}
          className="flex items-center justify-center gap-1.5 py-5 rounded-xl border border-dashed border-gray-200 text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t('cardEmpty')}
        </Link>
      ) : (
        <div className="space-y-1.5">
          {rows.map(rel => {
            const outgoing  = rel.from_role_id === roleId
            const otherId   = outgoing ? rel.to_role_id : rel.from_role_id
            const otherName = nameById.get(otherId) ?? '?'
            const style     = TYPE_STYLE[rel.type]
            const sym       = isSymmetric(rel.type)

            return (
              <Link
                key={rel.id}
                href={`/roller/${otherId}`}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <span
                  className="w-1 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: style.color }}
                />
                <span className="text-xs text-gray-500 flex-shrink-0 w-20 truncate">
                  {rel.label || t(`type.${rel.type}`)}
                </span>
                {sym
                  ? <ArrowLeftRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  : outgoing
                    ? <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    : <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0 rotate-180" />}
                <span className="text-sm text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                  {otherName}
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
