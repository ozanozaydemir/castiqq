'use client'

import { useRouter } from 'next/navigation'

/**
 * Tıklanan eleman bir link/buton/select/input ise satır navigasyonunu
 * atlıyoruz — aksi halde satır içindeki kendi hedefi olan elemanlar
 * (ör. proje linki) tıklandığında hem kendi hedefine hem de satırın
 * hedefine gidilmeye çalışılır.
 */
export function ClickableRow({
  href,
  children,
  className = '',
}: {
  href: string
  children: React.ReactNode
  className?: string
}) {
  const router = useRouter()
  return (
    <tr
      onClick={e => {
        const target = e.target as HTMLElement
        if (target.closest('a, button, select, input, label')) return
        router.push(href)
      }}
      className={`cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
    >
      {children}
    </tr>
  )
}
