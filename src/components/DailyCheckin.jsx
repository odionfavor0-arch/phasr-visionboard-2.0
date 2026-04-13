import { useEffect, useMemo, useState } from 'react'
import {
  buildWeeklyGoals,
  getLockInSummary,
  loadBoardData,
  loadLockInState,
  UNLOCK_TIERS,
} from '../lib/lockIn'
// Sage briefing card removed; live score card is rendered inline below.

const WEEK_PROGRESS_KEY = 'phasr_week_progress'

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

function generateTasksForDay(activities, dayOfWeek, currentWeek) {
  if (!Array.isArray(activities) || !activities.length) return []
  return activities.map(activity => ({
    id: activity.id,
    goalId: activity.id,
    description: activity.description,
    pillar: activity.pillar,
    done: false,
    timesPerWeek: activity.timesPerWeek,
  }))
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

  const boardStore = useMemo(() => safeRead('phasr_vb', {}), [])
  const currentPhase = boardStore?.phases?.[0] || selectedPhase
  const allActivities = useMemo(() => {
    const pillars = Array.isArray(currentPhase?.pillars) ? currentPhase.pillars : []
    return pillars.flatMap((pillar, pillarIndex) => {
      const activities = Array.isArray(pillar?.activities) ? pillar.activities : []
      return activities
        .map((activity, activityIndex) => {
          const description = typeof activity === 'string'
            ? activity.trim()
            : String(activity?.description || activity?.title || '').trim()
          if (!description) return null
          return {
            id: `${pillar?.id || pillar?.name || `pillar-${pillarIndex}`}_${description}_${activityIndex}`,
            description,
            pillar: pillar?.name || 'Pillar',
            done: false,
          }
        })
        .filter(Boolean)
    })
  }, [currentPhase, selectedPhase])
  const hasPillars = Array.isArray(currentPhase?.pillars) && currentPhase.pillars.length > 0

  const weekNumber = selectedWeek?.index || weeklyData.currentWeek?.index || 1
  const phaseStartDate = useMemo(() => {
    if (selectedPhase?.startDate) {
      return new Date(`${selectedPhase.startDate}T12:00:00`)
    }
    if (selectedWeek?.startDate) {
      return new Date(`${selectedWeek.startDate}T12:00:00`)
    }
    const fallback = new Date()
    fallback.setHours(12, 0, 0, 0)
    return fallback
  }, [selectedPhase?.startDate, selectedWeek?.startDate])

  const today = new Date()
  const daysSinceStart = Math.floor((today - phaseStartDate) / 86400000)
  const calculatedWeek = Math.floor(daysSinceStart / 7) + 1
  const currentWeek = Math.max(1, calculatedWeek)
  const rawDayOfWeek = (daysSinceStart % 7) + 1
  const dayNumber = rawDayOfWeek <= 0 ? rawDayOfWeek + 7 : rawDayOfWeek
  const [todaysTasks, setTodaysTasks] = useState([])

  useEffect(() => {
    setActiveWeek(Math.max(1, calculatedWeek))
  }, [activePhaseId, calculatedWeek])

  useEffect(() => {
    if (!hasPillars) {
      setTodaysTasks([])
      return
    }
    const taskKey = `phasr_tasks_w${currentWeek}_d${dayNumber}`
    const savedTasks = safeRead(taskKey, null)
    const baseTasks = generateTasksForDay(allActivities, dayNumber, currentWeek)
    const nextTasks = Array.isArray(savedTasks) && savedTasks.length
      ? savedTasks
      : baseTasks

    if (!Array.isArray(savedTasks) || !savedTasks.length) {
      safeWrite(taskKey, nextTasks)
    }
    setTodaysTasks(nextTasks)
  }, [allActivities, currentWeek, dayNumber, hasPillars])

  const completedToday = todaysTasks.filter(t => t.done).length
  const totalToday = todaysTasks.length
  const todayScore = Math.round((completedToday / totalToday) * 100) || 0

  function getDaysCompleted(weekNumberToCheck) {
    let daysCount = 0
    for (let day = 1; day <= 7; day += 1) {
      const key = `phasr_tasks_w${weekNumberToCheck}_d${day}`
      const tasks = safeRead(key, null)
      if (Array.isArray(tasks) && tasks.length > 0 && tasks.every(task => task.done)) {
        daysCount += 1
      }
    }
    return daysCount
  }

  const daysCompleted = useMemo(
    () => (hasPillars ? getDaysCompleted(currentWeek) : 0),
    [currentWeek, todaysTasks, allActivities.length, hasPillars],
  )
  const totalDays = 7
  const weekDayProgressPercent = Math.round((daysCompleted / totalDays) * 100) || 0

  const totalTasksThisWeek = allActivities.length * 7
  const completedTasksThisWeek = useMemo(() => {
    let count = 0
    for (let day = 1; day <= 7; day += 1) {
      const key = `phasr_tasks_w${currentWeek}_d${day}`
      const tasks = safeRead(key, []) || []
      count += tasks.filter(task => task.done).length
    }
    return count
  }, [currentWeek, todaysTasks, allActivities.length])

  const weekStreakPercent = totalTasksThisWeek > 0
    ? Math.round((completedTasksThisWeek / totalTasksThisWeek) * 100)
    : 0
  const weekCompletionPercent = weekStreakPercent

  const pulseKey = `phasr_weekly_pulse_w${currentWeek}_done`
  const currentWeekPulseDone = localStorage.getItem(pulseKey) === 'true'
  const prevWeekPulseDone = currentWeek === 1
    || localStorage.getItem(`phasr_weekly_pulse_w${currentWeek - 1}_done`) === 'true'
  const weekComplete = daysCompleted === 7

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

  function toggleTask(taskId) {
    const updated = todaysTasks.map(task => (
      task.id === taskId ? { ...task, done: !task.done } : task
    ))
    const taskKey = `phasr_tasks_w${currentWeek}_d${dayNumber}`
    safeWrite(taskKey, updated)
    setTodaysTasks(updated)

    const allDoneToday = updated.length > 0 && updated.every(task => task.done)
    if (allDoneToday) {
      const streakKey = `phasr_streak_w${currentWeek}_d${dayNumber}`
      localStorage.setItem(streakKey, 'true')
    }

    setLockInState(loadLockInState())
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

  const openPulse = () => {
    if (typeof onOpenWeeklyPulse === 'function') {
      onOpenWeeklyPulse({
        weekNumber: currentWeek,
        completionPercent: weekStreakPercent,
        tasksCompleted: completedTasksThisWeek,
        tasksTotal: totalTasksThisWeek,
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
        {hasPillars && currentWeek > 1 && !prevWeekPulseDone && (
          <p
            style={{ fontSize: '0.7rem', color: '#e8407a', marginBottom: 8, cursor: 'pointer' }}
            onClick={openPulse}
          >
            Week {currentWeek - 1} reflection with Sage is still pending. Tap to complete it.
          </p>
        )}

        {hasPillars && !weekComplete && (
          <div style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 16, padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a' }}>
                Week {currentWeek} - Day {dayNumber} of 7
              </p>
              <p style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3d1f2b' }}>
                {completedToday}/{totalToday}
              </p>
            </div>
            <div style={{ height: 6, background: '#f2c4d0', borderRadius: 99, marginBottom: 6 }}>
              <div style={{
                height: '100%',
                width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%`,
                background: completedToday === totalToday && totalToday > 0
                  ? 'linear-gradient(90deg, #34d399, #059669)'
                  : 'linear-gradient(90deg, #e8407a, #f472a8)',
                borderRadius: 99,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <p style={{ fontSize: '0.7rem', color: '#7a5a66' }}>
              {completedToday === totalToday && totalToday > 0
                ? 'All done today. Streak secured.'
                : `${totalToday - completedToday} task${totalToday - completedToday !== 1 ? 's' : ''} left today`
              }
            </p>
          </div>
        )}

        {hasPillars && weekComplete && !currentWeekPulseDone && (
          <div style={{ background: 'linear-gradient(135deg, #fff5f7, #fffbfc)', border: '1.5px solid #f2c4d0', borderRadius: 16, padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', marginBottom: 4 }}>
              Week {currentWeek} closed
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 4, fontFamily: 'Playfair Display, serif' }}>
              {weekCompletionPercent}% completion
            </p>
            <p style={{ fontSize: '0.78rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 12 }}>
              Two questions. Sage reads your week and tells you what matters going into week {currentWeek + 1}.
            </p>
            <button onClick={openPulse} style={{
              width: '100%', padding: '0.75rem', borderRadius: 12, border: 'none',
              background: 'linear-gradient(135deg, #e8407a, #f472a8)',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            }}>
              Open Weekly Pulse
            </button>
          </div>
        )}

        {hasPillars && weekComplete && currentWeekPulseDone && (
          <div style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 16, padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#b08090', marginBottom: 4 }}>
              Week {currentWeek} closed
            </p>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3d1f2b' }}>
              {weekCompletionPercent}% complete
            </p>
            <p style={{ fontSize: '0.7rem', color: '#34d399', marginTop: 4 }}>
              Reflection done. Week {currentWeek + 1} is open.
            </p>
          </div>
        )}

        <div style={{
          background: '#fff', border: '1.5px solid #f2c4d0',
          borderRadius: 16, padding: '1rem', marginBottom: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'linear-gradient(135deg, #e8407a, #f472a8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'DM Sans, sans-serif', fontWeight: 800,
              fontSize: '0.55rem', color: '#fff', flexShrink: 0,
            }}>SAGE</div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e8407a' }}>
              Live Score
            </p>
            <p style={{ fontSize: '0.65rem', color: '#b08090', marginLeft: 'auto' }}>
              {weekStreakPercent}% this week
            </p>
          </div>

          {hasPillars && weekComplete && !currentWeekPulseDone && (
            <>
              <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6, marginBottom: 12 }}>
                Week {currentWeek} closed at {weekStreakPercent}%.
                Two questions. Sage reads your week and tells you
                what matters going into week {currentWeek + 1}.
              </p>
              <button
                onClick={openPulse}
                style={{
                  width: '100%', padding: '0.7rem', borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                  color: '#fff', fontSize: '0.82rem', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                }}
              >
                Open Weekly Pulse
              </button>
            </>
          )}

          {hasPillars && weekComplete && currentWeekPulseDone && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Week {currentWeek} done. Reflection complete.
              Week {currentWeek + 1} is open.
            </p>
          )}

          {hasPillars && !weekComplete && !prevWeekPulseDone && currentWeek > 1 && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              You are {dayNumber} days into week {currentWeek}.
              Your week {currentWeek - 1} reflection with Sage
              is still pending. Complete it so Sage can shape
              this week properly.{' '}
              <span
                onClick={openPulse}
                style={{ color: '#e8407a', fontWeight: 700, cursor: 'pointer' }}
              >
                Complete now
              </span>
            </p>
          )}

          {hasPillars && !weekComplete && prevWeekPulseDone && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Day {dayNumber} of 7. You have completed{' '}
              {completedTasksThisWeek} of {totalTasksThisWeek} tasks
              this week. {weekStreakPercent >= 50
                ? 'You are on track. Keep going.'
                : 'Stay consistent. Every task counts.'
              }
            </p>
          )}
        </div>

        {!hasPillars && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', border: `1px solid ${shellBorder}`, borderRadius: 16, background: shellSurfaceAlt, marginBottom: '1rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8 }}>
              Set up your Vision Board first
            </p>
            <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6 }}>
              Your daily tasks come from your pillars and activities. Add them to your Vision Board to activate your streak.
            </p>
          </div>
        )}

        {hasPillars && (
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: shellMuted, marginBottom: 10 }}>
            All Weeks
          </div>
        )}
        {hasPillars && (
          <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', paddingBottom: 2 }}>
            <div style={{ display: 'flex', gap: 8, width: 'max-content', minWidth: '100%', paddingBottom: 2, flexWrap: 'nowrap' }}>
              {weeklyData.weeks.map(week => {
                  const active = week.index === activeWeek
                  const daysDoneForWeek = getDaysCompleted(week.index)
                  const pulseDoneForWeek = localStorage.getItem(`phasr_weekly_pulse_w${week.index}_done`) === 'true'
                  const prevWeekDone = week.index === 1 || getDaysCompleted(week.index - 1) === 7
                  const state = (() => {
                    if (week.index === currentWeek) return 'current'
                    if (!prevWeekDone && week.index > 1) return 'locked'
                    if (daysDoneForWeek === 7 && pulseDoneForWeek) return 'completed_with_pulse'
                    return 'completed_no_pulse'
                  })()
                  const isLocked = state === 'locked'
                  return (
                    <button
                      key={week.id}
                      type="button"
                      onClick={isLocked ? undefined : () => handleWeekSelect(week)}
                      style={{
                        padding: isMobile ? '7px 12px' : '8px 14px',
                        borderRadius: 999,
                        border: active ? `1px solid ${accent}` : `1px solid ${shellBorder}`,
                        background: active ? (isDarkTheme ? 'rgba(249,95,133,0.12)' : '#fff1f6') : shellSurface,
                        color: active ? accent : shellMuted,
                        fontSize: isMobile ? 11 : 12,
                        fontWeight: 700,
                        cursor: isLocked ? 'default' : 'pointer',
                        whiteSpace: 'nowrap',
                        opacity: isLocked ? 0.4 : 1,
                      }}
                    >
                      {state === 'completed_with_pulse' ? `Week ${week.index} done` : `Week ${week.index}`}
                    </button>
                  )
                })}
            </div>
          </div>
        )}

        {hasPillars && <div style={{ height: 14 }} />}

        {hasPillars && (
        <div style={{ background: shellSurface, border: `1px solid ${shellBorder}`, borderRadius: 22, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: shellText }}>
              {selectedWeek?.weekLabel || 'Week 1'} Daily To-Do
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>
              {completedToday}/{totalToday}
            </div>
          </div>
          <div style={{ fontSize: 11, color: shellMuted, marginBottom: 10 }}>
            Day {dayNumber} of 7
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
            {todaysTasks.map(task => {
              const done = task.done
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => toggleTask(task.id)}
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
                    {done ? 'v' : ''}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isMobile ? 14 : 16, fontWeight: 600, lineHeight: 1.45, color: done ? shellMuted : shellText, textDecoration: done ? 'line-through' : 'none' }}>
                      {task.description}
                    </div>
                    <div style={{ fontSize: 12, color: shellMuted, marginTop: 4 }}>
                      {task.pillar}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

        </div>
        )}

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
