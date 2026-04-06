import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, LoaderCircle, Mic, Plus } from 'lucide-react'

const STORAGE_KEY = 'phasr_journal_entries'
const LEGACY_KEYS = ['phasr_journal_v2', 'phasr_journal']
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

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

function formatDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

function formatLongDate(dateKey) {
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function formatShortDate(dateKey) {
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
    })
  } catch {
    return dateKey
  }
}

function getPreview(content) {
  const clean = String(content || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'No content yet'
  return clean.length > 88 ? `${clean.slice(0, 88).trim()}...` : clean
}

function getWordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function fallbackTitle(content) {
  const clean = String(content || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'Untitled entry'
  const clipped = clean.split(' ').slice(0, 5).join(' ')
  return clipped.length > 42 ? `${clipped.slice(0, 42).trim()}...` : clipped
}

function fallbackMood(content) {
  const text = String(content || '').toLowerCase()
  if (/stress|overwhelm|pressure|panic|anxious|fear|confused/.test(text)) return { label: 'Stressed', score: 4 }
  if (/focus|clear|clarity|plan|steady|progress/.test(text)) return { label: 'Focused', score: 8 }
  if (/happy|joy|grateful|excited|energ/i.test(text)) return { label: 'Energised', score: 8 }
  if (/stuck|unclear|lost|unsure|confused/.test(text)) return { label: 'Confused', score: 5 }
  return { label: 'Calm', score: 7 }
}

function fallbackSageResponse(content) {
  const { label } = fallbackMood(content)
  if (label === 'Stressed') return 'There is a lot of pressure in this entry. Reduce today to one clear next move and protect your energy while you do it.'
  if (label === 'Focused') return 'You already have momentum here. Keep the next step visible and finish one thing before opening a new loop.'
  if (label === 'Confused') return 'The signal here is not missing, it is crowded. Shrink this down to one decision and one next action.'
  if (label === 'Energised') return 'This entry has life in it. Use that energy on one meaningful move so the momentum becomes real progress.'
  return 'You are more grounded than it feels. Stay with what matters most and let the next step stay simple.'
}

function normalizeEntryShape(entry) {
  const content = String(entry?.content || entry?.transcript || '').trim()
  const fallback = fallbackMood(content)
  return {
    id: entry?.id || Date.now(),
    date: entry?.date || formatDateKey(),
    title: String(entry?.title || fallbackTitle(content)).trim() || 'Untitled entry',
    content,
    clarityScore: Number(entry?.clarityScore || entry?.scoreValue || fallback.score),
    clarityLabel: String(entry?.clarityLabel || entry?.mood || fallback.label),
    sageResponse: String(entry?.sageResponse || entry?.insight || fallbackSageResponse(content)),
    prompt: String(entry?.prompt || 'What is on your mind?'),
  }
}

function loadEntries() {
  const current = safeRead(STORAGE_KEY, null)
  if (Array.isArray(current)) {
    return current.map(normalizeEntryShape).sort((a, b) => String(b.id).localeCompare(String(a.id)))
  }

  for (const legacyKey of LEGACY_KEYS) {
    const legacy = safeRead(legacyKey, null)
    if (Array.isArray(legacy) && legacy.length) {
      return legacy.map(normalizeEntryShape).sort((a, b) => String(b.id).localeCompare(String(a.id)))
    }
  }

  return []
}

async function callGroq(messages, system) {
  const groqKey = import.meta.env.VITE_GROQ_KEY || import.meta.env.VITE_GROQ_API_KEY
  if (!groqKey) throw new Error('missing_groq_key')

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.5,
      max_tokens: 550,
      messages: [
        { role: 'system', content: system },
        ...messages,
      ],
    }),
  })

  const data = await response.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

