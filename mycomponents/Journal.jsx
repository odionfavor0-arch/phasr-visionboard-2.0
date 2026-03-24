// src/components/Journal.jsx
// ─────────────────────────────────────────────
// Journal — page-by-page book navigation
// "Log things you don't want to lose"
// Surfaces old entries when user is slipping
// Memory + feedback loop, not emotional dumping
// ─────────────────────────────────────────────

import { useState, useEffect } from 'react'

const DAILY_PROMPTS = [
  "What did you learn today that you don't want to forget?",
  "What mistake should you not repeat?",
  "What worked today?",
  "What almost stopped you — and how did you push through?",
  "What decision are you proud of today?",
  "What are you pretending not to know?",
  "What moved the needle on your goals today?",
  "What would your future self say about today?",
  "What did you protect that mattered?",
  "One thing you will do differently tomorrow.",
]

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function getPromptOfDay() {
  const day = Math.floor(Date.now() / 86400000)
  return DAILY_PROMPTS[day % DAILY_PROMPTS.length]
}

function loadEntries() {
  try { return JSON.parse(localStorage.getItem('phasr_journal') || '[]') } catch { return [] }
}

function saveEntries(entries) {
  localStorage.setItem('phasr_journal', JSON.stringify(entries))
}

function getStreak() {
  const entries = loadEntries()
  if (entries.length === 0) return 0
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  let streak = 0
  let current = new Date()
  current.setHours(0, 0, 0, 0)
  for (const e of sorted) {
    const d = new Date(e.date + 'T12:00:00')
    d.setHours(0, 0, 0, 0)
    const diff = (current - d) / 86400000
    if (diff <= 1) { streak++; current = d } else break
  }
  return streak
}

// Detect if user is slipping (no entry yesterday or day before)
function isSlipping(entries) {
  if (entries.length < 2) return false
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const hasYesterday = entries.some(e => e.date === yesterday)
  const hasToday = entries.some(e => e.date === today)
  return !hasToday && !hasYesterday
}

// Find a relevant past entry to surface
function getSurfacedEntry(entries) {
  if (entries.length < 3) return null
  // Find an entry from 3-10 days ago with a win or learning
  const cutoff = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)
  const old = entries.filter(e => e.date <= cutoff && (e.worked || e.learned))
  if (old.length === 0) return null
  return old[Math.floor(Math.random() * Math.min(old.length, 5))]
}

