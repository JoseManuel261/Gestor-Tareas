import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { projectName, projectDescription, completedTasks, currentTask, messages } = await req.json()

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 })
    }

    // Construir el contexto de forma segura
    const completedSummary = completedTasks?.length
      ? completedTasks.map((t: any) => 
          `• [${t.priority}] ${t.title}${t.description ? ': ' + t.description : ''}`
        ).join('\n')
      : 'Ninguna tarea completada aún.'

    // Usamos JSON.stringify para asegurar que la tarea llegue limpia a la IA
    const taskContext = currentTask ? JSON.stringify(currentTask, null, 2) : 'Ninguna tarea seleccionada.'

    const systemPrompt = `Eres un asistente de trabajo integrado en TaskFlow, una app de gestión de tareas en equipo.
Tu rol es ayudar al usuario a entender y ejecutar su tarea específica, basándote en el contexto del proyecto.

---
PROYECTO: ${projectName}
DESCRIPCIÓN: ${projectDescription || 'Sin descripción.'}

TAREAS YA COMPLETADAS POR EL EQUIPO:
${completedSummary}

TAREA ACTUAL DEL USUARIO (Datos estructurados):
${taskContext}
---

Reglas:
- Responde SIEMPRE en español.
- Sé conciso: máximo 3 párrafos por respuesta.
- Si el usuario pide un prompt para otra IA, genera uno claro y estructurado entre triple backticks.
- Si no tienes suficiente contexto para algo, dilo directamente.
- No inventes información que no esté en el contexto.`

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 512,
        temperature: 0.5,
        messages: [
          { role: 'system', content: systemPrompt },
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
    console.error('AI route error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}