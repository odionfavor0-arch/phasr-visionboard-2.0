// Thin Supabase sync layer for Phase 1 (core data sync).
//
// Design: this module is the ONLY thing that talks to Supabase for product
// data. It never computes anything — lib/lockIn.js's math (streak, weekly
// targets, dial) is untouched; this module just mirrors the same rows
// lockIn.js/Journal.jsx/Review.jsx already read and write in localStorage,
// so every existing synchronous read in the app keeps working unchanged.
//
// Every push is fire-and-forget from the caller's point of view (the local
// localStorage write already happened synchronously, same as before this
// migration) — a failed push is queued in a localStorage outbox and retried
// on the next successful write, on `online`, or on next hydrate. That is
// the full extent of the offline handling: no conflict resolution, last
// write wins, per the instruction to keep it simple.
//
// user_id is ALWAYS the real Supabase auth uuid (`user.id`) — never an
// email or the app's own `phasr_active_user` identifier fallback that other
// parts of the app use for scoping localStorage keys. RLS checks
// `auth.uid() = user_id`; anything else silently matches zero rows.

import { supabase } from './supabase'

const OUTBOX_KEY = 'phasr_sync_outbox'
const MAX_OUTBOX_ENTRIES = 500

// Raw localStorage key names this module reads/writes directly, mirroring
// the same constants defined locally in lockIn.js / Journal.jsx / Review.jsx
// (none of those export their key constants). ACTIVE_USER_KEY here is ONLY
// used to compute the LOCAL cache key suffix, the same way every other file
// in this app already scopes localStorage — it is never the value sent to
// Supabase as `user_id`, which is always `currentUserId` (the real auth uuid).
const ACTIVE_USER_KEY = 'phasr_active_user'
const BOARD_KEY = 'phasr_vb'
const COMPLETIONS_KEY = 'phasr_completions'
const LOCK_IN_KEY = 'phasr_lock_in'
const STREAK_KEY = 'phasr_streak'
const DIAL_STATE_KEY = 'phasr_dial_state'
const JOURNAL_KEY = 'phasr_journal_v2'
const PILLAR_REVIEWS_KEY = 'phasr_pillar_reviews'
const PILLAR_WRAPS_KEY = 'phasr_pillar_wraps'

function localScopedKey(base) {
  const id = localStorage.getItem(ACTIVE_USER_KEY) || ''
  return id ? `${base}:${id}` : base
}

