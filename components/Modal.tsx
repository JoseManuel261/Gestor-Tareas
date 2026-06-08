'use client'
import { X } from 'lucide-react'
import { useEffect } from 'react'

export default function Modal({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
      style={{background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'}}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-xl p-6 animate-fade-up"
        style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-base" style={{color: 'var(--text)'}}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md transition-all"
            style={{color: 'var(--text-muted)'}}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
