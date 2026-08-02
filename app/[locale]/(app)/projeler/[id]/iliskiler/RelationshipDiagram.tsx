'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ReactFlow, Background, Controls, MiniMap, MarkerType, ConnectionMode,
  useNodesState, ReactFlowProvider,
  type Connection, type Edge, type OnNodeDrag,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useTranslations } from 'next-intl'
import { Users, Network, LayoutGrid, Eye, EyeOff, AlertTriangle, Loader2, Info } from 'lucide-react'

import { RoleNode, type RoleNodeType, type SelectedTalent } from './RoleNode'
import { RelationshipModal, type PendingEdge } from './RelationshipModal'
import { CombinationModal } from './CombinationModal'
import { MobileRelationshipList } from './MobileRelationshipList'

import {
  TYPE_STYLE, TYPE_CATEGORY, isSymmetric,
  findAgeGapWarnings, findCycles, findSameTalentConflicts,
  type RelationshipCategory, type RelationshipWarning,
} from '@/lib/role-relationships'
import { computeLayout, withFallbackPositions, NODE_W, NODE_H } from '@/lib/diagram-layout'
import {
  createRelationship, updateRelationship, deleteRelationship, saveNodePositions,
} from '@/app/actions/role-relationships'
import type { RelationshipType } from '@/types/database'

export type DiagramRole = {
  id: string
  name: string
  gender: string | null
  age_min: number | null
  age_max: number | null
  status: 'open' | 'casting' | 'filled' | 'cancelled'
  diagram_x: number | null
  diagram_y: number | null
}

export type DiagramRelationship = {
  id: string
  from_role_id: string
  to_role_id: string
  type: RelationshipType
  label: string | null
}

interface Props {
  projectId: string
  roles: DiagramRole[]
  relationships: DiagramRelationship[]
  selectedByRole: Record<string, SelectedTalent>
  candidateCounts: Record<string, number>
}

const nodeTypes = { role: RoleNode }
const CATEGORIES: (RelationshipCategory | 'all')[] = ['all', 'family', 'work', 'social']

export function RelationshipDiagram(props: Props) {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)

  // React Flow'u mobilde hiç mount etmiyoruz: küçük ekranda node grafiği
  // gerçekten kullanılamıyor, kırpılmış tuval yerine yapılandırılmış liste
  // daha dürüst bir deneyim.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const update = () => setIsDesktop(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (isDesktop === null) {
    return (
      <div className="sb-card h-[560px] flex items-center justify-center text-gray-300">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    )
  }

  return isDesktop
    ? <ReactFlowProvider><DesktopCanvas {...props} /></ReactFlowProvider>
    : <MobileRelationshipList {...props} />
}

