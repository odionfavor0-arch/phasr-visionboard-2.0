import { useEffect, useMemo, useState } from 'react'
import { buildWeeklyGoals, loadBoardData, loadLockInState } from '../lib/lockIn'
const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAILY_STREAK_RESET_KEY = 'phasr_daily_streak_reset_2026_05_20_v1'
const milestones = [
  {
    day: 3,
    label: 'Sage starts remembering you',
    description: 'Sage now references your journal entries and past answers when she responds. Everything gets more personal from here.',
    icon: '🧠',
  },
  {
    day: 7,
    label: 'Your first weekly pulse',
    description: 'You completed your first full week. Sage gives you one pattern from your week that you would not have seen yourself.',
    icon: '💓',
  },
  {
    day: 14,
    label: 'Your statistics come alive',
    description: 'Two weeks of real data. Your statistics page now shows your completion rate, best days, and first patterns.',
    icon: '📊',
  },
  {
    day: 30,
    label: 'Your first monthly report',
    description: 'One month in. Sage generates a one-page report of what shifted, what you built, and what to focus on next.',
    icon: '📋',
  },
  {
    day: 60,
    label: 'The deeper journal unlocks',
    description: 'Sixty days means you are ready for the harder conversations. Reality Check and Unsent Message templates are now active.',
    icon: '🔓',
  },
  {
    day: 90,
    label: 'Your Phase 1 Legacy card',
    description: 'Ninety days. Sage writes your legacy card — who you were when you started versus who you are now, in your own words.',
    icon: '✨',
  },
]

function getMilestoneState(milestone, currentStreak) {
  if (currentStreak >= milestone.day) return 'achieved'
  if (milestones.find(m => m.day > currentStreak)?.day === milestone.day) return 'next'
  return 'upcoming'
}

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Derived task caches should not crash the screen when storage is full.
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Ignore storage quota errors for non-critical cache writes.
  }
}

function loadVisionBoardFromStorage() {
  try {
    const activeUserId = localStorage.getItem('phasr_active_user') || ''
    const keys = [activeUserId ? `phasr_vb:${activeUserId}` : null, 'phasr_vb'].filter(Boolean)
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (raw) return JSON.parse(raw)
    }
    return null
  } catch {
    return null
  }
}

function parseDateOnly(value) {
  const text = String(value || '').trim().slice(0, 10)
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  const [, year, month, day] = match
  return new Date(Number(year), Number(month) - 1, Number(day))
}

