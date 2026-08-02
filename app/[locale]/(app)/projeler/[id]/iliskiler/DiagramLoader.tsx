'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { ComponentProps } from 'react'
import type { RelationshipDiagram as DiagramType } from './RelationshipDiagram'

// React Flow tarayıcı ölçümlerine dayanıyor ve ~50KB; sunucuda render edilemez
// ve ana bundle'a girmemeli. Yalnızca bu tab açılınca yükleniyor.
//
// `ssr: false` Server Component'ten geçilemediği için bu ince client sarmalayıcı
// gerekiyor.
const RelationshipDiagram = dynamic(
  () => import('./RelationshipDiagram').then(m => m.RelationshipDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="sb-card h-[560px] flex items-center justify-center text-gray-300">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    ),
  },
)

export function DiagramLoader(props: ComponentProps<typeof DiagramType>) {
  return <RelationshipDiagram {...props} />
}
