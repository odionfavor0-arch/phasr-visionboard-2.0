// src/pages/AppShell.jsx
// ─────────────────────────────────────────────
// The inner app — shown after login.
// Contains: Vision Board | Journal | Daily Check-in
// ─────────────────────────────────────────────

import { useState } from 'react'
import VisionBoard  from '../components/VisionBoard'
import Journal      from '../components/Journal'
import DailyCheckin from '../components/DailyCheckin'

/* ── Theme dot selector (reusable) ── */
function ThemeSwitcher({ theme, onThemeChange }) {
  return (
    <div className="theme-switcher" title="Change theme">
      {['neutral', 'rose', 'slate'].map(t => (
        <div
          key={t}
          className={`theme-dot ${theme === t ? 'active' : ''}`}
          data-t={t}
          onClick={() => onThemeChange(t)}
          title={t.charAt(0).toUpperCase() + t.slice(1)}
        />
      ))}
    </div>
  )
}

export default function AppShell({ user, theme, onThemeChange, streak, onSignOut }) {
  const [view, setView] = useState('board') // 'board' | 'journal' | 'checkin'

  const email   = user?.email || ''
  const initial = (email[0] || 'U').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top Bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.65rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        {/* Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #f472a8, #ffd6e7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            flexShrink: 0, cursor: 'pointer',
          }}>Phasr</span>

          {/* Nav tabs */}
          <nav style={{ display: 'flex', gap: '0.2rem' }}>
            {[
              { id: 'board',    label: 'Vision Board' },
              { id: 'journal',  label: 'Journal'      },
              { id: 'checkin',  label: 'Daily Check-in' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  padding: '0.38rem 0.85rem', borderRadius: 8, border: 'none',
                  background: view === tab.id ? 'rgba(232,64,122,0.12)' : 'transparent',
                  color: view === tab.id ? 'var(--accent2)' : 'var(--muted)',
                  fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Streak counter */}
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: 99,
              background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--streak-color)',
            }}>
              <span style={{ fontSize: '0.9rem' }}>⚡</span>
              {streak} day{streak !== 1 ? 's' : ''}
            </div>
          )}

          {/* Theme switcher */}
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

          {/* User */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.75rem', borderRadius: 99,
            border: '1px solid var(--border)', background: 'rgba(232,64,122,0.06)',
            fontSize: '0.75rem', color: 'var(--muted)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initial}</div>
            <span style={{
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{email}</span>
          </div>

          <button
            onClick={onSignOut}
            style={{
              padding: '0.32rem 0.85rem', borderRadius: 99,
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--muted)', fontSize: '0.74rem', cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)' }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Views ── */}
      {view === 'board'   && <VisionBoard  user={user} />}
      {view === 'journal' && <Journal      user={user} />}
      {view === 'checkin' && <DailyCheckin user={user} streak={streak} />}
    </div>
  )
}
// src/components/DailyCheckin.jsx
// ─────────────────────────────────────────────
// Daily Check-in — the feature that brings users back every day.
// Morning: Set one intention (60 seconds)
// Evening: 2-minute reflection
// Streak counter + phase-linked daily prompt
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'

const MORNING_PROMPTS = [
  "What is the one thing that, if done today, makes everything else easier?",
  "Who do you need to be today to move closer to your goal?",
  "What would your future self do today?",
  "Name one habit you will protect at all costs today.",
  "What conversation have you been avoiding that needs to happen today?",
  "What does your goal need from you today — not tomorrow, today?",
  "If today were the day everything changed, what would you do first?",
]

const EVENING_PROMPTS = [
  "On a scale of 1–10, how aligned were your actions with your goals today?",
  "What moment today are you most proud of?",
  "What did you learn about yourself today?",
  "What would you do differently if you could repeat today?",
  "Did you honour your commitments to yourself today? What happened?",
]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getPromptOfTheDay(arr) {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return arr[dayOfYear % arr.length]
}

