'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const stored = (localStorage.getItem('theme') as 'dark' | 'light' | null) || 'dark'
    setTheme(stored)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
    try { localStorage.setItem('theme', next) } catch {}
  }

  return (
    <button onClick={toggle} aria-label="Cambiar tema"
      className="p-1.5 rounded-md transition-all"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
      {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  )
}
