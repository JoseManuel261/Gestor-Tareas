'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import type { Notification } from '@/lib/types'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h} h`
  const d = Math.floor(h / 24)
  return `hace ${d} d`
}

export default function NotificationBell() {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unread = items.filter(i => !i.read).length

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setItems((data as Notification[]) || [])

      channel = supabase
        .channel('notifications-feed')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          payload => setItems(prev => [payload.new as Notification, ...prev])
        )
        .subscribe()
    }

    init()
    return () => { if (channel) supabase.removeChannel(channel) }
  }, [])

  async function markAllRead() {
    const ids = items.filter(i => !i.read).map(i => i.id)
    if (!ids.length) return
    setItems(prev => prev.map(i => ({ ...i, read: true })))
    await supabase.from('notifications').update({ read: true }).in('id', ids)
  }

  function openItem(n: Notification) {
    setOpen(false)
    if (!n.read) {
      setItems(prev => prev.map(i => (i.id === n.id ? { ...i, read: true } : i)))
      supabase.from('notifications').update({ read: true }).eq('id', n.id).then(() => {})
    }
    if (n.link) router.push(n.link)
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="relative p-1.5 rounded-md transition-all"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
        onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
        <Bell size={15} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: 'var(--accent)', color: '#000' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 rounded-xl overflow-hidden z-50 animate-fade-up"
            style={{ background: 'var(--surface)', border: '1px solid var(--border2)', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Notificaciones</span>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs transition-all"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
                  <CheckCheck size={12} /> Marcar leídas
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {!items.length ? (
                <p className="text-sm text-center py-10" style={{ color: 'var(--text-dim)' }}>
                  Sin notificaciones
                </p>
              ) : (
                items.map(n => (
                  <button key={n.id} onClick={() => openItem(n)}
                    className="w-full text-left px-4 py-3 flex gap-3 transition-all"
                    style={{ borderBottom: '1px solid var(--border)', background: n.read ? 'transparent' : 'var(--accent-dim)' }}>
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                      style={{ background: n.read ? 'var(--text-dim)' : 'var(--accent)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{n.title}</p>
                      {n.body && <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{n.body}</p>}
                      <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{timeAgo(n.created_at)}</p>
                    </div>
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
