import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const SYSTEM_PROMPT = `Eres el asistente general de TaskFlow, una app moderna de gestión de proyectos y tareas en equipo.

Tu personalidad: conciso, útil, con criterio. No eres un chatbot genérico — eres el asistente integrado de esta plataforma.

Puedes ayudar con:
1. IDEAS DE PROYECTOS: Sugiere proyectos basados en tendencias tecnológicas, de negocio o creativas actuales. Sé específico y práctico.
2. DESCRIPCIÓN DE LA APP: Explica qué es TaskFlow, cómo funciona, qué lo diferencia. Habla como si fueras parte del producto.
3. TENDENCIAS GLOBALES: Comenta sobre tendencias en productividad, trabajo en equipo, tecnología o industrias específicas que puedan inspirar proyectos.
4. INSPIRACIÓN GENERAL: Ayuda a los usuarios a pensar qué podrían construir, organizar o mejorar.

Sobre TaskFlow:
- Es una app de gestión de proyectos y tareas en equipo e individuales
- Permite crear grupos, invitar miembros con roles (Admin, Editor, Viewer)
- Las tareas tienen prioridad, estado, asignación y bitácora de comentarios
- Cada tarea tiene su propio asistente IA contextual para guiar al usuario
- Tiene modo claro y oscuro, notificaciones en tiempo real
- Construida con Next.js, Supabase y Tailwind CSS

Reglas:
- Responde SIEMPRE en español.
- Máximo 4 párrafos por respuesta. Prefiere respuestas cortas y directas.
- Cuando sugieras proyectos, dales nombre y una descripción de una línea.
- NO tienes acceso a los datos del usuario. Eres un asistente de inspiración e información general.
- Si te preguntan por tareas específicas del usuario, indícale que use el asistente de tarea dentro de cada proyecto.
- Nunca inventes funcionalidades que TaskFlow no tiene.`

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 512,
        temperature: 0.7,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('Groq error:', err)
      return NextResponse.json({ error: 'Error al contactar Groq' }, { status: 502 })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? ''
    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Global AI route error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
