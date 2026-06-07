import Navbar from '@/components/Navbar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{background: 'var(--bg)', minHeight: '100vh'}}>
      <main className="max-w-7xl mx-auto px-8 md:px-12 pt-24 pb-16">
        {children}
      </main>
    </div>
  )
}