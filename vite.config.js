import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only middleware so `npm run dev` can serve the same /api/sage-chat
// endpoint that runs as a Vercel serverless function in production.
function sageChatDevMiddleware() {
  return {
    name: 'sage-chat-dev-middleware',
    async configureServer(server) {
      const { pipeSageChat } = await import('./api/_sageChatCore.js')
      server.middlewares.use('/api/sage-chat', async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          let messages = []
          try {
            messages = JSON.parse(body || '{}').messages || []
          } catch {}
          await pipeSageChat(messages, res)
        })
      })
    },
  }
}

// Dev-only middleware factory for the JSON-in/JSON-out backend proxies
// (Groq chat, Inworld TTS) that run as Vercel serverless functions in
// production. Mirrors sageChatDevMiddleware's parsing so `npm run dev`
// exercises the same server-only code path that production uses.
function jsonApiDevMiddleware(routePath, loadHandler) {
  return {
    name: `dev-middleware-${routePath.replace(/\W+/g, '-')}`,
    async configureServer(server) {
      const handle = await loadHandler()
      server.middlewares.use(routePath, async (req, res) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method not allowed')
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          let parsed = {}
          try {
            parsed = JSON.parse(body || '{}')
          } catch {}
          await handle(parsed, res)
        })
      })
    },
  }
}

// Dev-only middleware for API routes that use the raw Vercel serverless
// signature directly (`req.body`, `res.status(code).json(obj)`/`.end()`)
// instead of the core+wrapper pattern above. Shims just enough of that API
// so the same handler file runs unchanged in both `npm run dev` and Vercel.
function vercelHandlerDevMiddleware(routePath, loadHandler) {
  return {
    name: `dev-middleware-vercel-${routePath.replace(/\W+/g, '-')}`,
    async configureServer(server) {
      const handler = await loadHandler()
      server.middlewares.use(routePath, async (req, res) => {
        let body = ''
        req.on('data', chunk => { body += chunk })
        req.on('end', async () => {
          try {
            req.body = body ? JSON.parse(body) : {}
          } catch {
            req.body = {}
          }
          res.status = code => {
            res.statusCode = code
            return {
              json: payload => res.end(JSON.stringify(payload)),
              end: () => res.end(),
            }
          }
          try {
            await handler(req, res)
          } catch (err) {
            res.statusCode = 500
            res.end(JSON.stringify({ error: err?.message || 'dev_handler_failed' }))
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Vite loads .env into `env` here, but plain server-side code (this file,
  // api/*.js) reads from process.env — mirror the server-only keys across
  // so the dev middleware can see them without exposing them to the client.
  if (!process.env.GROQ_API_KEY && env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
  if (!process.env.GROQ_MODEL && env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL
  if (!process.env.INWORLD_API_KEY && env.INWORLD_API_KEY) process.env.INWORLD_API_KEY = env.INWORLD_API_KEY
  if (!process.env.INWORLD_TTS_MODEL && env.INWORLD_TTS_MODEL) process.env.INWORLD_TTS_MODEL = env.INWORLD_TTS_MODEL
  if (!process.env.INWORLD_TTS_VOICE && env.INWORLD_TTS_VOICE) process.env.INWORLD_TTS_VOICE = env.INWORLD_TTS_VOICE

  return {
    plugins: [
      react(),
      sageChatDevMiddleware(),
      jsonApiDevMiddleware('/api/groq/chat', () => import('./api/_groqChatCore.js').then(m => m.handleGroqChat)),
      jsonApiDevMiddleware('/api/inworld/tts', () => import('./api/_inworldTtsCore.js').then(m => m.handleInworldTts)),
      vercelHandlerDevMiddleware('/api/plan/generate', () => import('./api/plan/generate.js').then(m => m.default)),
    ],
  }
})
