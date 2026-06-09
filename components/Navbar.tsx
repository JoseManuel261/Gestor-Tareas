'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { LayoutDashboard, FolderKanban, Users, LogOut, Menu, X } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import ThemeToggle from '@/components/ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Proyectos', icon: FolderKanban },
  { href: '/groups', label: 'Grupos', icon: Users },
]

export default function Navbar({ username }: { username: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 md:px-6 justify-between"
        style={{
          background: 'rgba(10,10,10,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border)'
        }}>

        {/* Logo */}
        <Link href="/dashboard" className="font-display text-xl leading-none shrink-0"
          style={{ color: 'var(--text)' }}>
          Taskflow.
        </Link>

        {/* Nav links — solo desktop */}
        <div className="hidden md:flex items-center gap-1">
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

        {/* Derecha desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <NotificationBell />
          <Link href="/profile"
            className="mono text-xs px-2 py-1 rounded-md transition-all"
            style={{
              color: pathname === '/profile' ? 'var(--accent)' : 'var(--text-muted)',
              background: pathname === '/profile' ? 'var(--accent-dim)' : 'transparent',
            }}
            onMouseEnter={e => {
              if (pathname !== '/profile') (e.currentTarget as HTMLElement).style.color = 'var(--text)'
            }}
            onMouseLeave={e => {
              if (pathname !== '/profile') (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}>
            @{username}
          </Link>
          <button onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--red)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.3)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            }}>
            <LogOut size={12} />
            Salir
          </button>
        </div>

        {/* Derecha móvil */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-md transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            {menuOpen ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </nav>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div className="fixed top-14 left-0 right-0 z-40 md:hidden px-4 py-3 space-y-1"
          style={{
            background: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)'
          }}>
          {navItems.map(item => {
            const active = pathname.startsWith(item.href)
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active ? 'var(--accent)' : 'var(--text-muted)',
                  background: active ? 'var(--accent-dim)' : 'transparent'
                }}>
                <item.icon size={15} />
                {item.label}
              </Link>
            )
          })}

          <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />

          <div className="flex items-center justify-between px-3 py-2">
            <Link href="/profile" onClick={() => setMenuOpen(false)}
              className="mono text-xs transition-all"
              style={{ color: 'var(--text-muted)' }}>
              @{username}
            </Link>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--red)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.3)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
              }}>
              <LogOut size={12} />
              Salir
            </button>
          </div>
        </div>
      )}
    </>
  )
}
