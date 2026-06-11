'use client'
import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, TrendingUp, Info, Lightbulb, RotateCcw, X } from 'lucide-react'
import { inputCls, inputStyle, focusAccent, blurBorder } from '@/components/FormField'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const QUICK_PROMPTS = [
  { icon: TrendingUp, label: 'Tendencias 2025', prompt: '¿Qué tendencias globales de tecnología o negocio podrían inspirar proyectos interesantes este año?' },
  { icon: Lightbulb, label: 'Ideas de proyectos', prompt: 'Dame 5 ideas de proyectos originales que podría gestionar en Strata, con nombre y descripción breve.' },
  { icon: Info, label: '¿Qué es Strata?', prompt: 'Explícame qué es Strata y cómo puedo sacarle el máximo provecho.' },
]

const WELCOME = 'Hola. Soy el asistente general de Strata.\n\nPuedo ayudarte con ideas de proyectos, contarte sobre tendencias globales o explicarte cómo sacar provecho de la app. ¿Por dónde empezamos?'

function BotCharacter({ open }: { open: boolean }) {
  return (
    <svg width="52" height="52" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', overflow: 'visible' }}>
      <style>{`
        @keyframes tf-blink { 0%,88%,100% { transform: scaleY(1); } 93% { transform: scaleY(0.07); } }
        @keyframes tf-bob { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-3.5px); } }
        @keyframes tf-wave { 0%,100% { transform: rotate(0deg); } 30% { transform: rotate(22deg); } 70% { transform: rotate(-6deg); } }
        @keyframes tf-pulse { 0%,100% { r: 2.5; opacity: 1; } 50% { r: 4; opacity: 0.7; } }
        .tf-bob { animation: tf-bob 2.4s ease-in-out infinite; transform-origin: 24px 26px; }
        .tf-eye-l { animation: tf-blink 3.8s ease-in-out infinite; transform-origin: 18px 23px; }
        .tf-eye-r { animation: tf-blink 3.8s ease-in-out infinite 0.1s; transform-origin: 30px 23px; }
        .tf-arm { animation: tf-wave 2.2s ease-in-out infinite; transform-origin: 38px 27px; }
        .tf-dot { animation: tf-pulse 1.6s ease-in-out infinite; }
      `}</style>
      <g className="tf-bob">
        <line x1="24" y1="9" x2="24" y2="14" stroke="#c8f04a" strokeWidth="1.8" strokeLinecap="round"/>
        <circle className="tf-dot" cx="24" cy="7" r="2.5" fill="#c8f04a"/>
        <rect x="12" y="14" width="24" height="18" rx="6" fill="#111111" stroke="#c8f04a" strokeWidth="1.6"/>
        <g className="tf-eye-l"><rect x="15.5" y="20" width="5.5" height="5.5" rx="1.5" fill="#c8f04a"/></g>
        <g className="tf-eye-r"><rect x="27" y="20" width="5.5" height="5.5" rx="1.5" fill="#c8f04a"/></g>
        {open
          ? <path d="M18 29.5 Q24 33.5 30 29.5" fill="none" stroke="#c8f04a" strokeWidth="1.4" strokeLinecap="round"/>
          : <path d="M18 29 Q24 32.5 30 29" fill="none" stroke="#c8f04a" strokeWidth="1.4" strokeLinecap="round"/>
        }
        <rect x="21" y="32" width="6" height="3" rx="1.2" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="0.6"/>
        <rect x="11" y="35" width="26" height="11" rx="5" fill="#111111" stroke="#c8f04a" strokeWidth="1.6"/>
        <rect x="19" y="38.5" width="10" height="4" rx="1.2" fill="#1a1a1a" stroke="#c8f04a" strokeWidth="0.9"/>
        <line x1="21.5" y1="40.5" x2="26.5" y2="40.5" stroke="#c8f04a" strokeWidth="0.7" strokeLinecap="round"/>
        <rect x="4" y="36" width="6" height="8" rx="3" fill="#111111" stroke="#c8f04a" strokeWidth="1.4"/>
        <g className="tf-arm">
          <rect x="38" y="34" width="6" height="8" rx="3" fill="#111111" stroke="#c8f04a" strokeWidth="1.4"/>
        </g>
      </g>
    </svg>
  )
}

