import type { MetadataRoute } from 'next'

// Base PWA (Fase 7): Next sirve esto en /manifest.webmanifest e inyecta el
// <link rel="manifest"> automáticamente. Los iconos y el Service Worker se
// añaden más adelante sin tocar la lógica de la app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Strata — Gestión de equipos',
    short_name: 'Strata',
    description: 'Gestor de tareas colaborativo para equipos pequeños',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#0a0a0a',
    icons: [],
  }
}
