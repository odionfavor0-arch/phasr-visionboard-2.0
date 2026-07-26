import { useEffect, useMemo, useState } from 'react'
// eslint-disable-next-line no-unused-vars -- used via JSX member expressions (motion.div)
import { motion, AnimatePresence } from 'framer-motion'
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Mic,
  ArrowRight,
  Flame,
  BookOpen,
  Gift,
  History,
  CheckCircle2,
} from 'lucide-react'
import {
  loadBoardData,
  getActivePhase,
  getLockInSummary,
  loadLockInState,
  ensureProgressEngine,
} from '../lib/lockIn'
import { pushPillarReview, pushPillarWrap } from '../lib/supabaseSync'

const ACTIVE_USER_KEY = 'phasr_active_user'
const JOURNAL_KEY = 'phasr_journal_v2'
const PILLAR_REVIEWS_KEY = 'phasr_pillar_reviews'
const PILLAR_WRAPS_KEY = 'phasr_pillar_wraps'

function getActiveUserId(user) {
  return user?.id || user?.email || user?.user_metadata?.email || (typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_USER_KEY) : '') || ''
}

function scopedKey(base, user) {
  const id = getActiveUserId(user)
  return id ? `${base}:${id}` : base
}

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage pressure — non-fatal, the record can be rebuilt from source data
  }
}

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function parseDateKey(value) {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

async function callSage({ system, prompt, maxTokens = 500 }) {
  const res = await fetch('/api/groq/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system,
      messages: [{ role: 'user', content: prompt }],
      mode: 'chat',
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error('sage_request_failed')
  const data = await res.json()
  return data?.content || ''
}

const SAGE_VOICE = `You are Sage, PHASR's structured clarity coach. You are warm, honest, direct — a smart friend, never a scold. Do not use bullet points unless asked. Do not use m-dashes. Do not open with "That's great" or "I hear you." Keep it short.`

function useVoiceDictation(onResult) {
  function start() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = event => {
      const transcript = Array.from(event.results || []).map(r => r?.[0]?.transcript || '').join(' ')
      if (transcript) onResult(transcript)
    }
    recognition.start()
  }
  return start
}

// eslint-disable-next-line no-unused-vars -- Icon is used via JSX element usage below
function EmptyState({ icon: Icon = Compass, title, body }) {
  return (
    <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', boxShadow: 'var(--app-shadow-sm)' }}>
      <Icon size={26} color="var(--app-accent)" style={{ marginBottom: '0.7rem' }} />
      <p style={{ fontSize: '0.9rem', color: 'var(--app-text)', marginBottom: '0.3rem', fontWeight: 700 }}>{title}</p>
      {body && <p style={{ fontSize: '0.82rem', color: 'var(--app-muted)', lineHeight: 1.55, maxWidth: 380, margin: '0 auto' }}>{body}</p>}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 1 — Weekly Reflection. Read-only display of the Weekly Pulse journal entry.
// This does NOT capture a second copy of that data — the write happens in
// Journal.jsx via the compulsory weekly-review CTA on the Daily Streak screen. One
// record lives in phasr_journal_v2 — a weekly pulse is identified by carrying
// weeklyPulseMeta (every save path sets it; no writer sets a literal isWeeklyPulse
// field, so that never matched anything).
// ────────────────────────────────────────────────────────────────────────────

function getWeeklyPulseEntries(user, phase) {
  const entries = safeRead(scopedKey(JOURNAL_KEY, user), [])
  if (!Array.isArray(entries)) return []
  const phaseName = cleanText(phase?.name).toLowerCase()
  return entries
    .filter(e => Boolean(e?.weeklyPulseMeta))
    .filter(e => !phaseName || cleanText(e?.weeklyPulseMeta?.phaseName).toLowerCase() === phaseName)
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
}

function WeeklyReflection({ user, boardData, phase, onOpenJournal }) {
  const engine = useMemo(() => ensureProgressEngine(boardData), [boardData])
  const currentWeekNumber = engine.currentWeek?.index || 1
  const pulses = useMemo(() => getWeeklyPulseEntries(user, phase), [user, phase])
  const thisWeekEntry = pulses.find(e => Number(e?.weeklyPulseMeta?.weekNumber) === currentWeekNumber)
  const mostRecent = thisWeekEntry || pulses[0] || null

  if (!mostRecent) {
    return (
      <EmptyState
        icon={BookOpen}
        title="No weekly reflection yet"
        body="Sage prompts you for this on the Daily Streak screen once your week is up — it's compulsory before week 2 opens. Once you write it there, it shows up here automatically."
      />
    )
  }

  const isCurrentWeek = mostRecent === thisWeekEntry

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      {!isCurrentWeek && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--app-muted)', background: 'var(--app-bg2)', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-sm)', padding: '0.6rem 0.8rem' }}>
          <History size={14} />
          Showing your most recent reflection — week {mostRecent?.weeklyPulseMeta?.weekNumber || '?'}. This week's isn't written yet.
        </div>
      )}
      <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '1.1rem', boxShadow: 'var(--app-shadow-sm)' }}>
        <p style={{ margin: '0 0 0.2rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>
          {mostRecent.title || `Weekly Reflection — Week ${mostRecent?.weeklyPulseMeta?.weekNumber || 1}`}
        </p>
        <p style={{ margin: '0 0 0.9rem', fontSize: '0.72rem', color: 'var(--app-muted)' }}>
          {mostRecent?.weeklyPulseMeta?.phaseName || phase?.name} · {new Date(mostRecent.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--app-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{mostRecent.content}</p>
        {mostRecent.sageResponse && (
          <div style={{ background: 'linear-gradient(135deg,#fff8fb,#fff0f7)', border: '1px solid rgba(249,95,133,0.2)', borderRadius: 'var(--app-radius-sm)', padding: '0.85rem' }}>
            <p style={{ margin: '0 0 0.3rem', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Sage's read</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#4d3142', lineHeight: 1.6 }}>{mostRecent.sageResponse}</p>
          </div>
        )}
      </div>
      {onOpenJournal && (
        <button type="button" onClick={onOpenJournal} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--app-accent2)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Open in Journal <ArrowRight size={13} />
        </button>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Shared data helpers — real numbers from lib/lockIn.js's weeklyGoals, never invented.
// ────────────────────────────────────────────────────────────────────────────

function getPillarProgress(pillar, phase, engine) {
  const goals = (engine?.weeklyGoals || []).filter(g => g.phaseId === phase?.id && g.pillar === pillar?.name)
  const totalCompleted = goals.reduce((sum, g) => sum + Math.min(g.completed || 0, g.target || 0), 0)
  const totalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0)
  const rate = totalTarget ? Math.round((totalCompleted / totalTarget) * 100) : 0
  return { totalCompleted, totalTarget, rate }
}

function getPhaseProgress(phase, engine) {
  const goals = (engine?.weeklyGoals || []).filter(g => g.phaseId === phase?.id)
  const totalCompleted = goals.reduce((sum, g) => sum + Math.min(g.completed || 0, g.target || 0), 0)
  const totalTarget = goals.reduce((sum, g) => sum + (g.target || 0), 0)
  const rate = totalTarget ? Math.round((totalCompleted / totalTarget) * 100) : 0
  return { totalCompleted, totalTarget, rate }
}

// Journal matching is best-effort: only Weekly Pulse entries carry explicit pillar
// tags (weeklyPulseMeta.pillars). Ordinary daily entries aren't pillar-tagged in this
// codebase, so those are matched by a loose substring check on the pillar name — real
// but imprecise, flagged here rather than hidden.
function getJournalForPillar(user, phase, pillar) {
  const entries = safeRead(scopedKey(JOURNAL_KEY, user), [])
  if (!Array.isArray(entries)) return []
  const start = parseDateKey(phase?.startDate)
  const end = parseDateKey(phase?.endDate)
  const pillarNameLower = cleanText(pillar?.name).toLowerCase()
  return entries
    .filter(entry => {
      const d = parseDateKey(String(entry?.date || '').slice(0, 10))
      if (start && end && d && (d < start || d > end)) return false
      if (Array.isArray(entry?.weeklyPulseMeta?.pillars)) {
        return entry.weeklyPulseMeta.pillars.some(p => cleanText(p).toLowerCase() === pillarNameLower)
      }
      if (entry?.weeklyPulseMeta) return false
      return Boolean(pillarNameLower) && String(entry?.content || '').toLowerCase().includes(pillarNameLower)
    })
    .sort((a, b) => new Date(b?.date || 0) - new Date(a?.date || 0))
}

function getPillarReview(user, phase, pillar) {
  const reviews = safeRead(scopedKey(PILLAR_REVIEWS_KEY, user), [])
  return reviews.find(r => r.pillarId === pillar?.id && r.phaseId === phase?.id) || null
}

function upsertPillarReview(user, phase, pillar, patch) {
  const reviews = safeRead(scopedKey(PILLAR_REVIEWS_KEY, user), [])
  const idx = reviews.findIndex(r => r.pillarId === pillar?.id && r.phaseId === phase?.id)
  const base = idx >= 0 ? reviews[idx] : {
    phaseId: phase?.id,
    phaseName: phase?.name,
    pillarId: pillar?.id,
    pillarName: pillar?.name,
    whatWorked: '',
    whatDidntWork: '',
    whatDrained: '',
    nextStrategy: '',
    decision: null,
    createdAt: new Date().toISOString(),
  }
  const next = { ...base, ...patch, updatedAt: new Date().toISOString() }
  if (idx >= 0) reviews[idx] = next
  else reviews.unshift(next)
  safeWrite(scopedKey(PILLAR_REVIEWS_KEY, user), reviews)
  pushPillarReview(next)
  return next
}

function aggregatePillarStats(pillar, phase, user, engine) {
  const progress = getPillarProgress(pillar, phase, engine)
  const goals = (engine?.weeklyGoals || []).filter(g => g.phaseId === phase?.id && g.pillar === pillar?.name)
  const weeksTouched = new Set(goals.map(g => g.week)).size
  const lockSummary = getLockInSummary(loadLockInState())
  const journalEntries = getJournalForPillar(user, phase, pillar).filter(e => !e.weeklyPulseMeta)
  return {
    ...progress,
    weeksTouched,
    bestStreak: lockSummary.bestStreak,
    journalEntries,
  }
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 2 — Progress. A phase-level bar, then per-pillar bars, then that pillar's
// journal entries and weekly reflections underneath.
// ────────────────────────────────────────────────────────────────────────────

function ProgressBar({ rate }) {
  return (
    <div style={{ height: 8, borderRadius: 999, background: 'var(--app-bg2)', overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${Math.min(100, rate)}%`, borderRadius: 999, background: 'linear-gradient(90deg,var(--app-accent2),var(--app-accent))', transition: 'width 0.3s ease' }} />
    </div>
  )
}

function PillarEntryList({ user, phase, pillar }) {
  const all = useMemo(() => getJournalForPillar(user, phase, pillar), [user, phase, pillar])
  const reflections = all.filter(e => e.weeklyPulseMeta)
  const entries = all.filter(e => !e.weeklyPulseMeta)

  if (!all.length) {
    return <p style={{ margin: '0.5rem 0 0', fontSize: '0.76rem', color: 'var(--app-muted)' }}>No journal entries or weekly reflections tied to this pillar yet.</p>
  }

  return (
    <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {reflections.map(entry => (
        <div key={entry.id} style={{ background: 'var(--app-bg2)', borderRadius: 8, padding: '0.6rem 0.7rem' }}>
          <p style={{ margin: '0 0 0.15rem', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>
            Weekly Reflection · {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--app-text)', lineHeight: 1.5 }}>{cleanText(entry.content).slice(0, 220) || 'Untitled reflection'}</p>
        </div>
      ))}
      {entries.map(entry => (
        <div key={entry.id} style={{ borderLeft: '2px solid var(--app-border)', paddingLeft: '0.6rem' }}>
          <p style={{ margin: '0 0 0.1rem', fontSize: '0.68rem', color: 'var(--app-muted)' }}>
            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </p>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--app-text)', lineHeight: 1.5 }}>{cleanText(entry.content).slice(0, 180) || 'Untitled entry'}</p>
        </div>
      ))}
    </div>
  )
}

function ProgressTab({ user, boardData, phase }) {
  const engine = useMemo(() => ensureProgressEngine(boardData), [boardData])
  const pillars = phase?.pillars || []
  const phaseProgress = useMemo(() => getPhaseProgress(phase, engine), [phase, engine])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '1.1rem', boxShadow: 'var(--app-shadow-sm)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>{phase?.name || 'This phase'}</span>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--app-muted)' }}>
            {phaseProgress.totalTarget ? `${phaseProgress.totalCompleted}/${phaseProgress.totalTarget} · ${phaseProgress.rate}%` : 'No targets yet'}
          </span>
        </div>
        <ProgressBar rate={phaseProgress.rate} />
      </div>

      {pillars.length === 0 && <EmptyState title="No pillars set up yet" body="Add pillars in the Vision Board to see progress here." />}

      {pillars.map(pillar => {
        const progress = getPillarProgress(pillar, phase, engine)
        return (
          <div key={pillar.id} style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '1.1rem', boxShadow: 'var(--app-shadow-sm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--app-text)' }}>{pillar.name}</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--app-muted)' }}>
                {progress.totalTarget ? `${progress.totalCompleted}/${progress.totalTarget} · ${progress.rate}%` : 'No targets yet'}
              </span>
            </div>
            <ProgressBar rate={progress.rate} />
            <PillarEntryList user={user} phase={phase} pillar={pillar} />
          </div>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 3 — Review. Reflection is the price of the celebration, not a reward that
// precedes it: four questions first, then the Continue/End decision, and the
// Spotify-Wrapped-style walkthrough plays ONLY when she chooses Continue.
// ────────────────────────────────────────────────────────────────────────────

const REVIEW_QUESTIONS = [
  { key: 'whatWorked', label: 'What worked', hint: 'Things to keep doing' },
  { key: 'whatDidntWork', label: "What didn't work", hint: 'Things to drop' },
  { key: 'whatDrained', label: 'What drained you', hint: 'The friction to remove' },
  { key: 'nextStrategy', label: 'Next strategy', hint: "What you'll start, stop, and do more of" },
]

function QuestionField({ label, hint, value, onChange, placeholder = 'In your own words...', rows = 2 }) {
  const startVoice = useVoiceDictation(text => onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${text}`))
  return (
    <div>
      {label && <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#f78fb0' }}>{label}</p>}
      {hint && <p style={{ margin: '0 0 0.4rem', fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)' }}>{hint}</p>}
      <div style={{ position: 'relative' }}>
        <textarea
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '0.55rem 2.6rem 0.55rem 0.7rem', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem', color: '#fff', background: 'rgba(255,255,255,0.08)', outline: 'none', resize: 'vertical' }}
        />
        <button
          type="button"
          onClick={startVoice}
          aria-label="Dictate"
          style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.1)', color: '#f78fb0', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <Mic size={13} />
        </button>
      </div>
    </div>
  )
}

function ReviewShell({ children, footer }) {
  return (
    <div style={{ position: 'relative', minHeight: 480, borderRadius: 'var(--app-radius-lg)', overflow: 'hidden', background: 'linear-gradient(160deg,#1a0a10,#2e101c)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 1.75rem' }}>
        {children}
      </div>
      {footer && <div style={{ padding: '0 1.25rem 1.25rem' }}>{footer}</div>}
    </div>
  )
}

// Step 1 of 2: four questions. Answers are persisted the moment she moves on to the
// decision step — so if she abandons before deciding, the answers already survive.
function QuestionsStep({ pillar, answers, setAnswers, onNext }) {
  return (
    <ReviewShell
      footer={
        <button
          type="button"
          onClick={onNext}
          style={{ width: '100%', padding: '0.85rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#f78fb0,#f06090)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          Next
        </button>
      }
    >
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        {pillar?.name} · Reflection
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {REVIEW_QUESTIONS.map(q => (
          <QuestionField
            key={q.key}
            label={q.label}
            hint={q.hint}
            value={answers[q.key]}
            onChange={value => setAnswers(a => ({ ...a, [q.key]: value }))}
            rows={q.key === 'nextStrategy' ? 3 : 2}
          />
        ))}
      </div>
    </ReviewShell>
  )
}

// Step 2 of 2: the decision. Only Continue earns the wrap.
function DecisionStep({ pillar, onEditAnswers, onDecide }) {
  return (
    <ReviewShell>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
        {pillar?.name}
      </p>
      <p style={{ color: '#fff', fontSize: 'clamp(1.15rem,4vw,1.5rem)', fontFamily: "'Playfair Display',serif", lineHeight: 1.4, marginBottom: '1.6rem' }}>
        Continue this journey toward a bigger goal, or end it here?
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: '100%' }}>
        <button type="button" onClick={() => onDecide('continue')} style={{ padding: '0.85rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#f78fb0,#f06090)', color: '#fff', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Continue this journey
        </button>
        <button type="button" onClick={() => onDecide('end')} style={{ padding: '0.85rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          End it here
        </button>
        <button type="button" onClick={onEditAnswers} style={{ padding: '0.5rem', border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: '0.76rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Edit my answers
        </button>
      </div>
    </ReviewShell>
  )
}

// The wrap — earned by Continue only. No decision slide in here; the decision is
// already made and saved before this ever renders.
function PillarWrap({ user, boardData, phase, pillar, phaseHasRunningPillars, onDone }) {
  const [slide, setSlide] = useState(0)
  const [synthesis, setSynthesis] = useState('')
  const [busy, setBusy] = useState(false)
  const engine = useMemo(() => ensureProgressEngine(boardData), [boardData])
  const stats = useMemo(() => aggregatePillarStats(pillar, phase, user, engine), [pillar, phase, user, engine])

  async function generateSynthesis() {
    setBusy(true)
    try {
      const journalExcerpt = stats.journalEntries.slice(0, 4).map(e => cleanText(e.content)).filter(Boolean).join('\n---\n')
      const prompt = `The pillar "${pillar?.name}" is complete. Write a short synthesis (2-3 sentences, Sage's voice) of the pattern across this pillar's journey — the story behind the numbers.

Completion: ${stats.totalCompleted} of ${stats.totalTarget} weekly actions across ${stats.weeksTouched} week(s). Best streak this phase: ${stats.bestStreak} days.
Goal: ${cleanText(pillar?.afterState || pillar?.afterDesc) || 'not written'}.
${journalExcerpt ? `Journal entries touching this pillar:\n${journalExcerpt}` : 'No journal entries matched this pillar.'}

Return plain text only, no headers.`
      const text = await callSage({ system: SAGE_VOICE, prompt, maxTokens: 300 })
      const clean = cleanText(text) || `${stats.rate}% complete across ${stats.weeksTouched} weeks — real, steady movement.`
      setSynthesis(clean)
      const wraps = safeRead(scopedKey(PILLAR_WRAPS_KEY, user), [])
      const idx = wraps.findIndex(w => w.pillarId === pillar.id)
      const record = { pillarId: pillar.id, pillarName: pillar.name, phaseId: phase.id, synthesis: clean, generatedAt: new Date().toISOString() }
      if (idx >= 0) wraps[idx] = record
      else wraps.unshift(record)
      safeWrite(scopedKey(PILLAR_WRAPS_KEY, user), wraps)
      pushPillarWrap(record)
    } catch {
      setSynthesis(`${stats.rate}% complete across ${stats.weeksTouched} weeks — real, steady movement, even without a written synthesis right now.`)
    } finally {
      setBusy(false)
    }
  }

  const slides = [
    {
      render: () => (
        <>
          <Gift size={38} color="#f78fb0" />
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,5vw,2.2rem)', color: '#fff', margin: '1rem 0 0.4rem' }}>{pillar?.name} is complete.</h1>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.92rem' }}>Here's the journey.</p>
        </>
      ),
    },
    {
      render: () => (
        <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Follow-through</p>
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(3rem,12vw,5rem)', color: '#fff', margin: '0.3rem 0' }}>{stats.rate}%</p>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.92rem' }}>{stats.totalCompleted} of {stats.totalTarget} weekly actions, across {stats.weeksTouched} week{stats.weeksTouched === 1 ? '' : 's'}</p>
        </>
      ),
    },
    {
      render: () => (
        <>
          <Flame size={30} color="#f78fb0" />
          <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(2.6rem,10vw,4.5rem)', color: '#fff', margin: '0.3rem 0' }}>{stats.bestStreak}</p>
          <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: '0.92rem' }}>day best streak this phase</p>
        </>
      ),
    },
    {
      render: () => (
        <>
          <BookOpen size={30} color="#f78fb0" />
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '1rem 0 0.6rem' }}>The pattern</p>
          {synthesis ? (
            <p style={{ color: '#fff', fontSize: '1.02rem', lineHeight: 1.6, fontFamily: "'Playfair Display',serif", fontStyle: 'italic' }}>{synthesis}</p>
          ) : (
            <button type="button" disabled={busy} onClick={generateSynthesis} style={{ padding: '0.7rem 1.4rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#f78fb0,#f06090)', color: '#fff', fontWeight: 800, cursor: busy ? 'wait' : 'pointer' }}>
              {busy ? 'Sage is thinking...' : 'Reveal the pattern'}
            </button>
          )}
          {stats.journalEntries.length === 0 && (
            <p style={{ marginTop: '0.8rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>No journal entries matched this pillar directly.</p>
          )}
        </>
      ),
    },
    ...(phaseHasRunningPillars ? [{
      render: () => (
        <>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>One more thing</p>
          <p style={{ color: '#fff', fontSize: '1rem', lineHeight: 1.6 }}>
            Other pillars in {phase?.name} are still running — you've got another memory lane to walk once they finish too.
          </p>
        </>
      ),
    }] : []),
  ]

  const current = slides[Math.min(slide, slides.length - 1)]
  const isLast = slide >= slides.length - 1

  return (
    <div style={{ position: 'relative', minHeight: 480, borderRadius: 'var(--app-radius-lg)', overflow: 'hidden', background: 'linear-gradient(160deg,#1a0a10,#2e101c)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0.9rem 1rem 0' }}>
        {slides.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= slide ? '#f78fb0' : 'rgba(255,255,255,0.18)' }} />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem 1.75rem' }}
        >
          {current.render()}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.25rem', gap: '0.6rem' }}>
        <button type="button" onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0} style={{ opacity: slide === 0 ? 0.3 : 1, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronLeft size={18} /> Back
        </button>
        {!isLast ? (
          <button type="button" onClick={() => setSlide(s => Math.min(slides.length - 1, s + 1))} style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 999, padding: '0.5rem 1rem', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button type="button" onClick={onDone} style={{ background: 'linear-gradient(135deg,#f78fb0,#f06090)', border: 'none', borderRadius: 999, padding: '0.5rem 1.1rem', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            Done
          </button>
        )}
      </div>
    </div>
  )
}

function DoneStep({ pillar, decision }) {
  return (
    <ReviewShell>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
          {decision === 'continue' ? 'Saved. That strategy carries into your next phase.' : `${pillar?.name} is closed.`}
        </p>
      </div>
    </ReviewShell>
  )
}

// Orchestrates: questions → decision → (wrap only if Continue) → done.
function PillarReviewFlow({ user, boardData, phase, pillar, phaseHasRunningPillars, existingReview, onExit }) {
  const hasDraftAnswers = Boolean(existingReview?.whatWorked || existingReview?.whatDidntWork || existingReview?.whatDrained || existingReview?.nextStrategy)
  const [step, setStep] = useState(existingReview?.decision ? 'done' : hasDraftAnswers ? 'decision' : 'questions')
  const [answers, setAnswers] = useState({
    whatWorked: existingReview?.whatWorked || '',
    whatDidntWork: existingReview?.whatDidntWork || '',
    whatDrained: existingReview?.whatDrained || '',
    nextStrategy: existingReview?.nextStrategy || '',
  })
  const [decision, setDecision] = useState(existingReview?.decision || null)

  function goToDecision() {
    upsertPillarReview(user, phase, pillar, { ...answers, decision: null })
    setStep('decision')
  }

  function decide(nextDecision) {
    upsertPillarReview(user, phase, pillar, { ...answers, decision: nextDecision })
    setDecision(nextDecision)
    setStep(nextDecision === 'continue' ? 'wrap' : 'done')
  }

  if (step === 'questions') {
    return <QuestionsStep pillar={pillar} answers={answers} setAnswers={setAnswers} onNext={goToDecision} />
  }
  if (step === 'decision') {
    return <DecisionStep pillar={pillar} onEditAnswers={() => setStep('questions')} onDecide={decide} />
  }
  if (step === 'wrap') {
    return (
      <PillarWrap
        user={user}
        boardData={boardData}
        phase={phase}
        pillar={pillar}
        phaseHasRunningPillars={phaseHasRunningPillars}
        onDone={onExit}
      />
    )
  }
  return <DoneStep pillar={pillar} decision={decision} />
}

function ReviewTab({ user, boardData, phase }) {
  const engine = useMemo(() => ensureProgressEngine(boardData), [boardData])
  const pillars = phase?.pillars || []
  const [openPillarId, setOpenPillarId] = useState(null)

  const pillarStates = pillars.map(pillar => {
    const progress = getPillarProgress(pillar, phase, engine)
    const complete = progress.rate >= 100 && progress.totalTarget > 0
    const review = getPillarReview(user, phase, pillar)
    return { pillar, progress, complete, review }
  })

  const openEntry = pillarStates.find(p => p.pillar.id === openPillarId)
  if (openEntry) {
    return (
      <PillarReviewFlow
        user={user}
        boardData={boardData}
        phase={phase}
        pillar={openEntry.pillar}
        phaseHasRunningPillars={pillarStates.some(p => p.pillar.id !== openEntry.pillar.id && !p.complete)}
        existingReview={openEntry.review}
        onExit={() => setOpenPillarId(null)}
      />
    )
  }

  const actionable = pillarStates.filter(p => p.complete && p.review?.decision !== 'end' && p.review?.decision !== 'continue')
  const closed = pillarStates.filter(p => p.review?.decision === 'end' || p.review?.decision === 'continue')

  if (!actionable.length && !closed.length) {
    return (
      <EmptyState
        title="Nothing to review yet"
        body="When a pillar's weekly targets hit 100%, its reflection unlocks here — four quick questions, then your call on what's next."
      />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
      {actionable.map(({ pillar, review }) => (
        <button
          key={pillar.id}
          type="button"
          onClick={() => setOpenPillarId(pillar.id)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '1rem 1.1rem', boxShadow: 'var(--app-shadow-sm)', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
        >
          <div>
            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--app-text)' }}>{pillar.name}</p>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: 'var(--app-muted)' }}>
              {review ? 'Reflection started — pick up where you left off' : 'Complete — ready for reflection'}
            </p>
          </div>
          <ChevronRight size={18} color="var(--app-accent)" />
        </button>
      ))}
      {closed.map(({ pillar, review }) => (
        <div key={pillar.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--app-bg2)', borderRadius: 'var(--app-radius-md)', padding: '0.9rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--app-accent)" />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--app-text)' }}>{pillar.name}</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--app-muted)' }}>{review.decision === 'continue' ? 'Continuing' : 'Ended'}</span>
        </div>
      ))}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// TAB 4 — Past. Full phase history, each phase expandable to its pillars. Reviewed
// pillars open a read-only summary of the saved answers — the wrap already played
// once and isn't replayed here.
// ────────────────────────────────────────────────────────────────────────────

function PillarReviewSummary({ phase, pillar, review, onBack }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '1.1rem', boxShadow: 'var(--app-shadow-sm)', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
      <button type="button" onClick={onBack} style={{ alignSelf: 'flex-start', border: 'none', background: 'transparent', color: 'var(--app-accent2)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: "'DM Sans',sans-serif" }}>
        <ChevronLeft size={14} /> Back
      </button>
      <div>
        <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>{pillar?.name} · {phase?.name}</p>
        <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--app-muted)' }}>{review?.decision === 'continue' ? 'Continued' : 'Ended'}</p>
      </div>
      {REVIEW_QUESTIONS.map(q => (
        <div key={q.key}>
          <p style={{ margin: '0 0 0.2rem', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--app-accent2)' }}>{q.label}</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--app-text)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{review?.[q.key] || '—'}</p>
        </div>
      ))}
    </div>
  )
}

function PastPillarRow({ user, phase, pillar, isActivePhase, engine, onOpenReview }) {
  const liveProgress = isActivePhase ? getPillarProgress(pillar, phase, engine) : null
  const review = getPillarReview(user, phase, pillar)
  const reviewed = Boolean(review?.decision)

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.55rem 0.7rem', borderRadius: 8, background: 'var(--app-bg2)' }}>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--app-text)' }}>{pillar.name}</span>
      {reviewed ? (
        <button
          type="button"
          onClick={() => onOpenReview(pillar, review)}
          style={{ border: 'none', background: 'transparent', color: 'var(--app-accent)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'inline-flex', alignItems: 'center', gap: 3 }}
        >
          {review.decision === 'continue' ? 'Continuing' : 'Ended'} <ChevronRight size={13} />
        </button>
      ) : (
        <span style={{ fontSize: '0.72rem', color: 'var(--app-muted)' }}>
          {isActivePhase ? (liveProgress.totalTarget ? `${liveProgress.rate}%` : 'No targets yet') : 'Not reviewed'}
        </span>
      )}
    </div>
  )
}

function PastList({ user, boardData }) {
  const engine = useMemo(() => ensureProgressEngine(boardData), [boardData])
  const allPhases = boardData?.phases || []
  const [expandedPhaseId, setExpandedPhaseId] = useState(allPhases[0]?.id || null)
  const [viewing, setViewing] = useState(null) // { phase, pillar, review }

  if (viewing) {
    return <PillarReviewSummary phase={viewing.phase} pillar={viewing.pillar} review={viewing.review} onBack={() => setViewing(null)} />
  }

  if (!allPhases.length) {
    return <EmptyState icon={History} title="Nothing here yet" body="Your phase history will show up here once a phase is underway." />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {allPhases.map(phase => {
        const expanded = expandedPhaseId === phase.id
        const isActivePhase = phase.id === boardData?.activePhaseId
        const pillars = phase.pillars || []
        return (
          <div key={phase.id} style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setExpandedPhaseId(expanded ? null : phase.id)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0.9rem 1rem', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
            >
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--app-text)' }}>{phase.name}{isActivePhase ? ' · current' : ''}</span>
              <ChevronRight size={16} color="var(--app-muted)" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
            </button>
            {expanded && (
              <div style={{ padding: '0 1rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {pillars.length === 0 && <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--app-muted)' }}>No pillars in this phase.</p>}
                {pillars.map(pillar => (
                  <PastPillarRow
                    key={pillar.id}
                    user={user}
                    phase={phase}
                    pillar={pillar}
                    isActivePhase={isActivePhase}
                    engine={engine}
                    onOpenReview={(p, review) => setViewing({ phase, pillar: p, review })}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Root
// ────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'reflection', label: 'Weekly Reflection' },
  { id: 'progress', label: 'Progress' },
  { id: 'review', label: 'Pillar Reviews' },
  { id: 'past', label: 'Past' },
]

export default function Review({ user, onOpenBoard, onOpenJournal }) {
  const [tab, setTab] = useState('reflection')
  const [boardData, setBoardData] = useState(() => loadBoardData())

  useEffect(() => {
    const sync = () => setBoardData(loadBoardData())
    window.addEventListener('phasr-vb-updated', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('phasr-hydrated', sync)
    return () => {
      window.removeEventListener('phasr-vb-updated', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('phasr-hydrated', sync)
    }
  }, [])

  const phase = useMemo(() => getActivePhase(boardData), [boardData])
  const hasPillar = (phase?.pillars || []).some(p => cleanText(p.beforeDesc) || cleanText(p.afterDesc))

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {/* One section picker, not a page title stacked on top of a 4-button row where
            one of the buttons is *also* labeled "Review" — confusing, and it ate space
            better spent on the section itself, especially on mobile. Selecting a section
            here is the only chrome above it; that section then fills the rest of the page. */}
        <div style={{ position: 'relative', marginBottom: '1.2rem' }}>
          <Compass size={16} color="var(--app-accent)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          <select
            value={tab}
            onChange={e => setTab(e.target.value)}
            aria-label="Choose review section"
            style={{
              width: '100%',
              minHeight: 48,
              padding: '0.6rem 2.2rem 0.6rem 2.4rem',
              borderRadius: 999,
              border: '1px solid var(--app-border)',
              background: '#fff',
              color: 'var(--app-text)',
              fontFamily: "'DM Sans',sans-serif",
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              appearance: 'none',
              WebkitAppearance: 'none',
            }}
          >
            {TABS.map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          <ChevronRight size={16} color="var(--app-muted)" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%) rotate(90deg)', pointerEvents: 'none' }} />
        </div>

        {!hasPillar ? (
          <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)' }}>
            <Compass size={28} color="var(--app-accent)" style={{ marginBottom: '0.8rem' }} />
            <p style={{ fontSize: '0.95rem', color: 'var(--app-text)', marginBottom: '1rem' }}>Set up a pillar first — Review needs a real plan to reflect on.</p>
            <button type="button" onClick={onOpenBoard} style={{ padding: '0.7rem 1.4rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
              Go to Vision Board
            </button>
          </div>
        ) : (
          <>
            {tab === 'reflection' && phase && <WeeklyReflection user={user} boardData={boardData} phase={phase} onOpenJournal={onOpenJournal} />}
            {tab === 'progress' && phase && <ProgressTab user={user} boardData={boardData} phase={phase} />}
            {tab === 'review' && phase && <ReviewTab user={user} boardData={boardData} phase={phase} />}
            {tab === 'past' && <PastList user={user} boardData={boardData} />}
          </>
        )}
      </div>
    </div>
  )
}
