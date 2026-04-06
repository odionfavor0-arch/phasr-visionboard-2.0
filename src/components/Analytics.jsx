import { useEffect, useMemo, useState } from 'react'
import { buildWeeklyGoals, getLockInSummary, loadLockInState } from '../lib/lockIn'

export const STATS_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'journal', label: 'Journal' },
  { id: 'phases', label: 'Phases' },
  { id: 'activity', label: 'Activity Summary' },
  { id: 'days', label: 'Days Overview' },
]

const JOURNAL_KEY = 'phasr_journal_v2'
const LEGACY_JOURNAL_KEY = 'phasr_journal'
const BOARD_KEY = 'phasr_vb'
const COMPLETIONS_KEY = 'phasr_completions'

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function startOfWeek(date) {
  const next = new Date(date)
  const day = next.getDay()
  const diff = (day + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function loadJournalEntries() {
  const modern = safeRead(JOURNAL_KEY, null)
  if (Array.isArray(modern)) {
    return modern.map((entry, index) => ({
      ...entry,
      pageLabel: entry.pageLabel || `Page ${index + 1}`,
    }))
  }

  const legacy = safeRead(LEGACY_JOURNAL_KEY, [])
  if (!Array.isArray(legacy)) return []

  return legacy.map((entry, index) => ({
    id: `${entry.date}-${index}`,
    date: entry.date,
    createdAt: entry.date,
    pageLabel: `Page ${index + 1}`,
    title: entry.learned || entry.worked || 'Journal entry',
    summary: entry.learned || entry.worked || 'Reflection saved.',
    transcript: [entry.worked, entry.learned, entry.mistake, entry.focus, entry.freewrite].filter(Boolean).join(' '),
    score: entry.score || 'Score: 5/10 - mixed clarity',
  }))
}

function loadBoard() {
  return safeRead(BOARD_KEY, { phases: [] })
}

function loadCompletions() {
  return safeRead(COMPLETIONS_KEY, [])
}

function buildWeeklyBuckets(entries) {
  const now = new Date()
  const currentWeek = startOfWeek(now)
  return Array.from({ length: 12 }, (_, index) => {
    const weekStart = new Date(currentWeek)
    weekStart.setDate(currentWeek.getDate() - ((11 - index) * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)

    const count = entries.filter(entry => {
      const created = new Date(entry.createdAt || `${entry.date}T12:00:00`)
      return created >= weekStart && created < weekEnd
    }).length

    return {
      label: `W${12 - index}`,
      count,
    }
  })
}

function getPhaseCompletion(pillar) {
  const fields = [
    pillar.beforeState,
    pillar.beforeDesc,
    pillar.afterState,
    pillar.afterDesc,
    pillar.shortOutcome,
    pillar.longOutcome,
    ...(pillar.resources || []),
    ...(pillar.activities || []),
    ...(pillar.outputs || []),
    ...(pillar.weeklyActions || []),
  ]
  const total = fields.length || 1
  const filled = fields.filter(value => String(value || '').trim()).length
  return Math.round((filled / total) * 100)
}

function getNumericScore(score) {
  const match = String(score || '').match(/Score:\s*(\d+)/i)
  return match ? Number(match[1]) : 5
}

function detectPatterns(entry) {
  const text = `${entry.transcript || ''} ${entry.summary || ''}`.toLowerCase()
  const tags = []
  if (/stress|overwhelm|pressure|burned out|tired|anxious/.test(text)) tags.push('stress')
  if (/avoid|procrastin|delay|put off|stuck/.test(text)) tags.push('avoidance')
  if (/task|done|finish|ship|progress|work/.test(text)) tags.push('productivity')
  if (/clear|clarity|focus|understand|plan/.test(text)) tags.push('clarity')
  if (/decide|decision|choice|unsure|commit/.test(text)) tags.push('decision')
  return tags.length ? tags : ['clarity']
}

function buildLastThirtyDays(entries, lockIn) {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    const key = date.toISOString().slice(0, 10)

    const entryCount = entries.filter(entry => (entry.date || String(entry.createdAt).slice(0, 10)) === key).length
    const taskDone = lockIn.logs?.some(log => log.date === key) ? 1 : 0
    const streakPoint = taskDone ? 1 : 0

    return {
      key,
      dayLabel: `${date.getDate()}`,
      entryCount,
      taskDone,
      streakPoint,
    }
  })
}

function buildPatternData(entries) {
  const counts = {
    decision: 0,
    clarity: 0,
    stress: 0,
    avoidance: 0,
    productivity: 0,
  }

  entries.forEach(entry => {
    detectPatterns(entry).forEach(tag => {
      if (counts[tag] !== undefined) counts[tag] += 1
    })
  })

  const total = Object.values(counts).reduce((sum, value) => sum + value, 0) || 1
  return [
    { label: 'Decision', value: counts.decision, color: '#7b7cf6', percent: Math.round((counts.decision / total) * 100) },
    { label: 'Clarity', value: counts.clarity, color: '#2fb8ff', percent: Math.round((counts.clarity / total) * 100) },
    { label: 'Stress', value: counts.stress, color: '#ff8f45', percent: Math.round((counts.stress / total) * 100) },
    { label: 'Avoidance', value: counts.avoidance, color: '#b5dc5d', percent: Math.round((counts.avoidance / total) * 100) },
    { label: 'Productivity', value: counts.productivity, color: '#f65f7c', percent: Math.round((counts.productivity / total) * 100) },
  ]
}

function buildPatternGradient(patternData) {
  let cursor = 0
  const stops = patternData.map(item => {
    const start = cursor
    cursor += item.percent
    return `${item.color} ${start}% ${cursor}%`
  })

  if (cursor < 100) {
    stops.push(`#f4e8ee ${cursor}% 100%`)
  }

  return `conic-gradient(${stops.join(', ')})`
}

function buildStreakRisk(lockState, lockInSummary) {
  const logs = [...(lockState.logs || [])]
    .filter(log => log?.date)
    .sort((a, b) => a.date.localeCompare(b.date))

  let missedDays = 0
  let breakCount = 0

  for (let index = 1; index < logs.length; index += 1) {
    const previous = new Date(`${logs[index - 1].date}T12:00:00`)
    const current = new Date(`${logs[index].date}T12:00:00`)
    const gap = Math.round((current - previous) / 86400000)
    if (gap > 1) {
      missedDays += gap - 1
      breakCount += 1
    }
  }

  const lastEightWeeks = Array.from({ length: 8 }, (_, index) => {
    const weekStart = startOfWeek(new Date())
    weekStart.setDate(weekStart.getDate() - (index * 7))
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 7)
    return {
      start: weekStart,
      end: weekEnd,
    }
  })

  const missedWeeks = lastEightWeeks.filter(week => {
    return !logs.some(log => {
      const logDate = new Date(`${log.date}T12:00:00`)
      return logDate >= week.start && logDate < week.end
    })
  }).length

  const nextTierTarget = lockInSummary.nextTier?.min || Math.max(lockInSummary.currentStreak, 1)
  const contextPercent = lockInSummary.currentStreak
    ? Math.min(100, Math.round((lockInSummary.currentStreak / nextTierTarget) * 100))
    : 0

  const riskLabel =
    lockInSummary.mode === 'broken'
      ? 'High restart risk'
      : lockInSummary.mode === 'warning'
        ? 'Streak under pressure'
        : 'Streak protected'

  const riskText =
    lockInSummary.mode === 'broken'
      ? 'The streak is already broken, so the next completed day becomes the restart point.'
      : lockInSummary.mode === 'warning'
        ? 'A miss today will break the current streak if nothing is logged.'
        : 'You logged today, so the streak is stable as long as you keep showing up tomorrow.'

  return {
    missedDays,
    missedWeeks,
    breakCount,
    contextPercent,
    riskLabel,
    riskText,
  }
}