function DesktopCanvas({ projectId, roles, relationships, selectedByRole, candidateCounts }: Props) {
  const t  = useTranslations('relationships')
  const tg = useTranslations('roles.gender')

  const [category, setCategory]   = useState<RelationshipCategory | 'all'>('all')
  const [showCasting, setShowCasting] = useState(true)
  const [modalEdge, setModalEdge] = useState<PendingEdge | null>(null)
  const [comboEdge, setComboEdge] = useState<DiagramRelationship | null>(null)
  const [saving, setSaving]       = useState(false)

  const roleNames = useMemo(
    () => new Map(roles.map(r => [r.id, r.name])),
    [roles],
  )

  // ── Uyarılar ───────────────────────────────────────────────────────────────
  const warnings: RelationshipWarning[] = useMemo(() => {
    const selectedMap = new Map(
      Object.entries(selectedByRole).map(([roleId, tal]) => [
        roleId, { talentId: tal.id, talentName: tal.full_name },
      ]),
    )
    return [
      ...findCycles(relationships, roles),
      ...findSameTalentConflicts(relationships, selectedMap, roles),
      ...findAgeGapWarnings(relationships, roles),
    ]
  }, [relationships, roles, selectedByRole])

  const warnedRoleIds = useMemo(() => {
    const ids = new Set<string>()
    const byId = new Map(relationships.map(r => [r.id, r]))
    for (const w of warnings) {
      const rel = byId.get(w.relationshipId)
      if (rel) { ids.add(rel.from_role_id); ids.add(rel.to_role_id) }
    }
    return ids
  }, [warnings, relationships])

  // ── Düğümler ───────────────────────────────────────────────────────────────
  const initialNodes: RoleNodeType[] = useMemo(() => {
    const positions = withFallbackPositions(roles, relationships)
    return roles.map(r => ({
      id: r.id,
      type: 'role' as const,
      position: positions[r.id] ?? { x: 0, y: 0 },
      data: {
        name: r.name,
        gender: r.gender,
        ageMin: r.age_min,
        ageMax: r.age_max,
        status: r.status,
        candidateCount: candidateCounts[r.id] ?? 0,
        selected: showCasting ? (selectedByRole[r.id] ?? null) : null,
        hasWarning: warnedRoleIds.has(r.id),
        genderLabel: r.gender === 'erkek' ? tg('erkek') : r.gender === 'kadin' ? tg('kadin') : '',
        noCandidateLabel: t('noCandidate'),
        candidateCountLabel: t('candidateCount', { count: candidateCounts[r.id] ?? 0 }),
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles, relationships, candidateCounts, selectedByRole, showCasting, warnedRoleIds])

  const [nodes, setNodes, onNodesChange] = useNodesState<RoleNodeType>(initialNodes)

  // Sunucudan yeni veri geldiğinde (ilişki eklendi/silindi) düğümleri tazele,
  // ama kullanıcının sürüklediği konumları koru.
  useEffect(() => {
    setNodes(prev => {
      const posById = new Map(prev.map(n => [n.id, n.position]))
      return initialNodes.map(n => ({ ...n, position: posById.get(n.id) ?? n.position }))
    })
  }, [initialNodes, setNodes])

  // ── Kenarlar ───────────────────────────────────────────────────────────────
  const visibleRels = useMemo(
    () => category === 'all'
      ? relationships
      : relationships.filter(r => TYPE_CATEGORY[r.type] === category),
    [relationships, category],
  )

  const edges: Edge[] = useMemo(() => visibleRels.map(rel => {
    const style = TYPE_STYLE[rel.type]
    const symmetric = isSymmetric(rel.type)
    const hasWarning = warnings.some(w => w.relationshipId === rel.id)
    return {
      id: rel.id,
      source: rel.from_role_id,
      target: rel.to_role_id,
      type: 'smoothstep',
      animated: false,
      label: rel.label || t(`type.${rel.type}`),
      labelStyle: { fontSize: 10, fill: '#6b7280' },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
      style: {
        stroke: hasWarning ? '#f59e0b' : style.color,
        strokeWidth: hasWarning ? 2.5 : 1.8,
        strokeDasharray: style.dashed ? '5 4' : undefined,
      },
      markerEnd: symmetric ? undefined : {
        type: MarkerType.ArrowClosed,
        color: hasWarning ? '#f59e0b' : style.color,
        width: 16, height: 16,
      },
    }
  }), [visibleRels, warnings, t])

  // ── Etkileşim ──────────────────────────────────────────────────────────────
  const persistPositions = useCallback(async (list: { roleId: string; x: number; y: number }[]) => {
    setSaving(true)
    await saveNodePositions(projectId, list)
    setSaving(false)
  }, [projectId])

  // Sürükleme bittiğinde kaydediyoruz — her karede yazmak gereksiz yük olurdu.
  // onNodeDragStop nihai konumu doğrudan veriyor; onNodesChange içinden state
  // okumak henüz flush edilmemiş (bir önceki) konumu döndürürdü.
  const onNodeDragStop: OnNodeDrag<RoleNodeType> = useCallback((
    _: MouseEvent | TouchEvent, node: RoleNodeType, dragged: RoleNodeType[],
  ) => {
    const moved = dragged.length > 0 ? dragged : [node]
    void persistPositions(moved.map(n => ({ roleId: n.id, x: n.position.x, y: n.position.y })))
  }, [persistPositions])

  const onConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target || c.source === c.target) return
    setModalEdge({ id: null, fromRoleId: c.source, toRoleId: c.target, type: 'spouse', label: '' })
  }, [])

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const rel = relationships.find(r => r.id === edge.id)
    if (!rel) return
    // Çift kenarına tıklamak doğrudan kombinasyon moduna götürüyor — asıl
    // değerin olduğu yer burası.
    if (rel.type === 'spouse' || rel.type === 'partner') { setComboEdge(rel); return }
    setModalEdge({
      id: rel.id, fromRoleId: rel.from_role_id, toRoleId: rel.to_role_id,
      type: rel.type, label: rel.label ?? '',
    })
  }, [relationships])

  const applyAutoLayout = useCallback(async (mode: 'family' | 'org' | 'grid') => {
    const positions = computeLayout(mode, roles, relationships)
    setNodes(prev => prev.map(n => positions[n.id] ? { ...n, position: positions[n.id] } : n))
    await persistPositions(
      Object.entries(positions).map(([roleId, p]) => ({ roleId, x: p.x, y: p.y })),
    )
  }, [roles, relationships, setNodes, persistPositions])

  async function handleSaveEdge(e: PendingEdge) {
    return e.id
      ? updateRelationship(e.id, projectId, e.type, e.label)
      : createRelationship(projectId, e.fromRoleId, e.toRoleId, e.type, e.label)
  }

  const legendTypes = useMemo(
    () => ([...new Set(visibleRels.map(r => r.type))]),
    [visibleRels],
  )

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl border border-gray-200 overflow-hidden">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 text-xs transition-colors ${
                category === c
                  ? 'bg-indigo-50 text-indigo-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {t(`category.${c}`)}
            </button>
          ))}
        </div>

        <div className="h-5 w-px bg-gray-200" />

        <button onClick={() => applyAutoLayout('family')} className="sb-btn-secondary text-xs">
          <Users className="w-3.5 h-3.5" /> {t('layoutFamily')}
        </button>
        <button onClick={() => applyAutoLayout('org')} className="sb-btn-secondary text-xs">
          <Network className="w-3.5 h-3.5" /> {t('layoutOrg')}
        </button>
        <button onClick={() => applyAutoLayout('grid')} className="sb-btn-secondary text-xs">
          <LayoutGrid className="w-3.5 h-3.5" /> {t('layoutGrid')}
        </button>

        <div className="h-5 w-px bg-gray-200" />

        <button
          onClick={() => setShowCasting(v => !v)}
          className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-colors ${
            showCasting
              ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          {showCasting ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {t('castingOverlay')}
        </button>

        {saving && (
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400">
            <Loader2 className="w-3 h-3 animate-spin" /> {t('saving')}
          </span>
        )}
      </div>

      {/* Uyarılar */}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 space-y-1">
          {warnings.slice(0, 4).map((w, i) => (
            <p key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
              <span>{t(`warning.${w.code}`, w.params)}</span>
            </p>
          ))}
          {warnings.length > 4 && (
            <p className="text-xs text-amber-600 pl-5">{t('moreWarnings', { count: warnings.length - 4 })}</p>
          )}
        </div>
      )}

      {/* Canvas */}
      <div className="sb-card overflow-hidden" style={{ height: 'calc(100vh - 340px)', minHeight: 480 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeDragStop={onNodeDragStop}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          // Tutamaçların hepsi `source`: hangi uçtan çekilirse çekilsin bağlantı
          // kurulabilmeli. Varsayılan (Strict) modda source→source bağlantı
          // reddedilir ve sürükleme sessizce hiçbir şey yapmaz. Yönü zaten
          // tutamaç tipi değil, modaldeki tip seçimi belirliyor.
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
          minZoom={0.2}
          maxZoom={1.6}
          proOptions={{ hideAttribution: false }}
          defaultEdgeOptions={{ type: 'smoothstep' }}
        >
          <Background gap={20} size={1} color="#e5e7eb" />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={2}
            nodeColor={() => '#c7d2fe'}
            maskColor="rgba(255,255,255,0.7)"
            pannable
            style={{ width: 140, height: 92 }}
          />
        </ReactFlow>
      </div>

      {/* Legend + ipucu */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {legendTypes.map(type => (
          <span key={type} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
            <span
              className="w-4 h-0.5 rounded-full"
              style={
                TYPE_STYLE[type].dashed
                  ? { backgroundImage: `repeating-linear-gradient(to right, ${TYPE_STYLE[type].color} 0 3px, transparent 3px 6px)` }
                  : { backgroundColor: TYPE_STYLE[type].color }
              }
            />
            {t(`type.${type}`)}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-gray-400 ml-auto">
          <Info className="w-3 h-3" /> {t('canvasHint')}
        </span>
      </div>

      {modalEdge && (
        <RelationshipModal
          edge={modalEdge}
          roleNames={roleNames}
          onSave={handleSaveEdge}
          onDelete={modalEdge.id ? (id) => deleteRelationship(id, projectId) : undefined}
          onClose={() => setModalEdge(null)}
        />
      )}

      {comboEdge && (
        <CombinationModal
          relationship={comboEdge}
          roleNames={roleNames}
          onEditRelationship={() => {
            setModalEdge({
              id: comboEdge.id, fromRoleId: comboEdge.from_role_id, toRoleId: comboEdge.to_role_id,
              type: comboEdge.type, label: comboEdge.label ?? '',
            })
            setComboEdge(null)
          }}
          onClose={() => setComboEdge(null)}
        />
      )}
    </div>
  )
}

export { NODE_W, NODE_H }