export default function DailyCheckin({ user, streak }) {
  const todayKey = getTodayKey()
  const storageKey = `phasr_checkin_${todayKey}`

  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}') } catch { return {} }
  })
  const [session, setSession] = useState('morning') // 'morning' | 'evening'
  const [saved,   setSaved]   = useState(false)

  const morningPrompt = getPromptOfTheDay(MORNING_PROMPTS)
  const eveningPrompt = getPromptOfTheDay(EVENING_PROMPTS)

  const hour = new Date().getHours()
  // Auto-switch to evening after 5pm
  useEffect(() => {
    if (hour >= 17) setSession('evening')
  }, [hour])

  function update(key, val) {
    const next = { ...data, [key]: val }
    setData(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  function save() {
    const next = { ...data, [`${session}_done`]: true }
    setData(next)
    localStorage.setItem(storageKey, JSON.stringify(next))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const morningDone  = data.morning_done
  const eveningDone  = data.evening_done

  /* ── Past check-ins ── */
  const pastDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (i + 1) * 86400000)
    const k = d.toISOString().slice(0, 10)
    const stored = JSON.parse(localStorage.getItem(`phasr_checkin_${k}`) || '{}')
    return {
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      morning: !!stored.morning_done,
      evening: !!stored.evening_done,
    }
  }).reverse()

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--app-bg)',
      padding: '2rem 1rem 4rem',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
            fontWeight: 800,
            color: 'var(--app-text)',
            marginBottom: '0.4rem',
          }}>Daily Check-in</h1>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.88rem' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>

          {/* Streak */}
          {streak > 0 && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.4rem 1.2rem', borderRadius: 99, marginTop: '0.75rem',
              background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)',
              fontSize: '0.82rem', fontWeight: 600, color: 'var(--streak-color)',
            }}>
              <span>⚡</span> {streak}-day streak — keep it going
            </div>
          )}
        </div>

        {/* ── Session Toggle ── */}
        <div style={{
          display: 'flex', background: '#fff',
          border: '1px solid var(--app-border)',
          borderRadius: 99, padding: 4,
          marginBottom: '1.5rem', gap: 0,
        }}>
          {['morning', 'evening'].map(s => (
            <button
              key={s}
              onClick={() => setSession(s)}
              style={{
                flex: 1, padding: '0.6rem', borderRadius: 99, border: 'none',
                background: session === s ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : 'transparent',
                color: session === s ? '#fff' : 'var(--app-muted)',
                fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              }}
            >
              {s === 'morning' ? 'Morning' : 'Evening'}
              {(s === 'morning' ? morningDone : eveningDone) && (
                <span style={{ fontSize: '0.75rem', opacity: 0.85 }}>✓</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Main Card ── */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--app-border)',
          borderRadius: 'var(--r)',
          boxShadow: 'var(--app-glow)',
          overflow: 'hidden',
          marginBottom: '1.5rem',
        }}>
          {/* Card header */}
          <div style={{
            background: 'linear-gradient(135deg, var(--app-bg2), #fff)',
            borderBottom: '1px solid var(--app-border)',
            padding: '1.1rem 1.4rem',
          }}>
            <p style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: '0.75rem', fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'var(--app-accent)', marginBottom: '0.5rem',
            }}>
              {session === 'morning' ? 'Morning Intention' : 'Evening Reflection'}
            </p>
            <p style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 'clamp(0.9rem, 2.2vw, 1.05rem)',
              fontStyle: 'italic', color: 'var(--app-text)', lineHeight: 1.6,
            }}>
              {session === 'morning' ? morningPrompt : eveningPrompt}
            </p>
          </div>

          {/* Fields */}
          <div style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {session === 'morning' ? (
              <>
                <Field
                  label="My intention for today"
                  placeholder="Today I will..."
                  value={data.intention || ''}
                  onChange={v => update('intention', v)}
                  rows={3}
                />
                <Field
                  label="The one thing I must complete"
                  placeholder="By end of day I will have..."
                  value={data.one_thing || ''}
                  onChange={v => update('one_thing', v)}
                  rows={2}
                />
                <Field
                  label="How I want to show up today"
                  placeholder="I will be..."
                  value={data.show_up || ''}
                  onChange={v => update('show_up', v)}
                  rows={2}
                />
              </>
            ) : (
              <>
                {/* Energy rating */}
                <div>
                  <p style={{
                    fontSize: '0.72rem', fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--app-muted)', marginBottom: '0.6rem',
                  }}>
                    How aligned were you with your goals today?
                  </p>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => update('alignment', n)}
                        style={{
                          width: 36, height: 36, borderRadius: 8, border: '1.5px solid',
                          borderColor: data.alignment === n ? 'var(--app-accent)' : 'var(--app-border)',
                          background: data.alignment === n ? 'var(--app-bg2)' : '#fff',
                          color: data.alignment === n ? 'var(--app-accent)' : 'var(--app-muted)',
                          fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                          transition: 'all 0.15s', fontFamily: "'DM Sans', sans-serif",
                        }}
                      >{n}</button>
                    ))}
                  </div>
                </div>
                <Field
                  label="My biggest win today"
                  placeholder="Today I achieved..."
                  value={data.win || ''}
                  onChange={v => update('win', v)}
                  rows={2}
                />
                <Field
                  label="What I would do differently"
                  placeholder="Next time I will..."
                  value={data.different || ''}
                  onChange={v => update('different', v)}
                  rows={2}
                />
                <Field
                  label="Tomorrow's priority"
                  placeholder="Tomorrow the most important thing is..."
                  value={data.tomorrow || ''}
                  onChange={v => update('tomorrow', v)}
                  rows={2}
                />
              </>
            )}

            <button
              onClick={save}
              style={{
                width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none',
                background: saved
                  ? 'linear-gradient(135deg, #65c47c, #3da85a)'
                  : 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
                color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.3s',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 16px rgba(233,100,136,0.25)',
              }}
            >
              {saved ? 'Saved' : `Save ${session === 'morning' ? 'Morning' : 'Evening'} Check-in`}
            </button>
          </div>
        </div>

        {/* ── 7-Day Overview ── */}
        <div style={{
          background: '#fff', border: '1px solid var(--app-border)',
          borderRadius: 'var(--r)', padding: '1.1rem 1.4rem',
        }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: 700,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--app-muted)', marginBottom: '1rem',
          }}>Last 7 Days</p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
            {pastDays.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--app-muted)', marginBottom: '0.4rem' }}>{d.label}</p>
                <div style={{
                  width: '100%', aspectRatio: '1/1', borderRadius: 8,
                  background: d.morning && d.evening
                    ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))'
                    : d.morning || d.evening
                    ? 'var(--app-bg2)'
                    : 'var(--app-border)',
                  border: '1.5px solid',
                  borderColor: d.morning || d.evening ? 'var(--app-accent)' : 'var(--app-border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.68rem', fontWeight: 700,
                  color: d.morning && d.evening ? '#fff' : 'var(--app-muted)',
                }}>
                  {d.morning && d.evening ? '✓' : d.morning || d.evening ? '~' : ''}
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.72rem', color: 'var(--app-muted)', marginTop: '0.75rem', textAlign: 'center' }}>
            Filled = both sessions · Half = one session
          </p>
        </div>

      </div>
    </div>
  )
}