async function generateJournalInsight(content, existingTitle) {
  const clean = String(content || '').trim()
  const fallback = fallbackMood(clean)
  const fallbackPayload = {
    title: existingTitle || fallbackTitle(clean),
    clarityScore: fallback.score,
    clarityLabel: fallback.label,
    sageResponse: fallbackSageResponse(clean),
  }

  if (!clean) return fallbackPayload

  try {
    const raw = await callGroq(
      [{ role: 'user', content: clean }],
      `You are Sage inside Phasr.

Return JSON only with these exact keys:
- title
- clarityScore
- clarityLabel
- sageResponse

Rules:
- If the user already has a title, improve it only if needed.
- clarityScore must be an integer from 1 to 10.
- clarityLabel must be one word or short phrase like Calm, Focused, Stressed, Confused, Energised.
- sageResponse should be warm, direct, concise, and helpful.
- Do not include markdown fences.
- Do not include extra keys.`
    )

    const parsed = JSON.parse(
      String(raw || '')
        .replace(/^```json/i, '')
        .replace(/^```/i, '')
        .replace(/```$/i, '')
        .trim()
    )

    return {
      title: String(parsed?.title || existingTitle || fallbackPayload.title).trim() || fallbackPayload.title,
      clarityScore: Math.max(1, Math.min(10, Number(parsed?.clarityScore || fallbackPayload.clarityScore))),
      clarityLabel: String(parsed?.clarityLabel || fallbackPayload.clarityLabel).trim() || fallbackPayload.clarityLabel,
      sageResponse: String(parsed?.sageResponse || fallbackPayload.sageResponse).trim() || fallbackPayload.sageResponse,
    }
  } catch {
    return fallbackPayload
  }
}

function MoodBadge({ label, score }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '0.3rem 0.55rem',
        borderRadius: 999,
        background: '#fff1f6',
        color: '#e8407a',
        fontSize: '0.72rem',
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {label}
      <span style={{ color: '#7a5a66' }}>{score}/10</span>
    </span>
  )
}

export default function Journal() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('list')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [activeEntry, setActiveEntry] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(false)

  const recognitionRef = useRef(null)
  const baseContentRef = useRef('')
  const displayDate = useMemo(() => formatLongDate(formatDateKey()), [])
  const wordCount = getWordCount(draftContent)

  useEffect(() => {
    safeWrite(STORAGE_KEY, entries)
  }, [entries])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      baseContentRef.current = draftContent
      setIsRecording(true)
    }

    recognition.onresult = event => {
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0]?.transcript || ''
      }
      const nextText = `${baseContentRef.current}${baseContentRef.current ? ' ' : ''}${transcript}`.replace(/\s+/g, ' ').trim()
      setDraftContent(nextText)
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognition.onerror = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    setRecordingSupported(true)

    return () => {
      recognition.stop()
      recognitionRef.current = null
    }
  }, [draftContent])

  function openWriter() {
    setDraftTitle('')
    setDraftContent('')
    setScreen('write')
  }

  function toggleRecording() {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
      return
    }
    recognitionRef.current.start()
  }

  async function handleSaveEntry() {
    const content = String(draftContent || '').trim()
    if (!content) return

    const baseEntry = {
      id: Date.now(),
      date: formatDateKey(),
      title: String(draftTitle || '').trim() || fallbackTitle(content),
      content,
      clarityScore: null,
      clarityLabel: '',
      sageResponse: '',
      prompt: 'What is on your mind?',
    }

    setEntries(current => [baseEntry, ...current])
    setActiveEntry(baseEntry)
    setScreen('processing')

    const insight = await generateJournalInsight(content, String(draftTitle || '').trim())
    const finalEntry = {
      ...baseEntry,
      title: insight.title || baseEntry.title,
      clarityScore: insight.clarityScore,
      clarityLabel: insight.clarityLabel,
      sageResponse: insight.sageResponse,
    }

    setEntries(current => current.map(entry => (entry.id === baseEntry.id ? finalEntry : entry)))
    setActiveEntry(finalEntry)
    setScreen('detail')
  }

  function openEntry(entry) {
    setActiveEntry(entry)
    setScreen('detail')
  }

  if (screen === 'write') {
    return (
      <div style={{ minHeight: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1rem 0.8rem' }}>
          <button type="button" onClick={() => setScreen('list')} style={{ border: 'none', background: 'none', padding: 0, color: '#3d1f2b', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <button
            type="button"
            onClick={handleSaveEntry}
            style={{
              border: 'none',
              borderRadius: 999,
              background: 'linear-gradient(135deg, #e8407a, #f472a8)',
              color: '#fff',
              padding: '0.7rem 1rem',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Save entry
          </button>
        </div>

        <div style={{ padding: '0 1rem 0.5rem', fontSize: '0.78rem', color: '#9b7a86' }}>{displayDate}</div>

        <div style={{ padding: '0 1rem' }}>
          <input
            value={draftTitle}
            onChange={event => setDraftTitle(event.target.value)}
            placeholder="Title"
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: '2rem',
              lineHeight: 1.1,
              fontWeight: 700,
              color: '#3d1f2b',
              fontFamily: "'Playfair Display', serif",
              padding: '0.15rem 0 0.7rem',
            }}
          />
        </div>

        <div style={{ flex: 1, padding: '0 1rem' }}>
          <textarea
            value={draftContent}
            onChange={event => setDraftContent(event.target.value)}
            placeholder="Start writing..."
            style={{
              width: '100%',
              height: '100%',
              minHeight: 340,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              color: '#3d1f2b',
              fontSize: '1rem',
              lineHeight: 1.8,
              fontFamily: "'DM Sans', sans-serif",
              padding: '0.2rem 0 1rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem 1.2rem', borderTop: '1px solid #f6d9e3' }}>
          <span style={{ fontSize: '0.82rem', color: '#9b7a86' }}>{wordCount} words</span>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={!recordingSupported}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: 'none',
              background: 'none',
              color: recordingSupported ? '#e8407a' : '#d2b3bf',
              fontWeight: 700,
              cursor: recordingSupported ? 'pointer' : 'not-allowed',
              padding: 0,
            }}
          >
            <Mic size={18} />
            {isRecording ? 'Recording...' : 'Record'}
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'processing') {
    return (
      <div style={{ minHeight: '100%', background: '#fff', display: 'grid', placeItems: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 280 }}>
          <div style={{ width: 74, height: 74, margin: '0 auto 1rem', borderRadius: '50%', background: 'linear-gradient(135deg,#fff1f6,#ffe4ee)', display: 'grid', placeItems: 'center' }}>
            <LoaderCircle size={34} color="#e8407a" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.5rem', fontWeight: 700, color: '#3d1f2b' }}>Sage is reading your entry...</p>
          <p style={{ margin: '0.7rem 0 0', color: '#8e6b78', lineHeight: 1.7, fontSize: '0.95rem' }}>Finding your clarity score, mood, and the right response.</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (screen === 'detail' && activeEntry) {
    return (
      <div style={{ minHeight: '100%', background: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '1rem', borderBottom: '1px solid #f6d9e3' }}>
          <button type="button" onClick={() => setScreen('list')} style={{ border: 'none', background: 'none', padding: 0, color: '#3d1f2b', cursor: 'pointer' }}>
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#7a5a66' }}>{formatLongDate(activeEntry.date)}</span>
        </div>

        <div style={{ padding: '1.2rem 1rem 6rem' }}>
          <h1 style={{ margin: '0 0 0.9rem', fontFamily: "'Playfair Display', serif", fontSize: '1.55rem', lineHeight: 1.15, color: '#3d1f2b' }}>
            {activeEntry.title}
          </h1>
          <div style={{ color: '#3d1f2b', fontSize: '1rem', lineHeight: 1.95, whiteSpace: 'pre-wrap' }}>{activeEntry.content}</div>

          <div style={{ margin: '1.6rem 0', borderTop: '1px solid #f6d9e3' }} />

          <div style={{ marginBottom: '1.4rem' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8407a' }}>Clarity Score</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 18, background: '#fff7fa', border: '1px solid #f3ccd8' }}>
              <div style={{ width: 68, height: 68, borderRadius: '50%', border: '5px solid #f38eb0', display: 'grid', placeItems: 'center', color: '#3d1f2b', fontWeight: 800, fontSize: '1.1rem' }}>
                {activeEntry.clarityScore}/10
              </div>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', fontWeight: 700, color: '#3d1f2b' }}>{activeEntry.clarityLabel}</div>
                <div style={{ marginTop: 4, color: '#8e6b78', fontSize: '0.92rem' }}>How this entry feels right now.</div>
              </div>
            </div>
          </div>

          <div>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8407a' }}>Sage&apos;s Response</p>
            <div style={{ padding: '1rem 1rem 1.1rem', borderRadius: 18, background: 'linear-gradient(135deg,#fff1f6,#fff8fb)', border: '1px solid #f3ccd8', color: '#6f4554', lineHeight: 1.8, fontSize: '0.96rem' }}>
              {activeEntry.sageResponse}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', background: '#fff', padding: '0 0 6rem' }}>
      <div style={{ padding: '1.1rem 1rem 0.8rem' }}>
        <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.7rem', color: '#3d1f2b' }}>Journal</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: '0 1rem' }}>
        {entries.length ? entries.map(entry => (
          <button
            key={entry.id}
            type="button"
            onClick={() => openEntry(entry)}
            style={{
              border: '1px solid #f3ccd8',
              background: '#fff',
              borderRadius: 18,
              padding: '0.95rem 1rem',
              textAlign: 'left',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <span style={{ fontSize: '0.82rem', color: '#8e6b78', fontWeight: 700 }}>{formatShortDate(entry.date)}</span>
              <MoodBadge label={entry.clarityLabel} score={entry.clarityScore} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginTop: 10 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.08rem', fontWeight: 700, color: '#3d1f2b', lineHeight: 1.25 }}>{entry.title}</span>
            </div>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.88rem', color: '#9b7a86', lineHeight: 1.55 }}>{getPreview(entry.content)}</p>
          </button>
        )) : (
          <div style={{ border: '1px solid #f3ccd8', background: '#fff8fb', borderRadius: 18, padding: '1.1rem', color: '#8e6b78', lineHeight: 1.7 }}>
            Your entries will show here. Start with one honest page.
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={openWriter}
        style={{
          position: 'fixed',
          left: '50%',
          bottom: 18,
          transform: 'translateX(-50%)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: 'none',
          borderRadius: 999,
          background: 'linear-gradient(135deg, #e8407a, #f472a8)',
          color: '#fff',
          padding: '0.95rem 1.35rem',
          fontSize: '0.95rem',
          fontWeight: 800,
          boxShadow: '0 14px 28px rgba(232,64,122,0.26)',
          cursor: 'pointer',
        }}
      >
        <Plus size={18} />
        New entry
      </button>
    </div>
  )
}
