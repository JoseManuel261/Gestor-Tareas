'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Plus, FolderKanban, Trash2, ArrowRight } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('*, tasks(count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('projects').insert({ ...form, owner_id: user.id })
    setForm({ name: '', description: '' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  async function deleteProject(id: string) {
    if (!confirm('¿Eliminar este proyecto y todas sus tareas?')) return
    await supabase.from('projects').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-xs tracking-widest uppercase" style={{color: 'var(--text-muted)'}}>Workspace</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{color: 'var(--text)'}}>Mis Proyectos</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{background: 'var(--accent)', color: '#000'}}>
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{background: 'var(--surface)'}} />
          ))}
        </div>
      ) : !projects.length ? (
        <div className="text-center py-20">
          <FolderKanban size={32} className="mx-auto mb-3" style={{color: 'var(--text-dim)'}} />
          <p className="text-sm mb-4" style={{color: 'var(--text-muted)'}}>No tienes proyectos aún</p>
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{background: 'var(--accent)', color: '#000'}}>
            Crear mi primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <div key={project.id}
              className={`rounded-xl p-5 flex flex-col justify-between transition-all animate-fade-up stagger-${Math.min(i+1,5)}`}
              style={{background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 140}}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight" style={{color: 'var(--text)'}}>{project.name}</h3>
                  <button onClick={() => deleteProject(project.id)}
                    className="p-1 rounded shrink-0 transition-all"
                    style={{color: 'var(--text-dim)'}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                    <Trash2 size={13} />
                  </button>
                </div>
                {project.description && (
                  <p className="text-xs line-clamp-2" style={{color: 'var(--text-muted)'}}>{project.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="mono text-xs" style={{color: 'var(--text-dim)'}}>
                  {(project.tasks as any)?.[0]?.count || 0} tareas
                </span>
                <Link href={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-xs font-medium transition-all"
                  style={{color: 'var(--accent)'}}>
                  Ver tareas <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nuevo proyecto" onClose={() => setShowModal(false)}>
          <form onSubmit={createProject} className="space-y-4">
            <FormField label="Nombre">
              <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                placeholder="Mi proyecto" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Describe el proyecto..." rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000'}}>
              {saving ? 'Creando...' : 'Crear proyecto'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
