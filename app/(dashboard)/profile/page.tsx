'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Camera, Save, User, Mail, AtSign } from 'lucide-react'
import { FormField, inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ username: '', full_name: '', avatar_url: '' })
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      setUserId(user.id)
      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profile) {
        setForm({
          username: profile.username || '',
          full_name: profile.full_name || '',
          avatar_url: profile.avatar_url || '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    // Validar tamaño (max 2MB) y tipo
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no puede superar 2MB'); return }
    if (!file.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return }

    setUploadingAvatar(true)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError('Error al subir la imagen. Asegúrate de tener el bucket "avatars" en Supabase Storage.')
      setUploadingAvatar(false)
      return
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path)
    setForm(p => ({ ...p, avatar_url: data.publicUrl + '?t=' + Date.now() }))
    setUploadingAvatar(false)
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim()) { setError('El username no puede estar vacío'); return }
    setSaving(true)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: form.username.trim().toLowerCase().replace(/\s+/g, '_'),
        full_name: form.full_name.trim() || null,
        avatar_url: form.avatar_url || null,
      })
      .eq('id', userId)

    if (updateError) {
      setError(updateError.message.includes('unique') ? 'Ese username ya está en uso' : 'Error al guardar')
    } else {
      setSuccess('Perfil actualizado correctamente')
      router.refresh()
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  const initials = form.full_name
    ? form.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : form.username.slice(0, 2).toUpperCase()

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}/>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-fade-up">

      {/* Header */}
      <div>
        <div className="section-line"/>
        <p className="mono text-xs tracking-widest uppercase mb-1" style={{ color: 'var(--text-muted)' }}>Cuenta</p>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Tu perfil</h1>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          {form.avatar_url ? (
            <img src={form.avatar_url} alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
              style={{ border: '2px solid var(--accent)' }}/>
          ) : (
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
              style={{ background: 'var(--accent-dim)', border: '2px solid var(--accent)', color: 'var(--accent)' }}>
              {initials}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            {uploadingAvatar
              ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}/>
              : <Camera size={20} style={{ color: 'var(--accent)' }}/>
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload}/>
        </div>
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Haz clic en la imagen para cambiarla · máx 2MB</p>
      </div>

      {/* Formulario */}
      <form onSubmit={saveProfile} className="space-y-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>

        {/* Email — solo lectura */}
        <FormField label="Correo electrónico">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <Mail size={14} style={{ color: 'var(--text-dim)' }}/>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{email}</span>
          </div>
        </FormField>

        <FormField label="Username">
          <div className="relative">
            <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-dim)' }}/>
            <input type="text" value={form.username}
              onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
              placeholder="tu_username" required
              className={inputCls} style={{ ...inputStyle, paddingLeft: '2rem' }}
              onFocus={focusAccent} onBlur={blurBorder}/>
          </div>
        </FormField>

        <FormField label="Nombre completo (opcional)">
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--text-dim)' }}/>
            <input type="text" value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              placeholder="Tu nombre"
              className={inputCls} style={{ ...inputStyle, paddingLeft: '2rem' }}
              onFocus={focusAccent} onBlur={blurBorder}/>
          </div>
        </FormField>

        {error && (
          <p className="text-xs px-1" style={{ color: 'var(--red)' }}>⚠ {error}</p>
        )}
        {success && (
          <p className="text-xs px-1" style={{ color: 'var(--accent)' }}>✓ {success}</p>
        )}

        <button type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all"
          style={{ background: saving ? 'var(--border2)' : 'var(--accent)', color: saving ? 'var(--text-muted)' : '#000' }}>
          <Save size={14}/>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
