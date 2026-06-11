export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { system_prompt, user_message } = req.body || {}

  if (!system_prompt || !user_message) {
    return res.status(400).json({ error: 'system_prompt and user_message are required' })
  }

  const groqApiKey = process.env.VITE_GROQ_KEY
  if (!groqApiKey) {
    return res.status(500).json({ error: 'VITE_GROQ_KEY is not configured on the server' })
  }

  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'

  let groqRes
  try {
    groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: user_message },
        ],
      }),
    })
  } catch (err) {
    return res.status(502).json({ error: `Failed to reach Groq: ${err.message}` })
  }

  if (!groqRes.ok) {
    const errorText = await groqRes.text().catch(() => '')
    return res.status(502).json({ error: `Groq returned ${groqRes.status}: ${errorText}` })
  }

  const data = await groqRes.json()
  const content = data?.choices?.[0]?.message?.content || ''
  return res.status(200).json({ content })
}