function buildWeeklyStats(board, lockState) {
  const activeBoard = board?.phases?.length
    ? { ...board, activePhaseId: board.activePhaseId || board.phases[0]?.id }
    : board
  const weeklyData = buildWeeklyGoals(activeBoard, lockState)
  const week = weeklyData.currentWeek || weeklyData.weeks?.[0] || null
  const weekGoals = week?.goals || []
  const weekStart = week?.startDate
  const weekEnd = week?.endDate
  const checkedDays = new Set(
    (lockState.logs || [])
      .filter(log => log.date && (!weekStart || (log.date >= weekStart && log.date <= weekEnd)))
      .map(log => log.date),
  ).size
  const tasksCompleted = weekGoals.reduce((sum, goal) => sum + goal.completed, 0)
  const tasksTotal = weekGoals.reduce((sum, goal) => sum + goal.target, 0)
  const weekDates = [...new Set(
    (lockState.logs || [])
      .filter(log => log.date && (!weekStart || (log.date >= weekStart && log.date <= weekEnd)))
      .map(log => log.date),
  )].sort()

  let weeklyStreak = 0
  let previousDate = null
  weekDates.forEach(dateKey => {
    const current = new Date(`${dateKey}T12:00:00`)
    if (!previousDate) {
      weeklyStreak = 1
      previousDate = current
      return
    }
    const diff = Math.round((current - previousDate) / 86400000)
    weeklyStreak = diff === 1 ? weeklyStreak + 1 : 1
    previousDate = current
  })

  return {
    weekLabel: week?.weekLabel || 'Week 1',
    checkedDays,
    tasksCompleted,
    tasksTotal,
    weeklyStreak,
    completionRate: tasksTotal ? Math.round((tasksCompleted / tasksTotal) * 100) : 0,
  }
}

