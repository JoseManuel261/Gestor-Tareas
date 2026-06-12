'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Group, GroupMember, Project } from '@/lib/types'
import { Plus, ArrowLeft, UserPlus, Trash2, Crown, Shield, User, FolderKanban, ArrowRight, Link2, Copy, Check, LogOut } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import Link from 'next/link'
import ConfirmModal from '@/components/ConfirmModal'

export default function GroupDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [currentUser, setCurrentUser] = useState<string>('')
  const [isOwner, setIsOwner] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showConfirm, setShowConfirm] = useState<{ action: () => void; message: string } | null>(null)
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [copied, setCopied] = useState(false)
  const [confirmState, setConfirmState] = useState<{ message: string; action: () => void } | null>(null)

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) setCurrentUser(user.id)

    const { data: g } = await supabase.from('groups').select('*').eq('id', id).single()
    setGroup(g)
    if (g && user) setIsOwner(g.owner_id === user.id)

    const { data: m } = await supabase
      .from('group_members')
      .select('*, profile:profiles(*)')
      .eq('group_id', id)
    setMembers(m || [])

    const { data: p } = await supabase
      .from('projects')
      .select('*, tasks(status)')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
    setProjects(p || [])
  }

  useEffect(() => { load() }, [id])

  async function openInviteModal() {
    setShowInviteModal(true)
    setInviteLink('')
    setLinkError('')
    setCopied(false)
    setLinkLoading(true)

    const { data: existing } = await supabase
      .from('invitations')
      .select('token')
      .eq('group_id', id)
      .is('revoked_at', null)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      .limit(1)
      .maybeSingle()

    let token = (existing as any)?.token as string | undefined

    if (!token) {
      const { data, error } = await supabase
        .from('invitations')
        .insert({ group_id: id, invited_by: currentUser })
        .select('token')
        .single()
      if (error) {
        setLinkError('No se pudo generar el enlace.')
        setLinkLoading(false)
        return
      }
      token = (data as any).token
    }

    setInviteLink(`${window.location.origin}/invite/${token}`)
    setLinkLoading(false)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setLinkError('No se pudo copiar. Copia el enlace manualmente.')
    }
  }

  function confirm(message: string, action: () => void) {
    setConfirmState({ message, action })
  }

  async function removeMember(memberId: string, username: string) {
    confirm(`¿Eliminar a @${username} del grupo?`, async () => {
      await supabase.from('group_members').delete().eq('id', memberId)
      setShowConfirm(null)
      load()
    })
  }

  async function leaveGroup() {
    confirm('¿Salir de este grupo? No podrás volver a menos que te inviten de nuevo.', async () => {
      const myMembership = members.find(m => m.user_id === currentUser)
      if (myMembership) {
        await supabase.from('group_members').delete().eq('id', myMembership.id)
      }
      setShowConfirm(null)
      router.replace('/groups')
    })
  }

  async function changeRole(memberId: string, role: string) {
    await supabase.from('group_members').update({ role }).eq('id', memberId)
    load()
  }

  async function createGroupProject(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('projects').insert({
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null,
        owner_id: user.id,
        group_id: id
      })
      setProjectForm({ name: '', description: '' })
      setShowProjectModal(false)
      load()
    } finally {
      setSaving(false)
    }
  }

  if (!group) return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <div className="w-9 h-9 rounded-lg animate-pulse" style={{ background: 'var(--surface2)' }} />
        <div className="space-y-2">
          <div className="h-3 w-16 rounded animate-pulse" style={{ background: 'var(--surface2)' }} />
          <div className="h-7 w-48 rounded animate-pulse" style={{ background: 'var(--surface2)' }} />
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  )

  const isAdmin = isOwner || members.some(m => m.user_id === currentUser && m.role === 'admin')
  const isMember = !isOwner && members.some(m => m.user_id === currentUser)

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()}
          className="p-2 rounded-lg transition-all"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <p className="mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Grupo</p>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{group.name}</h1>
          {group.description && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{group.description}</p>}
        </div>
        {/* Botón salir del grupo — solo para miembros no dueños */}
        {isMember && (
          <button onClick={leaveGroup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--red)'
                ; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,68,68,0.3)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                ; (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
            }}>
            <LogOut size={12} /> Salir del grupo
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Miembros <span className="mono text-xs ml-1" style={{ color: 'var(--text-dim)' }}>{members.length}</span>
            </h2>
            {isAdmin && (
              <button onClick={openInviteModal}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--accent)', border: '1px solid var(--accent)', background: 'var(--accent-dim)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,240,74,0.15)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'}>
                <UserPlus size={12} /> Invitar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {members.map(member => {
              const canRemove = member.user_id !== currentUser && member.role !== 'owner' &&
                (isOwner || (isAdmin && member.role === 'member'))
              const canChangeRole = isOwner && member.role !== 'owner' && member.user_id !== currentUser
              return (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <div className="relative shrink-0">
                    {member.profile?.avatar_url ? (
                      <img src={member.profile.avatar_url} alt={member.profile.username}
                        className="w-7 h-7 rounded-full object-cover"
                        style={{ border: '1px solid var(--border2)' }} />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.55rem' }}>
                        {(member.profile?.username || 'U').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    {member.role !== 'member' && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                        {member.role === 'owner'
                          ? <Crown size={7} style={{ color: 'var(--accent)' }} />
                          : <Shield size={7} style={{ color: 'var(--accent)' }} />
                        }
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {member.profile?.username}
                    </p>
                    {canChangeRole ? (
                      <select value={member.role}
                        onChange={e => changeRole(member.id, e.target.value)}
                        className="mono text-xs outline-none cursor-pointer mt-0.5"
                        style={{ background: 'transparent', color: 'var(--text-dim)', border: 'none' }}>
                        <option value="member" style={{ background: 'var(--surface)', color: 'var(--text)' }}>member</option>
                        <option value="admin" style={{ background: 'var(--surface)', color: 'var(--text)' }}>admin</option>
                      </select>
                    ) : (
                      <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{member.role}</p>
                    )}
                  </div>
                  {canRemove && (
                    <button onClick={() => removeMember(member.id, member.profile?.username)}
                      className="p-1 rounded transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Projects */}
        <div className="rounded-xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Proyectos <span className="mono text-xs ml-1" style={{ color: 'var(--text-dim)' }}>{projects.length}</span>
            </h2>
            {isAdmin && (
              <button onClick={() => setShowProjectModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'var(--accent)', border: '1px solid var(--accent)', background: 'var(--accent-dim)' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(200,240,74,0.15)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-dim)'}>
                <Plus size={12} /> Proyecto
              </button>
            )}
          </div>
          {!projects.length ? (
            <div className="text-center py-8">
              <FolderKanban size={24} className="mx-auto mb-2" style={{ color: 'var(--text-dim)' }} />
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Sin proyectos en este grupo</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <FolderKanban size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{project.name}</p>
                    {(() => {
                      const tasks = (project as any).tasks || []
                      const total = tasks.length
                      const done = tasks.filter((t: any) => t.status === 'COMPLETED').length
                      const pct = total > 0 ? Math.round((done / total) * 100) : null
                      return total > 0 ? (
                        <div className="mt-1">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--border2)' }}>
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: pct === 100 ? 'var(--accent)' : 'var(--blue)' }} />
                          </div>
                          <p className="mono text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{done}/{total} · {pct}%</p>
                        </div>
                      ) : (
                        <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>Sin tareas</p>
                      )
                    })()}
                  </div>
                  <ArrowRight size={13} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {confirmState && (
        <Modal title="Confirmar acción" onClose={() => setConfirmState(null)}>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            {confirmState.message}
          </p>

          <div className="flex gap-3">
            {/* Botón Cancelar */}
            <button
              onClick={() => setConfirmState(null)}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
            >
              Cancelar
            </button>

            {/* Botón Confirmar */}
            <button
              onClick={() => {
                confirmState.action();
                setConfirmState(null); // Cerrar después de ejecutar
              }}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--red)', border: '1px solid rgba(255,68,68,0.3)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.25)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,68,68,0.15)'}
            >
              Confirmar
            </button>
          </div>
        </Modal>
      )}

      {showInviteModal && (
        <Modal title="Invitar al grupo" onClose={() => setShowInviteModal(false)}>
          <div className="space-y-4">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Comparte este enlace. Cualquiera con una cuenta podrá unirse al grupo.
            </p>
            {linkLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : linkError ? (
              <p className="text-sm px-4 py-3 rounded-lg border"
                style={{ color: 'var(--red)', borderColor: 'rgba(255,68,68,0.2)', background: 'rgba(255,68,68,0.05)' }}>
                {linkError}
              </p>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2 rounded-lg"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <Link2 size={14} className="shrink-0 ml-1" style={{ color: 'var(--text-dim)' }} />
                  <input readOnly value={inviteLink}
                    className="flex-1 bg-transparent text-xs outline-none min-w-0"
                    style={{ color: 'var(--text)' }}
                    onFocus={e => e.currentTarget.select()} />
                  <button onClick={copyLink}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold shrink-0 transition-all"
                    style={{ background: copied ? 'var(--accent-dim)' : 'var(--accent)', color: copied ? 'var(--accent)' : '#000' }}>
                    {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>
                <p className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                  Reutilizable · caduca en 7 días
                </p>
              </>
            )}
          </div>
        </Modal>
      )}

      {showProjectModal && (
        <Modal title="Nuevo proyecto grupal" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={createGroupProject} className="space-y-4">
            <FormField label="Nombre">
              <input type="text" value={projectForm.name}
                onChange={e => setProjectForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del proyecto" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} autoFocus />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={projectForm.description}
                onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))}
                placeholder="Describe el proyecto..." rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000' }}>
              {saving ? 'Creando...' : 'Crear proyecto'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
