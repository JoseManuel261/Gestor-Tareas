'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FolderKanban, Users, CheckSquare, Clock, ArrowRight } from 'lucide-react'
import { statusColor, statusLabel, priorityColor, priorityLabel } from '@/lib/utils'

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const uid = session.user.id

      const [
        { data: profile },
        { data: projects, count: projectCount },
        { data: groups, count: groupCount },
        { data: myTasks },
        { data: recentProjects },
        { count: completedCount }
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).single(),
        supabase.from('projects').select('*', { count: 'exact' }).eq('owner_id', uid),
        supabase.from('group_members').select('*', { count: 'exact' }).eq('user_id', uid),
        supabase.from('tasks').select('*, project:projects(id, name)').eq('assigned_to', uid).neq('status', 'COMPLETED').limit(5),
        supabase.from('projects').select('*').eq('owner_id', uid).order('created_at', { ascending: false }).limit(3),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('assigned_to', uid).eq('status', 'COMPLETED'),
      ])

      setData({ profile, projectCount, groupCount, myTasks, recentProjects, completedCount })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}/>
    </div>
  )

  const { profile, projectCount, groupCount, myTasks, recentProjects, completedCount } = data

  const stats = [
    { label: 'Proyectos', value: projectCount || 0, icon: FolderKanban, href: '/projects' },
    { label: 'Grupos', value: groupCount || 0, icon: Users, href: '/groups' },
    { label: 'Tareas activas', value: myTasks?.length || 0, icon: Clock, href: '/projects' },
    { label: 'Completadas', value: completedCount || 0, icon: CheckSquare, href: '/projects' },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="space-y-10 animate-fade-up">

      {/* Hero */}
      <div className="animate-fade-up">
        <div className="section-line"/>
        <p className="mono text-xs tracking-widest uppercase mb-3" style={{ color: 'var(--text-muted)' }}>
          {greeting}
        </p>
        <h1 className="font-display text-4xl md:text-5xl leading-none" style={{ color: 'var(--text)' }}>
          {profile?.full_name || profile?.username || 'Usuario'}
          <span style={{ color: 'var(--accent)' }}>.</span>
        </h1>
        <p className="text-sm md:text-base mt-4 max-w-xl" style={{ color: 'var(--text-muted)' }}>
          Gestiona tus proyectos, equipos y tareas desde un único lugar.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <Link key={stat.label} href={stat.href}
            className={`glass p-5 rounded-xl transition-all duration-200 animate-fade-up stagger-${i + 1}`}
            style={{ borderColor: 'var(--border)' }}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--accent)'
              el.style.transform = 'translateY(-2px)'
              el.style.background = 'var(--surface2)'
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLElement
              el.style.borderColor = 'var(--border)'
              el.style.transform = 'translateY(0)'
              el.style.background = ''
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon size={18} style={{ color: 'var(--text-muted)' }}/>
              <span className="text-3xl font-bold" style={{ color: 'var(--text)' }}>
                {stat.value}
              </span>
            </div>
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {stat.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Tasks */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Mis tareas pendientes</h2>
            <Link href="/projects" className="text-xs flex items-center gap-1 transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              Ver todo <ArrowRight size={11}/>
            </Link>
          </div>

          {!myTasks?.length ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>
              Sin tareas pendientes 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {myTasks.map((task: any) => (
                <Link key={task.id}
                  href={`/projects/${task.project?.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {task.title}
                    </p>
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                      {task.project?.name}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`mono text-xs px-2 py-0.5 rounded ${priorityColor[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                    <span className={`mono text-xs px-2 py-0.5 rounded ${statusColor[task.status]}`}>
                      {statusLabel[task.status]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects */}
        <div className="glass rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Proyectos recientes</h2>
            <Link href="/projects" className="text-xs flex items-center gap-1 transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              Ver todo <ArrowRight size={11}/>
            </Link>
          </div>

          {!recentProjects?.length ? (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: 'var(--text-dim)' }}>No tienes proyectos aún</p>
              <Link href="/projects"
                className="text-xs px-4 py-2 rounded-lg font-medium transition-all"
                style={{ background: 'var(--accent)', color: '#000' }}>
                Crear proyecto
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProjects.map((project: any) => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--accent-dim)' }}>
                    <FolderKanban size={14} style={{ color: 'var(--accent)' }}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {project.name}
                    </p>
                  </div>
                  <ArrowRight size={13} style={{ color: 'var(--text-dim)' }}/>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
