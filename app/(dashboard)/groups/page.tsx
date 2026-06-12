'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Trash2, Pencil } from 'lucide-react'
import ConfirmModal from '@/components/ConfirmModal'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import { formatDate } from '@/lib/utils'

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<any | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [userId, setUserId] = useState<string>('')
  const supabase = createClient()

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data: owned } = await supabase
      .from('groups')
      .select('*, group_members(count)')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group:groups(*, group_members(count))')
      .eq('user_id', user.id)
      .neq('role', 'owner')

    const memberGroups = memberships?.map((m: any) => m.group).filter(Boolean) || []
    const allGroups = [...(owned || []), ...memberGroups]
    const unique = allGroups.filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i)
    setGroups(unique)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditingGroup(null)
    setForm({ name: '', description: '' })
    setShowModal(true)
  }

  function openEdit(group: any) {
    setEditingGroup(group)
    setForm({ name: group.name, description: group.description || '' })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingGroup(null)
    setForm({ name: '', description: '' })
  }

  async function saveGroup(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingGroup) {
        await supabase.from('groups').update({
          name: form.name.trim(),
          description: form.description.trim() || null
        }).eq('id', editingGroup.id)
      } else {
        const { data: group } = await supabase
          .from('groups')
          .insert({
            name: form.name.trim(),
            description: form.description.trim() || null,
            owner_id: user.id
          })
          .select()
          .single()

        if (group) {
          await supabase.from('group_members').insert({
            group_id: group.id,
            user_id: user.id,
            role: 'owner'
          })
        }
      }

      closeModal()
      load()
    } finally {
      setSaving(false)
    }
  }

  async function deleteGroup(id: string) {
    await supabase.from('groups').delete().eq('id', id)
    setConfirmDelete(null)
    load()
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-xs tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Equipos</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{ color: 'var(--text)' }}>Mis Grupos</h1>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          style={{ background: 'var(--accent)', color: '#000' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent-hover)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--accent)'}>
          <Plus size={15} /> Nuevo grupo
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{ background: 'var(--surface)' }} />
          ))}
        </div>
      ) : !groups.length ? (
        <div className="text-center py-24">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Users size={24} style={{ color: 'var(--text-dim)' }} />
          </div>
          <p className="text-base font-medium mb-1" style={{ color: 'var(--text)' }}>Sin grupos todavía</p>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Crea un grupo e invita a tu equipo por link.
          </p>
          <button onClick={openNew}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{ background: 'var(--accent)', color: '#000' }}>
            Crear un grupo
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group, i) => (
            <div key={group.id}
              className={`rounded-xl p-5 transition-all duration-200 animate-fade-up stagger-${Math.min(i + 1, 5)}`}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--accent-dim)' }}>
                    <Users size={14} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{group.name}</h3>
                    <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>
                      {group.group_members?.[0]?.count || 0} miembro(s)
                    </span>
                  </div>
                </div>
                {group.owner_id === userId && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(group)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      title="Editar grupo"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--accent)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                      <Pencil size={12} />
                    </button>
                    <button onClick={() => setConfirmDelete(group.id)}
                      className="p-1.5 rounded transition-all"
                      style={{ color: 'var(--text-dim)' }}
                      title="Eliminar grupo"
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
              {group.description && (
                <p className="text-xs mb-3 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="mono text-xs" style={{ color: 'var(--text-dim)' }}>{formatDate(group.created_at)}</span>
                <Link href={`/groups/${group.id}`}
                  className="flex items-center gap-1 text-xs font-medium transition-all"
                  style={{ color: 'var(--accent)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.75'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                  Gestionar <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          message="¿Eliminar este grupo y todos sus proyectos? Esta acción no se puede deshacer."
          confirmLabel="Eliminar grupo"
          onConfirm={() => deleteGroup(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {showModal && (
        <Modal title={editingGroup ? 'Editar grupo' : 'Nuevo grupo'} onClose={closeModal}>
          <form onSubmit={saveGroup} className="space-y-4">
            <FormField label="Nombre del grupo">
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Mi equipo" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} autoFocus />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="¿De qué trata este grupo?" rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000' }}>
              {saving ? (editingGroup ? 'Guardando...' : 'Creando...') : (editingGroup ? 'Guardar cambios' : 'Crear grupo')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
