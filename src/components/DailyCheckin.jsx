import { useEffect, useMemo, useState } from 'react'
import { buildWeeklyGoals, getLockInSummary, loadBoardData, loadLockInState, UNLOCK_TIERS } from '../lib/lockIn'

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
      ...(Array.isArray(pillar?.activities) ? pillar.activities.map(item => String(item || '').trim()) : []),
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
    return activities.length > 0 || pillar?.beforeImage || pillar?.afterImage || pillar?.beforeState || pillar?.afterState
  })
}

function buildActivities(phase) {
  const pillars = Array.isArray(phase?.pillars) ? phase.pillars : []
  return pillars.flatMap((pillar, pillarIndex) =>
    (Array.isArray(pillar?.activities) ? pillar.activities : [])
      .map((activity, activityIndex) => {
        const description = String(activity || '').trim()
        if (!description) return null
        return {
          id: `${pillar?.id || `pillar-${pillarIndex}`}_${activityIndex}_${description}`,
          description,
          pillar: String(pillar?.name || `Pillar ${pillarIndex + 1}`).trim(),
          done: false,
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

function taskKey(scope, week, day) {
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
  localStorage.setItem(key, today)
  return today
}

function dayLabel(day) {
  return ({
    3: ' - push for one extra rep today',
    5: ' - match your best day this week',
    7: ' - finish strong. Last day of the week.',
  })[day] || ''
}

function buildBaseTasks(week, activities, day) {
  const goals = Array.isArray(week?.goals) ? week.goals : []
  if (goals.length) {
    return goals.map((goal, index) => ({
      id: goal.activityId || `${goal.pillar || 'pillar'}_${index}_${goal.activity}`,
      description: `${goal.activity}${goal.target ? ` (${goal.target}x this week)` : ''}${dayLabel(day)}`,
      pillar: goal.pillar || 'Pillar',
      done: false,
    }))
  }
  return activities.map(activity => ({
    ...activity,
    description: `${activity.description}${dayLabel(day)}`,
    done: false,
  }))
}

function sameTasks(saved, base) {
  if (!Array.isArray(saved) || saved.length !== base.length) return false
  return saved.map(item => item.id).sort().join('|') === base.map(item => item.id).sort().join('|')
}

function loadTasks(scope, week, day, base) {
  const saved = safeRead(taskKey(scope, week, day), null)
  if (sameTasks(saved, base)) return saved
  safeWrite(taskKey(scope, week, day), base)
  return base
}

function countDaysDone(scope, week) {
  let done = 0
  for (let day = 1; day <= 7; day += 1) {
    const tasks = safeRead(taskKey(scope, week, day), null)
    if (Array.isArray(tasks) && tasks.length > 0 && tasks.every(item => item.done)) done += 1
  }
  return done
}

function countWeekTasksDone(scope, week) {
  let done = 0
  for (let day = 1; day <= 7; day += 1) {
    const tasks = safeRead(taskKey(scope, week, day), [])
    done += tasks.filter(item => item.done).length
  }
  return done
}

function tierState(summary, tier) {
  if (summary.currentStreak >= tier.minStreak) return 'done'
  if (summary.nextTier?.id === tier.id) return 'next'
  return 'locked'
}

export default function DailyCheckin({ onLockInChange, onOpenBoard, onOpenWeeklyPulse }) {
  const [lockInState, setLockInState] = useState(() => loadLockInState())
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    const sync = () => {
      setLockInState(loadLockInState())
      setRefresh(value => value + 1)
    }
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
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
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const currentPhase = phases.find(phase => phase.id === activePhaseId) || phases[0] || null
  const hasPillars = hasConfiguredPillars(currentPhase)
  const activities = useMemo(() => buildActivities(currentPhase), [currentPhase])
  const phaseScope = useMemo(() => buildFingerprint(currentPhase || {}), [currentPhase])
  const totalWeeks = Math.max(weeklyData.weeks?.length || 1, 1)
  const [activeWeek, setActiveWeek] = useState(1)
  const [tasks, setTasks] = useState([])
  const [showPhaseModal, setShowPhaseModal] = useState(false)
  const [lockedWeekMessage, setLockedWeekMessage] = useState('')

  const weekStatuses = useMemo(() => {
    return (weeklyData.weeks || []).map(item => {
      const daysDone = hasPillars ? countDaysDone(phaseScope, item.index) : 0
      const pulseDone = pulseDoneForWeek(currentPhase?.name, item.index) && daysDone === 7
      return {
        week: item.index,
        daysDone,
        pulseDone,
      }
    })
  }, [weeklyData.weeks, hasPillars, phaseScope, currentPhase, tasks, refresh])

  const currentWeek = useMemo(() => {
    if (!weekStatuses.length) return 1
    for (const item of weekStatuses) {
      if (!(item.daysDone === 7 && item.pulseDone)) return item.week
    }
    return Math.min(totalWeeks, weekStatuses[weekStatuses.length - 1].week)
  }, [weekStatuses, totalWeeks])
  const now = new Date()

  useEffect(() => {
    setActiveWeek(currentWeek)
  }, [currentWeek, activePhaseId])

  useEffect(() => {
    if (!hasPillars) return
    getWeekStartDate(phaseScope, currentWeek)
  }, [hasPillars, phaseScope, currentWeek])

  const week = weeklyData.weeks.find(item => item.index === activeWeek) || weeklyData.weeks[0] || null
  const currentWeekStart = getWeekStartDate(phaseScope, currentWeek)
  const elapsedCurrentWeekDays = Math.max(0, Math.floor((now - new Date(`${currentWeekStart}T12:00:00`)) / 86400000))
  const displayedDay = activeWeek < currentWeek ? 7 : activeWeek > currentWeek ? 1 : Math.min(7, elapsedCurrentWeekDays + 1)

  useEffect(() => {
    if (!hasPillars || !week) {
      setTasks([])
      return
    }
    const base = buildBaseTasks(week, activities, displayedDay)
    setTasks(loadTasks(phaseScope, activeWeek, displayedDay, base))
  }, [hasPillars, week, activities, displayedDay, phaseScope, activeWeek])

  const completedToday = tasks.filter(item => item.done).length
  const totalToday = tasks.length
  const daysCompleted = useMemo(() => hasPillars ? countDaysDone(phaseScope, activeWeek) : 0, [hasPillars, phaseScope, activeWeek, tasks])
  const completedTasksThisWeek = useMemo(() => hasPillars ? countWeekTasksDone(phaseScope, activeWeek) : 0, [hasPillars, phaseScope, activeWeek, tasks])
  const totalTasksThisWeek = hasPillars ? activities.length * 7 : 0
  const weekPercent = totalTasksThisWeek ? Math.round((completedTasksThisWeek / totalTasksThisWeek) * 100) : 0
  const currentPulseDone = weekStatuses.find(item => item.week === activeWeek)?.pulseDone || false
  const previousPulseDone = activeWeek === 1 ? true : (weekStatuses.find(item => item.week === activeWeek - 1)?.pulseDone || false)
  const isNewUser = activeWeek === 1 && displayedDay === 1 && completedTasksThisWeek === 0
  const showReminder = activeWeek > 1 && displayedDay > 1 && !previousPulseDone
  const weekComplete = daysCompleted === 7
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  const accent = 'var(--app-accent)'
  const accent2 = 'var(--app-accent2)'

  function canAccessWeek(weekNumber) {
    if (weekNumber === 1) return true
    const previous = weekStatuses.find(item => item.week === weekNumber - 1)
    return Boolean(previous?.pulseDone)
  }

  function toggleTask(taskId) {
    const updated = tasks.map(item => item.id === taskId ? { ...item, done: !item.done } : item)
    safeWrite(taskKey(phaseScope, activeWeek, displayedDay), updated)
    setTasks(updated)
    setLockInState(loadLockInState())
    onLockInChange?.()
  }

  function openPulse() {
    onOpenWeeklyPulse?.({
      weekNumber: activeWeek,
      completionPercent: weekPercent,
      tasksCompleted: completedTasksThisWeek,
      tasksTotal: totalTasksThisWeek,
      phaseName: currentPhase?.name || 'Phase 1',
    })
  }

  function handlePhaseChange(nextPhaseId) {
    if (nextPhaseId === activePhaseId) return
    const currentIndex = phases.findIndex(item => item.id === activePhaseId)
    const nextIndex = phases.findIndex(item => item.id === nextPhaseId)
    if (currentIndex >= 0 && nextIndex > currentIndex) {
      const lastWeek = weeklyData.weeks[weeklyData.weeks.length - 1]?.index || 1
      if (!pulseDoneForWeek(currentPhase?.name, lastWeek)) {
        setShowPhaseModal(true)
        return
      }
    }
    setActivePhaseId(nextPhaseId)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', color: 'var(--app-text)', width: '100%', overflowX: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(100%, 1080px)', maxWidth: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 96px' : '18px 20px 96px', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {phases.map(phase => (
            <button
              key={phase.id}
              type="button"
              onClick={() => handlePhaseChange(phase.id)}
              style={{
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
              {phases.length === 1 ? 'Phase 1' : phase.name}
            </button>
          ))}
        </div>

        <div style={{ height: 16 }} />

        <div style={{ background: '#fff', border: '1.5px solid #f2c4d0', borderRadius: 16, padding: '1rem', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #e8407a, #f472a8)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '0.55rem' }}>SAGE</div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: '#e8407a' }}>Live Score</p>
            <p style={{ fontSize: '0.65rem', color: '#b08090', marginLeft: 'auto' }}>{weekPercent}% this week</p>
          </div>

          {!hasPillars && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Add your pillar activities in Vision Board and Sage will turn them into your daily streak plan.
            </p>
          )}
          {hasPillars && isNewUser && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Your week 1 starts today. Complete your daily tasks and come back tomorrow. Sage will track your progress and guide you as the week builds.
            </p>
          )}
          {hasPillars && !isNewUser && weekComplete && !currentPulseDone && (
            <>
              <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6, marginBottom: 12 }}>
                Week {activeWeek} closed at {weekPercent}%. Complete your weekly reflection with Sage before week {activeWeek + 1} opens.
              </p>
              <button onClick={openPulse} style={{ width: '100%', padding: '0.7rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                Open Weekly Pulse
              </button>
            </>
          )}
          {hasPillars && !isNewUser && weekComplete && currentPulseDone && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Week {activeWeek} done. Reflection complete. Week {activeWeek + 1} is open.
            </p>
          )}
          {hasPillars && !isNewUser && !weekComplete && showReminder && (
            <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              You are {displayedDay} days into week {activeWeek}. Your week {activeWeek - 1} reflection with Sage is still pending.
              <span onClick={openPulse} style={{ color: '#e8407a', fontWeight: 700, cursor: 'pointer' }}> Complete now</span>
            </p>
          )}
          {hasPillars && !isNewUser && !weekComplete && !showReminder && (
              <p style={{ fontSize: '0.82rem', color: '#3d1f2b', lineHeight: 1.6 }}>
              Day {displayedDay} of 7. You have completed {completedTasksThisWeek} of {totalTasksThisWeek} tasks this week.
              {weekPercent >= 50 ? ' You are on track. Keep going.' : ' Stay consistent. Every task counts.'}
            </p>
          )}
        </div>

        {!hasPillars && (
          <div style={{ textAlign: 'center', padding: '1.5rem 1rem', border: '1px solid #f2c8d6', borderRadius: 16, background: '#fff6f9', marginBottom: '1rem' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8 }}>Set up your Vision Board first</p>
            <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 12 }}>
              Your daily tasks come from your pillars and activities. Add them to your Vision Board to activate your streak.
            </p>
            <button type="button" onClick={onOpenBoard} style={{ borderRadius: 999, border: `1px solid ${accent}`, background: 'transparent', color: accent, padding: '0.55rem 0.95rem', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
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
                      setLockedWeekMessage(`Finish Week ${item.index - 1} and complete its weekly reflection with Sage first.`)
                      return
                    }
                    setActiveWeek(item.index)
                  }}
                  style={{
                    padding: isMobile ? '7px 12px' : '8px 14px',
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
          <div style={{ background: '#fff8ec', border: '1px solid #f3d38a', borderRadius: 16, padding: '0.9rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#5a4310', lineHeight: 1.5 }}>
              {lockedWeekMessage}
            </p>
            <button
              type="button"
              onClick={() => setLockedWeekMessage('')}
              style={{ border: 'none', background: 'transparent', color: '#9f7a18', fontWeight: 700, cursor: 'pointer' }}
            >
              OK
            </button>
          </div>
        ) : null}

        <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 22, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3d1f2b' }}>Daily To-Do</div>
              <div style={{ fontSize: '0.65rem', color: '#b08090' }}>Day {displayedDay} of 7</div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>{completedToday}/{totalToday}</div>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: '#fff6f9', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{ width: `${(daysCompleted / 7) * 100}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accent},${accent2})` }} />
          </div>

          <div style={{ fontSize: 11, color: '#7e5d68', marginBottom: 14 }}>
            {hasPillars ? 'These tasks come directly from your current pillar activities and get sharper week by week.' : 'Set up your activities first to activate your daily streak plan.'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.length === 0 && (
              <div style={{ padding: '18px 16px', borderRadius: 14, border: '1px solid #f2c8d6', background: '#fff6f9', color: '#7e5d68', fontSize: 12 }}>
                Set up your vision board first to activate your daily tasks.
              </div>
            )}
            {tasks.map(task => (
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
                  background: '#fff6f9',
                  border: `1px solid ${task.done ? 'rgba(74,222,128,0.25)' : '#f2c8d6'}`,
                  borderRadius: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  opacity: task.done ? 0.72 : 1,
                }}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${task.done ? '#22c55e' : '#f2c8d6'}`, background: task.done ? '#22c55e' : 'transparent', color: '#fff', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2, fontSize: 11, fontWeight: 700 }}>
                  {task.done ? 'v' : ''}
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

        <div style={{ height: 18 }} />

        <div style={{ background: '#fff1f6', border: '1px solid #f2c8d6', borderRadius: 22, padding: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Current Streak</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.currentStreak} day</div>
              <div style={{ fontSize: 11, color: '#7e5d68' }}>Keep the habit visible.</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Rank</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.rank}</div>
              <div style={{ fontSize: 11, color: '#7e5d68' }}>Your consistency level.</div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 16, padding: '16px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Sage Level</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#24131f', marginBottom: 5 }}>{summary.sageLevel.replace('Sage ', '') || 'Sage'}</div>
              <div style={{ fontSize: 11, color: '#7e5d68' }}>Guidance gets sharper as your streak grows.</div>
            </div>
          </div>
        </div>

        <div style={{ height: 18 }} />

        <div style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 22, padding: 16 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: accent, marginBottom: 8 }}>Unlock Path</div>
          <div style={{ fontSize: 12, color: '#7e5d68', marginBottom: 14 }}>Day 3 is encouragement. Day 14 unlocks real control.</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {UNLOCK_TIERS.map(tier => {
              const unlocked = summary.currentStreak >= tier.minStreak
              const progress = tier.minStreak ? Math.min(100, Math.round((summary.currentStreak / tier.minStreak) * 100)) : 0
              return (
                <div key={tier.id} style={{ background: '#fff', border: '1px solid #f2c8d6', borderRadius: 16, padding: '16px', opacity: unlocked ? 1 : 0.7 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8d7bb0', marginBottom: 10 }}>Tier {tier.id}</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: '#24131f', marginBottom: 10 }}>{tier.name}</div>
                  <div style={{ fontSize: 13, color: '#7e5d68', lineHeight: 1.7, marginBottom: 12 }}>{tier.reward}</div>
                  {tierState(summary, tier) === 'done' ? (
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>Unlocked</div>
                  ) : (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>Unlock at {tier.minStreak} days</div>
                      <div style={{ height: 6, borderRadius: 999, background: '#fff6f9', overflow: 'hidden', marginTop: 8 }}>
                        <div style={{ width: `${progress}%`, height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accent},${accent2})` }} />
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {showPhaseModal ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500 }}>
            <div style={{ background: '#fff', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: 480 }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', marginBottom: 6 }}>Before you move forward</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', marginBottom: 8, fontFamily: 'Playfair Display, serif' }}>Complete your phase reflection with Sage first.</p>
              <p style={{ fontSize: '0.82rem', color: '#7a5a66', lineHeight: 1.6, marginBottom: 16 }}>Sage needs your previous phase answers to guide the next phase properly. This takes 5 minutes.</p>
              <button onClick={openPulse} style={{ width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}>Reflect with Sage now</button>
              <button onClick={() => setShowPhaseModal(false)} style={{ width: '100%', padding: '0.75rem', borderRadius: 12, border: '1.5px solid #f2c4d0', background: 'transparent', color: '#7a5a66', fontSize: '0.85rem', cursor: 'pointer' }}>I will do it later</button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
