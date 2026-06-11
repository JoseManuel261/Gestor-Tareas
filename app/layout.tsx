import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Strata — Gestión de equipos',
  description: 'Gestor de tareas para equipos pequeños',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Evita el flash: aplica el tema guardado antes de hidratar. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.setAttribute('data-theme','light')}}catch(e){}})();`,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
