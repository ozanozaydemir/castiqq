'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { FileDown, Loader2 } from 'lucide-react'

export function DocumentDownloadButton({ path, label }: { path: string; label: string }) {
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  async function handleClick() {
    setLoading(true)
    const { data } = await supabase.storage.from('talent-documents').createSignedUrl(path, 60)
    setLoading(false)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileDown className="w-3 h-3" />}
      {label}
    </button>
  )
}
