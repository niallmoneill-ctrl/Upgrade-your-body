'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, X, Check, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'

type Notification = {
  id: string
  title: string
  message: string
  phrase: string | null
  read: boolean
  created_at: string
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  async function load() {
    try {
      const data = await api<{ notifications: Notification[] }>('/api/notifications')
      setNotifications(data.notifications ?? [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAllRead() {
    try {
      await api('/api/notifications', { method: 'PATCH', body: JSON.stringify({ mark_all_read: true }) })
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {}
  }

  async function markRead(id: string) {
    try {
      await api('/api/notifications', { method: 'PATCH', body: JSON.stringify({ id }) })
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n))
    } catch {}
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-xl p-2 transition"
        style={{ color: 'var(--uyb-muted)' }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: 'var(--uyb-green)', color: '#041019' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-12 z-50 w-80 overflow-hidden"
          style={{
            background: 'var(--uyb-card)',
            border: '1px solid var(--uyb-card-border)',
            borderRadius: 18,
            boxShadow: 'var(--uyb-card-shadow)',
          }}
        >
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--uyb-card-border)' }}>
            <span className="font-semibold text-sm">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs font-medium transition"
                  style={{ color: 'var(--uyb-green)' }}
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ color: 'var(--uyb-muted)' }}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="mx-auto h-6 w-6 mb-2" style={{ color: 'var(--uyb-muted)', opacity: 0.4 }} />
                <div className="text-sm" style={{ color: 'var(--uyb-muted)' }}>No notifications yet</div>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead(n.id) }}
                  className="p-4 transition cursor-pointer"
                  style={{
                    borderBottom: '1px solid var(--uyb-card-border)',
                    background: n.read ? 'transparent' : 'var(--uyb-green-soft, rgba(42,157,110,0.06))',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!n.read && <div className="h-2 w-2 rounded-full" style={{ background: 'var(--uyb-green)' }} />}
                        <span className="text-sm font-medium">{n.title}</span>
                      </div>
                      <div className="mt-1 text-xs" style={{ color: 'var(--uyb-muted)' }}>{n.message}</div>
                      {n.phrase && (
                        <div className="mt-2 flex items-start gap-1.5 text-xs italic" style={{ color: 'var(--uyb-green)' }}>
                          <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          {n.phrase}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--uyb-muted)' }}>
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
