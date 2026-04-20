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

function countPerfectWeeks(userId = getActiveUserId()) {
  const streakKeys = listMatchingKeys(/^phasr_streak_w\d+_d\d+(?::.+)?$/, userId)
  const weekDays = new Map()

  streakKeys.forEach(key => {
    const [base] = key.split(':')
    const match = base.match(/^phasr_streak_w(\d+)_d(\d+)$/)
    if (!match) return
    const weekNumber = match[1]
    const dayNumber = match[2]
    const value = localStorage.getItem(key) === 'true'
    const bucket = weekDays.get(weekNumber) || {}
    bucket[dayNumber] = value
    weekDays.set(weekNumber, bucket)
  })

  return [...weekDays.values()].filter(days => {
    for (let day = 1; day <= 7; day += 1) {
      if (!days[String(day)]) return false
    }
    return true
  }).length
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
  const perfectWeekPoints = countPerfectWeeks(userId) * 10
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