function normalizeLabel(value) {
  return String(value || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildFingerprint(phase) {
  const text = [
    phase?.id || '',
    phase?.name || '',
    phase?.startDate || '',
    phase?.endDate || '',
    ...(Array.isArray(phase?.pillars) ? phase.pillars.flatMap((pillar, index) => [
      pillar?.id || index,
      pillar?.name || '',
    ]) : []),
  ].join('|')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return `${phase?.id || 'phase'}_${Math.abs(hash)}`
}

function hasConfiguredPillars(phase) {
  const pillars = Array.isArray(phase?.pillars) ? phase.pillars : []
  return pillars.some(pillar => {
    const activities = Array.isArray(pillar?.activities) ? pillar.activities.filter(Boolean) : []
    const weeklyActions = Array.isArray(pillar?.weeklyActions) ? pillar.weeklyActions.filter(Boolean) : []
    return activities.length > 0 || weeklyActions.length > 0 || pillar?.beforeImage || pillar?.afterImage || pillar?.beforeState || pillar?.afterState
  })
}

function buildActivities(phase) {
  const pillars = Array.isArray(phase?.pillars) ? phase.pillars : []
  return pillars.flatMap((pillar, pillarIndex) =>
    (Array.isArray(pillar?.activities) ? pillar.activities : [])
      .map((item, activityIndex) => {
        const description = String(item || '').trim()
        if (!description) return null
        return {
          id: `${pillar?.id || `pillar-${pillarIndex}`}_act${activityIndex}`,
          description,
          pillar: String(pillar?.name || `Pillar ${pillarIndex + 1}`).trim(),
        }
      })
      .filter(Boolean)
  )
}

function buildNonNegotiables(phase) {
  const pillars = Array.isArray(phase?.pillars) ? phase.pillars : []
  return pillars.flatMap((pillar, pillarIndex) =>
    (Array.isArray(pillar?.weeklyActions) ? pillar.weeklyActions : [])
      .map((item, nonNegIndex) => {
        const description = String(item || '').trim()
        if (!description) return null
        return {
          id: `${pillar?.id || `pillar-${pillarIndex}`}_nn${nonNegIndex}`,
          description,
          pillar: String(pillar?.name || `Pillar ${pillarIndex + 1}`).trim(),
        }
      })
      .filter(Boolean)
  )
}

function pulseDoneForWeek(phaseName, weekNumber) {
  const entries = safeRead('phasr_journal_v2', [])
  const phaseKey = normalizeLabel(phaseName)
  const fromEntries = entries.some(entry => {
    const metaWeek = Number(entry?.weeklyPulseMeta?.weekNumber || 0)
    const metaPhase = normalizeLabel(entry?.weeklyPulseMeta?.phaseName || '')
    const title = String(entry?.title || '').toLowerCase()
    return (metaWeek === weekNumber || (title.includes('weekly pulse') && title.includes(`week ${weekNumber}`))) &&
      (!metaPhase || metaPhase === phaseKey)
  })
  return fromEntries || localStorage.getItem(`phasr_weekly_pulse_w${weekNumber}_done`) === 'true'
}

function isQuarterlyReviewComplete(phase) {
  const fields = [
    phase?.reviewWorked,
    phase?.reviewDrained,
    phase?.reviewPaid,
    phase?.reviewStrategy,
  ]
  return fields.every(value => String(value || '').trim().length > 0)
}

function taskKey(week, day, scope = 'global') {
  return `phasr_tasks_${scope}_w${week}_d${day}`
}

function weekStartKey(scope, week) {
  return `phasr_week_start_${scope}_w${week}`
}

function getWeekStartDate(scope, week) {
  const today = new Date().toISOString().slice(0, 10)
  const key = weekStartKey(scope, week)
  const saved = localStorage.getItem(key)
  if (saved) return saved
  safeSet(key, today)
  return today
}

function nonNegCompleteKey(week, nonNegIndex, scope = 'global') {
  return `phasr_nn_complete_${scope}_w${week}_nn${nonNegIndex}`
}

function parseNonNegotiable(text) {
  const numericMatch = text.match(/(\d[\d,]*)\s*(steps?|calories?|reps?|minutes?|hours?|pages?|words?)/i)
  if (numericMatch) {
    return {
      type: 'numeric',
      target: parseInt(numericMatch[1].replace(/,/g, ''), 10),
      unit: numericMatch[2].toLowerCase(),
      text,
    }
  }

  const freqMatch = text.match(/(\d+)\s*times?\s*(a\s*)?(week|weekly)/i)
  if (freqMatch) {
    return {
      type: 'frequency',
      timesPerWeek: parseInt(freqMatch[1], 10),
      text,
    }
  }

  return { type: 'habit', text }
}

function generateWeekSchedule(nonNeg) {
  const parsed = parseNonNegotiable(nonNeg.description)
  const schedule = {}

  if (parsed.type === 'numeric') {
    const avg = parsed.target / 7
    const dailyAmounts = [
      Math.round(avg * 0.7),
      Math.round(avg * 0.8),
      Math.round(avg * 0.9),
      Math.round(avg * 1.0),
      Math.round(avg * 1.1),
      Math.round(avg * 1.2),
      Math.round(avg * 1.3),
    ]
    const total = dailyAmounts.reduce((sum, amount) => sum + amount, 0)
    const scale = total ? parsed.target / total : 1
    const scaled = dailyAmounts.map(amount => Math.round(amount * scale))
    const diff = parsed.target - scaled.reduce((sum, amount) => sum + amount, 0)
    if (scaled.length) scaled[scaled.length - 1] += diff

    for (let day = 1; day <= 7; day += 1) {
      schedule[day] = `${Math.max(0, scaled[day - 1]).toLocaleString()} ${parsed.unit} today`
    }
  }

  if (parsed.type === 'frequency') {
    const frequencyDayMap = {
      7: [1, 2, 3, 4, 5, 6, 7],
      6: [1, 2, 3, 4, 5, 6],
      5: [1, 2, 3, 5, 6],
      4: [1, 2, 4, 6],
      3: [1, 3, 5],
      2: [2, 5],
      1: [3],
    }
    const activeDays = frequencyDayMap[parsed.timesPerWeek] || frequencyDayMap[3]
    for (let day = 1; day <= 7; day += 1) {
      schedule[day] = activeDays.includes(day)
        ? nonNeg.description.replace(/\d+\s*times?\s*(a\s*)?(week|weekly)/i, 'today')
        : null
    }
  }

  if (parsed.type === 'habit') {
    const isDaily = /daily|every day|each day/i.test(nonNeg.description)
    for (let day = 1; day <= 7; day += 1) {
      schedule[day] = isDaily ? nonNeg.description : (day === 3 ? nonNeg.description : null)
    }
  }

  return schedule
}

function getScheduleKey(weekNumber, nonNegIndex) {
  return `phasr_schedule_w${weekNumber}_nn${nonNegIndex}`
}

function buildDayTasks(activities, weekNumber, dayNumber) {
  return activities.map((activity, activityIndex) => ({
    id: `act${activityIndex}_w${weekNumber}_d${dayNumber}`,
    description: activity.description,
    pillar: activity.pillar,
    done: false,
  }))
}

function sameTaskShape(savedTasks, nextTasks) {
  if (!Array.isArray(savedTasks) || savedTasks.length !== nextTasks.length) return false
  return savedTasks.every((task, index) =>
    task?.id === nextTasks[index]?.id &&
    task?.description === nextTasks[index]?.description &&
    task?.pillar === nextTasks[index]?.pillar
  )
}

function mergeTaskProgress(savedTasks, nextTasks) {
  const buildTaskMatchKey = task => [task?.id, task?.description, task?.pillar].join('::')
  const savedMap = new Map((savedTasks || []).map(task => [buildTaskMatchKey(task), task]))
  return nextTasks.map(task => ({
    ...task,
    done: Boolean(savedMap.get(buildTaskMatchKey(task))?.done),
  }))
}

function getTodaysTasks(activities, weekNumber, dayNumber, scope = 'global') {
  const cacheKey = taskKey(weekNumber, dayNumber, scope)
  const cached = safeRead(cacheKey, null)
  const baseTasks = buildDayTasks(activities, weekNumber, dayNumber)

  if (sameTaskShape(cached, baseTasks)) return cached

  const nextTasks = Array.isArray(cached)
    ? mergeTaskProgress(cached, baseTasks)
    : baseTasks

  safeWrite(cacheKey, nextTasks)
  return nextTasks
}

function checkNonNegComplete(nonNegIndex, weekNumber, scope = 'global') {
  let allDone = true
  let foundTask = false
  for (let day = 1; day <= 7; day += 1) {
    const tasks = safeRead(taskKey(weekNumber, day, scope), [])
    const nonNegTask = tasks.find(task => task.nonNegIndex === nonNegIndex)
    if (nonNegTask) {
      foundTask = true
      if (!nonNegTask.done) {
        allDone = false
        break
      }
    }
  }
  if (foundTask && allDone) {
    safeSet(nonNegCompleteKey(weekNumber, nonNegIndex, scope), 'true')
  }
}

function countDaysDone(week, dayLimit = 7, scope = 'global') {
  let done = 0
  for (let day = 1; day <= dayLimit; day += 1) {
    const scopedValue = localStorage.getItem(`phasr_streak_${scope}_w${week}_d${day}`)
    const legacyValue = localStorage.getItem(`phasr_streak_w${week}_d${day}`)
    const isDone = (scopedValue ?? legacyValue) === 'true'
    if (isDone) done += 1
  }
  return done
}

function hasTrackedProgressForScope(scope = 'global') {
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || ''
      const isScopedTask = key.startsWith(`phasr_tasks_${scope}_w`)
      const isScopedStreak = key.startsWith(`phasr_streak_${scope}_w`)
      if (!isScopedTask && !isScopedStreak) continue
      if (isScopedStreak && localStorage.getItem(key) === 'true') return true
      if (isScopedTask) {
        const tasks = safeRead(key, [])
        if (Array.isArray(tasks) && tasks.some(task => task?.done)) return true
      }
    }
  } catch {
    return false
  }
  return false
}

