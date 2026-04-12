import { useEffect, useMemo, useState } from 'react'
import {
  broadcastLockInUpdate,
  buildWeeklyGoals,
  getLockInSummary,
  loadBoardData,
  loadLockInState,
  toggleWeeklyGoalCompletion,
  UNLOCK_TIERS,
} from '../lib/lockIn'
import { calculateWeeklyLoad, dismissBriefing, getSageWeeklyMessage, isBriefingDismissed } from '../lib/sageIntelligence'

const WEEK_PROGRESS_KEY = 'phasr_week_progress'
const DAILY_SCHEDULE_KEY_PREFIX = 'phasr_daily_schedule'

function makeBoardForPhase(boardData, phaseId) {
  return {
    ...boardData,
    activePhaseId: phaseId,
  }
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
  localStorage.setItem(key, JSON.stringify(value))
}

function getUnlockState(summary, tier) {
  if (summary.currentStreak >= tier.minStreak) return 'done'
  if (summary.nextTier?.id === tier.id) return 'next'
  return 'locked'
}

function getCompletedGoalCount(week) {
  return (week?.goals || []).filter(goal => goal.completed >= goal.target).length
}

function buildWeekProgressMap(phaseId, weeks) {
  const stored = safeRead(WEEK_PROGRESS_KEY, {})
  const phaseStore = stored[phaseId] || {}
  const nextPhaseStore = {}

  weeks.forEach((week, index) => {
    const totalGoals = week.goals?.length || 0
    const completedGoals = getCompletedGoalCount(week)
    const previousWeek = weeks[index - 1]
    const previousCompletedGoals = getCompletedGoalCount(previousWeek)
    const previousTotalGoals = previousWeek?.goals?.length || 0
    const previousUnlockThreshold = Math.floor(previousTotalGoals / 2) + (previousTotalGoals % 2 === 0 ? 1 : 0)

    const unlocked = index === 0
      ? true
      : previousCompletedGoals === previousTotalGoals || previousCompletedGoals >= previousUnlockThreshold

    nextPhaseStore[week.index] = {
      unlocked,
      completed: totalGoals > 0 && completedGoals === totalGoals,
      completedGoals,
      totalGoals,
      neededToUnlock: Math.max(0, previousUnlockThreshold - previousCompletedGoals),
      previousWeek: previousWeek?.index || null,
      lastViewed: phaseStore[week.index]?.lastViewed || false,
    }
  })

  const next = {
    ...stored,
    [phaseId]: nextPhaseStore,
  }
  safeWrite(WEEK_PROGRESS_KEY, next)
  return nextPhaseStore
}

function isConfiguredPillar(pillar) {
  if (!pillar) return false
  const hasImage = !!(pillar.beforeImage || pillar.afterImage)
  const hasStates = !!(pillar.beforeState || pillar.afterState || pillar.beforeDesc || pillar.afterDesc)
  return hasImage || hasStates
}

function getDailyScheduleStorageKey(phaseId, weekNumber) {
  return `${DAILY_SCHEDULE_KEY_PREFIX}_${phaseId}_${weekNumber}`
}

function getDayTaskStorageKey(phaseId, weekNumber, dayNumber) {
  return `phasr_tasks_${phaseId}_w${weekNumber}_d${dayNumber}`
}

function getDayNumberForWeek(week) {
  if (!week?.startDate) return 1
  const start = new Date(`${week.startDate}T12:00:00`)
  const now = new Date()
  const diff = Math.floor((now - start) / (24 * 60 * 60 * 1000))
  return Math.min(7, Math.max(1, diff + 1))
}

function pickDistributedDays(target = 1) {
  const count = Math.max(1, Math.min(7, Number(target) || 1))
  if (count === 1) return [1]
  const days = []
  for (let i = 0; i < count; i += 1) {
    const day = Math.min(7, Math.floor((i * 7) / count) + 1)
    if (!days.includes(day)) days.push(day)
  }
  while (days.length < count) {
    const candidate = ((days[days.length - 1] || 0) % 7) + 1
    if (!days.includes(candidate)) days.push(candidate)
  }
  return days
}

