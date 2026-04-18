const ACTIVE_USER_KEY = 'phasr_active_user'
const NEXT_WEEK_PLAN_KEY = 'phasr_next_week_plan'
const SAGE_PLANS_KEY = 'phasr_sage_plans'
const BRIEFING_DISMISS_KEY = 'phasr_sage_briefing_dismissed'
const JOURNAL_KEY = 'phasr_journal_v2'
const LEGACY_JOURNAL_KEY = 'phasr_journal'
const COMPLETIONS_KEY = 'phasr_completions'
const WEEKLY_GOALS_KEY = 'phasr_weekly_goals'

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

function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function getDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function startOfWeek(date) {
  const next = new Date(date)
  const diff = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
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
      })),
  ) || []
}

function getPhaseWeeks(phase) {
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
      startDate: getDateKey(weekStart),
      endDate: getDateKey(weekEnd),
    })
    cursor.setDate(cursor.getDate() + 7)
  }

  return weeks
}

function getCurrentWeekIndex(weeks, dateKey) {
  return weeks.findIndex(week => dateKey >= week.startDate && dateKey <= week.endDate)
}

function getJournalEntries() {
  const modern = safeRead(JOURNAL_KEY, null)
  if (Array.isArray(modern)) return modern
  const legacy = safeRead(LEGACY_JOURNAL_KEY, [])
  return Array.isArray(legacy) ? legacy : []
}

function getMoodAverageForRange(startDate, endDate) {
  const entries = getJournalEntries().filter(entry => {
    const key = String(entry.date || entry.createdAt || '').slice(0, 10)
    return key && key >= startDate && key <= endDate
  })
  if (!entries.length) return null

  const scores = entries
    .map(entry => {
      const match = String(entry.score || '').match(/(\d+)/)
      return match ? Number(match[1]) : null
    })
    .filter(score => Number.isFinite(score))

  if (!scores.length) return null
  return Number((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1))
}

function countCheckedDays(startDate, endDate) {
  const completions = safeRead(COMPLETIONS_KEY, [])
  return new Set(
    completions
      .filter(item => item.date >= startDate && item.date <= endDate)
      .map(item => item.date),
  ).size
}

function getWeeklyGoalsForWeek(phaseId, weekIndex) {
  return safeRead(WEEKLY_GOALS_KEY, []).filter(goal => goal.phaseId === phaseId && goal.week === weekIndex)
}

function inferEasyTarget(goal) {
  return Math.max(1, Math.min(goal.target || 1, 2))
}

function inferRaisedTarget(goal) {
  return Math.min((goal.target || 1) + 1, 7)
}

function describeTask(activity, target) {
  const text = String(activity || '').trim()
  const lower = text.toLowerCase()

  if (lower.includes('gym')) return `Go to the gym ${target} times this week`
  if (lower.includes('walk')) return `Walk ${Math.min(20 + ((target - 1) * 10), 60)} minutes daily`
  if (lower.includes('strength')) return `Complete ${target} strength sessions this week`
  if (lower.includes('journal')) return `Journal ${target} times this week`
  if (lower.includes('meal')) return `${text} ${target} time${target === 1 ? '' : 's'} this week`
  return `${text} ${target} time${target === 1 ? '' : 's'} this week`
}

