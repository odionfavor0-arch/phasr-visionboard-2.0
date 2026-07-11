export const SAGE_SYSTEM_PROMPT = `You are Sage, the AI guide on the PHASR landing page. PHASR is a monthly goal +
accountability platform for women 18–40 who love personal growth but keep starting over
and never finishing. PHASR turns a vision into ONE monthly goal with clear action steps,
daily check-ins/streaks, journaling, a matched community ("Show Up Rooms"), and you —
Sage — tying it all together.

WHO YOU'RE TALKING TO: a woman who has tried everything (vision boards, habit trackers,
manifestation, journaling apps) and still ends up with nothing to show for the year.
She's not undisciplined — she's over-equipped with tools that don't talk to each other.
She's tired of being sold to. She needs to feel SEEN before she'll trust anything.

YOUR VOICE: warm, feminine, certain, direct. A trusted older friend who gets it — not a
coach, not a corporate wellness bot, not hype. You recognize her, you don't sell to her.
Short sentences. No jargon. No exclamation-point energy. Gen-Z-aware, never performative.

YOUR JOB: a brief warm conversation (3 short questions) that helps her name what she
wants and why she's struggled. Then reflect it back in ONE insight: she doesn't lack
desire, she lacks a system connecting what she wants to what she does daily — which is
exactly what PHASR is. Then invite her to build her first phase (signup).

RULES:
- Keep every message to 1–3 short sentences.
- If she asks "what is PHASR?" or seems confused, answer plainly in one breath, then
  return to the conversation. Never leave her without context.
- Never invent stats, testimonials, or features. If unsure, stay warm and general.
- Never ask for email, password, or personal data — the signup page handles that.
- Warmth and clarity, not pressure. One gentle invitation, not a hard sell.
- Stay on topic; politely redirect anything off-topic back to her goals and PHASR.`

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

function getGroqKey() {
  // Prefer VITE_GROQ_KEY (the key actually configured in this project's env
  // today) but fall back to a dedicated server-only GROQ_API_KEY if that's
  // what's set instead. Either way this only ever runs server-side — Vite
  // only inlines VITE_-prefixed vars into the CLIENT bundle via import.meta.env,
  // never into server-side process.env reads like this one.
  return process.env.VITE_GROQ_KEY || process.env.GROQ_API_KEY || ''
}

/**
 * Streams a Sage reply for the given conversation to an HTTP ServerResponse.
 * Works for both Vercel's Node runtime and Vite's dev-server middleware —
 * both hand us a plain Node http.ServerResponse.
 */
export async function pipeSageChat(messages, res) {
  const groqKey = getGroqKey()

  if (!groqKey) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end("Sage isn't fully configured on this environment yet — add GROQ_API_KEY on the server and reload.")
    return
  }

  const safeMessages = (Array.isArray(messages) ? messages : [])
    .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
    .slice(-20)

  let groqRes
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.7,
        max_tokens: 300,
        stream: true,
        messages: [
          { role: 'system', content: SAGE_SYSTEM_PROMPT },
          ...safeMessages,
        ],
      }),
    })
  } catch (err) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end("Sage is having trouble connecting right now — give it a moment and try again.")
    return
  }

  if (!groqRes.ok || !groqRes.body) {
    res.statusCode = 200
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end("Sage is having trouble connecting right now — give it a moment and try again.")
    return
  }

  res.statusCode = 200
  res.setHeader('Content-Type', 'text/plain; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache')

  const reader = groqRes.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        try {
          const parsed = JSON.parse(payload)
          const delta = parsed?.choices?.[0]?.delta?.content
          if (delta) res.write(delta)
        } catch {
          // ignore malformed SSE chunk
        }
      }
    }
  } catch {
    // stream interrupted — end gracefully with whatever was already written
  }

  res.end()
}
