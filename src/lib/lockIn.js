const ACTIVE_USER_KEY = 'phasr_active_user'
const LOCK_IN_KEY = 'phasr_lock_in'
const BOARD_KEY = 'phasr_vb'
const WEEKLY_GOALS_KEY = 'phasr_weekly_goals'
const TODAY_TASK_KEY = 'phasr_today_task'
const COMPLETIONS_KEY = 'phasr_completions'
const STREAK_KEY = 'phasr_streak'
const STREAK_HISTORY_KEY = 'phasr_streak_history'
const STATS_LOG_KEY = 'phasr_stats_log'
const PHASE_WEEKS_KEY = 'phasr_phase_weeks'
const ENGINE_META_KEY = 'phasr_engine_meta'

export const LOCK_IN_MODE_LABELS = {
  active: 'Active',
  warning: 'Warning',
  broken: 'Broken',
}

export const SAGE_LEVELS = {
  default: 'Sage',
  sharp: 'Sharp',
  precise: 'Precise',
  razor: 'Razor',
}

export const UNLOCK_TIERS = [
  {
    id: 1,
    minStreak: 14,
    name: 'Control Unlocks',
    reward: 'Commitment mode, custom daily targets, phase override',
  },
  {
    id: 2,
    minStreak: 30,
    name: 'Intelligence Unlocks',
    reward: 'Advanced Sage insights, behavior analysis, adaptive missions',
  },
  {
    id: 3,
    minStreak: 60,
    name: 'Visibility Unlocks',
    reward: 'Deep analytics, planned vs actual, reality reports',
  },
  {
    id: 4,
    minStreak: 90,
    name: 'Identity & Status Unlocks',
    reward: 'Levels, badges, profile status, visual evolution',
  },
]

const RANKS = [
  { min: 0, label: 'Beginner' },
  { min: 7, label: 'Rising' },
  { min: 14, label: 'Consistent' },
  { min: 30, label: 'Locked In' },
  { min: 60, label: 'Elite' },
  { min: 90, label: 'Legend' },
]

function getScopedKey(base) {
  const id = localStorage.getItem(ACTIVE_USER_KEY) || ''
  return id ? `${base}:${id}` : base
}