export function calculateWeeklyLoad(boardData, date = new Date()) {
  const phase =
    boardData?.phases?.find(item => item.id === boardData?.activePhaseId) ||
    boardData?.phases?.[0]
  if (!phase) return null

  const weeks = getPhaseWeeks(phase)
  const todayKey = getDateKey(date)
  const currentWeekIndex = getCurrentWeekIndex(weeks, todayKey)
  const currentWeek = weeks[currentWeekIndex] || weeks[0]
  const lastWeek = weeks[Math.max(0, currentWeekIndex - 1)]
  const nextWeekNumber = currentWeek?.index || 1
  const lastWeekGoals = currentWeekIndex > 0 ? getWeeklyGoalsForWeek(phase.id, lastWeek.index) : []
  const totalAssigned = lastWeekGoals.reduce((sum, goal) => sum + goal.target, 0)
  const totalCompleted = lastWeekGoals.reduce((sum, goal) => sum + Math.min(goal.completed, goal.target), 0)
  const completionRate = totalAssigned ? Math.round((totalCompleted / totalAssigned) * 100) : 0
  const streakDays = currentWeekIndex > 0 ? countCheckedDays(lastWeek.startDate, lastWeek.endDate) : 0
  const moodAverage = currentWeekIndex > 0 ? getMoodAverageForRange(lastWeek.startDate, lastWeek.endDate) : null
  const currentWeekGoals = getWeeklyGoalsForWeek(phase.id, nextWeekNumber)
  const allActivities = getPhaseActivities(phase)

  let difficulty = 'same'
  let reason = 'Starting from the base weekly load.'
  let tasks = currentWeekGoals.map(goal => ({
    week: nextWeekNumber,
    activity: goal.activity,
    target: goal.target,
    pillar: goal.pillar,
    description: describeTask(goal.activity, goal.target),
  }))

  if (currentWeekIndex > 0) {
    if (completionRate >= 90) {
      difficulty = 'up'
      reason = `You completed ${completionRate}% last week, so the load goes up slightly.`
      tasks = currentWeekGoals.map(goal => {
        const target = inferRaisedTarget(goal)
        return {
          week: nextWeekNumber,
          activity: goal.activity,
          target,
          pillar: goal.pillar,
          description: describeTask(goal.activity, target),
        }
      })
    } else if (completionRate >= 60) {
      difficulty = 'same'
      reason = `You completed ${completionRate}% last week, so the main load stays steady with one easier support habit.`
      const easierActivity = allActivities.find(activity => !currentWeekGoals.some(goal => goal.activityId === activity.id)) || allActivities[0]
      tasks = currentWeekGoals.map(goal => ({
        week: nextWeekNumber,
        activity: goal.activity,
        target: goal.target,
        pillar: goal.pillar,
        description: describeTask(goal.activity, goal.target),
      }))
      if (easierActivity) {
        tasks.push({
          week: nextWeekNumber,
          activity: easierActivity.task,
          target: 1,
          pillar: easierActivity.pillar,
          description: describeTask(easierActivity.task, 1),
        })
      }
    } else {
      difficulty = 'down'
      reason = 'Focus on consistency this week, not volume.'
      tasks = currentWeekGoals.map((goal, index) => {
        const target = index === 0 ? inferEasyTarget(goal) : goal.target
        return {
          week: nextWeekNumber,
          activity: goal.activity,
          target,
          pillar: goal.pillar,
          description: describeTask(goal.activity, target),
        }
      })
    }
  }

  const payload = {
    phaseId: phase.id,
    week: nextWeekNumber,
    completionRate,
    streakDays,
    moodAverage,
    difficulty,
    tasks,
    reason,
    updatedAt: new Date().toISOString(),
  }

  safeWrite(NEXT_WEEK_PLAN_KEY, payload)
  return payload
}

export function getSageWeeklyMessage() {
  const plan = safeRead(NEXT_WEEK_PLAN_KEY, null)
  if (!plan) return ''

  if (plan.difficulty === 'up') {
    return `You hit ${plan.completionRate}% last week and kept your streak going for ${plan.streakDays} days. I’m increasing the load a little this week because you’re ready for it.`
  }
  if (plan.difficulty === 'down') {
    return `Last week landed at ${plan.completionRate}% with ${plan.streakDays} streak days kept. I simplified this week so you can rebuild momentum and focus on consistency first.`
  }
  return `You closed last week at ${plan.completionRate}% and held ${plan.streakDays} streak days. I’m keeping the main load steady this week and adding one easier habit to keep you moving.`
}

function normalizePlanJson(rawText) {
  const trimmed = String(rawText || '').trim()
  const fenced = trimmed.replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
  try {
    const parsed = JSON.parse(fenced)
    return {
      resources: Array.isArray(parsed.resources) ? parsed.resources : [],
      activities: Array.isArray(parsed.activities) ? parsed.activities : [],
      weeklyNonNegotiables: Array.isArray(parsed.weeklyNonNegotiables) ? parsed.weeklyNonNegotiables : [],
      outputs: Array.isArray(parsed.outputs) ? parsed.outputs : [],
      shortTermOutcome: String(parsed.shortTermOutcome || ''),
      longTermOutcome: String(parsed.longTermOutcome || ''),
    }
  } catch {
    return {
      resources: [],
      activities: [],
      weeklyNonNegotiables: [],
      outputs: [],
      shortTermOutcome: '',
      longTermOutcome: '',
    }
  }
}

