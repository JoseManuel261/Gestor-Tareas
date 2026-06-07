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
