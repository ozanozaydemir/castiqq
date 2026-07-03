'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface CopyPublicLinkButtonProps {
  url: string
}

export function CopyPublicLinkButton({ url }: CopyPublicLinkButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: silently ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-indigo-50"
      title="Linki kopyala"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-green-500" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {copied ? 'Kopyalandı' : 'Kopyala'}
    </button>
  )
}