export async function fetchRealWorldPlan(goalText) {
  const apiKey = import.meta.env.VITE_GROQ_KEY
  if (!apiKey) throw new Error('missing_groq_key')
  const model = 'llama-3.3-70b-versatile'

  const systemPrompt = `You are Sage, an AI life coach. The user has set the following goal from their vision board: ${goalText}. Generate a structured plan that includes: recommended resources they will need, a 12-week activity breakdown with progressive weekly targets, weekly non-negotiables for the first 4 weeks, measurable outputs to track, and short-term and long-term outcomes. Base this on proven real-world frameworks for this goal type. Be specific with numbers. Do not be generic.

Return valid JSON only with these keys:
resources
activities
weeklyNonNegotiables
outputs
shortTermOutcome
longTermOutcome`

  console.log('Groq key before fetchRealWorldPlan fetch:', import.meta.env.VITE_GROQ_KEY)
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1800,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: goalText,
        },
      ],
    }),
  })

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || '{}'
  return normalizePlanJson(text)
}

function normalizeGroqJson(rawText) {
  const trimmed = String(rawText || '').trim()
  const fenced = trimmed
    .replace(/^```json/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .trim()
  return fenced
}

export async function fetchPillarPlanWithGroq({
  planPrompt = '',
  systemPrompt: systemPromptOverride = '',
  userPrompt: userPromptOverride = '',
  pillarName,
  beforeState,
  beforeDesc,
  afterState,
  afterDesc,
} = {}) {
  const apiKey = import.meta.env.VITE_GROQ_KEY
  if (!apiKey) throw new Error('missing_groq_key')
  const model = 'llama-3.3-70b-versatile'

  const systemPrompt = 'You are Sage, an AI life coach inside Phasr. Generate a specific, realistic plan based on the user’s actual goal. Do not use generic templates. Read their before and after descriptions carefully and generate advice that is specific to their situation.'
  const userPrompt = String(planPrompt || '').trim() || `You are generating a structured plan for a Phasr user.\n\nTheir pillar: ${String(pillarName || '').trim()}\nTheir before state: ${String(beforeState || '').trim()}\nTheir before description: ${String(beforeDesc || '').trim()}\nTheir after goal: ${String(afterState || '').trim()}\nTheir after description: ${String(afterDesc || '').trim()}\n\nReturn JSON only:\n{\n  \"resources\": [\"...\", \"...\", \"...\", \"...\"],\n  \"activities\": [\"...\", \"...\", \"...\", \"...\"],\n  \"weeklyNonNegotiables\": [\"...\", \"...\", \"...\", \"...\"],\n  \"outcome\": \"...\"\n}\n`

  console.log('Groq key before fetchPillarPlanWithGroq fetch:', import.meta.env.VITE_GROQ_KEY)
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: String(systemPromptOverride || '').trim() || systemPrompt },
        { role: 'user', content: String(userPromptOverride || '').trim() || userPrompt },
      ],
    }),
  })

  if (!res.ok) throw new Error('groq_error')
  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content || ''
  const normalized = normalizeGroqJson(text)

  let parsed = null
  try {
    parsed = JSON.parse(normalized)
  } catch {
    throw new Error('invalid_json')
  }

  const resources = Array.isArray(parsed?.resources) ? parsed.resources.map(item => String(item || '').trim()).filter(Boolean) : []
  const activities = Array.isArray(parsed?.activities) ? parsed.activities.map(item => String(item || '').trim()).filter(Boolean) : []
  const weeklyNonNegotiables = Array.isArray(parsed?.weeklyNonNegotiables) ? parsed.weeklyNonNegotiables.map(item => String(item || '').trim()).filter(Boolean) : []
  const outcome = String(parsed?.outcome || '').trim()

  if (!resources.length && !activities.length && !weeklyNonNegotiables.length && !outcome) {
    throw new Error('invalid_json')
  }

  return { resources, activities, weeklyNonNegotiables, outcome }
}

export function loadSagePlans() {
  return safeRead(SAGE_PLANS_KEY, {})
}

export function saveSagePlan(pillarId, plan) {
  const store = loadSagePlans()
  store[pillarId] = plan
  safeWrite(SAGE_PLANS_KEY, store)
  return store[pillarId]
}

export function getSagePlan(pillarId) {
  const store = loadSagePlans()
  return store[pillarId] || null
}

export function getBriefingDismissState() {
  return safeRead(BRIEFING_DISMISS_KEY, {})
}

export function dismissBriefing(phaseId, week) {
  const store = getBriefingDismissState()
  store[`${phaseId}-${week}`] = true
  safeWrite(BRIEFING_DISMISS_KEY, store)
}

export function isBriefingDismissed(phaseId, week) {
  const store = getBriefingDismissState()
  return Boolean(store[`${phaseId}-${week}`])
}
