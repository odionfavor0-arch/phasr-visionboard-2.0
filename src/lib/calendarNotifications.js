const CALENDAR_PREF_KEY = 'phasr_calendar_pref'
const CALENDAR_EVENTS_KEY = 'phasr_calendar_events'
const CALENDAR_NOTIFICATION_LOG_KEY = 'phasr_calendar_notification_log'

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

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function withTime(date, hour = 9, minute = 0) {
  const next = new Date(date)
  next.setHours(hour, minute, 0, 0)
  return next
}

function parseDate(dateValue) {
  if (!dateValue) return null
  const parsed = new Date(`${dateValue}T12:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatICSDate(date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hour = String(date.getUTCHours()).padStart(2, '0')
  const minute = String(date.getUTCMinutes()).padStart(2, '0')
  const second = String(date.getUTCSeconds()).padStart(2, '0')
  return `${year}${month}${day}T${hour}${minute}${second}Z`
}

function escapeICSValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
}

export function getCalendarPreference() {
  return safeRead(CALENDAR_PREF_KEY, null)
}

export function setCalendarPreference(value) {
  safeWrite(CALENDAR_PREF_KEY, value)
}

export function loadCalendarEvents() {
  return safeRead(CALENDAR_EVENTS_KEY, [])
}

export function saveCalendarEvents(events) {
  safeWrite(CALENDAR_EVENTS_KEY, events)
}

export function loadNotificationLog() {
  return safeRead(CALENDAR_NOTIFICATION_LOG_KEY, {})
}

export function saveNotificationLog(log) {
  safeWrite(CALENDAR_NOTIFICATION_LOG_KEY, log)
}

export function buildWeeklyCalendarEvents(boardData) {
  const phase = boardData?.phases?.find(item => item.id === boardData?.activePhaseId) || boardData?.phases?.[0]
  const weeklyActions = phase?.pillars?.flatMap(pillar => {
    const tasks = (pillar.weeklyActions || []).filter(Boolean)
    const fallbackTasks = tasks.length ? tasks : (pillar.activities || []).filter(Boolean).slice(0, 3)
    return fallbackTasks.map(task => ({
      task,
      pillar: pillar.name,
    }))
  }
  ) || []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const phaseStart = parseDate(phase?.startDate) || new Date(today)
  const phaseEnd = parseDate(phase?.endDate)
  const start = phaseStart > today ? phaseStart : today

  return weeklyActions.map((item, index) => {
    const taskDate = new Date(start)
    taskDate.setDate(start.getDate() + index)
    if (phaseEnd && taskDate > phaseEnd) return null
    const startAt = withTime(taskDate, 9, 0)
    const endAt = withTime(taskDate, 9, 30)

    return {
      id: uid(),
      title: item.task,
      pillar: item.pillar,
      phaseName: phase?.name || 'Current Phase',
      date: toDateKey(taskDate),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: 'pending',
    }
  }).filter(Boolean)
}

export function createICSFile(events) {
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Phasr//Calendar Sync//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events.flatMap(event => [
      'BEGIN:VEVENT',
      `UID:${event.id}@phasr`,
      `DTSTAMP:${formatICSDate(new Date())}`,
      `DTSTART:${formatICSDate(new Date(event.startAt))}`,
      `DTEND:${formatICSDate(new Date(event.endAt))}`,
      `SUMMARY:${escapeICSValue(event.title)}`,
      `DESCRIPTION:${escapeICSValue(`${event.phaseName} - ${event.pillar}`)}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Phasr reminder',
      'TRIGGER:-PT15M',
      'END:VALARM',
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ].join('\r\n')

  return body
}

export function createCalendarFile(events, filename = 'phasr-calendar.ics') {
  return new File([createICSFile(events)], filename, { type: 'text/calendar;charset=utf-8' })
}

export function downloadCalendarICS(events) {
  if (!events.length) return
  const blob = new Blob([createICSFile(events)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = 'phasr-calendar.ics'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export async function openCalendarApp(events) {
  if (!events.length) return { method: 'empty' }

  const file = createCalendarFile(events)

  if (navigator.share && typeof navigator.canShare === 'function') {
    try {
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Phasr calendar plan',
          text: 'Add this weekly plan to your calendar.',
          files: [file],
        })
        return { method: 'share' }
      }
    } catch (error) {
      if (error?.name === 'AbortError') return { method: 'cancelled' }
    }
  }

  return { method: 'unsupported' }
}

export async function enableCalendarIntegration(boardData) {
  setCalendarPreference('allowed')
  const events = buildWeeklyCalendarEvents(boardData)
  saveCalendarEvents(events)

  if ('Notification' in window && Notification.permission === 'default') {
    try {
      await Notification.requestPermission()
    } catch {
      // ignore permission prompt failures
    }
  }

  await openCalendarApp(events)
  return events
}

export function skipCalendarIntegration() {
  setCalendarPreference('skipped')
}

export function completeCalendarTasksForDate(dateKey) {
  const events = loadCalendarEvents()
  const next = events.map(event => event.date === dateKey ? { ...event, status: 'done' } : event)
  saveCalendarEvents(next)
  return next
}

export function getDueCalendarNotifications(now = new Date()) {
  const events = loadCalendarEvents()
  const log = loadNotificationLog()

  const due = []

  events.forEach(event => {
    if (event.status === 'done') return

    const startAt = new Date(event.startAt)
    const delayShort = new Date(startAt.getTime() + (30 * 60 * 1000))
    const delayLong = new Date(startAt.getTime() + (2 * 60 * 60 * 1000))
    const streakWarning = new Date(startAt)
    streakWarning.setHours(20, 0, 0, 0)

    const stages = [
      { key: 'start', at: startAt, message: 'You planned this. Start now.' },
      { key: 'delay_short', at: delayShort, message: 'You have not started. Do a small part.' },
      { key: 'delay_long', at: delayLong, message: 'You are delaying. Reduce it. Do one step now.' },
      { key: 'streak_warning', at: streakWarning, message: 'You are about to lose your streak. Do a 2-minute action now.' },
    ]

    const sentKeys = log[event.id] || []

    stages.forEach(stage => {
      if (sentKeys.includes(stage.key)) return
      if (sentKeys.length >= 3) return
      if (now >= stage.at) {
        due.push({
          eventId: event.id,
          title: event.title,
          message: stage.message,
          stage: stage.key,
        })
      }
    })
  })

  return due
}

export function markNotificationSent(eventId, stage) {
  const log = loadNotificationLog()
  const next = {
    ...log,
    [eventId]: [...(log[eventId] || []), stage],
  }
  saveNotificationLog(next)
}
