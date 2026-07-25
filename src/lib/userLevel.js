import { getDateKeyFromDate, loadLockInState } from './lockIn'

const ACTIVE_USER_KEY = 'phasr_active_user'
const LEVEL_STORAGE_KEY = 'phasr_user_level'
const JOURNAL_KEY = 'phasr_journal_v2'
const LEGACY_JOURNAL_KEY = 'phasr_journal'

const LEVELS = [
  { level: 1, levelName: 'Starter', min: 0, max: 20 },
  { level: 2, levelName: 'Building', min: 21, max: 50 },
  { level: 3, levelName: 'Consistent', min: 51, max: 100 },
  { level: 4, levelName: 'Locked In', min: 101, max: 200 },
  { level: 5, levelName: 'Leader', min: 201, max: Infinity },
]

function getActiveUserId() {
  return localStorage.getItem(ACTIVE_USER_KEY) || ''
}

function getScopedKey(base, userId = getActiveUserId()) {
  return userId ? `${base}:${userId}` : base
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function readScopedJson(base, fallback, userId = getActiveUserId()) {
  const scopedValue = safeParse(localStorage.getItem(getScopedKey(base, userId)), null)
  if (scopedValue !== null) return scopedValue
  return safeParse(localStorage.getItem(base), fallback)
}

function listMatchingKeys(pattern, userId = getActiveUserId()) {
  const keys = []
  const seenBases = new Set()

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key || !pattern.test(key)) continue

    const [base, scopedUserId] = key.split(':')
    if (scopedUserId && scopedUserId !== userId) continue
    if (seenBases.has(base)) continue

    const preferredKey = userId && localStorage.getItem(`${base}:${userId}`) != null
      ? `${base}:${userId}`
      : base

    if (localStorage.getItem(preferredKey) == null) continue
    keys.push(preferredKey)
    seenBases.add(base)
  }

  return keys
}

function isWeeklyPulseEntry(entry) {
  return Boolean(
    entry?.weeklyPulseMeta ||
    String(entry?.prompt || '').toLowerCase() === 'weekly pulse',
  )
}

function countCompletedDailyTasks(userId = getActiveUserId()) {
  return listMatchingKeys(/^phasr_tasks_w\d+_d\d+(?::.+)?$/, userId).reduce((sum, key) => {
    const tasks = safeParse(localStorage.getItem(key), [])
    if (!Array.isArray(tasks)) return sum
    return sum + tasks.filter(task => task?.done).length
  }, 0)
}

function countSavedJournalEntries(userId = getActiveUserId()) {
  const modern = readScopedJson(JOURNAL_KEY, null, userId)
  const legacy = modern === null ? readScopedJson(LEGACY_JOURNAL_KEY, [], userId) : modern
  const entries = Array.isArray(legacy) ? legacy : []
  return entries.filter(entry => !isWeeklyPulseEntry(entry)).length
}

function countCompletedWeeklyPulses(userId = getActiveUserId()) {
  const modern = readScopedJson(JOURNAL_KEY, null, userId)
  const legacy = modern === null ? readScopedJson(LEGACY_JOURNAL_KEY, [], userId) : modern
  const entries = Array.isArray(legacy) ? legacy : []
  return entries.filter(isWeeklyPulseEntry).length
}

// Used to scan its own independent phasr_streak_w{n}_d{n} day-flags, written by
// DailyCheckin.jsx. Those flags are retired now that DailyCheckin routes completions
// through lib/lockIn.js's canonical writer (one source of truth for streak/completion
// data) — so this derives "perfect week" the same way: reading lockIn's own logs
// (one entry per calendar date, status 'done') and grouping into Mon-Sun weeks.
function countPerfectWeeks() {
  const state = loadLockInState()
  const doneDates = new Set((state.logs || []).filter(log => log?.status === 'done').map(log => log.date))
  if (!doneDates.size) return 0

  const weekBuckets = new Map()
  doneDates.forEach(dateStr => {
    const date = new Date(`${dateStr}T12:00:00`)
    if (Number.isNaN(date.getTime())) return
    const mondayOffset = (date.getDay() + 6) % 7
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - mondayOffset)
    const weekKey = getDateKeyFromDate(weekStart)
    const bucket = weekBuckets.get(weekKey) || new Set()
    bucket.add(dateStr)
    weekBuckets.set(weekKey, bucket)
  })

  return [...weekBuckets.values()].filter(bucket => bucket.size >= 7).length
}

export function getLevelForPoints(points) {
  return LEVELS.find(item => points >= item.min && points <= item.max) || LEVELS[0]
}

export function getStoredUserLevel(userId = getActiveUserId()) {
  const scoped = safeParse(localStorage.getItem(getScopedKey(LEVEL_STORAGE_KEY, userId)), null)
  if (scoped) return scoped
  return safeParse(localStorage.getItem(LEVEL_STORAGE_KEY), null)
}

export function calculateUserPoints() {
  const userId = getActiveUserId()
  const dailyTaskPoints = countCompletedDailyTasks(userId)
  const journalEntryPoints = countSavedJournalEntries(userId) * 2
  const weeklyPulsePoints = countCompletedWeeklyPulses(userId) * 5
  const perfectWeekPoints = countPerfectWeeks() * 10
  const points = dailyTaskPoints + journalEntryPoints + weeklyPulsePoints + perfectWeekPoints
  const currentLevel = getLevelForPoints(points)
  const payload = {
    points,
    level: currentLevel.level,
    levelName: currentLevel.levelName,
  }

  localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(payload))
  localStorage.setItem(getScopedKey(LEVEL_STORAGE_KEY, userId), JSON.stringify(payload))
  window.dispatchEvent(new CustomEvent('phasr-user-level-updated', { detail: payload }))

  return payload
}