function resetDailyStreakToFreshStart() {
  if (localStorage.getItem(DAILY_STREAK_RESET_KEY) === 'true') return
  const prefixes = ['phasr_tasks_', 'phasr_streak_', 'phasr_nonneg_', 'phasr_current_week']
  try {
    const keysToRemove = []
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index) || ''
      if (prefixes.some(prefix => key.startsWith(prefix))) keysToRemove.push(key)
    }
    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch {
    // If storage cleanup fails, the fresh start date below still prevents old week jumps.
  }
  const todayKey = new Date().toISOString().slice(0, 10)
  safeSet('phasr_joined_at', todayKey)
  safeSet('phasr_phase1_start_date', todayKey)
  safeSet('phasr_current_week', '1')
  safeSet(DAILY_STREAK_RESET_KEY, 'true')
}

function countWeekTasksDone(week, scope = 'global') {
  let done = 0
  for (let day = 1; day <= 7; day += 1) {
    const tasks = safeRead(taskKey(week, day, scope), [])
    done += tasks.filter(item => item.done).length
  }
  return done
}

function countWeekTasksAssigned(week, scope = 'global') {
  let assigned = 0
  for (let day = 1; day <= 7; day += 1) {
    const tasks = safeRead(taskKey(week, day, scope), [])
    assigned += Array.isArray(tasks) ? tasks.length : 0
  }
  return assigned
}

function formatPhasePercentLabel(value) {
  if (!Number.isFinite(value) || value <= 0) return '0'
  if (value < 1) return value.toFixed(2)
  if (value < 10) return value.toFixed(1)
  return String(Math.floor(value))
}

function loadVisionBoardForPhaseStats() {
  try {
    const raw = localStorage.getItem('phasr_vb')
    if (raw) return JSON.parse(raw)
  } catch {
    // Fall through to the existing board reader below.
  }
  return loadVisionBoardFromStorage()
}

function calculatePhaseTaskStats(activePhaseId, tasksPerWeek) {
  const board = loadVisionBoardForPhaseStats()
  const phases = Array.isArray(board?.phases) ? board.phases : []
  const phase = phases.find(item => item.id === activePhaseId) || phases[0] || null
  const phaseFingerprint = buildFingerprint(phase || {})
  const phaseActivities = buildActivities(phase)
  const start = parseDateOnly(phase?.startDate)
  const end = parseDateOnly(phase?.endDate)
  const derivedTasksPerWeek = phaseActivities.length * 7
  const safeTasksPerWeek = Number.isFinite(tasksPerWeek) && tasksPerWeek > 0
    ? tasksPerWeek
    : derivedTasksPerWeek

  if (!phase || !start || !end || end < start || safeTasksPerWeek <= 0) {
    return {
      completedTasks: 0,
      totalTasksInPhase: 0,
      phasePercent: 0,
    }
  }

  const totalDaysInPhase = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  const totalWeeksInPhase = Math.max(Math.ceil(totalDaysInPhase / 7), 1)
  const totalTasksInPhase = totalWeeksInPhase * safeTasksPerWeek
  const buildTaskMatchKey = task => [task?.id, task?.description, task?.pillar].join('::')

  let completedTasks = 0
  for (let week = 1; week <= totalWeeksInPhase; week += 1) {
    for (let day = 1; day <= 7; day += 1) {
      const storedTasks = safeRead(taskKey(week, day, phaseFingerprint), [])
      const expectedTasks = buildDayTasks(phaseActivities, week, day)
      if (!Array.isArray(storedTasks) || !expectedTasks.length) continue
      const storedMap = new Map(storedTasks.map(task => [buildTaskMatchKey(task), task]))
      completedTasks += expectedTasks.filter(task => Boolean(storedMap.get(buildTaskMatchKey(task))?.done)).length
    }
  }

  if (completedTasks <= 0 || totalTasksInPhase <= 0) {
    return {
      completedTasks: 0,
      totalTasksInPhase,
      phasePercent: 0,
    }
  }

  const rawPercent = Math.floor((completedTasks / totalTasksInPhase) * 100)
  const phasePercent = Number.isFinite(rawPercent)
    ? Math.min(100, Math.max(0, rawPercent))
    : 0

  return {
    completedTasks,
    totalTasksInPhase,
    phasePercent,
  }
}

