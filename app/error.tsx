'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}>
      <div className="text-center animate-fade-up">
        <p className="mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--red)' }}>
          Error 500
        </p>
        <h1 className="error-number mb-4">500</h1>
        <p className="text-base mb-2" style={{ color: 'var(--text)' }}>
          Algo salió mal
        </p>
        <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
          Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={reset}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
            Intentar de nuevo
          </button>
          <Link href="/dashboard"
            className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
