import { useEffect, useMemo, useRef, useState } from 'react'
import { Menu, Trash2, Volume2 } from 'lucide-react'

const STORAGE_KEY = 'phasr_journal_v2'
const LEGACY_STORAGE_KEY = 'phasr_journal'
const ACTIVE_TASK_KEY = 'phasr_journal_active_task'
const PROMPTS = ["What's on your mind?", 'What needs your attention today?']
const DEEP_KEYWORDS = ['overwhelmed', 'anxious', 'stressed', 'avoid', 'stuck', 'confused', 'pressure', 'burned out', 'scared', 'unclear']
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.1-8b-instant'
const INWORLD_API_KEY =
  import.meta.env.VITE_INWORLD_API_KEY ||
  (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : '') ||
  ''
const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice'
const INWORLD_TTS_MODEL = import.meta.env.VITE_INWORLD_TTS_MODEL || 'inworld-tts-1'
const INWORLD_TTS_VOICE = import.meta.env.VITE_INWORLD_TTS_VOICE || 'Eleanor'
const TRANSCRIPT_CLEANER_PROMPT =
  'You are a transcription cleaner. The following text was captured by voice recording and may contain mishearing errors, wrong words, and gibberish. Correct it into clean, natural English that preserves the original meaning and tone exactly. Do not add words, change the message, or summarize. Only fix transcription errors. Return only the corrected text with no explanation.'
const JOURNAL_COACH_PROMPT_OLD =
  "CRITICAL RULES — never break these. Always speak directly to the user using ‘you’ and ‘your.’ Never say ‘this person’ or ‘they’ or ‘their’ when referring to the user. The user is writing in their private journal. You are speaking directly to them, not describing them to someone else. Start your response by speaking to them directly. Example: ‘You are dealing with something real here.’ Never: ‘This person is dealing with something real.’ This is personal. Treat it that way.\n\n" +
  'You are a warm, sharp, emotionally intelligent best friend responding to a private journal entry: "{journal_text}".\nDo NOT summarize. Do NOT quote the entry. Do NOT use a formula. Do NOT use headings, steps, or numbered structure.\nWrite like a real person who listened. Sometimes it is two sentences. Sometimes a paragraph. Let the content decide.\nMatch the energy first. If it is playful, be playful. If it is heavy, be gentle and direct. If it is practical, be straight to the point.\nDo not force advice. If a suggestion fits, give one small, natural suggestion. If not, just be present.\nOnly ask a question if it genuinely opens something up. Otherwise, close with a line that lands.\nAvoid clinical phrases or coaching language. No frameworks, no templates.\nThe entry was written in a journal. Treat it with care.'

const JOURNAL_COACH_PROMPT = `You are Sage.

The user is writing in a private journal. You read what they wrote and respond directly as a sharp, caring, and honest best friend would - someone real, not a therapist, not a coach, and not a system following a structure.

Core behavior:
- Speak directly using "you" and "your."
- Respond to everything they wrote, moving naturally between topics if needed.
- Match the length to the entry. Keep it concise but complete. Do not overexplain.
- Let the content shape the response. No fixed structure or formula.
- Only ask a question if it genuinely adds value.

Answering:
- If there is a question, answer it directly and clearly.
- Have a real opinion. Agree, disagree, or add nuance - but say something meaningful.
- Do not delay answers with setup.

Tone:
- Warm, real, and grounded - like a best friend who tells the truth.
- Natural and conversational, not polished or clinical.
- No overexplaining. No "teaching mode."
- Avoid scripted phrases like:
  "it is likely that," "this is common," "you might consider," "if it feels comfortable," "taking a brave step."
- Do not perform enthusiasm (e.g., "I love that," "great question").

Continuation behavior:
- Treat the journal as something that can continue over multiple entries.
- Always prioritize and respond from the most recent part of what the user wrote, especially if they are continuing from a previous thought.
- Do not restart from the beginning or reprocess the entire history every time.
- Respond to the latest addition first, then naturally include anything earlier that still matters.
- If the user has written across multiple entries or updates, stay context-aware but grounded in the newest input.
- When appropriate (especially after multiple back-and-forth entries), briefly tie things together at the end with a light, natural synthesis - not a formal summary, just a few lines that connect the dots.

Critical constraints:
- Do not summarize or restate what the user wrote.
- Do not describe their thoughts back to them ("you mentioned," "it sounds like...").
- Do not follow predictable patterns (validate -> explain -> suggest -> close).
- Do not speak about the user in third person.

Judgment and honesty:
- If something is concerning, say it clearly.
- If something stands out as strong or real, acknowledge it specifically.
- If there are gaps or blind spots, point them out.
- If they are overwhelmed, meet them there first - do not rush into fixing.

Goal:
The user should feel like their best friend is reading along in real time and responding to where they are now - while still holding the bigger picture - not like they got a reset, over-explained, or templated reply.

MOST IMPORTANT RULES (override everything):

1. Have an actual opinion.
   Say what you really think. No filler.

2. Do not summarize.
   Skip recap. Go straight to your response.

3. Answer the real question.
   If there is one, answer it directly.

4. Do not perform enthusiasm.
   Be real, not overly positive.

5. Keep it tight.
   No overexplaining. Make your point and move on.

6. Push when needed.
   Challenge weak thinking. Acknowledge real growth with specificity.

7. Stay with where they are now.
   Prioritize the most recent writing. Do not reset to the beginning unless necessary.`