export default function Journal({ user }) {
  const todayKey   = getTodayKey()
  const prompt     = getPromptOfDay()

  const [entries,  setEntries]  = useState(() => loadEntries())
  const [pageIdx,  setPageIdx]  = useState(0)  // 0 = today, 1,2,3... = past pages
  const [newEntry, setNewEntry] = useState(() => {
    const today = loadEntries().find(e => e.date === todayKey)
    return today || { date: todayKey, worked: '', learned: '', mistake: '', focus: '', freewrite: '' }
  })
  const [saved,    setSaved]    = useState(false)
  const [viewing,  setViewing]  = useState(null) // past entry being viewed full-screen

  const streak      = getStreak()
  const slipping    = isSlipping(entries)
  const surfaced    = slipping ? getSurfacedEntry(entries) : null
  const pastEntries = entries.filter(e => e.date !== todayKey).sort((a, b) => b.date.localeCompare(a.date))

  function updateField(key, val) {
    setNewEntry(prev => ({ ...prev, [key]: val }))
  }

  function saveToday() {
    const updated = entries.filter(e => e.date !== todayKey)
    const next = [...updated, { ...newEntry, date: todayKey }].sort((a, b) => b.date.localeCompare(a.date))
    setEntries(next)
    saveEntries(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Page count: today = page 1, past entries fill the rest
  const totalPages = 1 + pastEntries.length
  const currentPastEntry = pastEntries[pageIdx - 1]

  function goToPrev() { setPageIdx(i => Math.max(0, i - 1)) }
  function goToNext() { setPageIdx(i => Math.min(totalPages - 1, i + 1)) }

  const fieldStyle = {
    width: '100%', padding: '0.6rem 0.8rem',
    border: '1.5px solid var(--app-border)', borderRadius: 10,
    fontFamily: "'DM Sans', sans-serif", fontSize: '0.86rem',
    color: 'var(--app-text)', background: '#fff', outline: 'none',
    resize: 'vertical', lineHeight: 1.6, transition: 'border-color 0.2s',
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--app-text)', marginBottom: '0.3rem' }}>
            Journal
          </h1>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>
            Log things you don't want to lose.
          </p>
          {streak > 0 && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.32rem 1rem', borderRadius: 99, background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--streak-color)', marginTop: '0.6rem' }}>
              ⚡ {streak}-day writing streak
            </div>
          )}
        </div>

        {/* ── Slipping alert — surfaces an old entry ── */}
        {slipping && surfaced && (
          <div style={{ background: 'linear-gradient(135deg,#fff8f0,#fff3e8)', border: '1.5px solid #f5d9a0', borderRadius: 12, padding: '0.9rem 1.2rem', marginBottom: '1.2rem' }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#d4773a', marginBottom: '0.4rem' }}>
              From {new Date(surfaced.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — you wrote this:
            </p>
            {surfaced.worked && <p style={{ fontSize: '0.86rem', color: '#7a4a00', fontStyle: 'italic', lineHeight: 1.6 }}>"{surfaced.worked}"</p>}
            {surfaced.learned && <p style={{ fontSize: '0.86rem', color: '#7a4a00', fontStyle: 'italic', lineHeight: 1.6, marginTop: '0.25rem' }}>"{surfaced.learned}"</p>}
            <p style={{ fontSize: '0.78rem', color: '#d4773a', marginTop: '0.5rem', fontWeight: 600 }}>
              You said this worked. Why stop?
            </p>
          </div>
        )}

        {/* ── Book navigation bar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button
            onClick={goToPrev}
            disabled={pageIdx === 0}
            style={{ padding: '0.4rem 1rem', borderRadius: 99, border: '1.5px solid var(--app-border)', background: '#fff', color: 'var(--app-muted)', fontSize: '0.8rem', cursor: pageIdx === 0 ? 'not-allowed' : 'pointer', opacity: pageIdx === 0 ? 0.4 : 1, fontFamily: "'DM Sans', sans-serif" }}
          >← Newer</button>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-muted)' }}>
              {pageIdx === 0 ? 'Today' : currentPastEntry
                ? new Date(currentPastEntry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                : '—'
              }
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--app-border)', marginTop: '0.1rem' }}>
              Page {pageIdx + 1} of {totalPages}
            </p>
          </div>

          <button
            onClick={goToNext}
            disabled={pageIdx >= totalPages - 1}
            style={{ padding: '0.4rem 1rem', borderRadius: 99, border: '1.5px solid var(--app-border)', background: '#fff', color: 'var(--app-muted)', fontSize: '0.8rem', cursor: pageIdx >= totalPages - 1 ? 'not-allowed' : 'pointer', opacity: pageIdx >= totalPages - 1 ? 0.4 : 1, fontFamily: "'DM Sans', sans-serif" }}
          >Older →</button>
        </div>

        {/* ── Page content ── */}
        <div style={{ background: '#fff', borderRadius: 20, border: '1px solid var(--app-border)', boxShadow: '0 4px 24px rgba(233,100,136,0.08)', overflow: 'hidden' }}>

          {/* Page header */}
          <div style={{ background: 'linear-gradient(135deg, var(--app-bg2), #fff)', borderBottom: '1px solid var(--app-border)', padding: '1.1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.05rem', fontWeight: 600, color: 'var(--app-accent)', marginBottom: '0.1rem' }}>
                {pageIdx === 0 ? 'Today' : currentPastEntry
                  ? new Date(currentPastEntry.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
                  : '—'
                }
              </p>
              {pageIdx === 0 && (
                <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--app-muted)' }}>
                  {prompt}
                </p>
              )}
            </div>
            <span style={{ fontSize: '1.2rem', opacity: 0.6 }}>📖</span>
          </div>

          {/* Page body */}
          <div style={{ padding: '1.3rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pageIdx === 0 ? (
              /* ── Today's entry form ── */
              <>
                {[
                  { key: 'worked',    label: 'What worked today?',                    placeholder: 'Something that moved the needle...',      rows: 3 },
                  { key: 'learned',   label: 'What did you learn today?',             placeholder: 'Something you don\'t want to forget...',   rows: 3 },
                  { key: 'mistake',   label: 'What mistake should you not repeat?',   placeholder: 'Be honest — what went wrong?',             rows: 2 },
                  { key: 'focus',     label: 'Tomorrow\'s one focus',                 placeholder: 'The one thing that matters most...',        rows: 2 },
                  { key: 'freewrite', label: 'Free entry',                            placeholder: 'Anything else you don\'t want to lose...', rows: 4 },
                ].map(({ key, label, placeholder, rows }) => (
                  <div key={key}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-muted)', marginBottom: '0.4rem' }}>{label}</p>
                    <textarea
                      rows={rows} value={newEntry[key]} placeholder={placeholder}
                      onChange={e => updateField(key, e.target.value)}
                      style={{ ...fieldStyle }}
                      onFocus={e => { e.target.style.borderColor = 'var(--app-accent)' }}
                      onBlur={e  => { e.target.style.borderColor = 'var(--app-border)' }}
                    />
                  </div>
                ))}

                <button
                  onClick={saveToday}
                  style={{
                    width: '100%', padding: '0.85rem', borderRadius: 12, border: 'none',
                    background: saved ? 'linear-gradient(135deg,#65c47c,#3da85a)' : 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                    color: '#fff', fontSize: '0.9rem', fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                    boxShadow: '0 4px 16px rgba(233,100,136,0.25)',
                    transition: 'background 0.3s',
                  }}
                >
                  {saved ? 'Saved' : 'Save Entry'}
                </button>
              </>
            ) : currentPastEntry ? (
              /* ── Past entry read-only ── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {[
                  { key: 'worked',    label: 'What worked'    },
                  { key: 'learned',   label: 'What I learned' },
                  { key: 'mistake',   label: 'Mistake to avoid' },
                  { key: 'focus',     label: 'Tomorrow\'s focus' },
                  { key: 'freewrite', label: 'Notes'          },
                ].filter(({ key }) => currentPastEntry[key]).map(({ key, label }) => (
                  <div key={key}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-muted)', marginBottom: '0.35rem' }}>{label}</p>
                    <p style={{ fontSize: '0.88rem', color: 'var(--app-text)', lineHeight: 1.7, background: 'var(--app-bg2)', borderRadius: 10, padding: '0.6rem 0.85rem', border: '1px solid var(--app-border)' }}>
                      {currentPastEntry[key]}
                    </p>
                  </div>
                ))}
                {!Object.values(currentPastEntry).some(v => v && v !== currentPastEntry.date) && (
                  <p style={{ color: 'var(--app-muted)', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No content saved for this day.</p>
                )}
              </div>
            ) : (
              <p style={{ color: 'var(--app-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem', fontStyle: 'italic' }}>No entry here.</p>
            )}
          </div>
        </div>

        {/* ── Page dots (up to 7) ── */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.4rem', marginTop: '1.2rem', flexWrap: 'wrap' }}>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const idx = totalPages <= 7 ? i : (i === 0 ? 0 : totalPages - 7 + i)
              return (
                <button
                  key={i}
                  onClick={() => setPageIdx(idx)}
                  style={{
                    width: pageIdx === idx ? 22 : 8, height: 8, borderRadius: 99,
                    background: pageIdx === idx ? 'var(--app-accent)' : 'var(--app-border)',
                    border: 'none', cursor: 'pointer', padding: 0,
                    transition: 'all 0.2s',
                  }}
                />
              )
            })}
          </div>
        )}

        {/* ── Entry count ── */}
        {entries.length > 0 && (
          <p style={{ textAlign: 'center', marginTop: '1.2rem', fontSize: '0.78rem', color: 'var(--app-muted)' }}>
            {entries.length} {entries.length === 1 ? 'entry' : 'entries'} logged
          </p>
        )}

      </div>
    </div>
  )
}
