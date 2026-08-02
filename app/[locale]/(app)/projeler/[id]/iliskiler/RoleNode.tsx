'use client'

import { memo } from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { User, AlertTriangle } from 'lucide-react'

export type SelectedTalent = {
  id: string
  full_name: string
  avatar_url: string | null
  height_cm: number | null
}

export type RoleNodeData = {
  name: string
  gender: string | null
  ageMin: number | null
  ageMax: number | null
  status: 'open' | 'casting' | 'filled' | 'cancelled'
  candidateCount: number
  selected: SelectedTalent | null
  hasWarning: boolean
  genderLabel: string
  noCandidateLabel: string
  candidateCountLabel: string
}

export type RoleNodeType = Node<RoleNodeData, 'role'>

const STATUS_STRIP: Record<RoleNodeData['status'], string> = {
  open:      'bg-green-400',
  casting:   'bg-blue-400',
  filled:    'bg-indigo-500',
  cancelled: 'bg-gray-300',
}

// Dört yöne de tutamaç: kullanıcı hangi taraftan çekerse çeksin bağlantı kurulabilsin.
const HANDLE_SIDES = [
  { id: 't', position: Position.Top },
  { id: 'r', position: Position.Right },
  { id: 'b', position: Position.Bottom },
  { id: 'l', position: Position.Left },
] as const

function ageText(min: number | null, max: number | null): string | null {
  if (min && max) return `${min}–${max}`
  if (min) return `${min}+`
  if (max) return `≤${max}`
  return null
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export const RoleNode = memo(function RoleNode({ data, selected: isSelected }: NodeProps<RoleNodeType>) {
  const age = ageText(data.ageMin, data.ageMax)
  const meta = [data.genderLabel, age].filter(Boolean).join(' · ')

  return (
    <div
      className={`group relative rounded-xl border bg-white shadow-sm transition-shadow ${
        isSelected ? 'border-indigo-400 shadow-md ring-2 ring-indigo-100' : 'border-gray-200'
      }`}
      style={{ width: 208, height: 96 }}
    >
      {/* Tutamaçlar kartın tamamına hover'la beliriyor (group-hover), kendi
          üzerlerine gelinince değil: görünmez 3–4 piksellik bir hedefi bulmak
          gerekseydi özellik keşfedilemezdi. Boyut da bu yüzden 12px. */}
      {HANDLE_SIDES.map(h => (
        <Handle
          key={h.id}
          id={h.id}
          type="source"
          position={h.position}
          className="!w-3 !h-3 !bg-indigo-500 !border-2 !border-white !opacity-0 group-hover:!opacity-100 transition-opacity"
        />
      ))}

      {/* Durum şeridi — kendi köşe yuvarlaması var; kartta overflow-hidden
          kullanamıyoruz, tutamaçların dışa taşan yarısını kırpardı. */}
      <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${STATUS_STRIP[data.status]}`} />

      {data.hasWarning && (
        <span className="absolute top-1.5 right-1.5 text-amber-500" title="!">
          <AlertTriangle className="w-3.5 h-3.5" />
        </span>
      )}

      <div className="pl-3 pr-2 py-2 h-full flex flex-col">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">{data.name}</p>
        {meta && <p className="text-[11px] text-gray-400 truncate mt-0.5">{meta}</p>}

        <div className="mt-auto flex items-center gap-2 min-w-0">
          {data.selected ? (
            <>
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                {data.selected.avatar_url
                  ? <img src={data.selected.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[9px] font-bold text-indigo-500">{initials(data.selected.full_name)}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-gray-700 truncate leading-tight">
                  {data.selected.full_name}
                </p>
                {data.selected.height_cm && (
                  <p className="text-[10px] text-gray-400 leading-tight">{data.selected.height_cm} cm</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-300 min-w-0">
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[11px] truncate">
                {data.candidateCount > 0 ? data.candidateCountLabel : data.noCandidateLabel}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})