function getBestDay(entries, lockIn) {
  const dayMap = new Map([
    ['Sunday', { entries: 0, tasks: 0 }],
    ['Monday', { entries: 0, tasks: 0 }],
    ['Tuesday', { entries: 0, tasks: 0 }],
    ['Wednesday', { entries: 0, tasks: 0 }],
    ['Thursday', { entries: 0, tasks: 0 }],
    ['Friday', { entries: 0, tasks: 0 }],
    ['Saturday', { entries: 0, tasks: 0 }],
  ])

  entries.forEach(entry => {
    const day = new Date(entry.createdAt || `${entry.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
    dayMap.get(day).entries += 1
  })

  ;(lockIn.logs || []).forEach(log => {
    const day = new Date(`${log.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'long' })
    dayMap.get(day).tasks += 1
  })

  const ranked = [...dayMap.entries()]
    .map(([label, value]) => ({ label, score: value.entries + value.tasks, tasks: value.tasks }))
    .sort((a, b) => b.score - a.score)

  return {
    best: ranked[0] || { label: 'Monday', tasks: 0 },
    worst: ranked[ranked.length - 1] || { label: 'Thursday', tasks: 0 },
  }
}

function getFrequentPattern(entries) {
  const thisWeek = entries.filter(entry => {
    const created = new Date(entry.createdAt || `${entry.date}T12:00:00`)
    return created >= startOfWeek(new Date())
  })

  const counts = {}
  thisWeek.forEach(entry => {
    detectPatterns(entry).forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1
    })
  })

  const [label, value] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ['stress', 0]
  const total = Object.values(counts).reduce((sum, item) => sum + item, 0) || 1
  return {
    label,
    percent: Math.round((value / total) * 100),
  }
}

function getAverageMood(entries) {
  if (!entries.length) return '0 / 0'
  const averageScore = entries.reduce((sum, entry) => sum + getNumericScore(entry.score), 0) / entries.length
  const clarity = Math.min(10, averageScore + 2)
  return `${averageScore.toFixed(1)} / ${clarity.toFixed(1)}`
}

function InsightLine({ text }) {
  return (
    <p style={{ fontSize: '0.9rem', color: 'var(--app-muted)', margin: 0, lineHeight: 1.6 }}>
      {text}
    </p>
  )
}