const JOURNAL_TITLE_SUMMARY_PROMPT =
  "You are a journal editor. Create a short title and a clear one to two sentence summary.\n" +
  "Title: 3 to 6 words. Summary: one or two sentences that capture the main takeaway clearly.\n" +
  "Do not quote the user. Do not add new facts. Return JSON only with keys: title, summary."
let activeJournalAudio = null
let activeJournalSpeechRequest = false

function getTodayKey() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateKey) {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

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

function getDisplayName(user) {
  const raw = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Your'
  const first = raw.split(/[.\s_-]+/).find(Boolean) || 'Your'
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}'s`
}

function buildEntryTitle(transcript) {
  const clean = transcript.trim().replace(/\s+/g, ' ')
  if (!clean) return 'Untitled reflection'
  const lower = clean.toLowerCase()
  if (/stress|overwhelm|pressure|burned out|anxious|tired/.test(lower)) return 'Pressure is building'
  if (/avoid|procrastin|delay|put off|dodg/.test(lower)) return 'Avoidance is getting in the way'
  if (/relationship|friend|family|partner|mother|father|love|argument/.test(lower)) return 'A relationship needs attention'
  if (/money|debt|budget|spend|income|finance/.test(lower)) return 'Money needs a steadier plan'
  if (/health|gym|energy|sleep|food|weight|body/.test(lower)) return 'Your body needs support'
  if (/task|project|deadline|work|career|business/.test(lower)) return 'A task needs clear action'
  if (/goal|vision|future|phase|plan/.test(lower)) return 'Your goal needs a clearer plan'
  if (/confused|unclear|stuck|decide|decision|choice/.test(lower)) return 'You need clearer direction'
  return 'A clearer next step is needed'
}

function buildSummary(transcript) {
  const clean = transcript.trim().replace(/\s+/g, ' ')
  if (!clean) return ''
  const sentences = clean
    .split(/(?<=[.!?])\s+|\n+/)
    .map(part => part.trim())
    .filter(Boolean)

  if (sentences.length <= 2 && clean.length <= 260) return `In short, ${clean}`

  const last = sentences[sentences.length - 1] || ''
  const first = sentences[0] || ''
  const middle = sentences[Math.floor(sentences.length / 2)] || ''
  const summary = [first, middle, last]
    .filter(Boolean)
    .filter((sentence, index, list) => list.indexOf(sentence) === index)
    .join(' ')

  if (summary.length <= 260) return `In summary, ${summary}`

  const clipped = clean.split(' ').slice(0, 48).join(' ')
  return `In summary, ${clipped}${clipped.length < clean.length ? '...' : ''}`
}