function localRead(base, fallback) {
  try {
    const raw = localStorage.getItem(localScopedKey(base))
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function localWrite(base, value) {
  try {
    localStorage.setItem(localScopedKey(base), JSON.stringify(value))
  } catch {
    // Storage full — the pulled-down data just won't be cached locally this
    // time; the next successful hydrate (e.g. after quota frees up) retries.
  }
}

let currentUserId = null
let hydratedForUserId = null

export function setSyncUser(user) {
  const nextId = user?.id || null
  if (nextId !== currentUserId) {
    hydratedForUserId = null
  }
  currentUserId = nextId
}

export function getSyncUserId() {
  return currentUserId
}

export function isSyncEnabled() {
  return Boolean(supabase) && Boolean(currentUserId)
}

export function hasHydratedThisSession() {
  return hydratedForUserId && hydratedForUserId === currentUserId
}

export function markHydrated() {
  hydratedForUserId = currentUserId
}

function readOutbox() {
  try {
    const raw = localStorage.getItem(OUTBOX_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeOutbox(items) {
  try {
    const trimmed = items.length > MAX_OUTBOX_ENTRIES ? items.slice(items.length - MAX_OUTBOX_ENTRIES) : items
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(trimmed))
  } catch {
    // If even the outbox can't be written, the local (non-Supabase) data is
    // still intact — nothing is lost, the next successful write just won't
    // have a queued retry for this particular op.
  }
}

function queueWrite(op) {
  const outbox = readOutbox()
  outbox.push({ ...op, queuedAt: Date.now() })
  writeOutbox(outbox)
}

// Generic executor for one write op against one table. `op` is one of:
//   { upsert: rowOrRows, onConflict }  — supabase .upsert()
//   { deleteMatch: {col: value, ...} } — supabase .delete().match()
async function runOp(table, op) {
  if (!supabase) return { ok: false, offline: true }
  try {
    let query
    if (op.upsert) {
      query = supabase.from(table).upsert(op.upsert, op.onConflict ? { onConflict: op.onConflict } : undefined)
    } else if (op.deleteMatch) {
      query = supabase.from(table).delete().match(op.deleteMatch)
    } else {
      return { ok: false, error: new Error('runOp: no upsert or deleteMatch given') }
    }
    const { error } = await query
    if (error) throw error
    return { ok: true }
  } catch (error) {
    return { ok: false, error }
  }
}

// The single write entrypoint every push* function below goes through:
// try live, queue on failure. Never throws — callers fire this without
// awaiting, so a rejected promise would surface as an unhandled rejection.
async function syncWrite(table, op) {
  if (!isSyncEnabled()) return
  const result = await runOp(table, op)
  if (!result.ok) queueWrite({ table, ...op })
}

export async function flushOutbox() {
  if (!isSyncEnabled()) return
  const outbox = readOutbox()
  if (!outbox.length) return
  const remaining = []
  for (const { queuedAt, table, ...op } of outbox) {
    const result = await runOp(table, op)
    if (!result.ok) remaining.push({ table, ...op, queuedAt })
  }
  writeOutbox(remaining)
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { flushOutbox() })
}

function diffByKey(previous, next, keyFn) {
  const prevMap = new Map((previous || []).map(item => [keyFn(item), item]))
  const nextMap = new Map((next || []).map(item => [keyFn(item), item]))
  const added = []
  const changed = []
  nextMap.forEach((item, key) => {
    const prevItem = prevMap.get(key)
    if (!prevItem) added.push(item)
    else if (JSON.stringify(prevItem) !== JSON.stringify(item)) changed.push(item)
  })
  const removed = []
  prevMap.forEach((item, key) => {
    if (!nextMap.has(key)) removed.push(item)
  })
  return { added, changed, removed }
}

// ────────────────────────────────────────────────────────────────────────
// board_data — 1 row per user, whole board JSONB
// ────────────────────────────────────────────────────────────────────────

export function pushBoardData(boardData) {
  if (!isSyncEnabled()) return
  syncWrite('board_data', {
    upsert: { user_id: currentUserId, data: boardData, updated_at: new Date().toISOString() },
    onConflict: 'user_id',
  })
}

export async function pullBoardData() {
  if (!isSyncEnabled()) return null
  const { data, error } = await supabase.from('board_data').select('data').eq('user_id', currentUserId).maybeSingle()
  if (error) return null
  return data?.data || null
}

// ────────────────────────────────────────────────────────────────────────
// lock_in_completions — 1 row per completion tick; diffed by id
// ────────────────────────────────────────────────────────────────────────

export function syncCompletionsDelta(previous, next) {
  if (!isSyncEnabled()) return
  const { added, removed } = diffByKey(previous, next, item => item.id)
  added.forEach(completion => {
    syncWrite('lock_in_completions', {
      upsert: {
        id: completion.id,
        user_id: currentUserId,
        phase_id: completion.phaseId || null,
        activity_id: completion.activityId || null,
        weekly_goal_id: completion.weeklyGoalId || null,
        date: completion.date,
        task: completion.task || null,
        pillar: completion.pillar || null,
      },
      onConflict: 'id',
    })
  })
  removed.forEach(completion => {
    syncWrite('lock_in_completions', { deleteMatch: { id: completion.id, user_id: currentUserId } })
  })
}

export async function pullCompletions() {
  if (!isSyncEnabled()) return []
  const { data, error } = await supabase.from('lock_in_completions').select('*').eq('user_id', currentUserId)
  if (error) return []
  return (data || []).map(row => ({
    id: row.id,
    date: row.date,
    task: row.task,
    pillar: row.pillar,
    activityId: row.activity_id,
    phaseId: row.phase_id,
    weeklyGoalId: row.weekly_goal_id,
  }))
}

// ────────────────────────────────────────────────────────────────────────
// daily_logs — 1 row per calendar day; diffed by date (add/update only,
// current app never deletes a day-log entry)
// ────────────────────────────────────────────────────────────────────────

export function syncDailyLogsDelta(previous, next) {
  if (!isSyncEnabled()) return
  const { added, changed } = diffByKey(previous, next, item => item.date)
  ;[...added, ...changed].forEach(log => {
    syncWrite('daily_logs', {
      upsert: {
        user_id: currentUserId,
        date: log.date,
        task: log.task || null,
        note: log.note || null,
        status: log.status || 'done',
      },
      onConflict: 'user_id,date',
    })
  })
}

export async function pullDailyLogs() {
  if (!isSyncEnabled()) return []
  const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', currentUserId)
  if (error) return []
  return (data || []).map(row => ({ date: row.date, task: row.task || '', note: row.note || '', status: row.status }))
}

// ────────────────────────────────────────────────────────────────────────
// streak_state — 1 row per user
// ────────────────────────────────────────────────────────────────────────

export function pushStreakState(streak) {
  if (!isSyncEnabled()) return
  syncWrite('streak_state', {
    upsert: {
      user_id: currentUserId,
      current: streak.current || 0,
      best: streak.best || 0,
      last_completed: streak.lastCompleted || null,
      risk: Boolean(streak.risk),
      warning: streak.warning || '',
      weekly_consistency: streak.weeklyConsistency || 0,
      best_weekly_consistency: streak.bestWeeklyConsistency || 0,
      updated_at: new Date().toISOString(),
    },
    onConflict: 'user_id',
  })
}

export async function pullStreakState() {
  if (!isSyncEnabled()) return null
  const { data, error } = await supabase.from('streak_state').select('*').eq('user_id', currentUserId).maybeSingle()
  if (error || !data) return null
  return {
    current: data.current || 0,
    best: data.best || 0,
    lastCompleted: data.last_completed || null,
    risk: Boolean(data.risk),
    warning: data.warning || '',
    weeklyConsistency: data.weekly_consistency || 0,
    bestWeeklyConsistency: data.best_weekly_consistency || 0,
  }
}

// ────────────────────────────────────────────────────────────────────────
// lock_in_config — 1 row per user (the rest of phasr_lock_in besides .logs)
// ────────────────────────────────────────────────────────────────────────

export function pushLockInConfig(state) {
  if (!isSyncEnabled()) return
  syncWrite('lock_in_config', {
    upsert: {
      user_id: currentUserId,
      points_bank: state.pointsBank || 0,
      commitment_mode: Boolean(state.commitmentMode),
      penalties: state.penalties || [],
      last_penalty_anchor: state.lastPenaltyAnchor || null,
      custom_target: state.customTarget || '',
      updated_at: new Date().toISOString(),
    },
    onConflict: 'user_id',
  })
}

export async function pullLockInConfig() {
  if (!isSyncEnabled()) return null
  const { data, error } = await supabase.from('lock_in_config').select('*').eq('user_id', currentUserId).maybeSingle()
  if (error || !data) return null
  return {
    pointsBank: data.points_bank || 0,
    commitmentMode: Boolean(data.commitment_mode),
    penalties: data.penalties || [],
    lastPenaltyAnchor: data.last_penalty_anchor || null,
    customTarget: data.custom_target || '',
  }
}

// ────────────────────────────────────────────────────────────────────────
// dial_state — 1 row per (user, phase)
// ────────────────────────────────────────────────────────────────────────

export function pushDialState(phaseId, dialState) {
  if (!isSyncEnabled() || !phaseId) return
  syncWrite('dial_state', {
    upsert: {
      user_id: currentUserId,
      phase_id: phaseId,
      step: dialState.step || 0,
      effective_from_week: dialState.effectiveFromWeek || 1,
      updated_at: new Date().toISOString(),
    },
    onConflict: 'user_id,phase_id',
  })
}

export async function pullDialState() {
  if (!isSyncEnabled()) return {}
  const { data, error } = await supabase.from('dial_state').select('*').eq('user_id', currentUserId)
  if (error) return {}
  const store = {}
  ;(data || []).forEach(row => {
    store[row.phase_id] = { step: row.step || 0, effectiveFromWeek: row.effective_from_week || 1 }
  })
  return store
}

// ────────────────────────────────────────────────────────────────────────
// journal_entries — 1 row per entry; diffed by id (add/update/delete)
// ────────────────────────────────────────────────────────────────────────

export function syncJournalEntriesDelta(previous, next) {
  if (!isSyncEnabled()) return
  const { added, changed, removed } = diffByKey(previous, next, item => item.id)
  ;[...added, ...changed].forEach(entry => {
    syncWrite('journal_entries', {
      upsert: {
        id: String(entry.id),
        user_id: currentUserId,
        date: entry.date,
        is_weekly_pulse: Boolean(entry.weeklyPulseMeta),
        data: entry,
        created_at: entry.createdAt || new Date().toISOString(),
      },
      onConflict: 'id',
    })
  })
  removed.forEach(entry => {
    syncWrite('journal_entries', { deleteMatch: { id: String(entry.id), user_id: currentUserId } })
  })
}

export async function pullJournalEntries() {
  if (!isSyncEnabled()) return []
  const { data, error } = await supabase.from('journal_entries').select('data').eq('user_id', currentUserId)
  if (error) return []
  const entries = (data || []).map(row => row.data).filter(Boolean)
  // Defensive: one reflection = one entry, even if a duplicate id ever landed in the
  // table (e.g. a retried outbox write racing a live one) — Journal.jsx's own load
  // path dedupes the same way, this just keeps the hydrated cache consistent with it.
  const seen = new Set()
  return entries.filter(entry => {
    const key = String(entry?.id ?? '')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ────────────────────────────────────────────────────────────────────────
// pillar_reviews — 1 row per (user, phase, pillar)
// ────────────────────────────────────────────────────────────────────────

export function pushPillarReview(review) {
  if (!isSyncEnabled()) return
  syncWrite('pillar_reviews', {
    upsert: {
      user_id: currentUserId,
      phase_id: review.phaseId,
      pillar_id: review.pillarId,
      phase_name: review.phaseName || null,
      pillar_name: review.pillarName || null,
      what_worked: review.whatWorked || '',
      what_didnt_work: review.whatDidntWork || '',
      what_drained: review.whatDrained || '',
      next_strategy: review.nextStrategy || '',
      decision: review.decision || null,
      created_at: review.createdAt || new Date().toISOString(),
      updated_at: review.updatedAt || new Date().toISOString(),
    },
    onConflict: 'user_id,phase_id,pillar_id',
  })
}

export function pushPillarWrap(wrap) {
  if (!isSyncEnabled()) return
  syncWrite('pillar_reviews', {
    upsert: {
      user_id: currentUserId,
      phase_id: wrap.phaseId,
      pillar_id: wrap.pillarId,
      pillar_name: wrap.pillarName || null,
      synthesis: wrap.synthesis || null,
      synthesis_generated_at: wrap.generatedAt || new Date().toISOString(),
    },
    onConflict: 'user_id,phase_id,pillar_id',
  })
}

export async function pullPillarReviews() {
  if (!isSyncEnabled()) return { reviews: [], wraps: [] }
  const { data, error } = await supabase.from('pillar_reviews').select('*').eq('user_id', currentUserId)
  if (error) return { reviews: [], wraps: [] }
  const reviews = (data || []).map(row => ({
    phaseId: row.phase_id,
    phaseName: row.phase_name,
    pillarId: row.pillar_id,
    pillarName: row.pillar_name,
    whatWorked: row.what_worked || '',
    whatDidntWork: row.what_didnt_work || '',
    whatDrained: row.what_drained || '',
    nextStrategy: row.next_strategy || '',
    decision: row.decision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
  const wraps = (data || [])
    .filter(row => row.synthesis)
    .map(row => ({
      pillarId: row.pillar_id,
      pillarName: row.pillar_name,
      phaseId: row.phase_id,
      synthesis: row.synthesis,
      generatedAt: row.synthesis_generated_at,
    }))
  return { reviews, wraps }
}

// ────────────────────────────────────────────────────────────────────────
// hydrateAllFromSupabase — the ONE entrypoint the app calls, once per
// sign-in, before any product view mounts (see AppShell.jsx). This is what
// makes the recompute in lockIn.js timezone-stable across devices: every
// device pulls the SAME stored board/completions/logs/dial rows into its
// local cache before ensureProgressEngine() ever runs, so week boundaries
// and "which day is done" are computed from the same stored dates on every
// device, not from whatever each device's local cache happened to have.
//
// Migration decision: pullStreakState() doubles as "has this user got rows
// in Supabase yet at all" — Phase 1's tables are always created together,
// so streak_state existing or not is a reliable stand-in for "has this
// account been migrated" without a dedicated migration-marker table.
//   - No remote rows  → push this device's local snapshot up once (using
//     the same diff-based push functions as an ordinary save, seeded from
//     an empty "previous" so everything counts as new).
//   - Remote rows exist → they are the source of truth; pull everything
//     down into the same localStorage keys lockIn.js/VisionBoard.jsx/
//     Journal.jsx/Review.jsx already read synchronously, so nothing
//     downstream has to change how it reads.
// ────────────────────────────────────────────────────────────────────────

export async function hydrateAllFromSupabase(user) {
  setSyncUser(user)
  if (!isSyncEnabled()) return
  if (hasHydratedThisSession()) return

  await flushOutbox()

  const remoteStreak = await pullStreakState()

  if (!remoteStreak) {
    const localBoard = localRead(BOARD_KEY, null)
    if (localBoard) pushBoardData(localBoard)

    const localCompletions = localRead(COMPLETIONS_KEY, [])
    syncCompletionsDelta([], localCompletions)

    const localLockIn = localRead(LOCK_IN_KEY, null)
    if (localLockIn) {
      syncDailyLogsDelta([], localLockIn.logs || [])
      pushLockInConfig(localLockIn)
    }

    const localStreak = localRead(STREAK_KEY, null)
    if (localStreak) pushStreakState(localStreak)

    const localDial = localRead(DIAL_STATE_KEY, {})
    Object.entries(localDial).forEach(([phaseId, dialState]) => pushDialState(phaseId, dialState))

    const localJournal = localRead(JOURNAL_KEY, [])
    syncJournalEntriesDelta([], localJournal)

    const localReviews = localRead(PILLAR_REVIEWS_KEY, [])
    localReviews.forEach(review => pushPillarReview(review))
    const localWraps = localRead(PILLAR_WRAPS_KEY, [])
    localWraps.forEach(wrap => pushPillarWrap(wrap))

    markHydrated()
    return
  }

  const [remoteBoard, remoteCompletions, remoteLogs, remoteConfig, remoteDial, remoteJournal, remotePillars] =
    await Promise.all([
      pullBoardData(),
      pullCompletions(),
      pullDailyLogs(),
      pullLockInConfig(),
      pullDialState(),
      pullJournalEntries(),
      pullPillarReviews(),
    ])

  if (remoteBoard) localWrite(BOARD_KEY, remoteBoard)
  localWrite(COMPLETIONS_KEY, remoteCompletions)
  localWrite(STREAK_KEY, remoteStreak)
  localWrite(DIAL_STATE_KEY, remoteDial)
  localWrite(LOCK_IN_KEY, {
    logs: remoteLogs,
    pointsBank: remoteConfig?.pointsBank ?? 0,
    commitmentMode: remoteConfig?.commitmentMode ?? false,
    penalties: remoteConfig?.penalties ?? [],
    lastPenaltyAnchor: remoteConfig?.lastPenaltyAnchor ?? null,
    customTarget: remoteConfig?.customTarget ?? '',
  })
  localWrite(JOURNAL_KEY, remoteJournal)
  localWrite(PILLAR_REVIEWS_KEY, remotePillars.reviews)
  localWrite(PILLAR_WRAPS_KEY, remotePillars.wraps)

  markHydrated()
}
