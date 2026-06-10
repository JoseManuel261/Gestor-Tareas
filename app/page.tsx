import Link from 'next/link'
import { FolderKanban, Users, CheckSquare, ShieldCheck, Zap, ArrowRight } from 'lucide-react'
import GlobalAI from '@/components/GlobalAI'

const features = [
  {
    icon: FolderKanban,
    title: 'Proyectos organizados',
    desc: 'Agrupa tareas por proyecto y mantén todo tu trabajo en un único espacio claro.',
  },
  {
    icon: Users,
    title: 'Equipos colaborativos',
    desc: 'Invita a tu equipo, asigna tareas y trabaja en conjunto en tiempo real.',
  },
  {
    icon: CheckSquare,
    title: 'Flujos de trabajo',
    desc: 'Sigue cada tarea de pendiente a completada con estados y prioridades.',
  },
  {
    icon: ShieldCheck,
    title: 'Seguro por diseño',
    desc: 'Cada equipo ve solo lo suyo. Acceso protegido en el servidor de extremo a extremo.',
  },
]

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-6 justify-between"
        style={{ background: 'rgba(10,10,10,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
        <span className="font-display text-xl leading-none" style={{ color: 'var(--text)' }}>
          Taskflow.
        </span>
        <div className="flex items-center gap-2">
          <Link href="/login"
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid transparent' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
            }}>
            Iniciar sesión
          </Link>
          <Link href="/register"
            className="px-4 py-1.5 rounded-md text-xs font-semibold transition-all"
            style={{ background: 'var(--accent)', color: '#000' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="pt-14">
        <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
          <span className="mono text-xs tracking-widest uppercase animate-fade-up inline-flex items-center gap-2"
            style={{ color: 'var(--accent)' }}>
            <Zap size={12} /> Gestión de tareas para equipos
          </span>

          <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mt-6 animate-fade-up stagger-1"
            style={{ color: 'var(--text)' }}>
            Organiza el trabajo<br />de tu equipo
            <span style={{ color: 'var(--accent)' }}>.</span>
          </h1>

          <p className="text-base md:text-lg mt-6 max-w-xl mx-auto animate-fade-up stagger-2"
            style={{ color: 'var(--text-muted)' }}>
            TaskFlow reúne proyectos, equipos y tareas en un único lugar.
            Colabora, asigna y avanza sin perder de vista nada.
          </p>

          <div className="flex items-center justify-center gap-3 mt-9 animate-fade-up stagger-3">
            <Link href="/register"
              className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'var(--accent)', color: '#000' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}>
              Comenzar gratis <ArrowRight size={15} />
            </Link>
            <Link href="/login"
              className="px-6 py-3 rounded-lg text-sm font-medium transition-all"
              style={{ color: 'var(--text)', border: '1px solid var(--border)' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--accent)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
              }}>
              Ya tengo cuenta
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-5xl mx-auto px-6 pb-28">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={f.title}
                className={`glass rounded-xl p-6 animate-fade-up stagger-${Math.min(i + 1, 5)} transition-all duration-200`}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{ background: 'var(--accent-dim)' }}>
                  <f.icon size={16} style={{ color: 'var(--accent)' }} />
                </div>
                <h3 className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-8" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <span className="font-display text-sm" style={{ color: 'var(--text-muted)' }}>Taskflow.</span>
          <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
            Hecho para equipos pequeños
          </span>
        </div>
      </footer>

      {/* IA global también en la landing */}
      <GlobalAI />
    </div>
  )
}
