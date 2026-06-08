'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Group } from '@/lib/types'
import Link from 'next/link'
import { Plus, Users, ArrowRight, Trash2 } from 'lucide-react'
import Modal from '@/components/Modal'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'
import { formatDate } from '@/lib/utils'

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)
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

  async function createGroup(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error('❌ No authenticated user')
        setSaving(false)
        return
      }
      
      if (editingGroupId) {
        console.log('📝 Updating group:', editingGroupId)
        const { error: updateError } = await supabase.from('groups').update({
          name: form.name.trim(),
          description: form.description.trim() || null
        }).eq('id', editingGroupId)
        if (updateError) {
          console.error('❌ Update error:', updateError)
          throw updateError
        }
        console.log('✅ Group updated successfully')
      } else {
        console.log('➕ Creating new group')
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .insert({ 
            name: form.name.trim(),
            description: form.description.trim() || null, 
            owner_id: user.id 
          })
          .select()
          .single()
        if (groupError) {
          console.error('❌ Insert error:', groupError)
          throw groupError
        }
        
        console.log('✅ Group created, adding owner as member')
        if (group) {
          const { error: memberError } = await supabase.from('group_members').insert({ 
            group_id: group.id, 
            user_id: user.id, 
            role: 'owner' 
          })
          if (memberError) {
            console.error('❌ Member insert error:', memberError)
            throw memberError
          }
          console.log('✅ Owner added to group')
        }
      }
      
      setForm({ name: '', description: '' })
      setEditingGroupId(null)
      setShowModal(false)
      load()
    } catch (err) {
      console.error('❌ Error saving group:', err)
    } finally {
      setSaving(false)
    }
  }

  function openEditGroup(group: any) {
    setForm({
      name: group.name,
      description: group.description || ''
    })
    setEditingGroupId(group.id)
    setShowModal(true)
  }

  async function deleteGroup(id: string) {
    if (!confirm('¿Eliminar este grupo y todos sus proyectos?')) return
    await supabase.from('groups').delete().eq('id', id)
    load()
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <p className="mono text-xs tracking-widest uppercase" style={{color: 'var(--text-muted)'}}>Equipos</p>
          <h1 className="text-2xl font-bold mt-0.5" style={{color: 'var(--text)'}}>Mis Grupos</h1>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{background: 'var(--accent)', color: '#000'}}>
          <Plus size={15} /> Nuevo grupo
        </button>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-36 rounded-xl animate-pulse" style={{background: 'var(--surface)'}} />
          ))}
        </div>
      ) : !groups.length ? (
        <div className="text-center py-20">
          <Users size={32} className="mx-auto mb-3" style={{color: 'var(--text-dim)'}} />
          <p className="text-sm mb-4" style={{color: 'var(--text-muted)'}}>No perteneces a ningún grupo aún</p>
          <button onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold"
            style={{background: 'var(--accent)', color: '#000'}}>
            Crear un grupo
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {groups.map((group, i) => (
            <div key={group.id}
              className={`rounded-xl p-5 transition-all animate-fade-up stagger-${Math.min(i+1,5)}`}
              style={{background: 'var(--surface)', border: '1px solid var(--border)'}}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{background: 'var(--accent-dim)'}}>
                    <Users size={14} style={{color: 'var(--accent)'}} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => openEditGroup(group)}
                      style={{color: 'var(--text)'}}>{group.name}</h3>
                    <span className="mono text-xs" style={{color: 'var(--text-dim)'}}>
                      {group.group_members?.[0]?.count || 0} miembro(s)
                    </span>
                  </div>
                </div>
                {group.owner_id === userId && (
                  <button onClick={() => deleteGroup(group.id)}
                    className="p-1 rounded transition-all"
                    style={{color: 'var(--text-dim)'}}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--red)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              {group.description && (
                <p className="text-xs mb-3 line-clamp-2" style={{color: 'var(--text-muted)'}}>{group.description}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="mono text-xs" style={{color: 'var(--text-dim)'}}>{formatDate(group.created_at)}</span>
                <Link href={`/groups/${group.id}`}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{color: 'var(--accent)'}}>
                  Gestionar <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingGroupId ? "Editar grupo" : "Nuevo grupo"} onClose={() => { setShowModal(false); setEditingGroupId(null); setForm({ name: '', description: '' }) }}>
          <form onSubmit={createGroup} className="space-y-4">
            <FormField label="Nombre del grupo">
              <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}
                placeholder="Mi equipo" required className={inputCls} style={inputStyle}
                onFocus={focusAccent} onBlur={blurBorder} />
            </FormField>
            <FormField label="Descripción (opcional)">
              <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}
                placeholder="¿De qué trata este grupo?" rows={3}
                className={inputCls + ' resize-none'} style={inputStyle}
                onFocus={focusAccent as any} onBlur={blurBorder as any} />
            </FormField>
            <button type="submit" disabled={saving}
              className="w-full py-2.5 rounded-lg font-semibold text-sm"
              style={{background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000'}}>
              {saving ? (editingGroupId ? 'Guardando...' : 'Creando...') : (editingGroupId ? 'Guardar cambios' : 'Crear grupo')}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}
