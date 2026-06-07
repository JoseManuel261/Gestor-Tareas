'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Project, Task, Profile } from '@/lib/types'
import { statusColor, statusLabel, priorityColor, priorityLabel, formatDate } from '@/lib/utils'
import { Plus, Trash2, ArrowLeft, User } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<Profile[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigned_to: '' })
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUser(user.id)

    const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
    setProject(proj)

    if (proj?.group_id) {
      const { data: gm } = await supabase
        .from('group_members')
        .select('profile:profiles(*)')
        .eq('group_id', proj.group_id)
      setMembers((gm?.map((m: any) => m.profile) || []) as Profile[])
    }

    let query = supabase.from('tasks').select('*, assignee:profiles!tasks_assigned_to_fkey(*)').eq('project_id', id)
    if (filterStatus) query = query.eq('status', filterStatus)
    const { data: t } = await query.order('created_at', { ascending: false })
    setTasks(t || [])
  }

  useEffect(() => { load() }, [id, filterStatus])

  async function createTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('tasks').insert({
      title: form.title,
      description: form.description || null,
      priority: form.priority,
      project_id: id,
      assigned_to: form.assigned_to || null
    })
    setForm({ title: '', description: '', priority: 'MEDIUM', assigned_to: '' })
    setShowModal(false)
    setSaving(false)
    load()
  }

  async function updateStatus(taskId: string, status: string) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
    load()
  }

  async function deleteTask(taskId: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tasks').delete().eq('id', taskId)
    load()
  }

  if (!project) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{borderColor: 'var(--accent)', borderTopColor: 'transparent'}} />
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg transition-all"
          style={{color: 'var(--text-muted)', border: '1px solid var(--border)'}}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="mono text-xs tracking-widest uppercase" style={{color: 'var(--text-muted)'}}>Proyecto</p>
          <h1 className="text-2xl font-bold" style={{color: 'var(--text)'}}>{project.name}</h1>
          {project.description && <p className="text-sm mt-0.5" style={{color: 'var(--text-muted)'}}>{project.description}</p>}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{background: 'var(--accent)', color: '#000'}}>
          <Plus size={14} /> Nueva tarea
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs" style={{color: 'var(--text-muted)'}}>Filtrar:</span>
        {['', ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className="mono text-xs px-3 py-1 rounded-full transition-all"
            style={{
              background: filterStatus === s ? 'var(--accent)' : 'var(--surface)',
              color: filterStatus === s ? '#000' : 'var(--text-muted)',
              border: '1px solid ' + (filterStatus === s ? 'var(--accent)' : 'var(--border)')
            }}>
            {s ? statusLabel[s] : 'Todos'}
          </button>
        ))}
        <span className="mono text-xs ml-auto" style={{color: 'var(--text-dim)'}}>
          {tasks.length} tarea(s)
        </span>
      </div>

      {/* Tasks */}
      {!tasks.length ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{color: 'var(--text-dim)'}}>
            {filterStatus ? 'No hay tareas con este estado' : 'No hay tareas aún'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => (
            <div key={task.id}
              className={`p-4 rounded-xl flex items-start gap-4 transition-all animate-fade-up stagger-${Math.min(i+1,5)}`}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderLeft: '3px solid ' + (task.status === 'COMPLETED' ? 'var(--accent)' : task.status === 'IN_PROGRESS' ? 'var(--blue)' : 'var(--border2)')
              }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className={`text-sm font-medium ${task.status === 'COMPLETED' ? 'line-through' : ''}`}
                    style={{color: task.status === 'COMPLETED' ? 'var(--text-dim)' : 'var(--text)'}}>
                    {task.title}
                  </h3>
                  <span className={`mono text-xs px-2 py-0.5 rounded ${priorityColor[task.priority]}`}>
                    {priorityLabel[task.priority]}
                  </span>
                </div>
                {task.description && (
                  <p className="text-xs mb-2 line-clamp-2" style={{color: 'var(--text-muted)'}}>{task.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="mono text-xs" style={{color: 'var(--text-dim)'}}>{formatDate(task.created_at)}</span>
                  {task.assignee && (
                    <span className="flex items-center gap-1 text-xs" style={{color: 'var(--text-muted)'}}>
                      <User size={11} /> {(task.assignee as any).username}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select value={task.status}
                  onChange={e => updateStatus(task.id, e.target.value)}
                  className={`mono text-xs px-2 py-1 rounded-lg outline-none ${statusColor[task.status]}`}
                  style={{background: 'transparent', border: '1px solid currentColor', cursor: 'pointer'}}>
                  {STATUSES.map(s => <option key={s} value={s} style={{background: 'var(--surface)', color: 'var(--text)'}}>{statusLabel[s]}</option>)}
                </select>
                <button onClick={() => deleteTask(task.id)}
                  className="p-1.5 rounded transition-all"
                  style={{color: 'var(--text-dim)'}}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title="Nueva tarea" onClose={() => setShowModal(false)}>
          <form onSubmit={createTask} className="space-y-4">
            <FormField label="Título">
              <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                placeholder="Título de la tarea" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="Describe la tarea..." rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <FormField label="Prioridad">
              <select value={form.priority} onChange={e => setForm(p => ({...p, priority: e.target.value}))}
                className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder}>
                {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
              </select>
            </FormField>
            {members.length > 0 && (
              <FormField label="Asignar a">
                <select value={form.assigned_to} onChange={e => setForm(p => ({...p, assigned_to: e.target.value}))}
                  className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder}>
                  <option value="">Sin asignar</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </FormField>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000'}}>
              {saving ? 'Creando...' : 'Crear tarea'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