function buildDailyAssignments(weeklyGoals, weekNumber) {
  const daySets = {
    1: new Set(),
    2: new Set(),
    3: new Set(),
    4: new Set(),
    5: new Set(),
    6: new Set(),
    7: new Set(),
  }
  const allIds = weeklyGoals.map(goal => goal.id)
  if (!allIds.length) {
    return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] }
  }

  weeklyGoals.forEach(goal => {
    const frequency = Math.max(1, Number(goal.target) || 1)
    const days = frequency >= 7 ? [1, 2, 3, 4, 5, 6, 7] : pickDistributedDays(frequency)
    days.forEach(day => daySets[day].add(goal.id))
  })

  for (let day = 1; day <= 7; day += 1) {
    const ordered = Array.from(daySets[day])
    let cursor = (weekNumber + day) % allIds.length
    while (ordered.length < Math.min(2, allIds.length)) {
      const candidate = allIds[cursor % allIds.length]
      if (!ordered.includes(candidate)) ordered.push(candidate)
      cursor += 1
    }
    daySets[day] = new Set(ordered.slice(0, 3))
  }

  return {
    1: Array.from(daySets[1]),
    2: Array.from(daySets[2]),
    3: Array.from(daySets[3]),
    4: Array.from(daySets[4]),
    5: Array.from(daySets[5]),
    6: Array.from(daySets[6]),
    7: Array.from(daySets[7]),
  }
}

function generateDailyTasks(nonNegotiable, weekNumber, dayNumber) {
  const { timesPerWeek, description, pillar, id, completedCount } = nonNegotiable
  const scheduleMap = {
    7: [1, 2, 3, 4, 5, 6, 7],
    6: [1, 2, 3, 4, 5, 6],
    5: [1, 2, 3, 5, 6],
    4: [1, 2, 4, 6],
    3: [1, 3, 5],
    2: [2, 5],
    1: [3],
  }

  const activeDays = scheduleMap[timesPerWeek] || scheduleMap[3]
  const done = completedCount >= Math.max(1, Number(timesPerWeek) || 1)
  return activeDays.includes(dayNumber)
    ? [{ id, description, pillar, done, weekNumber, dayNumber }]
    : []
}

function getOrCreateWeekSchedule(phaseId, weekNumber, weeklyGoals) {
  const key = getDailyScheduleStorageKey(phaseId, weekNumber)
  const existing = safeRead(key, null)
  if (
    existing &&
    typeof existing === 'object' &&
    Array.isArray(existing['1']) &&
    Array.isArray(existing['2']) &&
    Array.isArray(existing['3']) &&
    Array.isArray(existing['4']) &&
    Array.isArray(existing['5']) &&
    Array.isArray(existing['6']) &&
    Array.isArray(existing['7'])
  ) {
    return existing
  }

  const created = buildDailyAssignments(weeklyGoals, weekNumber)
  safeWrite(key, created)
  return created
}

function getOrCreateDayTasks(phaseId, weekNumber, dayNumber, nonNegotiables) {
  const key = getDayTaskStorageKey(phaseId, weekNumber, dayNumber)
  const existing = safeRead(key, null)
  if (Array.isArray(existing)) return existing

  const generated = nonNegotiables.flatMap(nn => generateDailyTasks(nn, weekNumber, dayNumber))
  safeWrite(key, generated)
  return generated
}

function getFormattedGoalText(activity, target) {
  const text = String(activity || '').trim()
  if (!text) return `Complete ${target} times this week`
  return `${text} (${target}x this week)`
}