/* ── Reusable textarea field ── */
function Field({ label, placeholder, value, onChange, rows = 3 }) {
  return (
    <div>
      <p style={{
        fontSize: '0.72rem', fontWeight: 700,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: 'var(--app-muted)', marginBottom: '0.4rem',
      }}>{label}</p>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          width: '100%', padding: '0.7rem 0.9rem',
          border: '1.5px solid var(--app-border)', borderRadius: 12,
          fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem',
          color: 'var(--app-text)', background: '#fff', outline: 'none',
          resize: 'vertical', minHeight: 60, lineHeight: 1.6,
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--app-accent)' }}
        onBlur={e  => { e.target.style.borderColor = 'var(--app-border)' }}
      />
    </div>
  )
}
// src/components/SageCoach.jsx
// ─────────────────────────────────────────────
// Sage — AI Life Coach
// Floating + draggable panel. No emoji in name.
// Warm, direct, honest. Reduces m-dashes.
// ─────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "Give me an affirmation for this phase",
  "Review my goals with me",
  "I need motivation right now",
  "What am I avoiding?",
]

function getContext(boardData, todayJournal) {
  const phase = boardData?.phases?.find(p => p.id === boardData?.activePhaseId)
    || boardData?.phases?.[0]

  const pillarsText = phase?.pillars?.map(pl =>
    `Pillar: ${pl.name} | Goal: ${pl.afterState} | Weekly habits: ${pl.weeklyActions?.join(', ')}`
  ).join('\n') || ''

  const journalText = todayJournal
    ? `Today's check-in: Intention: ${todayJournal.intention || 'not set'} | Win: ${todayJournal.win || 'not set'} | Mood: ${todayJournal.mood || 'not set'}`
    : 'No check-in today yet.'

  return `You are Sage, a deeply personal AI Life Coach inside Phasr, a phased vision board and goal-tracking platform. You are a trusted partner, not a tool.

Your voice: Warm, direct, and honest. You speak like a wise friend who genuinely cares. You do not agree with everything the user says just to make them feel good. You challenge them when needed and celebrate them when they earn it.

Style rules:
- Never use m-dashes. Use commas, periods, or colons instead.
- Avoid bullet-point lists unless the user asks for a breakdown.
- Keep responses concise. One paragraph is usually enough.
- No filler phrases like "Great question!" or "Absolutely!"
- Reference their actual goals when possible. Be specific, not generic.

Context:
Board: ${boardData?.boardTitle || 'My Vision Board'}
Current phase: ${phase?.name || 'Phase 1'} | Affirmation: ${phase?.affirmation || ''}
Goal statement: ${phase?.impact || ''}

Pillars:
${pillarsText}

${journalText}

If asked for affirmations, give 2 to 3 that are tied to their specific goals, not generic inspiration.
If they share a struggle, acknowledge it first before offering a solution.
If they share a win, celebrate it without immediately pivoting to the next challenge.
If they seem stuck, ask one clear question instead of giving advice.`
}

