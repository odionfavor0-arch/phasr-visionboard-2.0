import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const AUTH_RETURN_KEY = 'phasr_auth_return'
const memoryStorage = new Map()

function getBrowserStorage(type) {
  if (typeof window === 'undefined') return null
  try {
    return type === 'session' ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function getPersistentValue(key) {
  const local = getBrowserStorage('local')
  const session = getBrowserStorage('session')

  try {
    const fromLocal = local?.getItem(key)
    if (fromLocal != null) return fromLocal
  } catch {}

  try {
    const fromSession = session?.getItem(key)
    if (fromSession != null) return fromSession
  } catch {}

  return memoryStorage.has(key) ? memoryStorage.get(key) : null
}

function setPersistentValue(key, value) {
  const local = getBrowserStorage('local')
  const session = getBrowserStorage('session')

  try {
    local?.setItem(key, value)
    if (session) session.removeItem(key)
    memoryStorage.delete(key)
    return
  } catch {}

  try {
    local?.removeItem(AUTH_RETURN_KEY)
  } catch {}

  try {
    session?.setItem(key, value)
    memoryStorage.delete(key)
    return
  } catch {}

  memoryStorage.set(key, value)
}

function removePersistentValue(key) {
  const local = getBrowserStorage('local')
  const session = getBrowserStorage('session')

  try {
    local?.removeItem(key)
  } catch {}

  try {
    session?.removeItem(key)
  } catch {}

  memoryStorage.delete(key)
}

const authStorage = {
  getItem(key) {
    return getPersistentValue(key)
  },
  setItem(key, value) {
    setPersistentValue(key, value)
  },
  removeItem(key) {
    removePersistentValue(key)
  },
}

export const supabaseConfigError = !supabaseUrl
  ? 'Missing `VITE_SUPABASE_URL`. Add it to your Vercel Environment Variables and redeploy, or to your local `.env` when running locally.'
  : !supabaseKey
    ? 'Missing `VITE_SUPABASE_ANON_KEY`. Add it to your Vercel Environment Variables and redeploy, or to your local `.env` when running locally.'
    : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: authStorage,
      },
    })

export async function submitIssueReport({ user, message, context = {} }) {
  if (!supabase) {
    throw new Error('Supabase is not configured.')
  }

  const payload = {
    user_id: user?.id || null,
    user_email: user?.email || null,
    user_name:
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.user_metadata?.first_name ||
      null,
    message: String(message || '').trim(),
    context,
    source: 'settings_report_issue',
    status: 'new',
    created_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('issue_reports')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

