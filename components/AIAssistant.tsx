'use client'
import { useState, useRef, useEffect } from 'react'
import { Sparkles, Send, X, ChevronDown, Loader2 } from 'lucide-react'
import { Task, Project } from '@/lib/types'
import { inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface AIAssistantProps {
  project: Project
  currentTask: Task
  completedTasks: Task[]
}

export default function AIAssistant({ project, currentTask, completedTasks }: AIAssistantProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll al último mensaje automáticamente
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  // Mensaje de bienvenida contextual al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcome: Message = {
        role: 'assistant',
        content: `Hola. Estoy al tanto del proyecto **${project.name}** y de tu tarea **"${currentTask.title}"**.\n\n¿En qué te puedo ayudar? Puedo explicarte qué implica esta tarea, resumir lo que el equipo ya hizo, o generarte un prompt para llevar a otra IA.`,
      }
      setMessages([welcome])
    }
  }, [open])

  async function sendMessage(e?: React.FormEvent, overrideText?: string) {
    e?.preventDefault()
    const text = overrideText ?? input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          projectDescription: project.description,
          completedTasks,
          currentTask,
          // Solo mandamos los últimos 8 mensajes para no sobrecargar el contexto
          messages: newMessages.slice(-8),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err: any) {
      setError(err.message || 'No se pudo obtener respuesta.')
    } finally {
      setLoading(false)
    }
  }

  // Prompts de acceso rápido
  const quickPrompts = [
    '¿Qué debo hacer exactamente en esta tarea?',
    '¿Qué hizo el equipo antes que yo?',
    'Genera un prompt para llevar esto a otra IA',
  ]

  return (
    <div className="mt-5 pt-5" style={{ borderTop: '1px solid var(--border)' }}>
      {/* Botón de toggle */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all group"
        style={{
          background: open ? 'var(--accent-dim)' : 'var(--surface2)',
          border: '1px solid ' + (open ? 'rgba(200,240,74,0.3)' : 'var(--border)'),
          color: open ? 'var(--accent)' : 'var(--text-muted)',
        }}
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Sparkles size={13} />
          Asistente IA
        </span>
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {/* Panel expandible */}
      {open && (
        <div className="mt-3 rounded-xl overflow-hidden flex flex-col"
          style={{
            border: '1px solid rgba(200,240,74,0.15)',
            background: 'var(--surface)',
            maxHeight: '360px',
          }}>

          {/* Listado de mensajes */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: '180px', maxHeight: '260px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="text-sm rounded-xl px-3 py-2 max-w-[90%] whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                    color: msg.role === 'user' ? '#000' : 'var(--text)',
                    border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                    lineHeight: '1.5',
                  }}
                >
                  {/* Renderizar negritas simples */}
                  {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                    part.startsWith('**') && part.endsWith('**')
                      ? <strong key={j} style={{ fontWeight: 700 }}>{part.slice(2, -2)}</strong>
                      : part
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pensando...</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-xs px-2" style={{ color: 'var(--red)' }}>⚠ {error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Prompts rápidos — solo si es el inicio */}
          {messages.length <= 1 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickPrompts.map((p, i) => (
                <button key={i}
                  onClick={() => { setInput(p); sendMessage(undefined, p) }}
                  className="text-xs px-2.5 py-1 rounded-full transition-all"
                  style={{
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    border: '1px solid rgba(200,240,74,0.2)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={sendMessage}
            className="flex items-center gap-2 px-3 py-2.5"
            style={{ borderTop: '1px solid var(--border)' }}>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) sendMessage() }}
              placeholder="Pregunta sobre tu tarea..."
              className={inputCls}
              style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
              onFocus={focusAccent}
              onBlur={blurBorder}
              disabled={loading}
            />
            <button type="submit" disabled={loading || !input.trim()}
              className="p-2 rounded-lg shrink-0 transition-all"
              style={{
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--border2)',
                color: input.trim() && !loading ? '#000' : 'var(--text-muted)',
              }}>
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
