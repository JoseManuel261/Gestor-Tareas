'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import GlobalAI from '@/components/GlobalAI'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ username: string; avatar_url: string | null } | null>(null)
  const [ready, setReady] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      supabase.from('profiles').select('username, avatar_url').eq('id', session.user.id).single()
        .then(({ data }) => {
          setProfile({
            username: (data as any)?.username || session.user.email?.split('@')[0] || 'usuario',
            avatar_url: (data as any)?.avatar_url || null,
          })
          setReady(true)
        })
    })
  }, [])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Navbar username={profile?.username || ''} avatarUrl={profile?.avatar_url || null} />
      <main className="pt-20 px-6 max-w-6xl mx-auto py-8">
        {children}
      </main>
      <GlobalAI />
    </div>
  )
}
