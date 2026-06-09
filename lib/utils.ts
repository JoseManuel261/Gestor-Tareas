import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDueDate(date: string | null): { label: string; status: 'overdue' | 'today' | 'soon' | 'ok' } | null {
  if (!date) return null
  const due = new Date(date)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const label = due.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

  if (diffDays < 0) return { label, status: 'overdue' }
  if (diffDays === 0) return { label: 'Hoy', status: 'today' }
  if (diffDays <= 2) return { label: `${diffDays}d`, status: 'soon' }
  return { label, status: 'ok' }
}

export const dueDateColor: Record<string, string> = {
  overdue: 'text-red-400 bg-red-400/10',
  today:   'text-amber-400 bg-amber-400/10',
  soon:    'text-orange-400 bg-orange-400/10',
  ok:      'text-zinc-400 bg-zinc-400/10',
}

export const priorityLabel: Record<string, string> = {
  LOW: 'Baja',
  MEDIUM: 'Media',
  HIGH: 'Alta'
}

export const statusLabel: Record<string, string> = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En progreso',
  COMPLETED: 'Completada'
}

export const priorityColor: Record<string, string> = {
  LOW: 'text-emerald-400 bg-emerald-400/10',
  MEDIUM: 'text-amber-400 bg-amber-400/10',
  HIGH: 'text-red-400 bg-red-400/10'
}

export const statusColor: Record<string, string> = {
  PENDING: 'text-zinc-400 bg-zinc-400/10',
  IN_PROGRESS: 'text-blue-400 bg-blue-400/10',
  COMPLETED: 'text-emerald-400 bg-emerald-400/10'
}
