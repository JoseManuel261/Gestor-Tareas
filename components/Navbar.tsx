'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, FolderKanban, Users, LogOut } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban },
  { href: '/groups', label: 'Grupos', icon: Users },
]

export default function Navbar({ username }: { username: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 justify-between"
      style={{
        background: 'rgba(10,10,10,0.8)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)'
      }}>
      <Link
        href="/dashboard"
        className="font-display text-xl leading-none"
        style={{ color: 'var(--text)' }}
      >
        Taskflow.
      </Link>

      <div className="flex items-center gap-1">
        {navItems.map(item => {
          const active = pathname.startsWith(item.href)
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                background: active ? 'var(--accent-dim)' : 'transparent'
              }}>
              <item.icon size={13} />
              {item.label}
            </Link>
          )
        })}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />
        <span className="mono text-xs" style={{ color: 'var(--text-muted)' }}>@{username}</span>
        <button onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--red)'
              ; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.3)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
          }}>
          <LogOut size={12} />
          Salir
        </button>
      </div>
    </nav>
  )
}
