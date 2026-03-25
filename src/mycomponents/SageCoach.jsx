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

function getContext(boardData, lockInState) {
  const phase = boardData?.phases?.find(p => p.id === boardData?.activePhaseId)
    || boardData?.phases?.[0]

  const pillarsText = phase?.pillars?.map(pl =>
    `Pillar: ${pl.name} | Goal: ${pl.afterState} | Weekly habits: ${pl.weeklyActions?.join(', ')}`
  ).join('\n') || ''

  const lockInText = lockInState
    ? `Lock In status: ${lockInState.modeLabel || 'Unknown'} | Current streak: ${lockInState.currentStreak || 0} | Sage level: ${lockInState.sageLevel || 'Sage'} | Today's task: ${lockInState.task || 'not set'}`
    : 'No Lock In entry today yet.'

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

${lockInText}

If asked for affirmations, give 2 to 3 that are tied to their specific goals, not generic inspiration.
If they share a struggle, acknowledge it first before offering a solution.
If they share a win, celebrate it without immediately pivoting to the next challenge.
If they seem stuck, ask one clear question instead of giving advice.
Every reply should end with a next action.
If Sage level is Sage, keep it short, simple, and focused on immediate execution.
If Sage level is Sage Boost, reduce friction using their own plan and break tasks into smaller steps.
If Sage level is Sage Pro, be sharper, reference patterns, and call out inconsistency when needed.`
}

export default function SageCoach({ boardData, lockInState }) {
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
          system: getContext(boardData, lockInState),
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
          cursor: 'grab',
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

