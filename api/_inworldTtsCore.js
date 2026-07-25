function getInworldKey() {
  // Server-only. Vite only inlines VITE_-prefixed vars into the CLIENT bundle
  // via import.meta.env — it never touches process.env reads like this one —
  // so falling back to the legacy VITE_INWORLD_API_KEY name here is safe.
  return process.env.INWORLD_API_KEY || process.env.VITE_INWORLD_API_KEY || ''
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

/**
 * Proxies an Inworld text-to-speech request. Works for both Vercel's Node
 * runtime and Vite's dev-server middleware — both hand us a plain Node
 * http.ServerResponse.
 */
export async function handleInworldTts(body, res) {
  const apiKey = getInworldKey()
  if (!apiKey) {
    return sendJson(res, 500, { error: 'INWORLD_API_KEY is not configured on the server' })
  }

  const text = String(body?.text || '').trim()
  if (!text) {
    return sendJson(res, 400, { error: 'text is required' })
  }

  const voiceId = String(body?.voiceId || process.env.INWORLD_TTS_VOICE || 'Eleanor')
  const modelId = String(body?.modelId || process.env.INWORLD_TTS_MODEL || 'inworld-tts-1')

  let inworldRes
  try {
    inworldRes = await fetch('https://api.inworld.ai/tts/v1/voice', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voiceId, modelId }),
    })
  } catch (err) {
    return sendJson(res, 502, { error: `Failed to reach Inworld: ${err.message}` })
  }

  if (!inworldRes.ok) {
    const errorText = await inworldRes.text().catch(() => '')
    return sendJson(res, 502, { error: `Inworld returned ${inworldRes.status}: ${errorText}` })
  }

  const data = await inworldRes.json()
  return sendJson(res, 200, data)
}
