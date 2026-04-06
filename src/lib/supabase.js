import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabaseConfigError = !supabaseUrl
  ? 'Missing `VITE_SUPABASE_URL` in your project `.env` file.'
  : !supabaseKey
    ? 'Missing `VITE_SUPABASE_ANON_KEY` in your project `.env` file.'
    : null

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
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