function normalizeTranscript(raw) {
  const text = String(raw || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?])/g, '$1')
    .trim()
  if (!text) return ''
  return text
    .split(/([.!?]\s+)/)
    .map((part, index) => {
      if (/[.!?]\s+/.test(part)) return part
      const trimmed = part.trim()
      if (!trimmed) return trimmed
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function loadEntries() {
  const entries = safeRead(STORAGE_KEY, null)
  if (Array.isArray(entries)) return entries

  const legacy = safeRead(LEGACY_STORAGE_KEY, [])
  if (!Array.isArray(legacy)) return []

  return legacy.map(entry => {
    const transcript = [entry.worked, entry.learned, entry.mistake, entry.focus, entry.freewrite].filter(Boolean).join(' ')
    return {
      id: `${entry.date}-legacy`,
      date: entry.date,
      createdAt: entry.date,
      title: buildEntryTitle(transcript),
      transcript,
      summary: entry.learned || entry.worked || 'Reflection saved.',
      score: 'Score: 5/10 - mixed clarity',
      insight: entry.mistake || 'You were trying to stay consistent.',
      actions: entry.focus ? [entry.focus, 'Do one small task now to build momentum.'] : ['Do one small task now to build momentum.', 'Reset the day with one simple action you can finish.'],
    }
  })
}

function saveEntries(entries) {
  safeWrite(STORAGE_KEY, entries)
}

function detectTags(transcript) {
  const text = transcript.toLowerCase()
  const tags = []
  if (/stress|overwhelm|pressure|burned out|tired|anxious/.test(text)) tags.push('stress')
  if (/avoid|procrastin|delay|put off|dodg/.test(text)) tags.push('avoidance')
  if (/task|done|finish|ship|progress|work/.test(text)) tags.push('productivity')
  if (/clear|clarity|focus|understand|plan/.test(text)) tags.push('clarity')
  if (/decide|decision|choice|unsure|commit/.test(text)) tags.push('decision')
  return tags.length ? tags : ['clarity']
}

function buildScore(transcript, tags) {
  const words = transcript.trim().split(/\s+/).filter(Boolean).length
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
  const text = transcript.toLowerCase()
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
  const text = transcript.toLowerCase()
  const step = actions?.[0] || 'Write the next action in one sentence, then do it within 10 minutes.'

  if (/relationship|friend|family|partner|mother|father|love|argument/.test(text)) {
    return `This sounds emotionally heavy. Be honest, be calm, and take this next step: ${step}`
  }
  if (/task|deadline|project|work|career|business/.test(text)) {
    return `You are carrying pressure, but there is still a clear way forward. Take this next step: ${step}`
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
  return `There is a useful next move here. Start with this: ${step}`
}

function buildFriendlyFallback(text) {
  const lower = String(text || '').toLowerCase()
  if (!lower.trim()) return 'You are here, and that matters. Say a little more when you are ready.'
  if (/excited|happy|joy|celebrat|party|birthday|love|grateful/.test(lower)) {
    return 'You sound excited and full of energy. I can feel that glow. What part are you most excited about right now?'
  }
  if (/tired|overwhelm|stress|anxious|pressure|burned out|exhausted/.test(lower)) {
    return 'You sound worn down and you have been carrying a lot. I am here with you. What is the one thing you want to feel less of today?'
  }
  if (/angry|mad|upset|frustrat|hurt/.test(lower)) {
    return 'You sound frustrated and it makes sense. You are not wrong for feeling that way. Do you want to let it out or do you want to make sense of it first?'
  }
  if (/confused|unclear|lost|stuck/.test(lower)) {
    return 'You sound unsure and that can be heavy. You do not have to solve it all at once. What feels like the smallest clear part of this right now?'
  }
  return 'You have a lot on your mind and you are still showing up. I am listening. What do you want to focus on most here?'
}

function analyzeTranscript(transcript) {
  const clean = normalizeTranscript(transcript)
  const lower = clean.toLowerCase()
  const tags = detectTags(clean)
  const actions = buildActions(clean, tags)
  return {
    title: buildEntryTitle(clean),
    summary: buildSummary(clean),
    score: buildScore(clean, tags),
    insight: buildInsight(tags),
    actions,
    sageResponse: buildSageResponse(clean, tags, actions),
    isDeep: clean.split(' ').filter(Boolean).length > 80 || DEEP_KEYWORDS.some(keyword => lower.includes(keyword)),
  }
}

function getPatternInsight(entries) {
  const recent = entries.slice(0, 5)
  if (recent.length < 3) return ''
  const lowScores = recent.filter(entry => /Score: [1-4]\//.test(entry.score || ''))
  if (lowScores.length >= 3) return 'Your recent entries have been heavier than usual.'
  return ''
}

function loadActiveTask() {
  return safeRead(ACTIVE_TASK_KEY, null)
}

function saveActiveTask(task) {
  safeWrite(ACTIVE_TASK_KEY, task)
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 18, padding: '0.85rem 0.9rem' }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.3rem' }}>{label}</p>
      <p style={{ color: 'var(--app-text)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>{value}</p>
    </div>
  )
}

export default function Journal({ user, onOpenEntries }) {
  const [entries, setEntries] = useState(() => loadEntries().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))
  const [reflectionsOpen, setReflectionsOpen] = useState(false)
  const [promptUsed, setPromptUsed] = useState('')
  const [transcript, setTranscript] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [saved, setSaved] = useState(false)
  const [activeTask, setActiveTask] = useState(() => loadActiveTask())
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(false)
  const [revealedEntryDeleteId, setRevealedEntryDeleteId] = useState(null)
  const [isCleaning, setIsCleaning] = useState(false)
  const [cleanedLabel, setCleanedLabel] = useState('')
  const lastCleanedRef = useRef('')
  const typingTimerRef = useRef(null)
  const textareaRef = useRef(null)
  const [activeEntryId, setActiveEntryId] = useState(null)

  const recognitionRef = useRef(null)
  const recordingBaseRef = useRef('')
  const displayName = getDisplayName(user)
  const patternInsight = useMemo(() => getPatternInsight(entries), [entries])
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).filter(Boolean).length : 0
  const activePrompt = promptUsed || PROMPTS[0]
  const showPrompts = !transcript.trim() && !isRecording

  async function callGroq(messages, system, model = GROQ_MODEL) {
    const groqKey = import.meta.env.VITE_GROQ_KEY || import.meta.env.VITE_GROQ_API_KEY
    if (!groqKey) throw new Error('missing_groq_key')
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 600,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
      }),
    })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content?.trim() || ''
  }

  function extractActionsFromResponse(responseText) {
    const lines = String(responseText || '').split(/\n+/).map(line => line.trim()).filter(Boolean)
    const bullets = lines.filter(line => /^[-•]/.test(line)).map(line => line.replace(/^[-•]\s*/, ''))
    if (bullets.length) return bullets.slice(0, 2)
    const sentences = String(responseText || '').split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
    if (!sentences.length) return []
    return sentences.slice(-2)
  }

  async function runSageAnalysis(text) {
    const systemPrompt = JOURNAL_COACH_PROMPT.replace('{journal_text}', text)
    let responseText = await callGroq([{ role: 'user', content: text }], systemPrompt, 'llama-3.3-70b-versatile')
    if (!responseText) {
      responseText = buildFriendlyFallback(text)
    }
    const actions = extractActionsFromResponse(responseText)
    setAnalysis(current => {
      const base = current || analyzeTranscript(text)
      return {
        ...base,
        sageResponse: responseText || base.sageResponse,
        actions: actions.length ? actions : base.actions,
      }
    })
    return {
      sageResponse: responseText || '',
      actions,
      title: buildEntryTitle(text),
      summary: buildSummary(text),
    }
  }

  async function runTitleSummary(text) {
    if (!import.meta.env.VITE_GROQ_KEY) {
      return {
        title: buildEntryTitle(text),
        summary: buildSummary(text),
      }
    }
    try {
      const raw = await callGroq([{ role: 'user', content: text }], JOURNAL_TITLE_SUMMARY_PROMPT, 'llama-3.3-70b-versatile')
      const cleaned = String(raw || '').trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
      const parsed = JSON.parse(cleaned)
      return {
        title: String(parsed.title || '').trim() || buildEntryTitle(text),
        summary: String(parsed.summary || '').trim() || buildSummary(text),
      }
    } catch {
      return {
        title: buildEntryTitle(text),
        summary: buildSummary(text),
      }
    }
  }

  async function runAutoCorrect(rawText) {
    const text = String(rawText || '').trim()
    const words = text.split(/\s+/).filter(Boolean).length
    if (words < 10) return text
    if (isCleaning) return text
    if (!import.meta.env.VITE_GROQ_KEY) return text
    if (lastCleanedRef.current === text) return text
    setIsCleaning(true)
    setCleanedLabel('cleaning')
    try {
      const cleaned = await callGroq(
        [{ role: 'user', content: text }],
        TRANSCRIPT_CLEANER_PROMPT,
        'llama-3.3-70b-versatile'
      )
      const finalText = cleaned || text
      lastCleanedRef.current = finalText
      setCleanedLabel('done')
      setTranscript(finalText)
      setAnalysis(analyzeTranscript(finalText))
      return finalText
    } catch (error) {
      setCleanedLabel('')
      return text
    } finally {
      setIsCleaning(false)
      setTimeout(() => setCleanedLabel(''), 2600)
    }
  }

  function speakJournalText(text) {
    const content = String(text || '').replace(/\s+/g, ' ').trim()
    if (!content || typeof window === 'undefined') return
    if (activeJournalSpeechRequest) return
    if (activeJournalAudio && !activeJournalAudio.paused) return
    if (!INWORLD_API_KEY) {
      console.error('Inworld TTS unavailable', 'missing_api_key')
      return
    }

    if (activeJournalAudio) {
      activeJournalAudio.pause()
      activeJournalAudio = null
    }

    activeJournalSpeechRequest = true
    void fetch(INWORLD_TTS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${INWORLD_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content,
        voiceId: INWORLD_TTS_VOICE,
        modelId: INWORLD_TTS_MODEL,
      }),
    })
      .then(async response => {
        if (!response.ok) {
          let errorMessage = ''
          try {
            const errorJson = await response.json()
            errorMessage = errorJson?.message || ''
          } catch {
            errorMessage = ''
          }
          console.error('Inworld TTS failed', response.status, errorMessage)
          throw new Error(`inworld_tts_failed_${response.status}${errorMessage ? `_${errorMessage}` : ''}`)
        }
        const data = await response.json()
        const audioContent = data?.audioContent
        if (!audioContent) throw new Error('inworld_tts_missing_audio')
        const binary = atob(audioContent)
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index)
        }
        const blob = new Blob([bytes], { type: 'audio/mpeg' })
        const audioUrl = URL.createObjectURL(blob)
        const audio = new Audio(audioUrl)
        activeJournalAudio = audio
        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          if (activeJournalAudio === audio) activeJournalAudio = null
        }
        audio.play().catch(() => {
          URL.revokeObjectURL(audioUrl)
          activeJournalAudio = null
          throw new Error('audio_play_failed')
        })
      })
      .catch(error => {
        console.error('Inworld TTS error', error?.message || error)
      })
      .finally(() => {
        activeJournalSpeechRequest = false
      })
  }

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => {
      setIsRecording(false)
      setTranscript(current => {
        const normalized = normalizeTranscript(current)
        setAnalysis(normalized ? analyzeTranscript(normalized) : null)
        runAutoCorrect(normalized)
        return normalized
      })
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onresult = event => {
      const heardText = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim()
      const nextTranscript = `${recordingBaseRef.current}${heardText}`.trim()
      setTranscript(nextTranscript)
      if (/i'm done|i am done|done recording|stop recording/.test(nextTranscript.toLowerCase())) recognition.stop()
    }

    recognitionRef.current = recognition
    setRecordingSupported(true)
    return () => recognition.stop()
  }, [])

  function startPrompt(prompt) {
    setPromptUsed(prompt)
    setTranscript(prompt)
    setAnalysis(null)
    recordingBaseRef.current = ''
  }

  function toggleRecording() {
    if (!recognitionRef.current) return
    if (isRecording) {
      recognitionRef.current.stop()
    } else {
      recordingBaseRef.current = transcript ? `${transcript.trim()} ` : ''
      recognitionRef.current.start()
    }
  }

  function handleTranscriptChange(value) {
    setTranscript(value)
    setCleanedLabel('')
    if (!value.trim()) {
      setPromptUsed('')
      recordingBaseRef.current = ''
    }
    if (value.trim()) setAnalysis(null)
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current)
    }
    typingTimerRef.current = setTimeout(() => {
      runAutoCorrect(value)
    }, 180000)
  }

  useEffect(() => {
    if (!textareaRef.current) return
    requestAnimationFrame(() => {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight
    })
  }, [transcript])

  function handleCommit(action) {
    const task = { action, date: getTodayKey(), source: 'journal' }
    setActiveTask(task)
    saveActiveTask(task)
  }

  async function saveEntry() {
    if (!transcript.trim()) return
    const normalized = normalizeTranscript(transcript)
    const corrected = await runAutoCorrect(normalized)
    const finalText = normalizeTranscript(corrected || normalized)
    setTranscript(finalText)
    const derived = analyzeTranscript(finalText)
    const titleSummary = await runTitleSummary(finalText)
    const entry = {
      id: activeEntryId || `${Date.now()}`,
      date: getTodayKey(),
      createdAt: new Date().toISOString(),
      transcript: finalText,
      promptUsed,
      ...derived,
      title: titleSummary.title,
      summary: titleSummary.summary,
      committedAction: activeTask?.date === getTodayKey() ? activeTask.action : null,
    }
    const nextEntries = activeEntryId
      ? entries.map(item => (item.id === activeEntryId ? { ...item, ...entry } : item))
      : [entry, ...entries].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    setEntries(nextEntries)
    saveEntries(nextEntries)
    setReflectionsOpen(false)
    setPromptUsed('')
    setAnalysis({
      ...derived,
      title: titleSummary.title,
      summary: titleSummary.summary,
    })
    recordingBaseRef.current = ''
    setSaved(true)
    setTimeout(() => setSaved(false), 2200)
    if (!activeEntryId) setActiveEntryId(entry.id)
    const sageResult = await runSageAnalysis(finalText)
    const finalTitle = sageResult?.title || titleSummary.title
    const finalSummary = sageResult?.summary || titleSummary.summary
    if (sageResult?.sageResponse) {
      const updatedEntries = activeEntryId
        ? nextEntries.map(item => (item.id === entry.id ? { ...item, sageResponse: sageResult.sageResponse, title: finalTitle, summary: finalSummary } : item))
        : [ { ...entry, sageResponse: sageResult.sageResponse, title: finalTitle, summary: finalSummary }, ...nextEntries.filter(item => item.id !== entry.id) ]
      setEntries(updatedEntries)
      saveEntries(updatedEntries)
      setAnalysis(current => ({
        ...current,
        sageResponse: sageResult.sageResponse,
        actions: sageResult.actions?.length ? sageResult.actions : current?.actions,
        title: finalTitle,
        summary: finalSummary,
      }))
    }
  }

  function updateEntryTitle(entryId, title) {
    const nextEntries = entries.map(entry => (entry.id === entryId ? { ...entry, title } : entry))
    setEntries(nextEntries)
    saveEntries(nextEntries)
  }

  function deleteEntry(entryId) {
    if (!window.confirm('Delete this journal entry?')) return
    const nextEntries = entries.filter(entry => entry.id !== entryId)
    setEntries(nextEntries)
    saveEntries(nextEntries)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.25rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '1320px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.2rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.65rem', textAlign: 'left' }}>
              {displayName} journal
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: 600, color: 'var(--app-text)', margin: 0, lineHeight: 1.2, textAlign: 'left' }}>
              Talk. Understand. Act.
            </h1>
          </div>

          <button
            onClick={() => {
              if (onOpenEntries) {
                onOpenEntries()
                return
              }
              setReflectionsOpen(open => !open)
            }}
            style={{ minHeight: 44, minWidth: 220, borderRadius: 14, border: '1px solid var(--app-border)', background: 'var(--app-bg2)', color: 'var(--app-text)', padding: '0.8rem 1rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}
          >
            <span>Entries</span>
            <Menu size={16} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.82fr', gap: '1rem', alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {showPrompts && (
              <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', gap: '0.8rem' }}>
                  <div style={{ flex: 1, borderRadius: 999, border: !promptUsed || promptUsed === PROMPTS[0] ? '1px solid color-mix(in srgb, var(--app-accent) 55%, transparent)' : '1px solid transparent', boxShadow: !promptUsed || promptUsed === PROMPTS[0] ? '0 0 18px color-mix(in srgb, var(--app-accent) 16%, transparent)' : 'none' }} />
                  <div style={{ flex: 1, borderRadius: 999, border: promptUsed === PROMPTS[1] ? '1px solid color-mix(in srgb, var(--app-accent) 55%, transparent)' : '1px solid transparent', boxShadow: promptUsed === PROMPTS[1] ? '0 0 18px color-mix(in srgb, var(--app-accent) 16%, transparent)' : 'none' }} />
                </div>
                {PROMPTS.map((prompt, index) => (
                  <button
                    key={prompt}
                    onClick={() => startPrompt(prompt)}
                    style={{
                      textAlign: 'center',
                      borderRadius: 999,
                      border: '1px solid rgba(255,255,255,0.04)',
                      background: promptUsed
                        ? prompt === promptUsed
                          ? 'linear-gradient(135deg, color-mix(in srgb, var(--app-accent) 28%, white), color-mix(in srgb, var(--app-accent2) 14%, white))'
                          : '#15111a'
                        : index === 0
                          ? 'linear-gradient(135deg, rgba(86,48,58,0.98), rgba(130,60,85,0.9))'
                          : 'linear-gradient(135deg, #15111a, #1d1620)',
                      backgroundSize: !promptUsed ? '180% 180%' : '100% 100%',
                      animation: !promptUsed ? 'journalPromptFloat 4s ease-in-out infinite' : 'none',
                      color: promptUsed
                        ? prompt === promptUsed
                          ? 'var(--app-accent)'
                          : 'rgba(255,255,255,0.72)'
                        : index === 0
                          ? 'color-mix(in srgb, var(--app-accent2) 72%, white)'
                          : 'rgba(255,255,255,0.72)',
                      padding: '0.88rem 1rem',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                      position: 'relative',
                      zIndex: 1,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            <div style={{ background: '#ffffff', border: '1px solid var(--app-border)', borderRadius: 28, overflow: 'hidden', boxShadow: '0 20px 38px rgba(31,23,48,0.08)' }}>
              <div style={{ padding: '1rem 1.15rem 0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--app-muted)', fontSize: '0.9rem', flexWrap: 'wrap', gap: '0.7rem' }}>
                <span>{formatDateLabel(getTodayKey())}</span>
                {showPrompts && <span style={{ color: 'var(--app-accent)', fontStyle: 'italic' }}>{activePrompt}</span>}
              </div>

              <div style={{ padding: '0 1.15rem 1.1rem' }}>
                <textarea
                  rows={10}
                  ref={textareaRef}
                  value={transcript}
                  onChange={event => handleTranscriptChange(event.target.value)}
                  placeholder="Hi, how are you doing today?"
                  autoCorrect="on"
                  spellCheck
                  style={{
                    width: '100%',
                    height: 320,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--app-text)',
                    fontSize: '1.05rem',
                    lineHeight: 1.9,
                    resize: 'none',
                    overflowY: 'auto',
                    scrollbarWidth: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                />
                {cleanedLabel === 'done' && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: '#b06d86' }}>Auto-corrected by Sage</p>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1e4ea', padding: '1rem 1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--app-muted)', fontSize: '0.86rem', alignItems: 'center' }}>
                  <span>{wordCount} words</span>
                  {isCleaning && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="journal-spinner" />
                      Cleaning up…
                    </span>
                  )}
                  {!isCleaning && cleanedLabel === 'done' && (
                    <span style={{ fontSize: '0.78rem', color: '#b06d86' }}>Auto-corrected</span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={toggleRecording}
                    disabled={!recordingSupported}
                    style={{ border: 'none', borderRadius: 999, padding: '0.92rem 1.5rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800, cursor: recordingSupported ? 'pointer' : 'not-allowed', opacity: recordingSupported ? 1 : 0.55, fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {isRecording ? 'Stop' : 'Record'}
                  </button>
                  <button
                    onClick={saveEntry}
                    style={{ border: '1px solid var(--app-border)', borderRadius: 999, padding: '0.92rem 1.5rem', background: saved ? 'rgba(94,203,143,0.14)' : 'var(--app-bg2)', color: 'var(--app-text)', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {saved ? 'Saved' : 'Save entry'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            {reflectionsOpen ? (
              <div style={{ background: '#f7f1f3', borderRadius: 26, padding: '1rem', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#b25474' }}>Reflections</p>
                <p style={{ margin: '0.35rem 0 0.9rem', color: '#8d7480', fontSize: '0.84rem' }}>Your saved reflections open here, inside the journal.</p>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {entries.slice(0, 8).map(entry => (
                    <div
                      key={entry.id}
                      style={{ borderRadius: 16, background: 'var(--app-bg2)', border: '1px solid var(--app-border)', padding: '0.85rem 0.9rem' }}
                      onMouseEnter={() => setRevealedEntryDeleteId(entry.id)}
                      onMouseLeave={() => setRevealedEntryDeleteId(current => current === entry.id ? null : current)}
                      onTouchStart={() => setRevealedEntryDeleteId(entry.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                        <input
                          value={entry.title}
                          onChange={event => updateEntryTitle(entry.id, event.target.value)}
                          style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'var(--app-text)', fontWeight: 800, fontSize: '0.94rem', marginBottom: '0.28rem', fontFamily: "'DM Sans', sans-serif" }}
                        />
                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          aria-label="Delete entry"
                          style={{ width: 26, height: 26, borderRadius: 999, border: '1px solid transparent', background: 'transparent', color: 'var(--app-muted)', cursor: 'pointer', fontSize: '0.8rem', lineHeight: 1, flexShrink: 0, opacity: revealedEntryDeleteId === entry.id ? 1 : 0, pointerEvents: revealedEntryDeleteId === entry.id ? 'auto' : 'none', transition: 'opacity 0.18s ease' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p style={{ margin: '0 0 0.35rem', color: '#8d7480', fontSize: '0.78rem' }}>{formatDateLabel(entry.date)}</p>
                      <p style={{ margin: 0, color: 'var(--app-muted)', fontSize: '0.84rem', lineHeight: 1.6 }}>{entry.summary || 'Your reflection summary will show here.'}</p>
                    </div>
                  ))}
                  {!entries.length && <p style={{ margin: 0, color: '#8d7480', fontSize: '0.88rem' }}>Your reflections will appear here.</p>}
                </div>
              </div>
            ) : (
              <>
                <div style={{ background: '#f7f1f3', borderRadius: 26, padding: '1rem', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    <SummaryCard label="Title" value={analysis?.title || 'Your title will be generated here.'} />
                    <SummaryCard label="Reflection" value={analysis?.score || 'Reflection: -'} />
                    <div style={{ background: '#fffafc', border: '1px dashed #dca1b7', borderRadius: 18, padding: '0.85rem 0.9rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b06d86', margin: 0 }}>Sage guidance</p>
                        <button
                          type="button"
                          onClick={() => speakJournalText(analysis?.sageResponse || analysis?.actions?.[0] || '')}
                          aria-label="Read Sage guidance aloud"
                          style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #efcddd', background: '#fff', color: '#b06d86', display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                        >
                          <Volume2 size={14} />
                        </button>
                      </div>
                      <p style={{ color: '#9e7c89', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                        {analysis?.sageResponse || 'Sage will reply to what you shared here.'}
                      </p>
                    </div>
                  </div>
                </div>

                {patternInsight && (
                  <div style={{ background: '#f7f1f3', borderRadius: 26, padding: '1rem', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' }}>
                    <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#b25474', marginBottom: '0.7rem' }}>Pattern insight</p>
                    <p style={{ color: 'var(--app-muted)', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>{patternInsight}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <style>{`
        @keyframes journalPromptFloat {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes journalSpin {
          to { transform: rotate(360deg); }
        }
        .journal-spinner {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid rgba(180,109,134,0.25);
          border-top-color: rgba(180,109,134,0.85);
          animation: journalSpin 0.7s linear infinite;
          display: inline-block;
        }
        textarea::-webkit-scrollbar { width: 0; height: 0; }
        @media (max-width: 980px) {
          [style*="grid-template-columns: 1.2fr 0.82fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
      </div>
    </div>
  )
}
