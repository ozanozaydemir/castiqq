interface ProjectStorageItem {
  id: string
  name: string
  totalBytes: number
  videoCount: number
}

interface StorageCardProps {
  usedBytes: number
  limitBytes: number
  projects: ProjectStorageItem[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export function StorageCard({ usedBytes, limitBytes, projects }: StorageCardProps) {
  const pct = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0
  const barColor = pct >= 90 ? 'bg-red-500' : pct >= 75 ? 'bg-amber-500' : 'bg-indigo-500'
  const maxProjectBytes = Math.max(...projects.map(p => p.totalBytes), 1)

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">{formatBytes(usedBytes)} kullanıldı</span>
          <span className="text-gray-400">{formatBytes(limitBytes)} limit</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-400">Henüz video yüklenmemiş.</p>
      ) : (
        <div className="divide-y divide-gray-50 -mx-6 px-6">
          {projects.map(p => {
            const projectPct = (p.totalBytes / maxProjectBytes) * 100
            return (
              <div key={p.id} className="py-3 first:pt-0">
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-900 truncate max-w-[65%]">{p.name}</span>
                  <span className="text-gray-400 shrink-0 text-xs tabular-nums">
                    {formatBytes(p.totalBytes)} · {p.videoCount} video
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-full"
                    style={{ width: `${projectPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
