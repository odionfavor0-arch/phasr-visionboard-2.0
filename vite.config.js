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

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Vite loads .env into `env` here, but plain server-side code (this file,
  // api/*.js) reads from process.env — mirror the server-only keys across
  // so the dev middleware can see them without exposing them to the client.
  if (!process.env.GROQ_API_KEY && env.GROQ_API_KEY) process.env.GROQ_API_KEY = env.GROQ_API_KEY
  if (!process.env.GROQ_MODEL && env.GROQ_MODEL) process.env.GROQ_MODEL = env.GROQ_MODEL
  if (!process.env.VITE_GROQ_KEY && env.VITE_GROQ_KEY) process.env.VITE_GROQ_KEY = env.VITE_GROQ_KEY

  return {
    plugins: [react(), sageChatDevMiddleware()],
  }
})
