// Sage-voice payoff copy for the Weekly Reflection's adaptive difficulty dial.
// Deterministic, not an AI call — branch selection is mechanical (outcome/reason from
// lib/lockIn.js's applyDifficultyDial), and the line within a branch rotates by week
// index so she doesn't read the same sentence every week. Tone follows
// PHASR_Brand_Positioning.md: warm, not hype; encouraging, never preachy; direct, never
// corporate; "your", not "we".

function taskLine(nextTaskLabel) {
  return nextTaskLabel ? ` First up: ${nextTaskLabel}.` : ''
}

const LIGHTER_VARIANTS = [
  ({ dailyTaskDelta, nextTaskLabel }) =>
    `Got it — next week's lighter.${dailyTaskDelta < 0 ? ' One fewer thing on your plate each day.' : ''}${taskLine(nextTaskLabel)}`,
  ({ nextTaskLabel }) =>
    `Done. I've eased your load for next week — your non-negotiables come down a notch too.${taskLine(nextTaskLabel)}`,
  ({ dailyTaskCount, nextTaskLabel }) =>
    `Okay, lighter it is.${dailyTaskCount ? ` Your daily list is down to ${dailyTaskCount} for now.` : ''}${taskLine(nextTaskLabel)}`,
  ({ nextTaskLabel }) =>
    `Noted. Less on your plate next week — that's not backing down, that's pacing yourself.${taskLine(nextTaskLabel)}`,
]

const HARDER_VARIANTS = [
  ({ dailyTaskDelta, nextTaskLabel }) =>
    `Let's go. Next week's got a bit more in it.${dailyTaskDelta > 0 ? ' One more task a day.' : ''}${taskLine(nextTaskLabel)}`,
  ({ nextTaskLabel }) =>
    `Good. I've raised your non-negotiables for next week — you asked for more, you're getting more.${taskLine(nextTaskLabel)}`,
  ({ dailyTaskCount, nextTaskLabel }) =>
    `Pushing it is.${dailyTaskCount ? ` Your daily list is up to ${dailyTaskCount}.` : ''}${taskLine(nextTaskLabel)}`,
  ({ nextTaskLabel }) =>
    `Got it — turning the dial up. Next week asks a little more of you.${taskLine(nextTaskLabel)}`,
]

// Held-steady is one outcome bucket with a few different honest reasons behind it. Each
// reason gets its own small rotating pool so the line always matches what's actually true.
const HELD_VARIANTS = {
  'reality-check': [
    ({ nextTaskLabel }) =>
      `You're asking for more, but this week was heavy — I'm holding next week steady instead. That's not a no, it's timing.${taskLine(nextTaskLabel)}`,
    ({ nextTaskLabel }) =>
      `I hear you wanting to push. Given how this week actually went, I'd rather keep it steady than set you up to miss it.${taskLine(nextTaskLabel)}`,
    ({ nextTaskLabel }) =>
      `Not yet. This week was a tough one, so next week stays where it is — you can push once you've got your footing back.${taskLine(nextTaskLabel)}`,
  ],
  floor: [
    ({ nextTaskLabel }) => `Next week's already about as light as it gets — nothing left to trim.${taskLine(nextTaskLabel)}`,
    ({ nextTaskLabel }) => `There's nowhere lighter to go from here, so next week stays as-is.${taskLine(nextTaskLabel)}`,
  ],
  ceiling: [
    ({ nextTaskLabel }) => `You're already at full stretch — next week holds here rather than stacking on more.${taskLine(nextTaskLabel)}`,
    ({ nextTaskLabel }) => `Next week's already at the top of what makes sense — holding steady instead of adding more.${taskLine(nextTaskLabel)}`,
  ],
  'no-choice': [
    ({ nextTaskLabel }) => `Next week stays as planned.${taskLine(nextTaskLabel)}`,
  ],
}

function pickVariant(pool, weekIndex) {
  if (!pool?.length) return () => ''
  const index = ((Number(weekIndex) || 0) % pool.length + pool.length) % pool.length
  return pool[index]
}

// dialResult: the object returned by lib/lockIn.js's applyDifficultyDial.
// nextTaskLabel: the description of next week's first task (already resolved by the caller).
// weekIndex: the week the reflection is about — used purely to rotate the copy pool.
export function getDialPayoffLine(dialResult, { nextTaskLabel = '', weekIndex = 1 } = {}) {
  const { outcome, reason, dailyTaskDelta = 0, dailyTaskCount = 0, prevDailyTaskCount = 0 } = dialResult || {}
  const context = { dailyTaskDelta, dailyTaskCount, prevDailyTaskCount, nextTaskLabel }

  if (outcome === 'lighter') return pickVariant(LIGHTER_VARIANTS, weekIndex)(context)
  if (outcome === 'harder') return pickVariant(HARDER_VARIANTS, weekIndex)(context)
  const pool = HELD_VARIANTS[reason] || HELD_VARIANTS['no-choice']
  return pickVariant(pool, weekIndex)(context)
}
