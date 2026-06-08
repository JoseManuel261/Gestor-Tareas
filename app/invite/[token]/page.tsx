'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [message, setMessage] = useState('Procesando tu invitación…')

  useEffect(() => {
    const supabase = createClient()

    async function run() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.replace(`/login?next=/invite/${token}`)
        return
      }

      const { data, error } = await supabase.rpc('accept_invitation', { _token: token })
      if (error) {
        setStatus('error')
        setMessage(error.message || 'No se pudo aceptar la invitación.')
        return
      }

      // data = group_id devuelto por la RPC
      router.replace(`/groups/${data}`)
    }

    run()
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm text-center animate-fade-up">
        {status === 'loading' ? (
          <>
            <div className="w-7 h-7 rounded-full border-2 animate-spin mx-auto mb-5"
              style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{message}</p>
          </>
        ) : (
          <>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'rgba(255,68,68,0.08)' }}>
              <AlertCircle size={20} style={{ color: 'var(--red)' }} />
            </div>
            <h1 className="text-lg font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
              Invitación no válida
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>{message}</p>
            <Link href="/dashboard"
              className="inline-block px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: 'var(--accent)', color: '#000' }}>
              Ir al dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