export default function GlobalAI() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Globo visible los primeros 5 segundos, luego se oculta solo
  const [showBubble, setShowBubble] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setShowBubble(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [messages, open])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: WELCOME }])
    }
  }, [open])

  async function send(text?: string) {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const userMsg: Message = { role: 'user', content }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/ai/global', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.slice(-10) }),
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

  function reset() {
    setMessages([{ role: 'assistant', content: WELCOME }])
    setError('')
  }

  return (
    <>
      {/* Panel — ancho responsivo */}
      <div
        className="fixed bottom-24 right-4 z-[55] flex flex-col rounded-2xl overflow-hidden transition-all duration-300 origin-bottom-right"
        style={{
          width: 'min(360px, calc(100vw - 32px))',
          maxHeight: '520px',
          background: 'var(--surface)',
          border: '1px solid rgba(200,240,74,0.18)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.45)',
          opacity: open ? 1 : 0,
          transform: open ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(16px)',
          pointerEvents: open ? 'auto' : 'none',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'var(--accent-dim)' }}>
              <span style={{ color: 'var(--accent)', fontSize: 13, lineHeight: 1 }}>✦</span>
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Asistente Strata</span>
            <span className="mono px-1.5 py-0.5 rounded"
              style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontSize: '0.6rem' }}>
              GENERAL
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={reset} title="Nueva conversación"
              className="p-1.5 rounded-md transition-all" style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
              <RotateCcw size={13}/>
            </button>
            <button onClick={() => setOpen(false)} title="Cerrar"
              className="p-1.5 rounded-md transition-all" style={{ color: 'var(--text-dim)' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'var(--text-dim)'}>
              <X size={13}/>
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="text-sm rounded-xl px-3 py-2.5 max-w-[88%] whitespace-pre-wrap"
                style={{
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                  color: msg.role === 'user' ? '#000' : 'var(--text)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  lineHeight: '1.55', fontSize: '0.82rem',
                }}>
                {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                  part.startsWith('**') && part.endsWith('**')
                    ? <strong key={j}>{part.slice(2, -2)}</strong>
                    : part
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-3 py-2 rounded-xl flex items-center gap-2"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
                <Loader2 size={11} className="animate-spin" style={{ color: 'var(--accent)'}}/>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Pensando...</span>
              </div>
            </div>
          )}
          {error && <p className="text-xs px-1" style={{ color: 'var(--red)' }}>⚠ {error}</p>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick prompts */}
        {messages.length <= 1 && !loading && (
          <div className="px-4 pb-2 flex flex-col gap-1.5 shrink-0">
            {QUICK_PROMPTS.map(({ icon: Icon, label, prompt }) => (
              <button key={label} onClick={() => send(prompt)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left"
                style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(200,240,74,0.3)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
                }}>
                <Icon size={12} style={{ color: 'var(--accent)', flexShrink: 0 }}/>
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="text" value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) send() }}
              placeholder="Pregunta algo..." disabled={loading}
              className={inputCls} style={{ ...inputStyle, fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}
              onFocus={focusAccent} onBlur={blurBorder}/>
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="p-2 rounded-lg shrink-0 transition-all"
              style={{
                background: input.trim() && !loading ? 'var(--accent)' : 'var(--border2)',
                color: input.trim() && !loading ? '#000' : 'var(--text-muted)',
              }}>
              <Send size={13}/>
            </button>
          </div>
        </div>
      </div>

      {/* Botón flotante */}
      <div className="fixed bottom-6 right-6 z-[55]">
        {/* Globo — desaparece a los 5s y al abrir el panel */}
        {showBubble && !open && (
          <div
            className="absolute bottom-16 right-0 mb-1 animate-fade-up transition-opacity duration-500"
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(200,240,74,0.3)',
              borderRadius: '12px 12px 2px 12px',
              padding: '8px 12px',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>Soy tu IA de guía</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>¡Pregúntame lo que quieras!</p>
            <span style={{
              position: 'absolute', bottom: -6, right: 14,
              width: 0, height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(200,240,74,0.3)',
            }}/>
          </div>
        )}

        <button onClick={() => { setOpen(v => !v); setShowBubble(false) }}
          aria-label="Abrir asistente IA"
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            filter: 'drop-shadow(0 0 10px rgba(200,240,74,0.3))',
            transition: 'filter 0.3s ease, transform 0.2s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(0 0 18px rgba(200,240,74,0.65))'
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.1)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.filter = 'drop-shadow(0 0 10px rgba(200,240,74,0.3))'
            ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
          }}>
          <BotCharacter open={open}/>
        </button>
      </div>
    </>
  )
}
