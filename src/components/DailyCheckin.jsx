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
const WEEKLY_PULSE_COMPLETION_KEY = 'phasr_weekly_pulse_completion'
const PENDING_WEEKLY_PULSE_OPEN_KEY = 'phasr_pending_weekly_pulse_open'
const FORCE_WEEKLY_PULSE_OPEN_KEY = 'phasr_force_weekly_pulse_open'
const OPEN_WEEKLY_PULSE_KEY = 'phasr_open_weekly_pulse'

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

function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readPulseCompletions() {
  return safeRead(WEEKLY_PULSE_COMPLETION_KEY, {})
}

function getUnlockState(summary, tier) {
  if (summary.currentStreak >= tier.minStreak) return 'done'
  if (summary.nextTier?.id === tier.id) return 'next'
  return 'locked'
}

function SageBriefingCard({ plan, message, onDismiss }) {
  if (!plan || !message) return null

  const difficultyTone =
    plan.difficulty === 'up' ? { label: 'Difficulty Up', bg: 'rgba(74,222,128,0.12)', color: '#2f9e57' } :
    plan.difficulty === 'down' ? { label: 'Difficulty Down', bg: '#f5eef2', color: '#8f7683' } :
    { label: 'Difficulty Same', bg: 'rgba(244,197,66,0.16)', color: '#b28700' }

  return (
    <div style={{ borderRadius: 18, padding: '1rem', background: '#fff', border: '1px solid var(--app-border)', boxShadow: '0 12px 28px rgba(240,96,144,0.12)', position: 'relative', marginBottom: 16 }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 18, padding: 1, background: 'linear-gradient(135deg,var(--app-accent2),rgba(255,255,255,0.4),var(--app-accent))', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
        <div>
          <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Sage</p>
          <p style={{ margin: '0.45rem 0 0', fontSize: '0.94rem', lineHeight: 1.65, color: '#5a3d47' }}>{message}</p>
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss weekly Sage briefing" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--app-border)', background: '#fff', color: '#b85a82', cursor: 'pointer', lineHeight: 1, padding: 0, flexShrink: 0 }}>
          ×
        </button>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
        <span style={{ padding: '0.38rem 0.7rem', borderRadius: 999, background: '#fff1f6', border: '1px solid #f2c8d6', color: '#b85a82', fontSize: '0.72rem', fontWeight: 700 }}>
          {plan.completionRate}% done
        </span>
        <span style={{ padding: '0.38rem 0.7rem', borderRadius: 999, background: '#fff1f6', border: '1px solid #f2c8d6', color: '#b85a82', fontSize: '0.72rem', fontWeight: 700 }}>
          {plan.streakDays}/7 streak days
        </span>
        <span style={{ padding: '0.38rem 0.7rem', borderRadius: 999, background: difficultyTone.bg, border: '1px solid transparent', color: difficultyTone.color, fontSize: '0.72rem', fontWeight: 700 }}>
          {difficultyTone.label}
        </span>
      </div>
    </div>
  )
}

function getCompletedGoalCount(week) {
  return (week?.goals || []).filter(goal => goal.completed >= goal.target).length
}

function getFormattedGoalText(activity, target) {
  const text = String(activity || '').trim()
  const lower = text.toLowerCase()

  if (lower.includes('gym')) return `Go to the gym ${target} times this week`
  if (lower.includes('strength')) return `Complete ${target} strength sessions this week`
  if (lower.includes('walk')) return `Walk ${Math.min(20 + ((target - 1) * 10), 60)} minutes daily`
  if (lower.includes('meal prep')) return `Meal prep ${target} time${target === 1 ? '' : 's'} this week`
  if (lower.includes('track')) return `${text} ${target} time${target === 1 ? '' : 's'} this week`
  if (lower.includes('review')) return `${text} ${target} time${target === 1 ? '' : 's'} this week`
  if (lower.includes('journal')) return `Journal ${target} time${target === 1 ? '' : 's'} this week`

  return `${text} ${target} time${target === 1 ? '' : 's'} this week`
}

function buildWeekProgressMap(phaseId, weeks) {
  const stored = safeRead(WEEK_PROGRESS_KEY, {})
  const phaseStore = stored[phaseId] || {}
  const nextPhaseStore = {}

  weeks.forEach((week, index) => {
    const totalGoals = week.goals?.length || 0
    const completedGoals = getCompletedGoalCount(week)
    const halfThreshold = Math.floor(totalGoals / 2) + (totalGoals % 2 === 0 ? 1 : 0)
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

export default function DailyCheckin({ onLockInChange, onOpenBoard }) {
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
  const [pulseGate, setPulseGate] = useState(null)
  const [autoPulseGateDismissed, setAutoPulseGateDismissed] = useState(false)

  useEffect(() => {
    if (!phases.some(phase => phase.id === activePhaseId)) {
      setActivePhaseId(phases[0]?.id || null)
    }
  }, [phases, activePhaseId])

  useEffect(() => {
    setActiveWeek(1)
    setAutoPulseGateDismissed(false)
  }, [activePhaseId])

  const phaseBoard = useMemo(() => makeBoardForPhase(boardData, activePhaseId), [boardData, activePhaseId])
  const weeklyData = useMemo(() => buildWeeklyGoals(phaseBoard, lockInState), [phaseBoard, lockInState])
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const selectedPhase = phases.find(phase => phase.id === activePhaseId) || phases[0] || null
  const weekProgressMap = useMemo(
    () => (selectedPhase ? buildWeekProgressMap(selectedPhase.id, weeklyData.weeks) : {}),
    [selectedPhase, weeklyData.weeks, lockInState],
  )
  const selectedWeek = weeklyData.weeks.find(week => week.index === activeWeek) || weeklyData.weeks[0] || null
  const selectedWeekProgress = selectedWeek?.totalTarget
    ? Math.min(100, Math.round((selectedWeek.totalProgress / selectedWeek.totalTarget) * 100))
    : 0
  const activePillarNames = useMemo(() => {
    const pillars = selectedPhase?.pillars || []
    return pillars.filter(isConfiguredPillar).map(pillar => pillar.name).filter(Boolean)
  }, [selectedPhase])
  const filteredGoals = useMemo(() => {
    const goals = selectedWeek?.goals || []
    if (!activePillarNames.length) return []
    return goals.filter(goal => activePillarNames.includes(goal.pillar))
  }, [selectedWeek, activePillarNames])
  const completedGoalItems = filteredGoals.filter(goal => (goal.completed || 0) >= (goal.target || 0)).length
  const filteredWeekTarget = filteredGoals.length
  const filteredWeekProgress = filteredWeekTarget
    ? Math.min(100, Math.round((completedGoalItems / filteredWeekTarget) * 100))
    : 0
  const selectedWeekStatus = selectedWeek ? weekProgressMap[selectedWeek.index] : null
  const showRiskWarning = useMemo(() => {
    const now = new Date()
    if (now.getHours() < 18) return false
    if (!selectedWeek) return false
    const hasOpenGoals = filteredGoals.some(goal => (goal.completed || 0) < (goal.target || 0))
    return hasOpenGoals && !summary.hasLoggedToday
  }, [summary.hasLoggedToday, selectedWeek, filteredGoals])
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
  const autoPulseGate = useMemo(() => {
    if (!selectedPhase) return null
    const week1 = weekProgressMap[1]
    if (!week1?.completed) return null
    const pulseDoneForWeek1 = isPulseCompletedForWeek(selectedPhase?.name || 'Phase 1', 1)
    if (pulseDoneForWeek1) return null
    return {
      fromWeek: 1,
      toWeek: 2,
      phaseName: selectedPhase?.name || 'Phase 1',
    }
  }, [selectedPhase, weekProgressMap])

  useEffect(() => {
    if (!autoPulseGate) setAutoPulseGateDismissed(false)
  }, [autoPulseGate])

  function handleToggleGoal(goal) {
    toggleWeeklyGoalCompletion(goal, phaseBoard)
    setLockInState(loadLockInState())
    broadcastLockInUpdate()
    onLockInChange?.()
  }

  function isPulseCompletedForWeek(phaseName, weekIndex) {
    const phaseKey = normalizeLabel(phaseName || 'phase 1')
    const store = readPulseCompletions()
    return Boolean(store?.[phaseKey]?.[String(weekIndex)])
  }

  function handleWeekSelect(nextWeek) {
    const nextIndex = nextWeek?.index || 1
    if (nextIndex <= 1) {
      setActiveWeek(nextIndex)
      setPulseGate(null)
      return
    }

    const previousIndex = nextIndex - 1
    const previousStatus = weekProgressMap[previousIndex]
    const previousCompleted = Boolean(previousStatus?.completed)
    const pulseDone = isPulseCompletedForWeek(selectedPhase?.name || 'Phase 1', previousIndex)

    if (previousCompleted && !pulseDone) {
      setPulseGate({
        fromWeek: previousIndex,
        toWeek: nextIndex,
        phaseName: selectedPhase?.name || 'Phase 1',
      })
      return
    }

    setPulseGate(null)
    setActiveWeek(nextIndex)
  }

  function openWeeklyPulseFromGate() {
    try {
      localStorage.setItem(OPEN_WEEKLY_PULSE_KEY, 'true')
    } catch {
      // ignore storage failures (private mode, disabled storage, etc.)
    }
    window.dispatchEvent(new CustomEvent('phasr-open-view', { detail: { view: 'journal', openWeeklyPulse: true } }))
  }

  const pulseGateCard = pulseGate || autoPulseGate
  const showPulseGateCard = Boolean(pulseGate) || (Boolean(autoPulseGate) && !autoPulseGateDismissed)

  function closePulseGateCard() {
    if (pulseGate) {
      setPulseGate(null)
      return
    }
    setAutoPulseGateDismissed(true)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: shellBg, color: shellText, width: '100%', overflowX: 'hidden', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: 'min(100%, 1080px)', maxWidth: '100%', margin: '0 auto', padding: isMobile ? '14px 10px 96px' : '18px 20px 96px', overflowX: 'hidden', boxSizing: 'border-box' }}>
        {showRiskWarning && (
          <div style={{ borderRadius: 14, padding: '0.85rem 1rem', border: '1px solid rgba(239,68,68,0.65)', background: 'rgba(239,68,68,0.08)', color: '#b4233f', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span>Your streak is at risk. Complete today&apos;s task before midnight.</span>
          </div>
        )}
        <div style={{ overflowX: 'hidden' }}>
          <div style={{ display: 'flex', gap: 10, width: '100%', flexWrap: 'wrap' }}>
            {phases.map(phase => {
              const active = phase.id === activePhaseId
              const phaseLabel = showSinglePhaseAsPhaseOne ? 'Phase 1' : phase.name
              return (
                <button
                  key={phase.id}
                  type="button"
                  onClick={() => setActivePhaseId(phase.id)}
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

        {showPulseGateCard && pulseGateCard ? (
          <div style={{ position: 'fixed', inset: 0, zIndex: 170, display: 'grid', placeItems: 'center', background: 'rgba(35,18,28,0.22)', backdropFilter: 'blur(1px)', padding: '18px' }} onClick={closePulseGateCard}>
            <div onClick={event => event.stopPropagation()} style={{ position: 'relative', width: 'min(calc(100% - 20px), 560px)', background: '#fff5f8', border: '1px solid #f2c8d6', borderRadius: 24, boxShadow: '0 24px 48px rgba(185,87,122,0.2)', padding: isMobile ? '1rem 1rem 0.95rem' : '1.1rem 1.15rem 1rem' }}>
              <button onClick={closePulseGateCard} aria-label="Close weekly pulse prompt" style={{ position: 'absolute', top: 12, right: 12, width: 36, height: 36, borderRadius: '50%', border: '1px solid #efc3d1', background: '#fff', color: '#b85a82', cursor: 'pointer', padding: 0, fontSize: '1.1rem', lineHeight: 1 }}>
                ×
              </button>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e07b9f' }}>Weekly Pulse</p>
              <p style={{ color: '#5c3342', fontSize: isMobile ? '1.12rem' : '1.32rem', lineHeight: 1.45, margin: '0.55rem 2.4rem 0.5rem 0', fontWeight: 700 }}>
                Before week {pulseGateCard.toWeek} begins, take 5 minutes with Sage.
              </p>
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                <button onClick={openWeeklyPulseFromGate} style={{ minHeight: 48, padding: '0.75rem 1.25rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.96rem' }}>
                  Open Weekly Pulse
                </button>
                <button onClick={closePulseGateCard} style={{ minHeight: 48, padding: '0.75rem 1.1rem', borderRadius: 999, border: '1px solid #efc3d1', background: '#fff', color: '#8a5568', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.94rem' }}>
                  Later
                </button>
              </div>
            </div>
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
                  Week {week.index}{status?.completed ? ' ✓' : ''}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div style={{ background: shellSurface, border: `1px solid ${shellBorder}`, borderRadius: 22, padding: isMobile ? 14 : 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: shellText }}>
              {selectedWeek?.weekLabel || 'Week 1'} To-Do List
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: accent }}>
              {completedGoalItems}/{filteredWeekTarget}
            </div>
          </div>

          <div style={{ height: 8, borderRadius: 999, background: shellSurfaceAlt, overflow: 'hidden', marginBottom: 10 }}>
            <div
              style={{
                width: `${filteredWeekProgress}%`,
                height: '100%',
                borderRadius: 999,
                background: `linear-gradient(90deg,${accent},${accent2})`,
              }}
            />
          </div>

          <div style={{ fontSize: 11, color: shellMuted, marginBottom: 14 }}>
            This week&apos;s checklist is pulled from your active pillars. Tap once to complete. Tap again to undo.
          </div>

          {selectedWeekStatus?.unlocked ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filteredGoals.length === 0 && (
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
              {filteredGoals.map(goal => {
                const done = goal.completed >= goal.target
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
                      {done ? '\u2713' : ''}
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
          ) : (
            <div
              style={{
                display: 'grid',
                justifyItems: 'center',
                gap: 10,
                padding: '28px 18px',
                borderRadius: 18,
                background: shellSurfaceAlt,
                border: `1px solid ${shellBorder}`,
                opacity: 0.58,
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              <div style={{ width: 46, height: 46, borderRadius: 14, background: isDarkTheme ? '#242433' : '#fff1f6', border: `1px solid ${shellBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                🔒
              </div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: shellText }}>
                Week {selectedWeek?.index || 1}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: shellMuted }}>
                {selectedWeekStatus?.neededToUnlock > 0
                  ? `Finish this week first. You need ${selectedWeekStatus.neededToUnlock} more tasks to move forward.`
                  : `Complete Week ${selectedWeekStatus?.previousWeek || 1} to unlock.`}
              </div>
            </div>
          )}
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
                          <span style={{ fontSize: 14 }}>✓</span>
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
      </div>
    </div>
  )
}