export default function DailyCheckin({ onLockInChange, onOpenBoard, onOpenWeeklyPulse, onOpenQuarterlyReview, ...props }) {
  resetDailyStreakToFreshStart()
  const [lockInState, setLockInState] = useState(() => loadLockInState())
  const [refresh, setRefresh] = useState(0)
  const [sageCardExpanded] = useState(false)
  const [milestoneMessage, setMilestoneMessage] = useState('')
  const [phaseStats, setPhaseStats] = useState({
    completedTasks: 0,
    totalTasksInPhase: 0,
    phasePercent: 0,
  })

  useEffect(() => {
    const sync = () => {
      setLockInState(loadLockInState())
      setRefresh(value => value + 1)
    }
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('phasr-user-level-updated', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('phasr-user-level-updated', sync)
    }
  }, [])

  const boardData = useMemo(() => loadBoardData(), [refresh])
  const phases = useMemo(() => {
    const next = Array.isArray(boardData?.phases) ? [...boardData.phases] : []
    next.sort((a, b) => {
      const aNum = Number(String(a?.name || '').replace(/[^\d]/g, '')) || 999
      const bNum = Number(String(b?.name || '').replace(/[^\d]/g, '')) || 999
      return aNum - bNum
    })
    return next
  }, [boardData])
  const [activePhaseId, setActivePhaseId] = useState(() => boardData?.activePhaseId || phases[0]?.id || null)

  useEffect(() => {
    if (!phases.some(phase => phase.id === activePhaseId)) {
      setActivePhaseId(boardData?.activePhaseId || phases[0]?.id || null)
    }
  }, [activePhaseId, boardData, phases])

  const phaseBoard = useMemo(() => ({ ...(boardData || {}), activePhaseId }), [boardData, activePhaseId])
  const weeklyData = useMemo(() => buildWeeklyGoals(phaseBoard, lockInState), [phaseBoard, lockInState])
  const currentPhase = phases.find(phase => phase.id === activePhaseId) || phases[0] || null
  const hasPillars = hasConfiguredPillars(currentPhase)
  const activities = useMemo(() => buildActivities(currentPhase), [currentPhase])
  const nonNegotiables = useMemo(() => buildNonNegotiables(currentPhase), [currentPhase])
  const phaseScope = useMemo(() => buildFingerprint(currentPhase || {}), [currentPhase])
  const totalWeeks = Math.max(weeklyData.weeks?.length || 1, 1)
  const tasksPerWeek = activities.length * 7
  const [activeWeek, setActiveWeek] = useState(1)
  const [tasks, setTasks] = useState([])
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [lockedWeekMessage, setLockedWeekMessage] = useState('')

  const weekStatuses = useMemo(() => {
    return (weeklyData.weeks || []).map(item => {
      const daysDone = hasPillars ? countDaysDone(item.index, 7, phaseScope) : 0
      const pulseDone = pulseDoneForWeek(currentPhase?.name, item.index) && daysDone === 7
      return {
        week: item.index,
        daysDone,
        pulseDone,
      }
    })
  }, [weeklyData.weeks, hasPillars, currentPhase, tasks, refresh])
  const phaseStart = useMemo(() => {
    const todayKey = new Date().toISOString().slice(0, 10)
    const joinedAt = String(localStorage.getItem('phasr_joined_at') || '').slice(0, 10)
    const stored = localStorage.getItem('phasr_phase1_start_date')
    const storedScope = localStorage.getItem('phasr_phase1_start_scope')
    const joinedDate = parseDateOnly(joinedAt)
    const storedDate = parseDateOnly(stored)
    const todayDate = parseDateOnly(todayKey)
    const normalizedJoinedAt = joinedDate ? joinedAt : todayKey
    if (!joinedAt) {
      safeSet('phasr_joined_at', normalizedJoinedAt)
    }
    const hasProgress = hasTrackedProgressForScope(phaseScope)
    const shouldResetStaleStart =
      !hasProgress &&
      storedDate &&
      todayDate &&
      storedDate.getTime() < todayDate.getTime()
    const nextStart =
      storedScope === phaseScope && storedDate && !shouldResetStaleStart
        ? stored
        : todayKey

    safeSet('phasr_phase1_start_date', nextStart)
    if (storedScope !== phaseScope) {
      safeSet('phasr_phase1_start_scope', phaseScope)
    }

    return nextStart
  }, [phaseScope])
  const dayOfPhase = useMemo(() => {
    const start = parseDateOnly(phaseStart)
    const today = parseDateOnly(new Date().toISOString().slice(0, 10))
    const startMs = start?.getTime()
    const todayMs = today?.getTime()
    if (!Number.isFinite(startMs) || !Number.isFinite(todayMs)) return 1
    return Math.max(Math.floor((todayMs - startMs) / 86400000) + 1, 1)
  }, [phaseStart])
  const daysIn = dayOfPhase
  const currentWeek = useMemo(() => Math.max(Math.min(totalWeeks, Math.ceil(dayOfPhase / 7)), 1), [dayOfPhase, totalWeeks])
  const currentDayNumber = useMemo(() => ((dayOfPhase - 1) % 7) + 1, [dayOfPhase])
  const dayOfWeek = currentDayNumber

  useEffect(() => {
    setActiveWeek(currentWeek)
  }, [currentWeek, activePhaseId])

  useEffect(() => {
    safeSet('phasr_current_week', String(currentWeek))
  }, [currentWeek])

  const week = weeklyData.weeks.find(item => item.index === activeWeek) || weeklyData.weeks[0] || null
  const displayedDay = activeWeek === currentWeek ? dayOfWeek : 7
  const weekDayCards = useMemo(() => WEEKDAY_LABELS.map((label, index) => {
    const day = index + 1
    const dayTasks = safeRead(taskKey(activeWeek, day, phaseScope), [])
    const streakValue = localStorage.getItem(`phasr_streak_${phaseScope}_w${activeWeek}_d${day}`) ?? localStorage.getItem(`phasr_streak_w${activeWeek}_d${day}`)
    const isFuture = activeWeek > currentWeek || (activeWeek === currentWeek && day > currentDayNumber)
    const isCurrent = activeWeek === currentWeek && day === currentDayNumber
    const isPast = activeWeek < currentWeek || (activeWeek === currentWeek && day < currentDayNumber)
    const anyTaskDone = Array.isArray(dayTasks) && dayTasks.some(task => task?.done)
    const done = streakValue === 'true' || anyTaskDone
    return { label, day, done, isCurrent, isPast, isFuture }
  }), [activeWeek, currentWeek, currentDayNumber, phaseScope, tasks, refresh])

  useEffect(() => {
    if (!hasPillars || !week) {
      setTasks([])
      return
    }
    setTasks(getTodaysTasks(activities, activeWeek, displayedDay, phaseScope))
  }, [hasPillars, week, activities, displayedDay, activeWeek, phaseScope])

  const todaysTasks = useMemo(() => safeRead(taskKey(activeWeek, displayedDay, phaseScope), []), [activeWeek, displayedDay, phaseScope, tasks, refresh])
  const completedToday = todaysTasks.filter(task => task.done).length
  const totalToday = todaysTasks.length
  const daysCompleted = useMemo(() => hasPillars ? countDaysDone(activeWeek, displayedDay, phaseScope) : 0, [hasPillars, activeWeek, displayedDay, phaseScope, tasks])
  const completedTasksThisWeek = useMemo(() => hasPillars ? countWeekTasksDone(activeWeek, phaseScope) : 0, [hasPillars, activeWeek, phaseScope, tasks])
  const totalTasksThisWeek = useMemo(() => hasPillars ? countWeekTasksAssigned(activeWeek, phaseScope) : 0, [hasPillars, activeWeek, phaseScope, tasks])
  const weekPercent = totalTasksThisWeek ? Math.round((completedTasksThisWeek / totalTasksThisWeek) * 100) : 0
  const currentPulseDone = weekStatuses.find(item => item.week === activeWeek)?.pulseDone || false
  const previousPulseDone = activeWeek === 1 ? true : (weekStatuses.find(item => item.week === activeWeek - 1)?.pulseDone || false)
  const isNewUser = activeWeek === 1 && displayedDay === 1 && completedTasksThisWeek === 0
  const showReminder = activeWeek > 1 && displayedDay > 1 && !previousPulseDone
  const weekComplete = daysCompleted === 7
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const accent = 'var(--app-accent)'
  const accent2 = 'var(--app-accent2)'
  const pagePadding = isMobile ? '14px 14px 0' : '22px 32px 96px'
  const contentMaxWidth = 1040

  const currentStreak = useMemo(() => {
    const readStreakValue = (weekNumber, dayNumber) => {
      const scopedValue = localStorage.getItem(`phasr_streak_${phaseScope}_w${weekNumber}_d${dayNumber}`)
      if (scopedValue != null) return scopedValue
      return localStorage.getItem(`phasr_streak_w${weekNumber}_d${dayNumber}`)
    }

    let streak = 0
    let weekNumber = currentWeek
    let dayNumber = currentDayNumber

    if (readStreakValue(weekNumber, dayNumber) !== 'true') return 0

    while (weekNumber >= 1 && dayNumber >= 1) {
      const isSuccessful = readStreakValue(weekNumber, dayNumber) === 'true'
      if (!isSuccessful) break
      streak += 1
      dayNumber -= 1
      if (dayNumber < 1) {
        weekNumber -= 1
        dayNumber = 7
      }
    }

    return streak
  }, [currentWeek, currentDayNumber, phaseScope, tasks, refresh])
  const currentLevel =
    currentStreak >= 90 ? 5
      : currentStreak >= 61 ? 4
        : currentStreak >= 31 ? 3
          : currentStreak >= 15 ? 2 : 1
  const levelLabels = {
    1: 'Day {streak} in',
    2: 'Building momentum',
    3: 'Consistent',
    4: 'Locked in',
    5: 'Unstoppable',
  }
  const streakLabel = currentLevel === 1
    ? `Day ${daysIn} in`
    : levelLabels[currentLevel]
  const currentMilestone = milestones.filter(item => item.day <= daysIn).slice(-1)[0]
  const nextMilestone = milestones.find(item => item.day > daysIn)
  const unlockPathLabel =
    daysIn >= 90 ? 'Legacy active'
      : daysIn >= 60 ? 'Deep reflection'
        : daysIn >= 30 ? 'Monthly insight'
          : daysIn >= 14 ? 'Pattern visibility'
            : daysIn >= 7 ? 'Weekly rhythm active'
              : daysIn >= 3 ? 'Personalization building'
                : 'Sage learning you'
  const unlockPathMessage = daysIn <= 3 ? 'Sage is getting to know you' : unlockPathLabel
  const completedTasksThisPhase = phaseStats.completedTasks
  const totalTasksThisPhase = phaseStats.totalTasksInPhase
  const phasePercent = phaseStats.phasePercent
  const exactPhasePercent = totalTasksThisPhase > 0
    ? Math.min(100, Math.max(0, (completedTasksThisPhase / totalTasksThisPhase) * 100))
    : 0
  const displayPhasePercent = formatPhasePercentLabel(exactPhasePercent)
  const progressToNext = nextMilestone
    ? Math.min(Math.round((daysIn / nextMilestone.day) * 100), 100)
    : 100

  const buildProgressTrackStyle = background => ({
    height: 4,
    background,
    borderRadius: 99,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  })
  const buildProgressFillStyle = (percent, background) => ({
    height: '100%',
    width: `${percent}%`,
    background,
    borderRadius: 99,
    transition: 'width 0.5s ease',
  })
  const phaseProgressTrackStyle = buildProgressTrackStyle('rgba(0,0,0,0.08)')
  const phaseProgressFillStyle = {
    height: '100%',
    width: `${exactPhasePercent}%`,
    minWidth: completedTasksThisPhase > 0 ? 6 : 0,
    background: 'linear-gradient(90deg, #059669, #34d399)',
    borderRadius: 99,
    transition: 'width 0.5s ease',
  }
  const unlockProgressTrackStyle = buildProgressTrackStyle('rgba(0,0,0,0.08)')
  const unlockProgressFillStyle = buildProgressFillStyle(progressToNext, 'linear-gradient(90deg, #7c3aed, #a78bfa)')
  const statCardStyle = {
    borderRadius: '14px',
    padding: '12px 12px 14px',
    minHeight: 110,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    gap: 8,
  }
  const statCardInnerStyle = {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    textAlign: 'center',
    gap: 12,
    paddingTop: 2,
    flex: 1,
  }

  useEffect(() => {
    const unlockState = {
      streakDays: currentStreak,
      completedActionsThisWeek: completedTasksThisWeek,
      rank: streakLabel,
      rankSubtitle: `${currentStreak} ${currentStreak === 1 ? 'day' : 'days'} active`,
      stageLevel: currentLevel,
      stageLabel: streakLabel,
      milestones,
      currentMilestone,
      nextMilestone,
      allFeaturesAvailable: true,
    }

    safeWrite('phasr_unlock_state', unlockState)
    window.dispatchEvent(new CustomEvent('phasr-unlocks-updated', { detail: unlockState }))
  }, [currentStreak, completedTasksThisWeek, currentLevel, currentMilestone, nextMilestone, streakLabel])

  useEffect(() => {
    const unlockedMilestone = milestones.find(item => item.day === daysIn)
    if (!unlockedMilestone) {
      setMilestoneMessage('')
      return undefined
    }

    const shownKey = `phasr_milestone_shown_${unlockedMilestone.day}`
    if (localStorage.getItem(shownKey)) {
      setMilestoneMessage('')
      return undefined
    }

    setMilestoneMessage(unlockedMilestone.description)
    safeSet(shownKey, 'true')

    const timeoutId = window.setTimeout(() => {
      setMilestoneMessage('')
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [daysIn])

  function recalculatePhaseStats() {
    setPhaseStats(calculatePhaseTaskStats(activePhaseId, tasksPerWeek))
  }

  useEffect(() => {
    recalculatePhaseStats()
  }, [activePhaseId, phaseScope, tasksPerWeek, refresh, tasks])

  function canAccessWeek(weekNumber) {
    if (weekNumber === 1) return true
    const previous = weekStatuses.find(item => item.week === weekNumber - 1)
    return Boolean(previous?.pulseDone)
  }

  function toggleTask(taskId) {
    const updated = tasks.map(item => item.id === taskId ? { ...item, done: !item.done } : item)
    safeWrite(taskKey(activeWeek, displayedDay, phaseScope), updated)
    setTasks(updated)
    setLockInState(loadLockInState())
    onLockInChange?.()

    const checkedInToday = updated.some(item => item.done)
    if (checkedInToday) {
      safeSet(`phasr_streak_${phaseScope}_w${activeWeek}_d${displayedDay}`, 'true')
      safeSet(`phasr_streak_w${activeWeek}_d${displayedDay}`, 'true')
    } else {
      safeSet(`phasr_streak_${phaseScope}_w${activeWeek}_d${displayedDay}`, 'false')
      safeSet(`phasr_streak_w${activeWeek}_d${displayedDay}`, 'false')
    }
    setPhaseStats(calculatePhaseTaskStats(activePhaseId, tasksPerWeek))
    const task = updated.find(item => item.id === taskId)
    if (task) checkNonNegComplete(task.nonNegIndex, activeWeek, phaseScope)
  }

  function getPhaseLabel(phaseId) {
    const index = phases.findIndex(phase => phase.id === phaseId)
    return `Phase ${Math.max(1, index + 1)}`
  }

  function openPulse() {
    onOpenWeeklyPulse?.({
      weekNumber: activeWeek,
      completionPercent: weekPercent,
      tasksCompleted: completedTasksThisWeek,
      tasksTotal: totalTasksThisWeek,
      phaseName: getPhaseLabel(activePhaseId),
    })
  }

  function openQuarterlyReview() {
    onOpenQuarterlyReview?.(currentPhase)
  }

  function handlePhaseChange(nextPhaseId) {
    if (nextPhaseId === activePhaseId) {
      onOpenBoard?.()
      return
    }
    const currentIndex = phases.findIndex(item => item.id === activePhaseId)
    const nextIndex = phases.findIndex(item => item.id === nextPhaseId)
    if (currentIndex >= 0 && nextIndex > currentIndex) {
      if (!isQuarterlyReviewComplete(currentPhase)) {
        setShowPhaseModal(true)
        return
      }
    }
    setActivePhaseId(nextPhaseId)
  }

  return (
    <div style={{ minHeight: isMobile ? 'auto' : 'calc(100vh - 56px)', background: 'var(--app-bg)', color: 'var(--app-text)', width: '100%', overflowX: 'hidden', paddingBottom: isMobile ? 0 : 0 }}>
      <div style={{ width: '100%', maxWidth: contentMaxWidth, margin: '0 auto', padding: pagePadding, boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {phases.map((phase, index) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => handlePhaseChange(phase.id)}
              style={{
                minHeight: 44,
                padding: '10px 18px',
                borderRadius: 999,
                border: phase.id === activePhaseId ? '1px solid transparent' : '1px solid #f2c8d6',
                background: phase.id === activePhaseId ? `linear-gradient(135deg,${accent2},${accent})` : '#fff',
                color: phase.id === activePhaseId ? '#fff' : 'var(--app-text)',
                fontFamily: "'Syne', sans-serif",
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {`Phase ${index + 1}`}
            </button>
          ))}
        </div>

        <div style={{ height: 16 }} />

        <div style={{ background: '#fff', border: '1.5px solid #f2c4d0', borderRadius: 14, padding: isMobile ? '0.95rem' : '1.1rem', marginBottom: '1rem', boxShadow: '0 14px 34px rgba(240, 96, 144, 0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8407a, #f472a8)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '0.55rem' }}>SAGE</div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e8407a' }}>Live Score</p>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <p style={{ fontSize: '0.65rem', color: '#b08090', margin: 0 }}>{weekPercent}% this week</p>
              <button
                type="button"
                onClick={openPulse}
                style={{ minHeight: 28, padding: '0.35rem 0.65rem', borderRadius: 999, border: '1px solid #f2c8d6', background: '#fff6f9', color: '#e8407a', fontSize: '0.68rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Weekly Reflection
              </button>
            </div>
          </div>

          {!sageCardExpanded && (
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              {hasPillars ? `Day ${dayOfWeek} of 7. You have completed ${completedToday} of ${totalToday} tasks today.` : 'Add pillar activities in Vision Board to activate your streak.'}
            </p>
          )}

          {sageCardExpanded && (
            <>
          {!hasPillars && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Add your pillar activities in Vision Board and they will appear in your daily to-do automatically.
            </p>
          )}
          {hasPillars && isNewUser && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Your week 1 starts today. Complete your daily tasks and come back tomorrow. Sage will track your progress and guide you as the week builds.
            </p>
          )}
          {hasPillars && !isNewUser && milestoneMessage && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              {milestoneMessage}
            </p>
          )}
          {hasPillars && !isNewUser && !milestoneMessage && weekComplete && !currentPulseDone && (
            <>
              <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6, marginBottom: 12 }}>
                Week {activeWeek} closed at {weekPercent}%. Complete Weekly Reflection before week {activeWeek + 1} opens.
              </p>
              <button onClick={openPulse} style={{ width: '100%', minHeight: 46, padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                Weekly Reflection
              </button>
            </>
          )}
          {hasPillars && !isNewUser && !milestoneMessage && weekComplete && currentPulseDone && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Week {activeWeek} done. Reflection complete. Week {activeWeek + 1} is open.
            </p>
          )}
          {hasPillars && !isNewUser && !milestoneMessage && !weekComplete && showReminder && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              You are {displayedDay} days into week {activeWeek}. Your week {activeWeek - 1} reflection with Sage is still pending.
              <button type="button" onClick={openPulse} style={{ marginLeft: 6, border: 'none', background: 'transparent', color: '#e8407a', fontWeight: 800, cursor: 'pointer', padding: '4px 0', font: 'inherit' }}>Complete now</button>
            </p>
          )}
          {hasPillars && !isNewUser && !milestoneMessage && !weekComplete && !showReminder && (
              <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              {`Day ${dayOfWeek} of 7. You have completed ${completedToday} of ${totalToday} tasks today.`}
            </p>
          )}
            </>
          )}
        </div>

        {!hasPillars && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '1px solid #f2c8d6', borderRadius: 14, background: '#fff6f9', marginBottom: '1rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8 }}>Set up your Vision Board first</p>
            <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 12 }}>
              Your daily tasks come from your pillar activities. Add them to your Vision Board to activate your streak.
            </p>
            <button type="button" onClick={onOpenBoard} style={{ minHeight: 44, borderRadius: 999, border: `1px solid ${accent}`, background: 'transparent', color: accent, padding: '0.55rem 0.95rem', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              Go to Vision Board
            </button>
          </div>
        )}

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7e5d68', marginBottom: 10 }}>All Weeks</div>
        <div style={{ overflowX: 'auto', paddingBottom: 2 }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', minWidth: '100%' }}>
            {weeklyData.weeks.map(item => {
              const active = item.index === activeWeek
              const locked = !canAccessWeek(item.index)
              const pulseDone = weekStatuses.find(weekItem => weekItem.week === item.index)?.pulseDone || false
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (locked) {
                      setLockedWeekMessage(`Finish Week ${item.index - 1} and complete Weekly Reflection first.`)
                      return
                    }
                    setActiveWeek(item.index)
                  }}
                  style={{
                    minHeight: 42,
                    padding: isMobile ? '8px 13px' : '8px 14px',
                    borderRadius: 999,
                    border: active ? `1px solid ${accent}` : '1px solid #f2c8d6',
                    background: active ? '#fff1f6' : '#fff',
                    color: active ? accent : 'var(--app-text)',
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    opacity: locked ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pulseDone ? `Week ${item.index} done` : `Week ${item.index}`}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 14 }} />

        {lockedWeekMessage ? (
          <div style={{ background: '#fff8ec', border: '1px solid #f3d38a', borderRadius: 14, padding: '0.9rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#5a4310', lineHeight: 1.5 }}>
              {lockedWeekMessage}
            </p>
            <button
              type="button"
              onClick={() => setLockedWeekMessage('')}
              style={{ minWidth: 44, minHeight: 44, border: 'none', background: 'transparent', color: '#9f7a18', fontWeight: 700, cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        ) : null}

        {hasPillars ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
            gap: isMobile ? 5 : 8,
            marginBottom: 12,
            position: 'relative',
            zIndex: 2,
            pointerEvents: 'auto',
          }}>
            {weekDayCards.map(day => (
              <div
                key={`${activeWeek}-${day.day}`}
                style={{
                  minHeight: isMobile ? 56 : 64,
                  borderRadius: 12,
                  border: day.isCurrent ? `1.5px solid ${accent}` : '1px solid #f2c8d6',
                  background: day.isFuture ? '#fffafd' : day.done ? '#ffe4ee' : '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  opacity: day.isFuture ? 0.55 : 1,
                  boxShadow: day.isCurrent ? '0 10px 22px rgba(240,96,144,0.13)' : 'none',
                }}
              >
                <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 800, color: day.isCurrent ? accent : '#7e5d68' }}>{day.label}</span>
                <span style={{ width: 18, height: 18, borderRadius: '50%', border: `1.5px solid ${day.done ? accent : '#f2c8d6'}`, background: day.done ? accent : '#fff', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 10, lineHeight: 1 }}>
                  {day.done ? '✓' : ''}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, color: day.isFuture ? '#c39aaa' : day.isCurrent ? accent : '#b08090' }}>
                  {day.isFuture ? 'Locked' : day.isCurrent ? 'Today' : day.done ? 'Done' : day.isPast ? 'Open' : ''}
                </span>
              </div>
            ))}
          </div>
        ) : null}

        <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 14, padding: isMobile ? 14 : 18, boxShadow: '0 14px 34px rgba(240, 96, 144, 0.06)', position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3d1f2b' }}>Daily To-Do</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{completedToday}/{totalToday}</div>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: '#fff6f9', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${(daysCompleted / 7) * 100}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accent},${accent2})` }} />
          </div>

          <div style={{ fontSize: 11, color: '#7e5d68', marginBottom: 14 }}>
            {hasPillars ? 'These tasks are generated from your pillar activities and update with your daily streak progress.' : 'Set up your pillar activities first to activate your daily streak plan.'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.length === 0 && (
              <div style={{ padding: '18px 16px', borderRadius: 14, border: '1px solid #f2c8d6', background: '#fff6f9', color: '#7e5d68', fontSize: 12 }}>
                {hasPillars ? 'Add activities to your pillar so your daily to-do can load.' : 'Set up your vision board first to activate your daily tasks.'}
              </div>
            )}
            {tasks.map(task => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    toggleTask(task.id)
                  }
                }}
                style={{
                  width: '100%',
                  appearance: 'none',
                  position: 'relative',
                  isolation: 'isolate',
                  zIndex: 3,
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  minHeight: 58,
                  padding: '14px 16px',
                  background: task.done ? '#ffe4ee' : '#fff6f9',
                  border: `1px solid ${task.done ? '#ef5d90' : '#f2c8d6'}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: "'DM Sans', sans-serif",
                  opacity: 1,
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${task.done ? '#ef5d90' : '#f2c8d6'}`, background: task.done ? '#ef5d90' : '#fff', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2, fontSize: 11, fontWeight: 800, lineHeight: 1, pointerEvents: 'none' }}>
                  {task.done ? '✓' : ''}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, lineHeight: 1.45, color: task.done ? '#7e5d68' : 'var(--app-text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                    {task.description}
                  </div>
                  <div style={{ fontSize: 12, color: '#7e5d68', marginTop: 4 }}>{task.pillar}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: isMobile ? 8 : 18 }} />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: isMobile ? '6px' : '10px',
          margin: isMobile ? '0.75rem 0 0' : '1rem 0',
        }}>
          <div
            onClick={() => {
              if (props.setActiveView) props.setActiveView('board')
              else onOpenBoard?.()
            }}
            style={{
              background: '#f0fff4', border: '1px solid #b9dfc0',
              ...statCardStyle,
              cursor: 'pointer',
            }}
          >
            <div style={statCardInnerStyle}>
              <p style={{
                fontSize: '0.56rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: '#059669',
                margin: 0,
              }}>Phase</p>
              <p style={{
                fontSize: '1.35rem', fontWeight: 800,
                color: '#3d1f2b', lineHeight: 1, margin: 0,
              }}>{displayPhasePercent}%</p>
              <p style={{ fontSize: '0.6rem', color: '#7a5a66', margin: 0 }}>
                {totalTasksThisPhase ? 'Progress moves with every task you finish.' : 'Set your phase dates to start tracking.'}
              </p>
              <div style={phaseProgressTrackStyle}>
                <div style={phaseProgressFillStyle} />
              </div>
            </div>
          </div>

          <div style={{
            background: '#fff5f7',
            border: '1px solid #f2c4d0',
            ...statCardStyle,
          }}>
            <div style={statCardInnerStyle}>
              <p style={{
                fontSize: '0.52rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#e8407a', margin: 0,
              }}>Streak</p>
              <p style={{
                fontSize: '1.35rem', fontWeight: 800,
                color: '#3d1f2b', lineHeight: 1, margin: 0,
              }}>{currentStreak}</p>
              <p style={{
                fontSize: '0.58rem', fontWeight: 700,
                color: '#e8407a',
                margin: 0,
              }}>
                {`Day ${daysIn} in`}
              </p>
            </div>
          </div>

          <div
            style={{
              background: '#f5f0ff', border: '1px solid #d0b9f0',
              ...statCardStyle,
            }}
          >
            <div style={statCardInnerStyle}>
              <p style={{ fontSize: '0.52rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7c3aed', margin: 0 }}>
                Unlock Path
              </p>
              <p style={{
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#7c3aed',
                lineHeight: 1.25,
                minHeight: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                margin: 0,
              }}>
                {unlockPathMessage}
              </p>
              <div style={unlockProgressTrackStyle}>
                <div style={unlockProgressFillStyle} />
              </div>
            </div>
          </div>
        </div>

        {showPhaseModal ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }}>
            <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480 }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', marginBottom: 6 }}>Before you move forward</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>Complete your phase review first.</p>
              <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 16 }}>Before moving into the next phase, Sage needs your quarterly review from this phase so the next one starts with the right clarity.</p>
              <button onClick={openQuarterlyReview} style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Open phase review</button>
              <button onClick={() => setShowPhaseModal(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: 12, border: '1.5px solid #f2c4d0', background: 'transparent', color: '#7a5a66', fontSize: '0.85rem', cursor: 'pointer' }}>I will do it later</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}


