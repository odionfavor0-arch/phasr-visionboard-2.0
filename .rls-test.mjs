import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const anonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !anonKey) {
  console.error('Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in env')
  process.exitCode = 1
}

const stamp = Date.now()
const userA = { email: `purityaddy74+rlstest-a-${stamp}@gmail.com`, password: `Test-${stamp}-aA1!` }
const userB = { email: `purityaddy74+rlstest-b-${stamp}@gmail.com`, password: `Test-${stamp}-bB1!` }

function freshClient() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signUpAndSignIn(creds, label) {
  const client = freshClient()
  const { data: signUpData, error: signUpError } = await client.auth.signUp(creds)
  if (signUpError) throw new Error(`${label} signUp failed: ${signUpError.message}`)

  let session = signUpData.session
  if (!session) {
    const { data: signInData, error: signInError } = await client.auth.signInWithPassword(creds)
    if (signInError) {
      throw new Error(
        `${label} has no session after signUp and signInWithPassword failed: ${signInError.message}. ` +
        `This project likely has "Confirm email" ON in Auth settings, which blocks immediate sign-in for ` +
        `freshly created test accounts. Disable it temporarily (Authentication > Providers > Email > Confirm email) ` +
        `or confirm these two accounts manually, then re-run.`
      )
    }
    session = signInData.session
  }
  return { client, userId: session.user.id, email: creds.email }
}

function report(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${label}${detail ? ' :: ' + detail : ''}`)
  return ok
}

async function main() {
  let allPassed = true

  console.log('Creating two throwaway test accounts...')
  const a = await signUpAndSignIn(userA, 'User A')
  const b = await signUpAndSignIn(userB, 'User B')
  console.log(`User A id: ${a.userId}`)
  console.log(`User B id: ${b.userId}`)
  console.log('')

  // ── board_data (single-uuid PK) ─────────────────────────────────────────
  {
    const { error } = await a.client.from('board_data').upsert({ user_id: a.userId, data: { boardTitle: 'A board' } })
    allPassed = report('board_data: A can insert own row', !error, error?.message) && allPassed

    const { error: errB } = await b.client.from('board_data').upsert({ user_id: b.userId, data: { boardTitle: 'B board' } })
    allPassed = report('board_data: B can insert own row', !errB, errB?.message) && allPassed

    const { data: ownRows, error: ownErr } = await a.client.from('board_data').select('*').eq('user_id', a.userId)
    allPassed = report('board_data: A sees exactly 1 own row', !ownErr && ownRows?.length === 1, ownErr?.message || `got ${ownRows?.length}`) && allPassed

    const { data: otherRows, error: otherErr } = await a.client.from('board_data').select('*').eq('user_id', b.userId)
    allPassed = report('board_data: A sees ZERO of B\'s rows (RLS-filtered, not an error)', !otherErr && otherRows?.length === 0, otherErr ? `unexpected error: ${otherErr.message}` : `got ${otherRows?.length} rows`) && allPassed

    const { data: bOwnRows, error: bOwnErr } = await b.client.from('board_data').select('*').eq('user_id', b.userId)
    allPassed = report('board_data: B (same query shape) sees own row — proves zero above was correct scoping, not RLS blocking everything', !bOwnErr && bOwnRows?.length === 1, bOwnErr?.message || `got ${bOwnRows?.length}`) && allPassed

    const { error: impersonateErr } = await a.client.from('board_data').upsert({ user_id: b.userId, data: { boardTitle: 'HACKED' } })
    allPassed = report('board_data: A CANNOT insert/upsert a row claiming to be B', Boolean(impersonateErr), impersonateErr ? 'correctly rejected: ' + impersonateErr.message : 'SECURITY BUG: insert succeeded') && allPassed
  }

  console.log('')

  // ── daily_logs (composite PK, the actual streak-driving table) ─────────
  {
    const today = new Date().toISOString().slice(0, 10)
    const { error } = await a.client.from('daily_logs').upsert({ user_id: a.userId, date: today, task: 'A task', status: 'done' })
    allPassed = report('daily_logs: A can insert own row', !error, error?.message) && allPassed

    const { error: errB } = await b.client.from('daily_logs').upsert({ user_id: b.userId, date: today, task: 'B task', status: 'done' })
    allPassed = report('daily_logs: B can insert own row', !errB, errB?.message) && allPassed

    const { data: otherRows, error: otherErr } = await a.client.from('daily_logs').select('*').eq('user_id', b.userId)
    allPassed = report('daily_logs: A sees ZERO of B\'s rows', !otherErr && otherRows?.length === 0, otherErr ? `unexpected error: ${otherErr.message}` : `got ${otherRows?.length} rows`) && allPassed

    const { data: bOwnRows, error: bOwnErr } = await b.client.from('daily_logs').select('*').eq('user_id', b.userId)
    allPassed = report('daily_logs: B sees own row', !bOwnErr && bOwnRows?.length === 1, bOwnErr?.message || `got ${bOwnRows?.length}`) && allPassed
  }

  console.log('')

  // ── streak_state (single-uuid PK, unlock/progress state) ───────────────
  {
    const { error } = await a.client.from('streak_state').upsert({ user_id: a.userId, current: 5, best: 5 })
    allPassed = report('streak_state: A can insert own row', !error, error?.message) && allPassed

    const { data: otherRows, error: otherErr } = await b.client.from('streak_state').select('*').eq('user_id', a.userId)
    allPassed = report('streak_state: B sees ZERO of A\'s rows', !otherErr && otherRows?.length === 0, otherErr ? `unexpected error: ${otherErr.message}` : `got ${otherRows?.length} rows`) && allPassed
  }

  console.log('')
  console.log('Cleaning up test rows (each user deletes only their own)...')
  await a.client.from('board_data').delete().eq('user_id', a.userId)
  await a.client.from('daily_logs').delete().eq('user_id', a.userId)
  await a.client.from('streak_state').delete().eq('user_id', a.userId)
  await b.client.from('board_data').delete().eq('user_id', b.userId)
  await b.client.from('daily_logs').delete().eq('user_id', b.userId)

  console.log('')
  console.log(allPassed ? '=== ALL RLS CHECKS PASSED ===' : '=== SOME RLS CHECKS FAILED — see above ===')
  console.log(`Throwaway auth accounts left in your Supabase project (anon key cannot delete auth users, needs service role): ${a.email}, ${b.email}`)
  process.exitCode = allPassed ? 0 : 1
}

main().catch(err => {
  console.error('RLS test script errored:', err.message)
  process.exitCode = 1
})
