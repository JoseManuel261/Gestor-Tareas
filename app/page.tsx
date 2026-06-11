'use client'
import Link from 'next/link'
import GlobalAI from '@/components/GlobalAI'

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative' }}>

      {/* Nav — minimalista, sin iconos */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: '3.5rem',
        display: 'flex', alignItems: 'center',
        padding: '0 2rem',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(10px)',
      }}>
        <span style={{
          fontFamily: 'Syne, sans-serif',
          fontWeight: 800,
          fontSize: '1rem',
          letterSpacing: '-0.01em',
          color: 'var(--text)',
        }}>
          Strata
          <span style={{ color: 'var(--accent)' }}>.</span>
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Link href="/login" style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            padding: '0.375rem 0.75rem',
            borderRadius: '0.375rem',
            transition: 'color 0.15s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            Entrar
          </Link>
          <Link href="/register" style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: '#000',
            background: 'var(--accent)',
            padding: '0.375rem 1rem',
            borderRadius: '0.375rem',
            transition: 'background 0.15s',
            textDecoration: 'none',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
            Crear cuenta
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '10rem 2rem 6rem',
      }}>

        {/* Eyebrow */}
        <p style={{
          fontFamily: 'DM Mono, monospace',
          fontSize: '0.65rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
          marginBottom: '2rem',
        }}>
          Gestión de proyectos en equipo
        </p>

        {/* Headline — el elemento firma */}
        <div style={{ position: 'relative', marginBottom: '2.5rem' }}>
          {/* Línea lime vertical que atraviesa el texto */}
          <div style={{
            position: 'absolute',
            left: '-1.5rem',
            top: 0,
            bottom: 0,
            width: '2px',
            background: 'linear-gradient(180deg, var(--accent) 0%, transparent 100%)',
          }}/>

          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: 'clamp(3rem, 8vw, 5.5rem)',
            lineHeight: 0.95,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            marginBottom: '0.75rem',
          }}>
            Organiza.<br/>
            <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontFamily: 'Fenix, serif', fontSize: '0.75em', letterSpacing: '-0.01em' }}>
              Sin ruido.
            </span>
          </h1>
        </div>

        <p style={{
          fontFamily: 'Fenix, serif',
          fontSize: '1.125rem',
          lineHeight: 1.65,
          color: 'var(--text-muted)',
          maxWidth: '480px',
          marginBottom: '3rem',
        }}>
          Strata pone cada proyecto, tarea y persona en su lugar.
          Sin tableros infinitos, sin configuración interminable.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '5rem' }}>
          <Link href="/register" style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 600,
            fontSize: '0.875rem',
            color: '#000',
            background: 'var(--accent)',
            padding: '0.75rem 1.75rem',
            borderRadius: '0.5rem',
            textDecoration: 'none',
            transition: 'background 0.15s, transform 0.15s',
            display: 'inline-block',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
          }}>
            Empezar — es gratis
          </Link>
          <Link href="/login" style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
            Ya tengo cuenta →
          </Link>
        </div>

        {/* Índice — en lugar de cards */}
        <div style={{
          borderTop: '1px solid var(--border)',
          paddingTop: '3rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}>
          {[
            ['Proyectos y tareas', 'Crea proyectos, divide el trabajo en tareas y sigue su estado en tiempo real.'],
            ['Equipos con roles', 'Invita por link. Cada miembro tiene un rol: Admin, Editor o Viewer.'],
            ['IA contextual', 'Un asistente que conoce tu proyecto y te guía en cada tarea. Sin costo adicional.'],
          ].map(([title, desc], i) => (
            <div key={title} style={{
              display: 'grid',
              gridTemplateColumns: '2rem 1fr',
              gap: '0 1.25rem',
              padding: '1.5rem 0',
              borderBottom: '1px solid var(--border)',
              alignItems: 'start',
            }}>
              <span style={{
                fontFamily: 'DM Mono, monospace',
                fontSize: '0.65rem',
                color: 'var(--accent)',
                paddingTop: '0.2rem',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p style={{
                  fontFamily: 'Syne, sans-serif',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  color: 'var(--text)',
                  marginBottom: '0.375rem',
                }}>
                  {title}
                </p>
                <p style={{
                  fontFamily: 'Fenix, serif',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                  color: 'var(--text-muted)',
                }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: '640px',
        margin: '0 auto',
        padding: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '0.875rem', color: 'var(--text-dim)' }}>
          Strata.
        </span>
        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.65rem', color: 'var(--text-dim)', letterSpacing: '0.1em' }}>
          HECHO PARA EQUIPOS PEQUEÑOS
        </span>
      </footer>

      <GlobalAI />
    </div>
  )
}
