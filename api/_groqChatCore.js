const GROQ_CHAT_MODEL = 'llama-3.1-8b-instant'
const GROQ_THINK_MODEL = 'llama-3.3-70b-versatile'

function getGroqKey() {
  // Server-only. Vite only inlines VITE_-prefixed vars into the CLIENT bundle
  // via import.meta.env — it never touches process.env reads like this one —
  // so falling back to the legacy VITE_GROQ_KEY name here is safe.
  return process.env.GROQ_API_KEY || process.env.VITE_GROQ_KEY || ''
}

function resolveModel({ model, mode }) {
  if (model) return String(model)
  if (mode === 'think') return GROQ_THINK_MODEL
  if (mode === 'chat') return GROQ_CHAT_MODEL
  return process.env.GROQ_MODEL || GROQ_CHAT_MODEL
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/**
 * Proxies a Groq chat-completion request. Works for both Vercel's Node
 * runtime and Vite's dev-server middleware — both hand us a plain Node
 * http.ServerResponse.
 */
export async function handleGroqChat(body, res) {
  const groqKey = getGroqKey()
  if (!groqKey) {
    return sendJson(res, 500, { error: 'GROQ_API_KEY is not configured on the server' })
  }

  const { system, messages, mode, model, temperature, max_tokens } = body || {}

  const safeMessages = (Array.isArray(messages) ? messages : [])
    .filter(m => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))

  if (!safeMessages.length) {
    return sendJson(res, 400, { error: 'messages is required' })
  }

  const groqRequestBody = {
    model: resolveModel({ model, mode }),
    messages: [
      ...(system ? [{ role: 'system', content: String(system) }] : []),
      ...safeMessages,
    ],
  }
  if (typeof temperature === 'number') groqRequestBody.temperature = temperature
  if (typeof max_tokens === 'number') groqRequestBody.max_tokens = max_tokens

  let groqRes
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify(groqRequestBody),
    })
  } catch (err) {
    return sendJson(res, 502, { error: `Failed to reach Groq: ${err.message}` })
  }

  if (!groqRes.ok) {
    const errorText = await groqRes.text().catch(() => '')
    return sendJson(res, 502, { error: `Groq returned ${groqRes.status}: ${errorText}` })
  }

  const data = await groqRes.json()
  const content = data?.choices?.[0]?.message?.content || ''
  return sendJson(res, 200, { content })
}
