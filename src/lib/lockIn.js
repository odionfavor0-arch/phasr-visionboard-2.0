const LOCK_IN_KEY = 'phasr_lock_in'
const BOARD_KEY = 'phasr_vb'

export const LOCK_IN_MODE_LABELS = {
  active: 'Active',
  warning: 'Warning',
  broken: 'Broken',
}

export const SAGE_LEVELS = {
  default: 'Sage',
  boost: 'Sage Boost',
  pro: 'Sage Pro',
}

export const UNLOCK_TIERS = [
  {
    id: 1,
    minStreak: 3,
    name: 'Control Unlocks',
    reward: 'Commitment mode, custom daily targets, phase override',
  },
  {
    id: 2,
    minStreak: 7,
    name: 'Intelligence Unlocks',
    reward: 'Advanced Sage insights, behavior analysis, adaptive missions',
  },
  {
    id: 3,
    minStreak: 14,
    name: 'Visibility Unlocks',
    reward: 'Deep analytics, planned vs actual, reality reports',
  },
  {
    id: 4,
    minStreak: 30,
    name: 'Identity & Status Unlocks',
    reward: 'Levels, badges, profile status, visual evolution',
  },
]

const RANKS = [
  { min: 0, label: 'Beginner' },
  { min: 3, label: 'Builder' },
  { min: 7, label: 'Operator' },
  { min: 14, label: 'Elite' },
  { min: 30, label: 'Locked In' },
]

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

function diffInDays(from, to) {
  return Math.round((to - from) / 86400000)
}

export function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function loadBoardData() {
  return safeRead(BOARD_KEY, null)
}

export function getTodayTask(boardData = loadBoardData()) {
  const phase = boardData?.phases?.find(p => p.id === boardData?.activePhaseId) || boardData?.phases?.[0]
  const weeklyActions = phase?.pillars?.flatMap(pillar => pillar.weeklyActions || []).filter(Boolean) || []
  return {
    phaseName: phase?.name || 'Current Phase',
    task: weeklyActions[0] || 'Complete one action that moves your current phase forward.',
  }
}

export function normalizeLockInState(state) {
  return {
    logs: Array.isArray(state?.logs) ? state.logs : [],
    pointsBank: Number.isFinite(state?.pointsBank) ? state.pointsBank : 0,
    commitmentMode: Boolean(state?.commitmentMode),
    penalties: Array.isArray(state?.penalties) ? state.penalties : [],
    lastPenaltyAnchor: state?.lastPenaltyAnchor || null,
    customTarget: state?.customTarget || '',
  }
}

export function loadLockInState() {
  const state = safeRead(LOCK_IN_KEY, null)
  if (state) return normalizeLockInState(state)

  return normalizeLockInState({
    logs: [],
    pointsBank: 0,
    commitmentMode: false,
    penalties: [],
    lastPenaltyAnchor: null,
    customTarget: '',
  })
}

export function saveLockInState(state) {
  safeWrite(LOCK_IN_KEY, normalizeLockInState(state))
}

export function getCompletedTierCount(streak) {
  return UNLOCK_TIERS.filter(tier => streak >= tier.minStreak).length
}

export function getRankLabel(streak) {
  const current = [...RANKS].reverse().find(rank => streak >= rank.min)
  return current?.label || RANKS[0].label
}

export function getSageLevel(summary) {
  if (summary.currentStreak >= 30) return SAGE_LEVELS.pro
  if (summary.currentStreak >= 7 && summary.mode !== 'broken') return SAGE_LEVELS.boost
  return SAGE_LEVELS.default
}

export function getLockInSummary(state = loadLockInState(), todayKey = getTodayKey()) {
  const logs = [...state.logs]
    .filter(log => log?.date)
    .sort((a, b) => b.date.localeCompare(a.date))

  const latestLog = logs[0] || null
  const today = getDateFromKey(todayKey)
  const latestDate = latestLog ? getDateFromKey(latestLog.date) : null
  const daysSinceLastLog = latestDate ? diffInDays(latestDate, today) : Infinity

  let preservedStreak = 0
  let pointer = latestDate

  for (const log of logs) {
    const current = getDateFromKey(log.date)
    if (!pointer) {
      preservedStreak = 1
      pointer = current
      continue
    }

    const gap = diffInDays(current, pointer)
    if (gap === 0 && preservedStreak === 0) {
      preservedStreak = 1
      pointer = current
      continue
    }

    if (gap === -1) {
      preservedStreak += 1
      pointer = current
      continue
    }

    if (gap === 0) continue
    break
  }

  if (preservedStreak === 0 && latestLog) preservedStreak = 1

  const mode =
    daysSinceLastLog === 0 ? 'active' :
    daysSinceLastLog === 1 ? 'warning' :
    'broken'

  const currentStreak = mode === 'broken' ? 0 : preservedStreak
  const completedTiers = getCompletedTierCount(currentStreak)
  const penaltiesApplied = state.penalties.reduce((sum, penalty) => sum + (penalty?.points || 0), 0)
  const points = Math.max(0, (logs.length * 10) + (completedTiers * 20) + state.pointsBank - penaltiesApplied)

  const summary = {
    todayKey,
    hasLoggedToday: logs.some(log => log.date === todayKey),
    latestLogDate: latestLog?.date || null,
    lastLog: latestLog,
    warning: daysSinceLastLog === 1,
    daysSinceLastLog,
    preservedStreak,
    currentStreak,
    mode,
    modeLabel: LOCK_IN_MODE_LABELS[mode],
    completedTiers,
    nextTier: UNLOCK_TIERS.find(tier => currentStreak < tier.minStreak) || null,
    points,
    rank: getRankLabel(currentStreak),
    unlockedCommitmentMode: currentStreak >= UNLOCK_TIERS[0].minStreak,
  }

  return {
    ...summary,
    sageLevel: getSageLevel(summary),
  }
}

export function upsertTodayLog(state, payload = {}) {
  const todayKey = getTodayKey()
  const existing = state.logs.find(log => log.date === todayKey)
  const nextLog = {
    date: todayKey,
    task: payload.task || existing?.task || '',
    note: payload.note || existing?.note || '',
    status: 'done',
  }

  const logs = existing
    ? state.logs.map(log => (log.date === todayKey ? nextLog : log))
    : [nextLog, ...state.logs]

  return normalizeLockInState({
    ...state,
    logs,
  })
}

export function applyCommitmentPenalty(state, summary) {
  if (!state.commitmentMode) return state
  if (summary.mode !== 'broken') return state
  if (!summary.latestLogDate) return state
  if (state.lastPenaltyAnchor === summary.latestLogDate) return state

  return normalizeLockInState({
    ...state,
    penalties: [
      ...state.penalties,
      {
        date: summary.todayKey,
        anchor: summary.latestLogDate,
        points: 15,
      },
    ],
    lastPenaltyAnchor: summary.latestLogDate,
  })
}

export function broadcastLockInUpdate() {
  window.dispatchEvent(new Event('phasr-lock-in-updated'))
}
