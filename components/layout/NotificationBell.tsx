'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { listNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '@/app/actions/notifications'

type NotificationRow = {
  id: string; type: string; title: string; body: string | null
  link_url: string | null; read_at: string | null; created_at: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unread, setUnread] = useState(0)
  const t = useTranslations('notifications')

  useEffect(() => {
    getUnreadNotificationCount().then(setUnread)
    const interval = setInterval(() => getUnreadNotificationCount().then(setUnread), 60000)
    return () => clearInterval(interval)
  }, [])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      const data = await listNotifications(20)
      setNotifications(data as NotificationRow[])
    }
  }

  async function handleClick(n: NotificationRow) {
    if (!n.read_at) {
      await markNotificationRead(n.id)
      setUnread(u => Math.max(0, u - 1))
    }
    setOpen(false)
    if (n.link_url) window.location.href = n.link_url
  }

  async function handleMarkAll() {
    await markAllNotificationsRead()
    setUnread(0)
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  return (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-500 transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-600">{t('title')}</span>
              {unread > 0 && (
                <button onClick={handleMarkAll} className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium">
                  {t('markAllRead')}
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">{t('empty')}</p>
              ) : (
                notifications.map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${!n.read_at ? 'bg-indigo-50/40' : ''}`}
                  >
                    <p className="text-xs text-gray-700 leading-snug">{n.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{new Date(n.created_at).toLocaleDateString('tr-TR')}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