function safeRead(key, fallback) {
  try {
    const scopedKey = getScopedKey(key)
    const scopedValue = localStorage.getItem(scopedKey)
    if (scopedValue) return JSON.parse(scopedValue)
    const legacyValue = localStorage.getItem(key)
    if (legacyValue) {
      localStorage.setItem(scopedKey, legacyValue)
      return JSON.parse(legacyValue)
    }
    return fallback
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  localStorage.setItem(getScopedKey(key), JSON.stringify(value))
}

function appendLog(key, entry) {
  const items = safeRead(key, [])
  items.unshift(entry)
  safeWrite(key, items)
}

function parseDate(value) {
  if (!value) return null
  const next = new Date(`${value}T12:00:00`)
  return Number.isNaN(next.getTime()) ? null : next
}

function getDateKeyFromDate(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function getDateFromKey(dateKey) {
  return new Date(`${dateKey}T12:00:00`)
}

function addDaysToKey(dateKey, days) {
  const next = getDateFromKey(dateKey)
  next.setDate(next.getDate() + days)
  return getDateKeyFromDate(next)
}

function diffInDays(from, to) {
  return Math.round((to - from) / 86400000)
}

function startOfWeekFromDate(date) {
  const next = new Date(date)
  const diff = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function getTaskRotationIndex(date = new Date()) {
  return Math.floor(date.getTime() / 86400000)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export function getTodayKey() {
  return getDateKeyFromDate(new Date())
}

export function loadBoardData() {
  return safeRead(BOARD_KEY, null)
}

export function getActivePhase(boardData = loadBoardData()) {
  return boardData?.phases?.find(phase => phase.id === boardData?.activePhaseId) || boardData?.phases?.[0] || null
}

function getPhaseActivities(phase) {
  return phase?.pillars?.flatMap((pillar, pillarIndex) =>
    (pillar.activities || [])
      .map(item => String(item || '').trim())
      .filter(Boolean)
      .map((task, taskIndex) => ({
        id: `${phase.id}-${pillar.id || pillarIndex}-${taskIndex}`,
        task,
        pillar: pillar.name,
        pillarId: pillar.id || `${pillar.name}-${pillarIndex}`,
      })),
  ) || []
}

export function getPhaseWeeks(phase) {
  const start = parseDate(phase?.startDate)
  const end = parseDate(phase?.endDate)
  if (!start || !end || start > end) return []

  const weeks = []
  let cursor = new Date(start)
  cursor.setHours(0, 0, 0, 0)

  while (cursor <= end) {
    const weekStart = new Date(cursor)
    const weekEnd = new Date(cursor)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (weekEnd > end) weekEnd.setTime(end.getTime())

    weeks.push({
      index: weeks.length + 1,
      startDate: getDateKeyFromDate(weekStart),
      endDate: getDateKeyFromDate(weekEnd),
    })

    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function getCurrentWeekIndex(weeks, dateKey) {
  const currentDate = parseDate(dateKey)
  const index = weeks.findIndex(week => currentDate && currentDate >= parseDate(week.startDate) && currentDate <= parseDate(week.endDate))
  return index >= 0 ? index : 0
}

function getCurrentWeek(phase, dateKey = getTodayKey()) {
  const weeks = getPhaseWeeks(phase)
  const index = getCurrentWeekIndex(weeks, dateKey)
  return {
    weeks,
    currentWeek: weeks[index] || null,
    currentWeekIndex: index,
  }
}

function getBaseTarget(activityIndex) {
  return 3 + (activityIndex % 2)
}

function calculateWeeklyTargets(activities, weeks, completions, phaseId) {
  const goals = []

  activities.forEach((activity, activityIndex) => {
    let target = getBaseTarget(activityIndex)

    weeks.forEach((week, weekIndex) => {
      const completed = completions.filter(item =>
        item.phaseId === phaseId &&
        item.activityId === activity.id &&
        item.date >= week.startDate &&
        item.date <= week.endDate,
      ).length

      goals.push({
        id: `${phaseId}-${week.index}-${activity.id}`,
        phaseId,
        week: week.index,
        weekLabel: `Week ${week.index}`,
        startDate: week.startDate,
        endDate: week.endDate,
        activity: activity.task,
        activityId: activity.id,
        target,
        completed,
        pillar: activity.pillar,
      })

      if (weekIndex < weeks.length - 1) {
        if (completed >= target) target += 1
        else if (completed >= target * 0.5) target = target
        else target = Math.max(1, target - 1)
      }
    })
  })

  return goals
}

function persistPhaseWeeks(phaseId, weeks) {
  const store = safeRead(PHASE_WEEKS_KEY, {})
  store[phaseId] = weeks.length
  safeWrite(PHASE_WEEKS_KEY, store)
}

function logStats(type, payload = {}) {
  appendLog(STATS_LOG_KEY, {
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    timestamp: new Date().toISOString(),
    ...payload,
  })
}

function logWeeklyResult(goal, successRate) {
  logStats('weekly_goal_result', {
    phaseId: goal.phaseId,
    week: goal.week,
    activity: goal.activity,
    pillar: goal.pillar,
    target: goal.target,
    completed: goal.completed,
    successRate,
  })
}

function removeLatestMatchingCompletion(records, goal) {
  const matching = records
    .map((item, index) => ({ item, index }))
    .filter(({ item }) =>
      item.phaseId === goal.phaseId &&
      item.activityId === goal.activityId &&
      item.date >= goal.startDate &&
      item.date <= goal.endDate,
    )
    .sort((a, b) => b.item.date.localeCompare(a.item.date))

  if (!matching.length) return records
  const removeIndex = matching[0].index
  return records.filter((_, index) => index !== removeIndex)
}

function addCompletionForGoal(records, goal) {
  const nextOffset = clamp(goal.completed, 0, 6)
  const completionDate = addDaysToKey(goal.startDate, nextOffset)
  const completion = {
    id: `${goal.id}-${completionDate}-${Math.random().toString(36).slice(2, 7)}`,
    date: completionDate,
    task: goal.activity,
    pillar: goal.pillar,
    activityId: goal.activityId,
    phaseId: goal.phaseId,
    weeklyGoalId: goal.id,
  }

  return [completion, ...records]
}

function ensureWeekRollover(phase, weeklyGoals, dateKey) {
  const meta = safeRead(ENGINE_META_KEY, {})
  const phaseMeta = meta[phase.id] || {}
  const { currentWeek } = getCurrentWeek(phase, dateKey)
  const currentWeekNumber = currentWeek?.index || 1

  if (phaseMeta.lastProcessedWeek && phaseMeta.lastProcessedWeek !== currentWeekNumber) {
    const previousGoals = weeklyGoals.filter(goal => goal.phaseId === phase.id && goal.week === phaseMeta.lastProcessedWeek)
    previousGoals.forEach(goal => {
      const successRate = goal.target ? goal.completed / goal.target : 0
      logWeeklyResult(goal, Math.round(successRate * 100))
    })
  }

  meta[phase.id] = {
    lastProcessedWeek: currentWeekNumber,
    lastProcessedDate: dateKey,
  }
  safeWrite(ENGINE_META_KEY, meta)
}

function getCompletionRecords() {
  return safeRead(COMPLETIONS_KEY, [])
}

function saveCompletionRecords(records) {
  safeWrite(COMPLETIONS_KEY, records)
}

function loadWeeklyGoals() {
  return safeRead(WEEKLY_GOALS_KEY, [])
}

function saveWeeklyGoals(goals) {
  safeWrite(WEEKLY_GOALS_KEY, goals)
}

function loadTodayTaskRecord() {
  return safeRead(TODAY_TASK_KEY, null)
}

function saveTodayTaskRecord(record) {
  safeWrite(TODAY_TASK_KEY, record)
}

function loadStreakState() {
  return safeRead(STREAK_KEY, {
    current: 0,
    best: 0,
    lastCompleted: null,
    risk: false,
    weeklyConsistency: 0,
    bestWeeklyConsistency: 0,
  })
}

function saveStreakState(streak) {
  safeWrite(STREAK_KEY, streak)
}

function saveStreakHistory(entry) {
  appendLog(STREAK_HISTORY_KEY, entry)
}

function getWeeklyConsistency(weeklyGoals, phaseId, currentWeekNumber) {
  const grouped = new Map()
  weeklyGoals
    .filter(goal => goal.phaseId === phaseId && goal.week < currentWeekNumber)
    .forEach(goal => {
      const bucket = grouped.get(goal.week) || []
      bucket.push(goal)
      grouped.set(goal.week, bucket)
    })

  let current = 0
  let best = 0
  ;[...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .forEach(([, goals]) => {
      const successCount = goals.filter(goal => goal.completed >= goal.target).length
      const successfulWeek = successCount >= Math.min(4, goals.length)
      if (successfulWeek) {
        current += 1
        best = Math.max(best, current)
      } else {
        current = 0
      }
    })

  return { current, best }
}

export function ensureProgressEngine(boardData = loadBoardData(), date = new Date()) {
  const phase = getActivePhase(boardData)
  const dateKey = getDateKeyFromDate(date)

  if (!phase) {
    return {
      phase: null,
      phaseWeeks: 0,
      weeks: [],
      weeklyGoals: [],
      currentWeek: null,
      todayTask: null,
      streak: loadStreakState(),
      completions: getCompletionRecords(),
      statsLog: safeRead(STATS_LOG_KEY, []),
    }
  }

  const activities = getPhaseActivities(phase)
  const weeks = getPhaseWeeks(phase)
  const completions = getCompletionRecords()
  persistPhaseWeeks(phase.id, weeks)

  const weeklyGoals = calculateWeeklyTargets(activities, weeks, completions, phase.id)
  saveWeeklyGoals(weeklyGoals)
  ensureWeekRollover(phase, weeklyGoals, dateKey)

  const { currentWeek, currentWeekIndex } = getCurrentWeek(phase, dateKey)
  const currentWeekGoals = weeklyGoals.filter(goal => goal.phaseId === phase.id && goal.week === (currentWeek?.index || 1))

  let todayTask = loadTodayTaskRecord()
  const currentWeekActivities = currentWeekGoals.map(goal => ({
    id: goal.activityId,
    task: goal.activity,
    pillar: goal.pillar,
    weeklyGoalId: goal.id,
  }))

  if (!todayTask || todayTask.date !== dateKey || todayTask.phaseId !== phase.id) {
    const weekStart = currentWeek ? parseDate(currentWeek.startDate) : startOfWeekFromDate(date)
    const dayOffset = Math.max(0, Math.round((parseDate(dateKey) - weekStart) / 86400000))
    const rotationSeed = getTaskRotationIndex(date)
    const candidates = currentWeekActivities.length ? currentWeekActivities : getPhaseActivities(phase)
    const nextTask = candidates.length ? candidates[(rotationSeed + dayOffset) % candidates.length] : null

    todayTask = nextTask ? {
      date: dateKey,
      phaseId: phase.id,
      week: currentWeek?.index || 1,
      pillar: nextTask.pillar,
      task: nextTask.task,
      weeklyGoalId: nextTask.weeklyGoalId || `${phase.id}-${currentWeek?.index || 1}-${nextTask.id}`,
      activityId: nextTask.id,
      done: completions.some(item => item.date === dateKey && item.activityId === nextTask.id && item.phaseId === phase.id),
    } : null

    saveTodayTaskRecord(todayTask)
  } else {
    todayTask = {
      ...todayTask,
      done: completions.some(item => item.date === dateKey && item.activityId === todayTask.activityId && item.phaseId === phase.id),
    }
    saveTodayTaskRecord(todayTask)
  }

  const streak = updateStreakRisk(loadStreakState(), dateKey)
  const weeklyConsistency = getWeeklyConsistency(weeklyGoals, phase.id, currentWeek?.index || (currentWeekIndex + 1))
  const mergedStreak = {
    ...streak,
    weeklyConsistency: weeklyConsistency.current,
    bestWeeklyConsistency: Math.max(streak.bestWeeklyConsistency || 0, weeklyConsistency.best),
  }
  saveStreakState(mergedStreak)

  return {
    phase,
    phaseWeeks: weeks.length,
    weeks,
    weeklyGoals,
    currentWeek,
    currentWeekGoals,
    todayTask,
    streak: mergedStreak,
    completions,
    statsLog: safeRead(STATS_LOG_KEY, []),
  }
}

export function getDailyTaskPlan(boardData = loadBoardData(), date = new Date()) {
  const engine = ensureProgressEngine(boardData, date)
  const activities = getPhaseActivities(engine.phase)
  const activeTasks = engine.currentWeekGoals.map(goal => ({
    id: goal.activityId,
    task: goal.activity,
    pillar: goal.pillar,
    weeklyGoalId: goal.id,
  }))
  const rotatedTasks = activeTasks.length ? activeTasks : activities

  return {
    phase: engine.phase,
    dateKey: getDateKeyFromDate(date),
    primaryTask: engine.todayTask ? {
      id: engine.todayTask.activityId,
      task: engine.todayTask.task,
      pillar: engine.todayTask.pillar,
      weeklyGoalId: engine.todayTask.weeklyGoalId,
    } : null,
    tasks: rotatedTasks,
    phaseWeeks: engine.phaseWeeks,
  }
}

export function buildWeeklyGoals(boardData = loadBoardData(), state = loadLockInState(), date = new Date()) {
  const engine = ensureProgressEngine(boardData, date)
  const weeks = engine.weeks.map(week => {
    const goals = engine.weeklyGoals
      .filter(goal => goal.phaseId === engine.phase?.id && goal.week === week.index)
      .map(goal => ({
        ...goal,
        completed: goal.completed >= goal.target ? goal.target : 0,
      }))
    return {
      id: `${engine.phase?.id || 'phase'}-${week.index}`,
      index: week.index,
      weekLabel: `Week ${week.index}`,
      startDate: week.startDate,
      endDate: week.endDate,
      goals,
      totalTarget: goals.reduce((sum, goal) => sum + goal.target, 0),
      totalProgress: goals.reduce((sum, goal) => sum + goal.completed, 0),
      successRate: goals.length
        ? Math.round((goals.reduce((sum, goal) => sum + Math.min(goal.completed, goal.target), 0) / goals.reduce((sum, goal) => sum + goal.target, 0)) * 100)
        : 0,
      completed: goals.length ? goals.every(goal => goal.completed >= goal.target) : false,
    }
  })

  const currentWeek = weeks.find(week => week.index === engine.currentWeek?.index) || weeks[0] || null

  return {
    currentWeek,
    weeks,
    phaseName: engine.phase?.name || 'Current Phase',
    phasePeriod: engine.phase?.period || 'Q1',
    hint: 'Complete your daily activities and the week fills automatically.',
  }
}

export function getTodayTask(boardData = loadBoardData()) {
  const engine = ensureProgressEngine(boardData)
  const goalDefined = Boolean(engine.phase?.impact) || Boolean(engine.phase?.pillars?.some(pillar => String(pillar?.afterState || '').trim()))
  return {
    phaseName: engine.phase?.name || 'Current Phase',
    phasePeriod: engine.phase?.period || 'Q1',
    hasPlan: Boolean(goalDefined && engine.todayTask?.task),
    task: engine.todayTask?.task || 'Set your activities to get your daily task',
    pillar: engine.todayTask?.pillar || '',
    done: Boolean(engine.todayTask?.done),
    weeklyGoalId: engine.todayTask?.weeklyGoalId || null,
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
  if (summary.currentStreak >= 60) return SAGE_LEVELS.razor
  if (summary.currentStreak >= 30) return SAGE_LEVELS.precise
  if (summary.currentStreak >= 14) return SAGE_LEVELS.sharp
  return SAGE_LEVELS.default
}

export function updateStreakRisk(streak = loadStreakState(), todayKey = getTodayKey()) {
  const today = getDateFromKey(todayKey)
  const lastCompleted = streak.lastCompleted ? getDateFromKey(streak.lastCompleted) : null
  const daysSinceLast = lastCompleted ? diffInDays(lastCompleted, today) : Infinity

  if (!lastCompleted) {
    return {
      ...streak,
      current: 0,
      risk: false,
    }
  }

  if (daysSinceLast <= 1) {
    return {
      ...streak,
      risk: false,
    }
  }

  if (daysSinceLast === 2) {
    return {
      ...streak,
      risk: true,
      warning: 'You are 1 miss away from losing your streak.',
    }
  }

  const dropped = {
    date: todayKey,
    previous: streak.current,
    lastCompleted: streak.lastCompleted,
  }
  saveStreakHistory(dropped)
  logStats('streak_drop', dropped)

  return {
    ...streak,
    current: 0,
    risk: false,
    warning: '',
  }
}

export function getLockInSummary(state = loadLockInState(), todayKey = getTodayKey()) {
  const streak = updateStreakRisk(loadStreakState(), todayKey)
  saveStreakState(streak)
  const completions = getCompletionRecords()
  const logs = [...state.logs].filter(log => log?.date).sort((a, b) => b.date.localeCompare(a.date))
  const latestLog = logs[0] || null
  const daysSinceLastLog = streak.lastCompleted ? diffInDays(getDateFromKey(streak.lastCompleted), getDateFromKey(todayKey)) : Infinity

  const mode =
    streak.current > 0 && daysSinceLastLog <= 1 ? 'active' :
    streak.risk ? 'warning' :
    'broken'

  const completedTiers = getCompletedTierCount(streak.current)
  const penaltiesApplied = state.penalties.reduce((sum, penalty) => sum + (penalty?.points || 0), 0)
  const points = Math.max(0, (completions.length * 10) + (completedTiers * 20) + state.pointsBank - penaltiesApplied)

  const summary = {
    todayKey,
    hasLoggedToday: Boolean(streak.lastCompleted === todayKey),
    latestLogDate: latestLog?.date || streak.lastCompleted || null,
    lastLog: latestLog,
    warning: Boolean(streak.risk),
    daysSinceLastLog,
    preservedStreak: streak.current,
    currentStreak: streak.current,
    bestStreak: streak.best || streak.current,
    weeklyConsistency: streak.weeklyConsistency || 0,
    bestWeeklyConsistency: streak.bestWeeklyConsistency || 0,
    mode,
    modeLabel: LOCK_IN_MODE_LABELS[mode],
    completedTiers,
    nextTier: UNLOCK_TIERS.find(tier => streak.current < tier.minStreak) || null,
    points,
    rank: getRankLabel(streak.current),
    unlockedCommitmentMode: streak.current >= UNLOCK_TIERS[0].minStreak,
  }

  return {
    ...summary,
    sageLevel: getSageLevel(summary),
  }
}

export function upsertTodayLog(state, payload = {}, boardDataOverride = null) {
  const boardData = boardDataOverride || loadBoardData()
  const engine = ensureProgressEngine(boardData)
  const todayKey = getTodayKey()
  const taskRecord = engine.todayTask
  if (!taskRecord?.task) return normalizeLockInState(state)

  const completions = getCompletionRecords()
  const existingCompletion = completions.find(item =>
    item.date === todayKey &&
    item.phaseId === engine.phase?.id &&
    item.activityId === taskRecord.activityId,
  )

  if (!existingCompletion) {
    const completion = {
      id: `${todayKey}-${taskRecord.activityId}`,
      date: todayKey,
      task: payload.task || taskRecord.task,
      pillar: payload.pillar || taskRecord.pillar,
      activityId: taskRecord.activityId,
      phaseId: engine.phase?.id || null,
      weeklyGoalId: taskRecord.weeklyGoalId,
    }
    saveCompletionRecords([completion, ...completions])
    logStats('completion', completion)
  }

  const todayTask = {
    ...taskRecord,
    done: true,
  }
  saveTodayTaskRecord(todayTask)

  const streak = updateStreakRisk(loadStreakState(), todayKey)
  const alreadyCountedToday = streak.lastCompleted === todayKey
  const yesterdayKey = getDateKeyFromDate(new Date(Date.now() - 86400000))
  const nextCurrent = alreadyCountedToday
    ? streak.current
    : streak.lastCompleted === yesterdayKey
      ? streak.current + 1
      : 1

  const nextStreak = {
    ...streak,
    current: nextCurrent,
    best: Math.max(streak.best || 0, nextCurrent),
    lastCompleted: todayKey,
    risk: false,
    warning: '',
  }
  saveStreakState(nextStreak)
  logStats('streak_update', {
    date: todayKey,
    current: nextStreak.current,
    best: nextStreak.best,
  })

  const existing = state.logs.find(log => log.date === todayKey)
  const nextLog = {
    date: todayKey,
    task: payload.task || taskRecord.task,
    note: payload.note || existing?.note || '',
    status: 'done',
  }

  const logs = existing
    ? state.logs.map(log => (log.date === todayKey ? nextLog : log))
    : [nextLog, ...state.logs]

  const normalized = normalizeLockInState({
    ...state,
    logs,
  })
  saveLockInState(normalized)
  ensureProgressEngine(boardData)
  return normalized
}

export function toggleWeeklyGoalCompletion(goal, boardData = loadBoardData()) {
  if (!goal?.id) return ensureProgressEngine(boardData)

  const records = getCompletionRecords()
  let nextRecords = records

  if (goal.completed >= goal.target) {
    while (nextRecords.some(item =>
      item.phaseId === goal.phaseId &&
      item.activityId === goal.activityId &&
      item.date >= goal.startDate &&
      item.date <= goal.endDate,
    )) {
      nextRecords = removeLatestMatchingCompletion(nextRecords, goal)
    }
  } else {
    for (let index = goal.completed; index < goal.target; index += 1) {
      nextRecords = addCompletionForGoal(nextRecords, {
        ...goal,
        completed: index,
      })
    }
  }

  saveCompletionRecords(nextRecords)
  logStats('weekly_goal_toggle', {
    goalId: goal.id,
    phaseId: goal.phaseId,
    week: goal.week,
    activity: goal.activity,
    pillar: goal.pillar,
    completed: goal.completed >= goal.target ? 0 : goal.target,
    target: goal.target,
  })

  return ensureProgressEngine(boardData)
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
