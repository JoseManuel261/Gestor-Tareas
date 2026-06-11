'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Project } from '@/lib/types'
import Link from 'next/link'
import { Plus, FolderKanban, Trash2, ArrowRight, Pencil } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import { formatDate } from '@/lib/utils'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditingProject(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  function openEdit(project: Project) {
    setEditingProject(project)
    setForm({ name: project.name, description: project.description || '' })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingProject(null)
    setForm({ name: '', description: '' })
  }

  async function saveProject(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      if (editingProject) {
        await supabase.from('projects').update({
          name: form.name.trim(),
          description: form.description.trim() || null
        }).eq('id', editingProject.id)
      } else {
        await supabase.from('projects').insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          owner_id: user.id
        })
      }
      closeModal()
      load()
    } finally {
      setSaving(false)
    }
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
          <p className="mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Workspace</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>Mis Proyectos</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
          <Plus size={15} /> Nuevo proyecto
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : !projects.length ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <FolderKanban size={24} style={{ color: 'var(--text-dim)' }} />
          </div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>Sin proyectos todavía</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Crea tu primer proyecto para empezar a organizar tareas.</p>
          <button onClick={openNew}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#000' }}>
            Crear mi primer proyecto
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, i) => (
            <div key={project.id}
              className={`rounded-xl p-5 flex flex-col justify-between transition-all duration-200 animate-fade-up stagger-${Math.min(i + 1, 5)}`}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', minHeight: 140 }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm leading-tight" style={{ color: 'var(--text)' }}>
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(project)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      title="Editar proyecto"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => deleteProject(project.id)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      title="Eliminar proyecto"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs line-clamp-2" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
                )}
              </div>
              <div className="flex items-center justify-between mt-4">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  {formatDate(project.created_at)}
                </span>
                <Link href={`/projects/${project.id}`}
                  className="flex items-center gap-1 text-xs font-medium transition-all"
                  style={{ color: 'var(--accent)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                  Ver tareas <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingProject ? 'Editar proyecto' : 'Nuevo proyecto'} onClose={closeModal}>
          <form onSubmit={saveProject} className="space-y-4">
            <FormField label="Nombre">
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Mi proyecto" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} autoFocus />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe el proyecto..." rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000' }}>
              {saving ? (editingProject ? 'Guardando...' : 'Creando...') : (editingProject ? 'Guardar cambios' : 'Crear proyecto')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
