'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Project, Task, Profile, Comment } from '@/lib/types'
import { statusColor, statusLabel, priorityColor, priorityLabel, formatDate, formatDueDate, dueDateColor } from '@/lib/utils'
import { Plus, Trash2, ArrowLeft, User, MessageSquare, Send, Calendar } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import AIAssistant from '@/components/AIAssistant'
import ConfirmModal from '@/components/ConfirmModal'

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
  const [filterAssignee, setFilterAssignee] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [form, setForm] = useState({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', due_date: '' })
  const [saving, setSaving] = useState(false)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [comments, setComments] = useState<Comment[]>([])
  const [commentBody, setCommentBody] = useState('')
  const [postingComment, setPostingComment] = useState(false)
  const [confirmDeleteTask, setConfirmDeleteTask] = useState<string | null>(null)

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
    if (filterAssignee) query = query.eq('assigned_to', filterAssignee)
    const { data: t } = await query.order('created_at', { ascending: false })
    setTasks(t || [])
  }

  useEffect(() => { load() }, [id, filterStatus, filterAssignee])

  async function saveTask(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        priority: form.priority,
        assigned_to: form.assigned_to || null,
        due_date: form.due_date ? new Date(form.due_date).toISOString() : null,
        updated_at: new Date().toISOString(),
      }
      if (editingTaskId) {
        await supabase.from('tasks').update(payload).eq('id', editingTaskId)
      } else {
        await supabase.from('tasks').insert({ ...payload, project_id: id })
      }
      closeModal()
      load()
    } finally {
      setSaving(false)
    }
  }

  function openEditTask(task: Task) {
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assigned_to: task.assigned_to || '',
      due_date: task.due_date ? task.due_date.slice(0, 10) : '',
    })
    setEditingTaskId(task.id)
    setEditingTask(task)
    setShowModal(true)
    loadComments(task.id)
  }

  function closeModal() {
    setShowModal(false)
    setEditingTaskId(null)
    setEditingTask(null)
    setForm({ title: '', description: '', priority: 'MEDIUM', assigned_to: '', due_date: '' })
    setComments([])
    setCommentBody('')
  }

  async function loadComments(taskId: string) {
    setComments([])
    const { data } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*)')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })
    setComments((data as Comment[]) || [])
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim() || !editingTaskId) return
    setPostingComment(true)
    await supabase.from('comments').insert({
      task_id: editingTaskId,
      author_id: currentUser,
      body: commentBody.trim()
    })
    setCommentBody('')
    loadComments(editingTaskId)
    setPostingComment(false)
  }

  async function updateStatus(taskId: string, status: string) {
    await supabase.from('tasks').update({ status, updated_at: new Date().toISOString() }).eq('id', taskId)
    load()
  }

  async function deleteTask(taskId: string) {
    await supabase.from('tasks').delete().eq('id', taskId)
    setConfirmDeleteTask(null)
    load()
  }

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')
  const hasFilters = filterStatus || filterAssignee

  if (!project) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}/>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
          <ArrowLeft size={16}/>
        </button>
        <div className="flex-1">
          <p className="mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Proyecto</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{project.name}</h1>
          {project.description && <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{project.description}</p>}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
          <Plus size={14}/> Nueva tarea
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3">
        {/* Filtro por estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Estado:</span>
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
        </div>

        {/* Filtro por asignado — solo si hay miembros */}
        {members.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs w-16 shrink-0" style={{ color: 'var(--text-muted)' }}>Asignado:</span>
            <button onClick={() => setFilterAssignee('')}
              className="mono text-xs px-3 py-1 rounded-full transition-all"
              style={{
                background: !filterAssignee ? 'var(--accent)' : 'var(--surface)',
                color: !filterAssignee ? '#000' : 'var(--text-muted)',
                border: '1px solid ' + (!filterAssignee ? 'var(--accent)' : 'var(--border)')
              }}>
              Todos
            </button>
            {members.map(m => (
              <button key={m.id} onClick={() => setFilterAssignee(m.id)}
                className="mono text-xs px-3 py-1 rounded-full transition-all flex items-center gap-1"
                style={{
                  background: filterAssignee === m.id ? 'var(--accent)' : 'var(--surface)',
                  color: filterAssignee === m.id ? '#000' : 'var(--text-muted)',
                  border: '1px solid ' + (filterAssignee === m.id ? 'var(--accent)' : 'var(--border)')
                }}>
                <User size={10}/> {m.username}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          {hasFilters && (
            <button onClick={() => { setFilterStatus(''); setFilterAssignee('') }}
              className="mono text-xs transition-all"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
              × Limpiar filtros
            </button>
          )}
          <span className="mono text-xs ml-auto" style={{ color: 'var(--text-dim)' }}>
            {tasks.length} tarea(s)
          </span>
        </div>
      </div>

      {/* Tasks */}
      {!tasks.length ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
            {hasFilters ? 'No hay tareas con estos filtros' : 'No hay tareas aún'}
          </p>
          {hasFilters && (
            <button onClick={() => { setFilterStatus(''); setFilterAssignee('') }}
              className="mt-3 text-xs transition-all"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}>
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task, i) => {
            const due = formatDueDate(task.due_date)
            return (
              <div key={task.id}
                className={`p-4 rounded-xl flex items-start gap-4 transition-all animate-fade-up stagger-${Math.min(i+1,5)}`}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderLeft: '3px solid ' + (task.status === 'COMPLETED' ? 'var(--accent)' : task.status === 'IN_PROGRESS' ? 'var(--blue)' : due?.status === 'overdue' ? 'var(--red)' : 'var(--border2)')
                }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3
                      className={`text-sm font-medium cursor-pointer transition-all hover:opacity-80 ${task.status === 'COMPLETED' ? 'line-through' : ''}`}
                      onClick={() => openEditTask(task)}
                      style={{ color: task.status === 'COMPLETED' ? 'var(--text-dim)' : 'var(--text)' }}>
                      {task.title}
                    </h3>
                    <span className={`mono text-xs px-2 py-0.5 rounded ${priorityColor[task.priority]}`}>
                      {priorityLabel[task.priority]}
                    </span>
                    {due && task.status !== 'COMPLETED' && (
                      <span className={`mono text-xs px-2 py-0.5 rounded flex items-center gap-1 ${dueDateColor[due.status]}`}>
                        <Calendar size={10}/>
                        {due.status === 'overdue' ? `Vencida · ${due.label}` : due.label}
                      </span>
                    )}
                  </div>
                  {task.description && (
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{task.description}</p>
                  )}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{formatDate(task.created_at)}</span>
                    {task.assignee && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <User size={11}/> {(task.assignee as any).username}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={task.status}
                    onChange={e => updateStatus(task.id, e.target.value)}
                    className={`mono text-xs px-2 py-1 rounded-lg outline-none ${statusColor[task.status]}`}
                    style={{ background: 'transparent', border: '1px solid currentColor', cursor: 'pointer' }}>
                    {STATUSES.map(s => <option key={s} value={s} style={{ background: 'var(--surface)', color: 'var(--text)' }}>{statusLabel[s]}</option>)}
                  </select>
                  <button onClick={() => setConfirmDeleteTask(task.id)}
                    className="p-1.5 rounded transition-all"
                    style={{ color: 'var(--text-dim)' }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {confirmDeleteTask && (
        <ConfirmModal
          message="¿Eliminar esta tarea? Esta acción no se puede deshacer."
          confirmLabel="Eliminar tarea"
          onConfirm={() => deleteTask(confirmDeleteTask)}
          onCancel={() => setConfirmDeleteTask(null)}
        />
      )}

      {showModal && (
        <Modal title={editingTaskId ? 'Editar tarea' : 'Nueva tarea'} onClose={closeModal}>
          <form onSubmit={saveTask} className="space-y-4">
            <FormField label="Título">
              <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                placeholder="Título de la tarea" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} autoFocus/>
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe la tarea..." rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any}/>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Prioridad">
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{priorityLabel[p]}</option>)}
                </select>
              </FormField>
              <FormField label="Fecha límite">
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }}
                  onFocus={focusAccent} onBlur={blurBorder}/>
              </FormField>
            </div>
            {members.length > 0 && (
              <FormField label="Asignar a">
                <select value={form.assigned_to} onChange={e => setForm(p => ({ ...p, assigned_to: e.target.value }))}
                  className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder}>
                  <option value="">Sin asignar</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </FormField>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000' }}>
              {saving ? (editingTaskId ? 'Guardando...' : 'Creando...') : (editingTaskId ? 'Guardar cambios' : 'Crear tarea')}
            </button>
          </form>

          {editingTaskId && (
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare size={13} style={{ color: 'var(--text-muted)' }}/>
                <span className="text-xs uppercase tracking-wider font-medium" style={{ color: 'var(--text-muted)' }}>
                  Bitácora ({comments.length})
                </span>
              </div>
              <div className="space-y-3 max-h-44 overflow-y-auto mb-3">
                {!comments.length ? (
                  <p className="text-xs py-3 text-center" style={{ color: 'var(--text-dim)' }}>Sin comentarios todavía</p>
                ) : comments.map(c => (
                  <div key={c.id}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                        @{(c.author as any)?.username || 'usuario'}
                      </span>
                      <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{formatDate(c.created_at)}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>{c.body}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={addComment} className="flex items-center gap-2">
                <input type="text" value={commentBody} onChange={e => setCommentBody(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className={inputCls} style={inputStyle} onFocus={focusAccent} onBlur={blurBorder}/>
                <button type="submit" disabled={postingComment || !commentBody.trim()}
                  className="p-2.5 rounded-lg shrink-0 transition-all"
                  style={{ background: commentBody.trim() ? 'var(--accent)' : 'var(--border2)', color: commentBody.trim() ? '#000' : 'var(--text-muted)' }}>
                  <Send size={14}/>
                </button>
              </form>
            </div>
          )}

          {editingTaskId && editingTask && project && (
            <AIAssistant project={project} currentTask={editingTask} completedTasks={completedTasks}/>
          )}
        </Modal>
      )}
    </div>
  )
}