function SageBriefingCard({ plan, message, onDismiss }) {
  if (!plan || !message) return null
  return (
    <div style={{ borderRadius: 18, padding: '1rem', background: '#fff', border: '1px solid var(--app-border)', boxShadow: '0 12px 28px rgba(240,96,144,0.12)', position: 'relative', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Sage</p>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.94rem', lineHeight: 1.65, color: '#5a3d47' }}>{message}</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss weekly Sage briefing" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--app-border)', background: '#fff', color: '#b85a82', cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0 }}>
          x
        </button>
      </div>
    </div>
  )
}

export default function DailyCheckin({ onLockInChange, onOpenBoard, onOpenWeeklyPulse }) {
  const [boardData] = useState(() => loadBoardData())
  const [lockInState, setLockInState] = useState(() => loadLockInState())
  const phases = useMemo(() => {
    const source = Array.isArray(boardData?.phases) ? [...boardData.phases] : []
    source.sort((a, b) => {
      const aNum = Number(String(a?.name || '').replace(/[^\d]/g, '')) || 999
      const bNum = Number(String(b?.name || '').replace(/[^\d]/g, '')) || 999
      return aNum - bNum
    })
    return source
  }, [boardData])

  const [activePhaseId, setActivePhaseId] = useState(() => phases[0]?.id || null)
  const [activeWeek, setActiveWeek] = useState(1)
  const [showPhaseModal, setShowPhaseModal] = useState(false)

  useEffect(() => {
    if (!phases.some(phase => phase.id === activePhaseId)) {
      setActivePhaseId(phases[0]?.id || null)
    }
  }, [phases, activePhaseId])

  const phaseBoard = useMemo(() => makeBoardForPhase(boardData, activePhaseId), [boardData, activePhaseId])
  const weeklyData = useMemo(() => buildWeeklyGoals(phaseBoard, lockInState), [phaseBoard, lockInState])
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const selectedPhase = phases.find(phase => phase.id === activePhaseId) || phases[0] || null
  const weekProgressMap = useMemo(
    () => (selectedPhase ? buildWeekProgressMap(selectedPhase.id, weeklyData.weeks) : {}),
    [selectedPhase, weeklyData.weeks, lockInState],
  )
  const selectedWeek = weeklyData.weeks.find(week => week.index === activeWeek) || weeklyData.weeks[0] || null

  useEffect(() => {
    const currentIndex = weeklyData.currentWeek?.index || 1
    setActiveWeek(currentIndex)
  }, [activePhaseId, weeklyData.currentWeek?.index])

  const activePillarNames = useMemo(() => {
    const pillars = selectedPhase?.pillars || []
    return pillars.filter(isConfiguredPillar).map(pillar => pillar.name).filter(Boolean)
  }, [selectedPhase])

  const weeklyGoals = useMemo(() => {
    const goals = selectedWeek?.goals || []
    if (!activePillarNames.length) return []
    return goals.filter(goal => activePillarNames.includes(goal.pillar))
  }, [selectedWeek, activePillarNames])

  const weekNumber = selectedWeek?.index || weeklyData.currentWeek?.index || 1
  const currentWeek = weekNumber
  const dayNumber = useMemo(() => getDayNumberForWeek(selectedWeek), [selectedWeek])

  const weeklySchedule = useMemo(
    () => getOrCreateWeekSchedule(selectedPhase?.id || 'phase', weekNumber, weeklyGoals),
    [selectedPhase?.id, weekNumber, weeklyGoals],
  )

  const nonNegotiables = useMemo(
    () => weeklyGoals.map(goal => ({
      id: goal.id,
      description: goal.activity,
      pillar: goal.pillar,
      timesPerWeek: Math.max(1, Number(goal.target) || 1),
      completedCount: Math.max(0, Number(goal.completed) || 0),
      goalRef: goal,
    })),
    [weeklyGoals],
  )

  const dayTaskRows = useMemo(
    () => getOrCreateDayTasks(selectedPhase?.id || 'phase', weekNumber, dayNumber, nonNegotiables),
    [selectedPhase?.id, weekNumber, dayNumber, nonNegotiables],
  )

  const todaysTasks = useMemo(() => {
    const byId = new Map(weeklyGoals.map(goal => [goal.id, goal]))
    const scheduledIds = weeklySchedule[dayNumber] || []
    const fromStoredDay = dayTaskRows
      .map(row => byId.get(row.id))
      .filter(Boolean)
      .map(goal => ({
        ...goal,
        done: (goal.completed || 0) >= (goal.target || 0),
      }))

    if (fromStoredDay.length) return fromStoredDay

    const assigned = scheduledIds
      .map(id => byId.get(id))
      .filter(Boolean)
      .map(goal => ({
        ...goal,
        done: (goal.completed || 0) >= (goal.target || 0),
      }))
    if (assigned.length) return assigned
    return weeklyGoals.slice(0, Math.min(3, weeklyGoals.length)).map(goal => ({
      ...goal,
      done: (goal.completed || 0) >= (goal.target || 0),
    }))
  }, [weeklyGoals, weeklySchedule, dayNumber, dayTaskRows])

  const completedToday = todaysTasks.filter(t => t.done).length
  const totalToday = todaysTasks.length
  const todayScore = Math.round((completedToday / totalToday) * 100) || 0

  const weekTasks = useMemo(() => [weeklyGoals.map(goal => ({
    ...goal,
    done: (goal.completed || 0) >= (goal.target || 0),
  }))], [weeklyGoals])
  const allTasksThisWeek = weekTasks.flat()
  const completedThisWeek = allTasksThisWeek.filter(t => t.done).length
  const totalThisWeek = allTasksThisWeek.length
  const weekScore = Math.round((completedThisWeek / totalThisWeek) * 100) || 0
  const weekCompletionPercent = weekScore

  function getActivitiesForNonNeg(nonNeg) {
    const target = Math.max(1, Number(nonNeg.timesPerWeek) || 1)
    const doneCount = Math.min(target, Math.max(0, Number(nonNeg.completedCount) || 0))
    return Array.from({ length: target }, (_, index) => ({
      id: `${nonNeg.id}-${index + 1}`,
      done: index < doneCount,
    }))
  }

  const nonNegProgress = useMemo(
    () => nonNegotiables.map(nn => ({
      ...nn,
      progress: getActivitiesForNonNeg(nn).filter(a => a.done).length,
      target: nn.timesPerWeek,
    })),
    [nonNegotiables],
  )

  const weekEndDate = useMemo(() => {
    const phaseStart = selectedPhase?.startDate ? new Date(`${selectedPhase.startDate}T12:00:00`) : new Date()
    phaseStart.setDate(phaseStart.getDate() + (currentWeek * 7))
    return phaseStart
  }, [selectedPhase?.startDate, currentWeek])
  const weekHasEnded = new Date() > weekEndDate
  const pulseAlreadyDone = localStorage.getItem(`phasr_weekly_pulse_w${currentWeek}_done`) === 'true'
  const showPulseBanner = weekHasEnded && !pulseAlreadyDone

  const weeklyLoadPlan = useMemo(() => calculateWeeklyLoad(phaseBoard), [phaseBoard, lockInState])
  const sageWeeklyMessage = useMemo(() => getSageWeeklyMessage(), [weeklyLoadPlan])
  const briefingDismissed = useMemo(() => {
    const phaseKey = selectedPhase?.id
    const weekKey = weeklyLoadPlan?.week
    return phaseKey && weekKey ? isBriefingDismissed(phaseKey, weekKey) : false
  }, [selectedPhase, weeklyLoadPlan])

  const isDarkTheme = typeof document !== 'undefined' && document.documentElement.dataset.theme === 'neutral'
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const shellBg = 'var(--app-bg)'
  const shellSurface = isDarkTheme ? '#13131a' : '#ffffff'
  const shellSurfaceAlt = isDarkTheme ? '#1c1c26' : '#fff6f9'
  const shellBorder = isDarkTheme ? 'rgba(255,255,255,0.08)' : '#f2c8d6'
  const shellText = 'var(--app-text)'
  const shellMuted = isDarkTheme ? 'rgba(255,255,255,0.55)' : '#7e5d68'
  const accent = 'var(--app-accent)'
  const accent2 = 'var(--app-accent2)'
  const showSinglePhaseAsPhaseOne = phases.length === 1

  function handleToggleGoal(goal) {
    toggleWeeklyGoalCompletion(goal, phaseBoard)
    setLockInState(loadLockInState())
    broadcastLockInUpdate()
    onLockInChange?.()
  }

  function handleWeekSelect(nextWeek) {
    setActiveWeek(nextWeek?.index || 1)
  }

  function handlePhaseSelect(nextPhaseId) {
    if (!selectedPhase || nextPhaseId === selectedPhase.id) {
      setActivePhaseId(nextPhaseId)
      return
    }
    const currentIndex = phases.findIndex(phase => phase.id === selectedPhase.id)
    const nextIndex = phases.findIndex(phase => phase.id === nextPhaseId)

    if (nextIndex > currentIndex) {
      const lastWeekNumber = weeklyData.weeks[weeklyData.weeks.length - 1]?.index || 1
      const phasePulseDone = localStorage.getItem(`phasr_weekly_pulse_w${lastWeekNumber}_done`) === 'true'
      if (!phasePulseDone) {
        setShowPhaseModal(true)
        return
      }
    }

    setActivePhaseId(nextPhaseId)
  }

  const selectedWeekStatus = {
    ...(selectedWeek ? weekProgressMap[selectedWeek.index] : {}),
    unlocked: true,
  }

  const showPulseEndedCard = showPulseBanner

  const openPulse = () => {
    if (typeof onOpenWeeklyPulse === 'function') {
      onOpenWeeklyPulse({
        weekNumber: Math.max(1, currentWeek - 1),
        completionPercent: weekScore,
        tasksCompleted: completedThisWeek,
        tasksTotal: totalThisWeek,
        nonNegProgress,
      })
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: shellBg, color: shellText, width: '100%', overflowX: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(100%, 1080px)', maxWidth: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 96px' : '18px 20px 96px', overflowX: 'hidden', boxSizing: 'border-box' }}>
        <div style={{ overflowX: 'hidden' }}>
          <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
            {phases.map(phase => {
              const active = phase.id === activePhaseId
              const phaseLabel = showSinglePhaseAsPhaseOne ? 'Phase 1' : phase.name
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => handlePhaseSelect(phase.id)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 999,
                    border: active ? '1px solid transparent' : `1px solid ${shellBorder}`,
                    background: active ? `linear-gradient(135deg,${accent2},${accent})` : shellSurface,
                    color: active ? '#fff' : shellText,
                    boxShadow: active ? 'var(--app-glow)' : 'none',
                    fontFamily: "'Syne', sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {phaseLabel}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: shellText, marginBottom: 10 }}>
          Turn your goal into daily action
        </div>

        <div style={{
          background: '#fff', border: '1px solid #f2c4d0',
          borderRadius: 16, padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a' }}>
              Today's Tasks
            </p>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3d1f2b' }}>
              {completedToday}/{totalToday}
            </p>
          </div>
          <div style={{ height: 6, background: '#f2c4d0', borderRadius: 99, marginBottom: 8 }}>
            <div style={{
              height: '100%',
              width: totalToday > 0 ? `${(completedToday / totalToday) * 100}%` : '0%',
              background: completedToday === totalToday && totalToday > 0
                ? 'linear-gradient(90deg, #34d399, #059669)'
                : 'linear-gradient(90deg, #e8407a, #f472a8)',
              borderRadius: 99,
              transition: 'width 0.4s ease',
            }} />
          </div>
          <p style={{ fontSize: '0.72rem', color: '#7a5a66' }}>
            {completedToday === totalToday && totalToday > 0
              ? 'All done for today. Streak secured.'
              : `${Math.max(0, totalToday - completedToday)} task${Math.max(0, totalToday - completedToday) !== 1 ? 's' : ''} remaining today`
            }
          </p>
        </div>

        {showPulseEndedCard ? (
          <div style={{
            background: 'linear-gradient(135deg, #fff5f7, #fffbfc)',
            border: '1.5px solid #f2c4d0', borderRadius: 16, padding: '1rem', margin: '0 0 1rem',
          }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', marginBottom: 4 }}>
              Week {currentWeek} closed
            </p>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 4 }}>
              {weekCompletionPercent}% completion
            </p>
            <p style={{ fontSize: '0.78rem', color: '#7a5a66', marginBottom: 12, lineHeight: 1.5 }}>
              This takes 5 minutes. Two questions. Sage reads your week and tells you what actually matters going into week {currentWeek + 1}.
            </p>
            <button
              onClick={openPulse}
              style={{
                background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                color: '#fff', border: 'none', borderRadius: 99,
                padding: '0.6rem 1.4rem', fontSize: '0.82rem',
                fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Open Weekly Pulse
            </button>
          </div>
        ) : null}

        {!briefingDismissed && weeklyLoadPlan && weeklyLoadPlan.week === activeWeek && (
          <SageBriefingCard
            plan={weeklyLoadPlan}
            message={sageWeeklyMessage}
            onDismiss={() => {
              if (selectedPhase?.id && weeklyLoadPlan?.week) {
                dismissBriefing(selectedPhase.id, weeklyLoadPlan.week)
                setLockInState(loadLockInState())
              }
            }}
          />
        )}

        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: shellMuted, marginBottom: 10 }}>
          All Weeks
        </div>
        <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
          <div style={{ display: 'flex', gap: 8, width: 'max-content', minWidth: '100%', paddingBottom: 2, flexWrap: 'nowrap' }}>
            {weeklyData.weeks.map(week => {
              const active = week.index === activeWeek
              const status = weekProgressMap[week.index]
              return (
                <button
                  key={week.id}
                  type="button"
                  onClick={() => handleWeekSelect(week)}
                  style={{
                    padding: isMobile ? '7px 12px' : '8px 14px',
                    borderRadius: 999,
                    border: active ? `1px solid ${accent}` : `1px solid ${shellBorder}`,
                    background: active ? (isDarkTheme ? 'rgba(249,95,133,0.12)' : '#fff1f6') : shellSurface,
                    color: active ? accent : shellMuted,
                    fontSize: isMobile ? 11 : 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Week {week.index}{status?.completed ? ' (done)' : ''}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div style={{ background: shellSurface, border: `1px solid ${shellBorder}`, borderRadius: 22, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: shellText }}>
              {selectedWeek?.weekLabel || 'Week 1'} Daily To-Do
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>
              {completedToday}/{totalToday}
            </div>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: shellSurfaceAlt, overflow: 'hidden', marginBottom: 10 }}>
            <div
              style={{
                width: `${todayScore}%`,
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg,${accent},${accent2})`,
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: shellMuted, marginBottom: 14 }}>
            Daily tasks rotate automatically from your weekly non-negotiables.
          </div>

          {selectedWeekStatus?.unlocked ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {todaysTasks.length === 0 && (
                <div style={{ padding: '18px 16px', borderRadius: 14, border: `1px solid ${shellBorder}`, background: shellSurfaceAlt, color: shellMuted, fontSize: 12, display: 'grid', gap: 10 }}>
                  <span>Set up your vision board first to activate your daily tasks.</span>
                  <button
                    type="button"
                    onClick={onOpenBoard}
                    style={{
                      width: 'fit-content',
                      borderRadius: 999,
                      border: `1px solid ${accent}`,
                      background: 'transparent',
                      color: accent,
                      padding: '0.45rem 0.9rem',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Go to Vision Board
                  </button>
                </div>
              )}
              {todaysTasks.map(goal => {
                const done = goal.done
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => handleToggleGoal(goal)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 16px',
                      background: shellSurfaceAlt,
                      border: `1px solid ${done ? 'rgba(74,222,128,0.25)' : shellBorder}`,
                      borderRadius: 14,
                      cursor: 'pointer',
                      textAlign: 'left',
                      opacity: done ? 0.72 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${done ? '#22c55e' : shellBorder}`,
                        background: done ? '#22c55e' : 'transparent',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {done ? 'ok' : ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, lineHeight: 1.45, color: done ? shellMuted : shellText, textDecoration: done ? 'line-through' : 'none' }}>
                        {getFormattedGoalText(goal.activity, goal.target)}
                      </div>
                      <div style={{ fontSize: 12, color: shellMuted, marginTop: 4 }}>
                        {goal.pillar}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          ) : null}

          <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b08090', marginBottom: 6 }}>
              This Week&apos;s Milestones
            </p>
            {nonNegProgress.map((nn, i) => (
              <div key={`${nn.id}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 4, background: '#f2c4d0', borderRadius: 99 }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((nn.progress / nn.timesPerWeek) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, #e8407a, #f472a8)',
                    borderRadius: 99,
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <p style={{ fontSize: '0.65rem', color: '#7a5a66', whiteSpace: 'nowrap' }}>
                  {nn.progress}/{nn.timesPerWeek}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 18 }} />

        <div style={{ background: isDarkTheme ? shellSurfaceAlt : '#fff1f6', border: `1px solid ${shellBorder}`, borderRadius: 22, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <div style={{ background: '#fff', border: `1px solid ${shellBorder}`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Current Streak</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.currentStreak} day</div>
              <div style={{ fontSize: 11, letterSpacing: '0.04em', color: '#7e5d68' }}>Keep the habit visible.</div>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${shellBorder}`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Rank</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.rank}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.04em', color: '#7e5d68' }}>Your consistency level.</div>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${shellBorder}`, borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Sage Level</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.sageLevel.replace('Sage ', '') || 'Sage'}</div>
              <div style={{ fontSize: 11, letterSpacing: '0.04em', color: '#7e5d68' }}>Guidance gets sharper as your streak grows.</div>
            </div>
          </div>
        </div>

        <div style={{ height: 18 }} />

        <div style={{ background: '#fff', border: `1px solid ${shellBorder}`, borderRadius: 22, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>
            Unlock Path
          </div>
          <div style={{ fontSize: 12, color: '#7e5d68', marginBottom: 14 }}>
            Day 3 is encouragement. Day 14 unlocks real control.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {UNLOCK_TIERS.map(tier => {
              const state = getUnlockState(summary, tier)
              const isUnlocked = summary.currentStreak >= tier.minStreak
              const progress = tier.minStreak
                ? Math.min(100, Math.round((summary.currentStreak / tier.minStreak) * 100))
                : 0
              return (
                <div
                  key={tier.id}
                  style={{
                    background: '#fff',
                    border: `1px solid ${shellBorder}`,
                    borderRadius: 16,
                    padding: '16px 16px',
                    opacity: isUnlocked ? 1 : 0.7,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>
                        Tier {tier.id}
                      </div>
                      <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#24131f', marginBottom: 10, lineHeight: 1.3 }}>
                        {tier.name}
                      </div>
                      <div style={{ fontSize: 13, color: '#7e5d68', lineHeight: 1.7, marginBottom: 12 }}>
                        {tier.reward}
                      </div>
                      {isUnlocked ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                          <span>Unlocked</span>
                        </div>
                      ) : (
                        <>
                          <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>
                            Unlock at {tier.minStreak} days
                          </div>
                          <div style={{ height: 6, borderRadius: 999, background: shellSurfaceAlt, overflow: 'hidden', marginTop: 8 }}>
                            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accent},${accent2})` }} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {showPhaseModal ? (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            zIndex: 500,
          }}>
            <div style={{
              background: '#fff', borderRadius: '20px 20px 0 0',
              padding: '1.5rem', width: '100%', maxWidth: 480,
            }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', marginBottom: 6 }}>
                Before you move forward
              </p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>
                Complete your phase reflection with Sage first.
              </p>
              <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 16 }}>
                Sage needs your phase 1 answers to guide phase 2 properly. This takes 5 minutes.
              </p>
              <button onClick={openPulse} style={{
                width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                marginBottom: 8,
              }}>
                Reflect with Sage now
              </button>
              <button onClick={() => setShowPhaseModal(false)} style={{
                width: '100%', padding: '0.75rem', borderRadius: 12,
                border: '1.5px solid #f2c4d0', background: 'transparent',
                color: '#7a5a66', fontSize: '0.85rem', cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                I will do it later
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
