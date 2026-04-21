import { NextRequest, NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You are a helpful customer support assistant for Maison du Prestige, a premium watch store in Morocco.

Language rules:
- If the user writes in French, reply in clear French.
- If the user writes in English, reply in clear English.
- If the user writes in Moroccan Darija, reply in simple, natural Moroccan Darija using Latin script only. Never use Arabic script. Keep Darija clean and easy to read — avoid overly slangy or hard-to-follow phrasing.
- If the user mixes Darija and French, reply in a natural Darija/French mix that feels comfortable for a Moroccan customer.
- If Darija would sound awkward or unclear in context, prefer simple French instead.

Always be concise, friendly, and focused on helping the customer.

Key info:
- Free shipping on orders ≥ 500 MAD (otherwise 50 MAD)
- Cash on delivery available everywhere in Morocco
- Delivery: 2-4 business days
- Return policy: 7 days after receipt
If you don't know the answer, say so politely and suggest contacting WhatsApp.`

const FALLBACK_REPLY = "Désolé, je ne suis pas disponible pour l'instant. Veuillez nous contacter via WhatsApp pour obtenir de l'aide."

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY manquant' }, { status: 500 })
  }

  let messages: Message[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) throw new Error('messages missing or empty')
  } catch {
    return NextResponse.json({ error: 'Corps JSON invalide' }, { status: 400 })
  }

  if (messages.length > 20) {
    return NextResponse.json({ error: 'Trop de messages (max 20).' }, { status: 422 })
  }

  // Keep only role + content string, drop empty, cap each message at 2000 chars
  const sanitized = messages
    .filter(m => (m.role === 'user' || m.role === 'assistant') && m.content != null)
    .map(m => ({ role: m.role, content: String(m.content).trim().slice(0, 2000) }))
    .filter(m => m.content !== '')

  // Groq/OpenAI requires the conversation to start with a user message
  const firstUserIdx = sanitized.findIndex(m => m.role === 'user')
  const cleanedMessages = firstUserIdx >= 0 ? sanitized.slice(firstUserIdx) : sanitized

  if (cleanedMessages.length === 0) {
    return NextResponse.json({ error: "Premier message doit être de l'utilisateur" }, { status: 422 })
  }

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...cleanedMessages,
        ],
      }),
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      console.error('[CHAT] Groq API error:', res.status, await res.text())
      return NextResponse.json({ reply: FALLBACK_REPLY })
    }

    const data = await res.json()
    const reply = data.choices?.[0]?.message?.content ?? FALLBACK_REPLY
    return NextResponse.json({ reply })
  } catch (e) {
    console.error('[CHAT] fetch error:', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ reply: FALLBACK_REPLY })
  }
}