function TabButton({ children, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: active ? '1px solid color-mix(in srgb, var(--app-accent) 36%, transparent)' : 'none',
        borderRadius: 999,
        padding: '0.65rem 1rem',
        background: active ? 'color-mix(in srgb, var(--app-accent) 14%, white)' : 'color-mix(in srgb, var(--app-accent) 8%, transparent)',
        color: active ? 'var(--app-accent)' : 'var(--app-text)',
        fontWeight: 800,
        fontSize: '0.86rem',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </button>
  )
}

function SectionCard({ title, children, locked = false }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: '1.1rem', border: '1px solid var(--app-border)', boxShadow: '0 14px 32px rgba(86,53,66,0.06)', position: 'relative', overflow: 'hidden', minHeight: 180 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.8rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)', margin: 0 }}>{title}</p>
      </div>
      <div className={locked ? 'pro-feature' : ''} style={{ opacity: locked ? 0.52 : 1, filter: locked ? 'blur(6px)' : 'none', userSelect: locked ? 'none' : 'auto', transform: locked ? 'scale(1.01)' : 'none', pointerEvents: locked ? 'none' : 'auto' }}>
        {children}
      </div>
      {locked && (
        <div className="pro-upgrade-overlay" style={{ position: 'absolute', top: '56%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 2 }}>
          <button
            className="upgrade-button"
            style={{
              background: '#fff',
              color: '#E91E63',
              padding: '12px 32px',
              borderRadius: 24,
              boxShadow: '0 4px 12px rgba(233, 30, 99, 0.3)',
              cursor: 'pointer',
              border: 'none',
              fontWeight: 800,
              fontFamily: "'DM Sans', sans-serif",
              transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            }}
            onMouseEnter={event => {
              event.currentTarget.style.transform = 'translateY(-1px)'
              event.currentTarget.style.boxShadow = '0 6px 16px rgba(233, 30, 99, 0.4)'
            }}
            onMouseLeave={event => {
              event.currentTarget.style.transform = 'translateY(0)'
              event.currentTarget.style.boxShadow = '0 4px 12px rgba(233, 30, 99, 0.3)'
            }}
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  )
}

function ProCard() {
  return (
    <div
      style={{
        marginTop: '1.2rem',
        borderRadius: 22,
        padding: '1.1rem',
        background: 'linear-gradient(135deg, rgba(255,245,249,0.96), rgba(249,240,247,0.96))',
        border: '1px solid var(--app-border)',
        boxShadow: '0 12px 28px rgba(255,145,186,0.14)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={event => {
        event.currentTarget.style.boxShadow = '0 16px 34px rgba(255,106,157,0.24)'
        event.currentTarget.style.borderColor = '#ff9dbf'
      }}
      onMouseLeave={event => {
        event.currentTarget.style.boxShadow = '0 12px 28px rgba(255,145,186,0.14)'
        event.currentTarget.style.borderColor = 'var(--app-border)'
      }}
    >
      <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c35d84', marginBottom: '0.45rem' }}>Pro</p>
      <p style={{ color: '#7d6170', fontSize: '0.82rem', lineHeight: 1.55 }}>AI analysis, forecasting, weekly insights.</p>
    </div>
  )
}

export default function Analytics() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 640 : false)
  const [activeTab, setActiveTab] = useState('overview')

  const entries = useMemo(() => loadJournalEntries().sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date))), [])
  const board = useMemo(() => loadBoard(), [])
  const lockIn = useMemo(() => getLockInSummary(loadLockInState()), [])
  const rawLockState = useMemo(() => loadLockInState(), [])
  const completions = useMemo(() => loadCompletions(), [])

  const weeklyBuckets = useMemo(() => buildWeeklyBuckets(entries), [entries])
  const lastThirtyDays = useMemo(() => buildLastThirtyDays(entries, rawLockState), [entries, rawLockState])
  const patternData = useMemo(() => buildPatternData(entries), [entries])
  const bestDay = useMemo(() => getBestDay(entries, rawLockState), [entries, rawLockState])
  const frequentPattern = useMemo(() => getFrequentPattern(entries), [entries])
  const streakRisk = useMemo(() => buildStreakRisk(rawLockState, lockIn), [rawLockState, lockIn])
  const weeklyStats = useMemo(() => buildWeeklyStats(board, rawLockState), [board, rawLockState, completions])

  const totalEntries = entries.length
  const weeklyActivity = weeklyBuckets.reduce((sum, week) => sum + week.count, 0)
  const phase = board?.phases?.find(item => item.id === board?.activePhaseId) || board?.phases?.[0]
  const pillars = phase?.pillars || []
  const phaseProgress = pillars.length ? Math.round(pillars.reduce((sum, pillar) => sum + getPhaseCompletion(pillar), 0) / pillars.length) : 0
  const weeklyActions = pillars.flatMap(pillar => pillar.weeklyActions || []).filter(Boolean)
  const reviewComplete = Boolean(phase?.reviewWorked || phase?.reviewDrained || phase?.reviewPaid || phase?.reviewStrategy)
  const insightText =
    activeTab === 'journal'
      ? 'Your journal pages and reflection trail live here.'
      : activeTab === 'phases'
        ? 'Your current phase structure and progress live here.'
        : 'Your overview brings your journal and phase progress together.'

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.4rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto 1fr', alignItems: 'center', gap: '1rem', marginBottom: '1.3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </TabButton>
          </div>
          <div style={{ display: 'grid', justifyItems: 'center', order: isMobile ? -1 : 0 }}>
            <p style={{ color: 'var(--app-muted)', fontSize: '0.82rem', marginTop: '0.1rem', textAlign: 'center', fontWeight: 600 }}>Activity Summary</p>
          </div>
          <div style={{ display: 'flex', gap: '0.55rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <TabButton active={activeTab === 'journal'} onClick={() => setActiveTab('journal')}>
              Journal
            </TabButton>
            <TabButton active={activeTab === 'phases'} onClick={() => setActiveTab('phases')}>
              Phases
            </TabButton>
          </div>
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: '0.9rem' }}>
              <SectionCard title="Journal entries">
                <p style={{ fontSize: 'clamp(1.28rem, 2.2vw, 2rem)', fontWeight: 800, color: '#2e1e28', textAlign: 'center', margin: 0 }}>{totalEntries}</p>
              </SectionCard>
              <SectionCard title="Weekly activity">
                <p style={{ fontSize: 'clamp(1.28rem, 2.2vw, 2rem)', fontWeight: 800, color: '#2e1e28', textAlign: 'center', margin: 0 }}>{weeklyActivity}</p>
              </SectionCard>
              <SectionCard title="Current streak">
                <p style={{ fontSize: 'clamp(1.28rem, 2.2vw, 2rem)', fontWeight: 800, color: '#2e1e28', textAlign: 'center', margin: 0 }}>{lockIn.currentStreak} day{lockIn.currentStreak !== 1 ? 's' : ''}</p>
              </SectionCard>
            </div>

            <SectionCard title="Streak and task completion - last 30 days">
              <div style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(30, minmax(0, 1fr))', gap: isMobile ? '0.32rem' : '0.25rem', alignItems: 'end', minHeight: 220, minWidth: isMobile ? 520 : 'auto' }}>
                {lastThirtyDays.map(day => (
                  <div key={day.key} style={{ display: 'grid', justifyItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '100%', maxWidth: 18, height: 150, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 3 }}>
                      <div style={{ height: `${Math.max(day.entryCount * 22, day.entryCount ? 18 : 8)}px`, borderRadius: 999, background: 'linear-gradient(180deg, #1f1730, #4b3458)' }} />
                      <div style={{ height: `${Math.max(day.taskDone * 18, day.taskDone ? 14 : 6)}px`, borderRadius: 999, background: 'linear-gradient(180deg, var(--app-accent2), var(--app-accent))' }} />
                    </div>
                    <div style={{ width: 18, height: 4, borderRadius: 999, background: day.streakPoint ? 'var(--app-accent)' : 'var(--app-border)' }} />
                    <span style={{ fontSize: '0.68rem', color: '#8a727f' }}>{day.dayLabel}</span>
                  </div>
                ))}
              </div>
              </div>
            </SectionCard>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.72fr 1.28fr', gap: '1rem' }}>
              <div style={{ background: '#fff', borderRadius: 24, padding: '1rem', border: '1px solid var(--app-border)', boxShadow: '0 14px 32px rgba(86,53,66,0.06)', display: 'grid', gap: '0.9rem', alignContent: 'start' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)', margin: '0 0 0.2rem' }}>This Week</p>
                <div>
                  <p style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.2rem', fontWeight: 800, color: '#2e1e28', margin: 0 }}>Week 1</p>
                  <div style={{ height: 5, width: '100%', borderRadius: 999, background: '#f8e7ee', overflow: 'hidden', marginTop: '0.65rem' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${weeklyStats.completionRate}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, var(--app-accent2), var(--app-accent))',
                      }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gap: '0.6rem' }}>
                  <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.72rem 0.8rem' }}>
                    <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-muted)' }}>Tasks completed</p>
                    <p style={{ margin: '0.28rem 0 0', fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 800, color: 'var(--app-accent)' }}>
                      {weeklyStats.tasksCompleted} out of {weeklyStats.tasksTotal}
                    </p>
                  </div>
                  <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.72rem 0.8rem' }}>
                    <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-muted)' }}>Days checked in</p>
                    <p style={{ margin: '0.28rem 0 0', fontFamily: "'Syne', sans-serif", fontSize: '1rem', fontWeight: 800, color: '#22c55e' }}>
                      {weeklyStats.checkedDays} out of 7
                    </p>
                  </div>
                </div>
              </div>

              <SectionCard title="Your Patterns This Week">
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  <div style={{ width: 'min(100%, 220px)', aspectRatio: '1 / 1', borderRadius: '50%', margin: '0 auto', background: buildPatternGradient(patternData) }} />
                  <div style={{ display: 'grid', gap: '0.45rem', minWidth: 0 }}>
                    {patternData.map(item => (
                      <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', color: '#54404a', fontSize: '0.86rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                          <span style={{ width: 9, height: 9, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <span>{item.label}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: '#2e1e28', flexShrink: 0 }}>{item.percent}%</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#705665', lineHeight: 1.6 }}>
                    Your best day this week was {bestDay.best.label}.
                  </p>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <SectionCard title="Journal frequency - last 12 weeks">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '1.1rem' }}>
                <p style={{ color: 'var(--app-muted)', fontSize: '0.9rem' }}>Entries this week</p>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: '#2e1e28' }}>{weeklyBuckets[11]?.count || 0}</p>
              </div>

              <div style={{ overflowX: isMobile ? 'auto' : 'visible' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: '0.65rem', alignItems: 'end', minHeight: 220, minWidth: isMobile ? 520 : 'auto' }}>
                {weeklyBuckets.map(week => (
                  <div key={week.label} style={{ display: 'grid', gap: '0.45rem', justifyItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: 36, height: 160, borderRadius: 999, background: 'linear-gradient(180deg, rgba(255,242,247,0.9), rgba(245,233,239,0.92))', display: 'flex', alignItems: 'flex-end', padding: 4 }}>
                      <div style={{ width: '100%', height: `${Math.max((week.count / Math.max(...weeklyBuckets.map(item => item.count), 1)) * 100, week.count ? 14 : 4)}%`, borderRadius: 999, background: 'linear-gradient(180deg, #1f1730, #ff6a9d)' }} />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#856d7a', fontWeight: 700 }}>{week.label}</span>
                  </div>
                ))}
              </div>
              </div>
            </SectionCard>

            <SectionCard title="Pages and dates">
              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {entries.slice(0, 5).map(entry => (
                  <div key={entry.id} style={{ borderRadius: 18, border: '1px solid var(--app-border)', background: 'var(--app-bg2)', padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <div>
                        <p style={{ fontWeight: 800, color: '#2e1e28' }}>{entry.title || 'Untitled reflection'}</p>
                      </div>
                      <span style={{ color: '#8f7683', fontSize: '0.82rem' }}>{entry.date || entry.createdAt?.slice(0, 10)}</span>
                    </div>
                    <p style={{ color: '#705665', fontSize: '0.88rem', lineHeight: 1.65 }}>{entry.summary || 'Saved journal reflection.'}</p>
                  </div>
                ))}
                {!entries.length && <p style={{ color: '#8f7683', fontSize: '0.9rem' }}>Your pages and dates will show here.</p>}
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === 'phases' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '0.85fr 1.15fr', gap: '1rem' }}>
              <SectionCard title="Current phase">
                <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2e1e28', textAlign: 'center', margin: 0 }}>
                  {phase?.title || 'Phase 1'}
                </p>
                <p style={{ margin: '0.55rem 0 0', color: '#705665', fontSize: '0.88rem', lineHeight: 1.6, textAlign: 'center' }}>
                  {phase?.subtitle || 'Your active phase progress lives here.'}
                </p>
              </SectionCard>
              <SectionCard title="Phase completion">
                <p style={{ fontSize: '2rem', fontWeight: 900, color: '#2e1e28', textAlign: 'center', margin: 0 }}>{phaseProgress}%</p>
                <p style={{ margin: '0.45rem 0 0', color: '#705665', fontSize: '0.86rem', textAlign: 'center' }}>
                  based on your current pillar setup
                </p>
              </SectionCard>
            </div>

            <SectionCard title="Pillars in this phase">
              <div style={{ display: 'grid', gap: '0.7rem' }}>
                {pillars.map(pillar => (
                  <div key={pillar.id || pillar.name} style={{ borderRadius: 18, border: '1px solid var(--app-border)', background: 'var(--app-bg2)', padding: '0.9rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
                      <p style={{ margin: 0, fontWeight: 800, color: '#2e1e28' }}>{pillar.name || 'Untitled pillar'}</p>
                      <span style={{ color: 'var(--app-accent)', fontSize: '0.82rem', fontWeight: 800 }}>{getPhaseCompletion(pillar)}%</span>
                    </div>
                    <p style={{ margin: '0.35rem 0 0', color: '#705665', fontSize: '0.86rem', lineHeight: 1.6 }}>
                      {(pillar.beforeState && pillar.afterState) ? `${pillar.beforeState} -> ${pillar.afterState}` : 'Phase states will show here.'}
                    </p>
                  </div>
                ))}
                {!pillars.length && <p style={{ color: '#8f7683', fontSize: '0.9rem' }}>Your phase pillars will show here.</p>}
              </div>
            </SectionCard>
          </div>
        )}

        <style>{`
          @media (max-width: 980px) {
            [style*="repeat(4, minmax(0, 1fr))"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            [style*="grid-template-columns: 1.15fr 1fr"] { grid-template-columns: 1fr !important; }
            [style*="grid-template-columns: 1.1fr 0.9fr"] { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 760px) {
            [style*="grid-template-columns: repeat(3, minmax(0, 1fr))"] { grid-template-columns: 1fr !important; }
            [style*="grid-template-columns: repeat(2, minmax(0, 1fr))"] { grid-template-columns: 1fr !important; }
            button { min-height: 44px; }
          }
          @media (max-width: 640px) {
            [style*="repeat(4, minmax(0, 1fr))"] { grid-template-columns: 1fr !important; }
            [style*="repeat(12, minmax(0, 1fr))"] { gap: 0.3rem !important; }
            [style*="repeat(30, minmax(0, 1fr))"] { gap: 0.18rem !important; }
          }
        `}</style>
      </div>
    </div>
  )
}