export default function SageCoach({ boardData, todayJournal }) {
  const [open,     setOpen]     = useState(false)
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phasr_sage') || '[]') } catch { return [] }
  })
  const [input,   setInput]   = useState('')
  const [loading, setLoading] = useState(false)
  const [pos,     setPos]     = useState({ bottom: 24, right: 24 })

  const msgsRef   = useRef(null)
  const inputRef  = useRef(null)
  const dragging  = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, bottom: 24, right: 24 })
  const panelRef  = useRef(null)

  /* ── Save messages ── */
  useEffect(() => {
    localStorage.setItem('phasr_sage', JSON.stringify(messages.slice(-80)))
  }, [messages])

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [messages, loading])

  /* ── Opening greeting ── */
  function handleOpen() {
    setOpen(o => {
      const next = !o
      if (next && messages.length === 0) {
        const phase = boardData?.phases?.[0]
        const greeting = `Welcome. I've looked at your board and I want to say this: what you're building is real. "${phase?.affirmation || 'You are becoming who you were always meant to be'}" — hold onto that. I'm here when you need clarity, accountability, or just someone to think with. What's on your mind?`
        setTimeout(() => {
          setMessages([{ role: 'assistant', content: greeting }])
          inputRef.current?.focus()
        }, 300)
      }
      return next
    })
  }

  /* ── Send message ── */
  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || loading) return
    setInput('')

    const next = [...messages, { role: 'user', content: msg }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: getContext(boardData, todayJournal),
          messages: next.map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.find(b => b.type === 'text')?.text
        || "I'm here. Tell me more about what's going on."
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: "Something went wrong on my end. Try again in a moment." }])
    }
    setLoading(false)
  }

  /* ── Drag to move ── */
  function startDrag(e) {
    dragging.current = true
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      bottom: pos.bottom,
      right: pos.right,
    }
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', stopDrag)
  }
  function onDrag(e) {
    if (!dragging.current) return
    const dx = dragStart.current.x - e.clientX
    const dy = dragStart.current.y - e.clientY
    setPos({
      right:  Math.max(8, dragStart.current.right  + dx),
      bottom: Math.max(8, dragStart.current.bottom + dy),
    })
  }
  function stopDrag() {
    dragging.current = false
    window.removeEventListener('mousemove', onDrag)
    window.removeEventListener('mouseup',   stopDrag)
  }

  function clearChat() {
    if (window.confirm('Clear your conversation with Sage?')) {
      setMessages([])
      localStorage.removeItem('phasr_sage')
    }
  }

  const bubbleSize = 52

  return (
    <>
      {/* ── Floating bubble ── */}
      <div
        onMouseDown={startDrag}
        style={{
          position: 'fixed',
          bottom: pos.bottom,
          right:  pos.right,
          zIndex: 9998,
          cursor: dragging.current ? 'grabbing' : 'grab',
          userSelect: 'none',
        }}
      >
        <button
          onClick={e => { if (!dragging.current) { e.stopPropagation(); handleOpen() } }}
          title="Open Sage — your AI coach"
          style={{
            width: bubbleSize, height: bubbleSize, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(232,64,122,0.45)',
            transition: 'transform 0.25s',
            transform: open ? 'scale(0.88)' : 'scale(1)',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.transform = 'scale(1.08)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.transform = 'scale(1)' }}
        >
          {/* Wordmark instead of emoji */}
          <span style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: '0.78rem',
            color: '#fff', letterSpacing: '0.03em',
          }}>SAGE</span>
        </button>
      </div>

      {/* ── Coach panel ── */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          bottom: pos.bottom + bubbleSize + 10,
          right:  pos.right,
          zIndex: 9997,
          width: 360,
          maxWidth: 'calc(100vw - 24px)',
          height: 520,
          maxHeight: 'calc(100vh - 100px)',
          background: 'var(--coach-bg)',
          borderRadius: 24,
          border: '1px solid var(--app-border)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 4px 20px rgba(232,64,122,0.1)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          transform: open ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.95)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'all' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div style={{
          background: 'var(--coach-header)',
          padding: '0.85rem 1rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            border: '2px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800, fontSize: '0.72rem',
            color: '#fff', letterSpacing: '0.03em', flexShrink: 0,
          }}>SAGE</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Sage</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.72)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7fff7f', display: 'inline-block' }}/>
              Your AI Life Coach
            </p>
          </div>
          <button onClick={clearChat} style={{
            background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: 6,
            color: 'rgba(255,255,255,0.75)', fontSize: '0.68rem', cursor: 'pointer',
            padding: '0.2rem 0.5rem', fontFamily: "'DM Sans', sans-serif",
          }}>Clear</button>
          <button onClick={() => setOpen(false)} style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)', border: 'none',
            color: '#fff', fontSize: '1rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* Messages */}
        <div
          ref={msgsRef}
          style={{
            flex: 1, overflowY: 'auto', padding: '0.5rem 0',
            display: 'flex', flexDirection: 'column', gap: '0.2rem',
          }}
        >
          {messages.length === 0 ? (
            <>
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <p style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: 'italic', fontSize: '0.95rem',
                  color: 'var(--app-accent)', marginBottom: '0.5rem',
                }}>Your coach is ready.</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>
                  Ask anything. Sage has context on your goals.
                </p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0 1rem 0.5rem' }}>
                {QUICK_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => send(p)}
                    style={{
                      padding: '0.35rem 0.85rem', borderRadius: 99,
                      border: '1.5px solid var(--app-border)',
                      background: 'var(--app-bg2)',
                      color: 'var(--app-accent)', fontSize: '0.74rem', fontWeight: 500,
                      cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.target.style.background = 'var(--app-border)' }}
                    onMouseLeave={e => { e.target.style.background = 'var(--app-bg2)' }}
                  >{p}</button>
                ))}
              </div>
            </>
          ) : (
            messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-end', gap: '0.55rem',
                  padding: '0.3rem 0.85rem',
                }}
              >
                {m.role === 'assistant' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--coach-header)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800, fontSize: '0.55rem', color: '#fff',
                    flexShrink: 0, marginBottom: 2,
                  }}>S</div>
                )}
                <div style={{
                  maxWidth: '78%', padding: '0.65rem 0.95rem',
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user'
                    ? 'var(--coach-user-msg)'
                    : '#fff',
                  color: m.role === 'user' ? '#fff' : 'var(--app-text)',
                  fontSize: '0.84rem', lineHeight: 1.65,
                  boxShadow: m.role === 'user'
                    ? '0 2px 12px rgba(232,64,122,0.25)'
                    : '0 2px 8px rgba(0,0,0,0.05)',
                  border: m.role === 'assistant' ? '1px solid var(--app-border)' : 'none',
                }}>
                  {m.content.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < m.content.split('\n').length - 1 ? <br/> : ''}</span>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.55rem', padding: '0.3rem 0.85rem' }}>
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'var(--coach-header)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.55rem',
                color: '#fff', flexShrink: 0,
              }}>S</div>
              <div style={{
                padding: '0.65rem 0.95rem',
                borderRadius: '18px 18px 18px 4px',
                background: '#fff', border: '1px solid var(--app-border)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <TypingDots />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{
          flexShrink: 0, borderTop: '1px solid var(--app-border)',
          padding: '0.7rem', background: '#fff',
          display: 'flex', alignItems: 'flex-end', gap: '0.55rem',
        }}>
          <textarea
            ref={inputRef}
            value={input}
            placeholder="Talk to Sage..."
            rows={1}
            onChange={e => {
              setInput(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
            }}
            style={{
              flex: 1, border: '1.5px solid var(--app-border)', borderRadius: 16,
              padding: '0.5rem 0.8rem', fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.84rem', color: 'var(--app-text)', outline: 'none',
              resize: 'none', maxHeight: 100, overflowY: 'auto', lineHeight: 1.5,
              background: '#fff', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = 'var(--app-accent)' }}
            onBlur={e  => { e.target.style.borderColor = 'var(--app-border)' }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: 'none',
              background: 'var(--coach-bubble-bg)',
              color: '#fff', fontSize: '0.9rem', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'all 0.2s',
              opacity: (!input.trim() || loading) ? 0.5 : 1,
              boxShadow: '0 2px 10px rgba(232,64,122,0.3)',
            }}
          >→</button>
        </div>
      </div>

      <style>{`
        @keyframes sageDot {
          0%,80%,100% { transform:scale(0.6);opacity:.4 }
          40%          { transform:scale(1);  opacity:1   }
        }
      `}</style>
    </>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', height: 16 }}>
      {[0, 0.2, 0.4].map((delay, i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--app-accent)',
          animation: `sageDot 1.2s infinite ${delay}s`,
          display: 'inline-block',
        }}/>
      ))}
    </div>
  )
}
