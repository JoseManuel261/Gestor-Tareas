'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg)' }}>
      <div className="text-center animate-fade-up">
        <p className="mono text-xs tracking-widest uppercase mb-4"
          style={{ color: 'var(--accent)' }}>
          Error 404
        </p>
        <h1 style={{
          fontFamily: 'Fenix, serif',
          fontSize: 'clamp(4rem, 15vw, 9rem)',
          lineHeight: 1,
          color: 'var(--surface2)',
          letterSpacing: '-0.04em',
          marginBottom: '1rem',
          userSelect: 'none',
        }}>
          404
        </h1>
        <p className="text-base mb-2" style={{ color: 'var(--text)' }}>
          Esta página no existe
        </p>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          La ruta que buscas no está disponible o fue eliminada.
        </p>
        <Link href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
