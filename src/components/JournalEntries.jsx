import { useEffect, useMemo, useRef, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'

const STORAGE_KEY = 'phasr_journal_v2'
const LEGACY_STORAGE_KEY = 'phasr_journal'

function safeRead(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function buildEntryTitle(transcript) {
  const clean = String(transcript || '').trim().replace(/\s+/g, ' ')
  if (!clean) return 'Untitled reflection'
  const firstSentence = clean.split(/[.!?]/).map(part => part.trim()).find(Boolean) || clean
  const words = firstSentence.split(' ').filter(Boolean).slice(0, 6).join(' ')
  return words.length > 40 ? `${words.slice(0, 37)}...` : words
}

function normalizeTranscript(raw) {
  const text = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()
  if (!text) return ''
  return text
    .split(/([.!?]\s+)/)
    .map(part => {
      if (/[.!?]\s+/.test(part)) return part
      const trimmed = part.trim()
      if (!trimmed) return trimmed
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildSummary(transcript) {
  const clean = String(transcript || '').trim().replace(/\s+/g, ' ')
  if (!clean) return ''
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map(part => part.trim())
    .filter(Boolean)

  if (sentences.length <= 2 && clean.length <= 260) return clean
  if (sentences.length > 2) {
    const first = sentences[0]
    const middle = sentences[Math.floor(sentences.length / 2)]
    const last = sentences[sentences.length - 1]
    const summary = [first, middle, last]
      .filter(Boolean)
      .filter((sentence, index, list) => list.indexOf(sentence) === index)
      .join(' ')
    if (summary.length <= 260) return summary
  }
  const clipped = clean.split(' ').slice(0, 48).join(' ')
  return clipped.length < clean.length ? `${clipped}...` : clipped
}

function detectTags(transcript) {
  const text = String(transcript || '').toLowerCase()
  const tags = []
  if (/stress|overwhelm|pressure|burned out|tired|anxious/.test(text)) tags.push('stress')
  if (/avoid|procrastin|delay|put off|dodg/.test(text)) tags.push('avoidance')
  if (/task|done|finish|ship|progress|work/.test(text)) tags.push('productivity')
  if (/clear|clarity|focus|understand|plan/.test(text)) tags.push('clarity')
  if (/decide|decision|choice|unsure|commit/.test(text)) tags.push('decision')
  return tags.length ? tags : ['clarity']
}

function buildScore(transcript, tags) {
  const words = String(transcript || '').trim().split(/\s+/).filter(Boolean).length
  let score = 7
  if (tags.includes('stress')) score -= 2
  if (tags.includes('avoidance')) score -= 2
  if (words > 120) score -= 1
  if (tags.includes('clarity')) score += 1
  if (tags.includes('productivity')) score += 1
  const safeScore = Math.max(1, Math.min(10, score))
  const explanation =
    safeScore <= 3 ? 'low control, high stress'
      : safeScore <= 5 ? 'mixed clarity, uneven momentum'
        : safeScore <= 7 ? 'steady progress, some friction'
          : 'clear direction, strong control'
  return `Score: ${safeScore}/10 - ${explanation}`
}

function buildInsight(tags) {
  if (tags.includes('avoidance')) return 'You delay tasks when they feel unclear.'
  if (tags.includes('stress')) return 'Your stress rises when too many priorities compete at once.'
  if (tags.includes('decision')) return 'You lose momentum when decisions stay open too long.'
  if (tags.includes('productivity')) return 'You feel better when your work has one visible next step.'
  return 'You move faster when the next action is obvious.'
}

function buildActions(transcript, tags) {
  const text = String(transcript || '').toLowerCase()
  if (/study|exam|test|assignment|class|school/.test(text)) {
    return ['Pick one study block and finish it before you open anything else.']
  }
  if (tags.includes('productivity') || /task|deadline|project|work|career|business/.test(text)) {
    return ['Open Daily Streaks and finish the next checklist item waiting for you.']
  }
  if (/content|post|video|edit|script|record/.test(text)) {
    return ['Write or record the first 10 minutes of the content so the rest feels easier.']
  }
  if (/goal|vision|phase|timeline|pillar/.test(text)) {
    return ['Go back to Vision Board and tighten one goal into the next weekly move.']
  }
  if (/money|debt|budget|bills|income|savings/.test(text)) {
    return ['Review your next expense and move one item into a simple budget today.']
  }
  if (tags.includes('avoidance')) {
    return ['Choose the one thing you have been avoiding and finish the first small piece of it today.']
  }
  if (tags.includes('stress')) {
    return ['Reduce today to one manageable win and protect your energy before adding more.']
  }
  if (/sleep|rest|tired|exhausted/.test(text)) {
    return ['Pick one recovery action first, then return to your priorities.']
  }
  if (/relationship|friend|family|partner|mother|father|love|argument/.test(text)) {
    return ['Send one honest message or start one calm conversation today instead of holding it in.']
  }
  if (/sleep|energy|health|gym|body|food|water/.test(text)) {
    return ['Take one body-supporting action today before you push harder.']
  }
  if (tags.includes('clarity') || tags.includes('decision')) {
    return ['Open Sage and map out your next move before you act on it.']
  }
  return ['Write the next action in one sentence, then do it within 10 minutes.']
}

function buildSageResponse(transcript, tags, actions) {
  const text = String(transcript || '').toLowerCase()
  const step = actions?.[0] || 'Write the next action in one sentence, then do it within 10 minutes.'
  if (/relationship|friend|family|partner|mother|father|love|argument/.test(text)) {
    return `What you said sounds emotionally heavy, and it makes sense that it is sitting with you. Be honest, be calm, and take this next step: ${step}`
  }
  if (/task|deadline|project|work|career|business/.test(text)) {
    return `You are carrying pressure, but there is still a clear way forward. Let Sage guide you with one move inside Phasr: ${step}`
  }
  if (tags.includes('stress')) {
    return `You sound stretched, not lazy. Slow it down and protect your energy with this next step: ${step}`
  }
  if (tags.includes('avoidance')) {
    return `You already know what matters here, you just need a cleaner entry point. Start with this: ${step}`
  }
  if (tags.includes('clarity') || tags.includes('decision')) {
    return `You are closer to clarity than it feels right now. Use this next step to make the situation simpler: ${step}`
  }
  return `What you shared matters, and there is a useful next move here. Start with this: ${step}`
}

function analyzeTranscript(transcript) {
  const clean = normalizeTranscript(transcript)
  const tags = detectTags(clean)
  const actions = buildActions(clean, tags)
  return {
    title: buildEntryTitle(clean),
    summary: buildSummary(clean),
    score: buildScore(clean, tags),
    insight: buildInsight(tags),
    actions,
    sageResponse: buildSageResponse(clean, tags, actions),
  }
}

function loadEntries() {
  const modern = safeRead(STORAGE_KEY, null)
  if (Array.isArray(modern)) return modern

  const legacy = safeRead(LEGACY_STORAGE_KEY, [])
  if (!Array.isArray(legacy)) return []

  return legacy.map((entry, index) => {
    const transcript = [entry.worked, entry.learned, entry.mistake, entry.focus, entry.freewrite].filter(Boolean).join(' ')
    return {
      id: `${entry.date}-${index}`,
      date: entry.date,
      createdAt: entry.date,
      title: buildEntryTitle(transcript),
      transcript,
      summary: entry.learned || entry.worked || 'Reflection saved.',
      score: entry.score || 'Score: 5/10 - mixed clarity',
      actions: entry.focus ? [entry.focus] : [],
    }
  })
}

function formatDateLabel(value) {
  const date = new Date(`${(value || '').slice(0, 10)}T12:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTimeLabel(value) {
  const raw = value || ''
  const date = new Date(raw.includes('T') ? raw : `${raw.slice(0, 10)}T12:00:00`)
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function JournalEntries({ onBack }) {
  const [entries, setEntries] = useState(() =>
    loadEntries().sort((a, b) => String(b.createdAt || b.date).localeCompare(String(a.createdAt || a.date)))
  )
  const [activeId, setActiveId] = useState(entries[0]?.id || null)
  const [revealedEntryDeleteId, setRevealedEntryDeleteId] = useState(null)
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [draftTranscript, setDraftTranscript] = useState('')
  const [showAllEntries, setShowAllEntries] = useState(false)
  const [expandedDetail, setExpandedDetail] = useState(false)
  const [expandedSage, setExpandedSage] = useState(false)
  const fullContentRef = useRef(null)
  const editTextareaRef = useRef(null)
  const activeEntry = entries.find(entry => entry.id === activeId) || entries[0] || null
  const entriesToRender = showAllEntries ? entries : entries.slice(0, 4)
  const detailTranscript = String(activeEntry?.transcript || '')
  const detailIsLong = detailTranscript.length > 220
  const sageText = String(activeEntry?.sageResponse || '')
  const sageIsLong = sageText.length > 220

  function startEdit(entry) {
    if (!entry) return
    setActiveId(entry.id)
    setEditingEntryId(entry.id)
    setDraftTranscript(entry.transcript || '')
    setTimeout(() => {
      fullContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      editTextareaRef.current?.focus()
    }, 140)
  }

  function cancelEdit() {
    setEditingEntryId(null)
    setDraftTranscript('')
  }

  function saveEdit() {
    if (!activeEntry) return
    const normalized = normalizeTranscript(draftTranscript || '')
    const computed = analyzeTranscript(normalized)
    const nextEntries = entries.map(entry =>
      entry.id === activeEntry.id
        ? {
          ...entry,
          transcript: normalized,
          title: computed.title,
          summary: computed.summary,
          score: computed.score,
          insight: computed.insight,
          actions: computed.actions,
          sageResponse: computed.sageResponse,
        }
        : entry
    )
    setEntries(nextEntries)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
    setEditingEntryId(null)
    setDraftTranscript('')
  }

  function deleteEntry(entryId) {
    if (!window.confirm('Delete this journal entry?')) return
    const nextEntries = entries.filter(entry => entry.id !== entryId)
    setEntries(nextEntries)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextEntries))
    if (activeId === entryId) {
      setActiveId(nextEntries[0]?.id || null)
    }
  }

  useEffect(() => {
    setExpandedDetail(false)
    setExpandedSage(false)
  }, [activeId])

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#ffffff', padding: '1.25rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.9rem,4vw,2.7rem)', color: '#2e1e28' }}>All journal entries</h1>
          </div>
          <button
            onClick={onBack}
            style={{ minHeight: 44, borderRadius: 14, border: '1px solid #efd6de', background: '#fff7fa', color: '#7a4c61', padding: '0.75rem 1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
          >
            Back to Journal
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{ background: '#f7f1f3', borderRadius: 24, padding: '1rem', display: 'grid', gap: '0.75rem' }}>
            {entriesToRender.map(entry => (
              <div
                key={entry.id}
                onMouseEnter={() => setRevealedEntryDeleteId(entry.id)}
                onMouseLeave={() => setRevealedEntryDeleteId(current => current === entry.id ? null : current)}
                onTouchStart={() => setRevealedEntryDeleteId(entry.id)}
                style={{
                  width: '100%',
                  borderRadius: 18,
                  border: activeId === entry.id ? '1px solid rgba(255,95,149,0.42)' : '1px solid #efd6de',
                  background: activeId === entry.id ? 'rgba(255,95,149,0.1)' : '#fff',
                  padding: '0.9rem 1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                  <button
                    type="button"
                    onClick={() => setActiveId(entry.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                      <p style={{ margin: 0, fontWeight: 800, color: '#2e1e28' }}>{entry.title || 'Untitled reflection'}</p>
                    </div>
                    <p style={{ margin: '0 0 0.35rem', color: '#5f4450', fontSize: '0.84rem', lineHeight: 1.6 }}>{entry.summary || 'No summary yet.'}</p>
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.7rem', marginTop: '0.45rem' }}>
                      <span style={{ color: '#8d7480', fontSize: '0.78rem' }}>{formatDateTimeLabel(entry.createdAt || entry.date)}</span>
                    </div>
                  </button>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: 2 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(entry.id)
                        startEdit(entry)
                      }}
                      aria-label="Edit entry"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: '1px solid transparent',
                        background: 'transparent',
                        color: '#b06d86',
                        cursor: 'pointer',
                        fontSize: '0.7rem',
                        lineHeight: 1,
                        flexShrink: 0,
                        opacity: revealedEntryDeleteId === entry.id ? 1 : 0,
                        pointerEvents: revealedEntryDeleteId === entry.id ? 'auto' : 'none',
                        transition: 'opacity 0.18s ease',
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEntry(entry.id)}
                      aria-label="Delete entry"
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 999,
                        border: '1px solid transparent',
                        background: 'transparent',
                        color: '#8d7480',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        lineHeight: 1,
                        flexShrink: 0,
                        opacity: revealedEntryDeleteId === entry.id ? 1 : 0,
                        pointerEvents: revealedEntryDeleteId === entry.id ? 'auto' : 'none',
                        transition: 'opacity 0.18s ease',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!entries.length && <p style={{ margin: 0, color: '#8d7480' }}>No entries yet.</p>}
            {entries.length > 4 && (
              <button
                onClick={() => setShowAllEntries(current => !current)}
                style={{
                  minHeight: 44,
                  borderRadius: 16,
                  border: '1px solid #f2b3c6',
                  background: '#fff',
                  color: '#c5537f',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {showAllEntries ? 'Show less' : 'See all entries'}
              </button>
            )}
          </div>

          <div style={{ background: '#f7f1f3', borderRadius: 24, padding: '1rem', minHeight: 420 }}>
            {activeEntry ? (
              <div style={{ display: 'grid', gap: '0.9rem' }}>
                <div>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b65f82' }}>
                    Details
                  </p>
                </div>
                {editingEntryId === activeEntry.id && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={saveEdit}
                      style={{ minHeight: 38, borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,#f65f96,#e0406a)', color: '#fff', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Save changes
                    </button>
                    <button
                      onClick={cancelEdit}
                      style={{ minHeight: 38, borderRadius: 999, border: '1px solid #efd6de', background: '#fff', color: '#7a4c61', padding: '0.5rem 1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                <div style={{ background: '#fff', border: '1px solid #efd6de', borderRadius: 18, padding: '0.95rem 1rem' }}>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2e1e28' }}>{activeEntry.title || 'Untitled reflection'}</p>
                  <p style={{ margin: '0.35rem 0 0', color: '#8d7480', fontSize: '0.82rem' }}>{formatDateLabel(activeEntry.date || activeEntry.createdAt)}</p>
                </div>
                <div style={{ background: '#fff', border: '1px solid #efd6de', borderRadius: 18, padding: '0.95rem 1rem' }}>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9b7a86' }}>Sage guidance</p>
                  <p
                    style={{
                      margin: 0,
                      color: '#5f4450',
                      lineHeight: 1.7,
                      display: '-webkit-box',
                      WebkitLineClamp: expandedSage ? 'unset' : 4,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {sageText || 'No Sage guidance yet.'}
                  </p>
                  {sageIsLong && (
                    <button
                      type="button"
                      onClick={() => setExpandedSage(current => !current)}
                      style={{
                        marginTop: '0.65rem',
                        border: '1px solid #f2b3c6',
                        background: '#fff',
                        color: '#c5537f',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 999,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {expandedSage ? 'View less' : 'View more'}
                    </button>
                  )}
                </div>
                <div style={{ background: '#fff', border: '1px solid #efd6de', borderRadius: 18, padding: '0.95rem 1rem' }}>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9b7a86' }}>Score</p>
                  <p style={{ margin: 0, color: '#5f4450', lineHeight: 1.7 }}>{activeEntry.score || 'Score: -'}</p>
                </div>
                <div ref={fullContentRef} style={{ background: '#fff', border: '1px solid #efd6de', borderRadius: 18, padding: '0.95rem 1rem' }}>
                  <p style={{ margin: '0 0 0.35rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9b7a86' }}>Full content</p>
                  {editingEntryId === activeEntry.id ? (
                    <textarea
                      rows={7}
                      value={draftTranscript}
                      onChange={event => setDraftTranscript(event.target.value)}
                      placeholder="Add to your entry..."
                      autoCorrect="on"
                      spellCheck
                      ref={editTextareaRef}
                      style={{ width: '100%', border: '1px solid #efd6de', borderRadius: 12, padding: '0.75rem 0.8rem', fontFamily: "'DM Sans', sans-serif", fontSize: '0.92rem', color: '#5f4450', lineHeight: 1.7, resize: 'vertical', background: '#fff' }}
                    />
                  ) : (
                    <>
                      <p
                        style={{
                          margin: 0,
                          color: '#5f4450',
                          lineHeight: 1.8,
                          display: '-webkit-box',
                          WebkitLineClamp: expandedDetail ? 'unset' : 4,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {detailTranscript || 'No full content yet.'}
                      </p>
                      {detailIsLong && (
                        <button
                          type="button"
                          onClick={() => setExpandedDetail(current => !current)}
                          style={{
                            marginTop: '0.65rem',
                            border: '1px solid #f2b3c6',
                            background: '#fff',
                            color: '#c5537f',
                            padding: '0.45rem 0.75rem',
                            borderRadius: 999,
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {expandedDetail ? 'View less' : 'View more'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <p style={{ margin: 0, color: '#8d7480' }}>Select an entry to view it.</p>
            )}
          </div>
        </div>

        <style>{`
          @media (max-width: 768px) {
            [style*="grid-template-columns: 0.92fr 1.08fr"] { grid-template-columns: 1fr !important; }
            button { min-height: 44px; }
          }
        `}</style>
      </div>
    </div>
  )
}
