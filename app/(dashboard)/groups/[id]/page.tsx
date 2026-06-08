'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Group, GroupMember, Project } from '@/lib/types'
import { Plus, ArrowLeft, UserPlus, Trash2, Crown, User, FolderKanban, ArrowRight } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import Link from 'next/link'
import { priorityLabel } from '@/lib/utils'

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
  const [inviteUsername, setInviteUsername] = useState('')
  const [projectForm, setProjectForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [inviteError, setInviteError] = useState('')

  async function load() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUser(user.id)

      const { data: g, error: groupError } = await supabase.from('groups').select('*').eq('id', id).single()
      if (groupError) {
        console.error('❌ Error loading group:', groupError)
      } else {
        console.log('✅ Group loaded:', g?.name)
      }
      setGroup(g)
      if (g && user) setIsOwner(g.owner_id === user.id)
    } catch (err) {
      console.error('❌ Error in load:', err)
    }

    const { data: m } = await supabase
      .from('group_members')
      .select('*, profile:profiles(*)')
      .eq('group_id', id)
    setMembers(m || [])

    const { data: p } = await supabase
      .from('projects')
      .select('*, tasks(count)')
      .eq('group_id', id)
      .order('created_at', { ascending: false })
    setProjects(p || [])
  }

  useEffect(() => { load() }, [id])

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setInviteError('')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', inviteUsername.trim())
      .single()

    if (!profile) {
      setInviteError('Usuario no encontrado')
      setSaving(false)
      return
    }

    const exists = members.find(m => m.user_id === profile.id)
    if (exists) {
      setInviteError('Este usuario ya es miembro del grupo')
      setSaving(false)
      return
    }

    await supabase.from('group_members').insert({ group_id: id, user_id: profile.id, role: 'member' })
    setInviteUsername('')
    setShowInviteModal(false)
    setSaving(false)
    load()
  }

  async function removeMember(memberId: string) {
    if (!confirm('¿Eliminar este miembro del grupo?')) return
    await supabase.from('group_members').delete().eq('id', memberId)
    load()
  }

  async function createGroupProject(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('No authenticated user')
        setSaving(false)
        return
      }
      const { error } = await supabase.from('projects').insert({ 
        name: projectForm.name.trim(),
        description: projectForm.description.trim() || null, 
        owner_id: user.id, 
        group_id: id 
      })
      if (error) throw error
      setProjectForm({ name: '', description: '' })
      setShowProjectModal(false)
      load()
    } catch (err) {
      console.error('Error creating group project:', err)
    } finally {
      setSaving(false)
    }
  }

  if (!group) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{borderColor: 'var(--accent)', borderTopColor: 'transparent'}} />
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
        <div>
          <p className="mono text-xs tracking-widest uppercase" style={{color: 'var(--text-muted)'}}>Grupo</p>
          <h1 className="text-2xl font-bold" style={{color: 'var(--text)'}}>{group.name}</h1>
          {group.description && <p className="text-sm" style={{color: 'var(--text-muted)'}}>{group.description}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Members */}
        <div className="rounded-xl p-5" style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{color: 'var(--text)'}}>
              Miembros <span className="mono text-xs ml-1" style={{color: 'var(--text-dim)'}}>{members.length}</span>
            </h2>
            {isOwner && (
              <button onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                style={{color: 'var(--accent)', border: '1px solid var(--accent)', background: 'var(--accent-dim)'}}>
                <UserPlus size={12} /> Invitar
              </button>
            )}
          </div>
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg"
                style={{background: 'var(--surface2)', border: '1px solid var(--border)'}}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                  style={{background: member.role === 'owner' ? 'var(--accent-dim)' : 'var(--border)'}}>
                  {member.role === 'owner'
                    ? <Crown size={12} style={{color: 'var(--accent)'}} />
                    : <User size={12} style={{color: 'var(--text-muted)'}} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{color: 'var(--text)'}}>
                    {member.profile?.username}
                  </p>
                  <p className="mono text-xs" style={{color: 'var(--text-dim)'}}>{member.role}</p>
                </div>
                {isOwner && member.user_id !== currentUser && (
                  <button onClick={() => removeMember(member.id)}
                    className="p-1 rounded transition-all"
                    style={{color: 'var(--text-dim)'}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div className="rounded-xl p-5" style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm" style={{color: 'var(--text)'}}>
              Proyectos <span className="mono text-xs ml-1" style={{color: 'var(--text-dim)'}}>{projects.length}</span>
            </h2>
            <button onClick={() => setShowProjectModal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{color: 'var(--accent)', border: '1px solid var(--accent)', background: 'var(--accent-dim)'}}>
              <Plus size={12} /> Proyecto
            </button>
          </div>
          {!projects.length ? (
            <p className="text-sm text-center py-6" style={{color: 'var(--text-dim)'}}>Sin proyectos en este grupo</p>
          ) : (
            <div className="space-y-2">
              {projects.map(project => (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{background: 'var(--surface2)', border: '1px solid var(--border)'}}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
                  <FolderKanban size={14} style={{color: 'var(--accent)'}} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{color: 'var(--text)'}}>{project.name}</p>
                    <p className="mono text-xs" style={{color: 'var(--text-dim)'}}>
                      {(project.tasks as any)?.[0]?.count || 0} tareas
                    </p>
                  </div>
                  <ArrowRight size={13} style={{color: 'var(--text-dim)'}} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {showInviteModal && (
        <Modal title="Invitar miembro" onClose={() => { setShowInviteModal(false); setInviteError('') }}>
          <form onSubmit={inviteMember} className="space-y-4">
            <FormField label="Nombre de usuario">
              <input type="text" value={inviteUsername}
                onChange={e => { setInviteUsername(e.target.value); setInviteError('') }}
                placeholder="username exacto del usuario" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} />
            </FormField>
            {inviteError && (
              <p className="text-xs" style={{color: 'var(--red)'}}>{inviteError}</p>
            )}
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000'}}>
              {saving ? 'Invitando...' : 'Invitar al grupo'}
            </button>
          </form>
        </Modal>
      )}

      {showProjectModal && (
        <Modal title="Nuevo proyecto grupal" onClose={() => setShowProjectModal(false)}>
          <form onSubmit={createGroupProject} className="space-y-4">
            <FormField label="Nombre">
              <input type="text" value={projectForm.name}
                onChange={e => setProjectForm(p => ({...p, name: e.target.value}))}
                placeholder="Nombre del proyecto" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={projectForm.description}
                onChange={e => setProjectForm(p => ({...p, description: e.target.value}))}
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
