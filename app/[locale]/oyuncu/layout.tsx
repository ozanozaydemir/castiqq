export default function OyuncuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="font-semibold text-gray-800">Castiqq</span>
        </div>
        {children}
      </div>
    </div>
  )
}
