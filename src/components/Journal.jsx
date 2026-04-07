import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpDown,
  Image as ImageIcon,
  List,
  Mic,
  MoreHorizontal,
  Paintbrush,
  Plus,
  Search,
  Smile,
  Tag,
  Type,
} from 'lucide-react'

const STORAGE_KEY = 'phasr_journal_v2'
const LEGACY_STORAGE_KEY = 'phasr_journal'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const PROMPTS = [
  "What's on your mind?",
  'What needs attention?',
  'What shifted today?',
]

const MOODS = [
  { emoji: '😊', label: 'Calm', score: 8 },
  { emoji: '😌', label: 'Grounded', score: 8 },
  { emoji: '🔥', label: 'Focused', score: 9 },
  { emoji: '😔', label: 'Reflective', score: 5 },
  { emoji: '😤', label: 'Stressed', score: 3 },
  { emoji: '😴', label: 'Tired', score: 4 },
  { emoji: '🥺', label: 'Tender', score: 4 },
  { emoji: '😎', label: 'Confident', score: 8 },
  { emoji: '🧘', label: 'Centered', score: 7 },
  { emoji: '💪', label: 'Energised', score: 9 },
]

const TEMPLATES = [
  {
    id: 'daily-quick-start',
    tier: 'Basic',
    name: 'Daily quick start',
    useWhen: 'Use this when you open the app and need a grounded starting point.',
    description: 'A simple way to begin the day with clarity and direction.',
    prompt: "What's on your mind?",
    starter: '• What matters most today?\n• What is one thing I must complete?\n• What might distract me?\n• How do I want to feel today?',
    accent: '#f6d7f7',
  },
  {
    id: 'gratitude-diary',
    tier: 'Basic',
    name: 'Gratitude diary',
    useWhen: 'Use this when you want to slow down and notice what is good.',
    description: 'A softer reflection that helps you stay rooted in what matters.',
    prompt: 'What felt meaningful today?',
    starter: '• What am I grateful for today?\n• Why does this matter to me?\n• What moment made me smile today?',
    accent: '#ffe8cc',
  },
  {
    id: 'clarity-reset',
    tier: 'Basic',
    name: 'Clarity reset',
    useWhen: 'Use this when your mind feels crowded and you need clarity.',
    description: 'Pull the real issue into the light and move toward one next step.',
    prompt: 'What needs attention?',
    starter: '• What is bothering me right now?\n• Why is this affecting me?\n• What do I need instead?\n• What is the next step I can take?',
    accent: '#ffe3ef',
  },
  {
    id: 'food-diary',
    tier: 'Basic',
    name: 'Food diary',
    useWhen: 'Use this when you want to notice patterns around food and emotion.',
    description: 'Track what you ate and what it was doing for you emotionally.',
    prompt: 'What patterns am I noticing?',
    starter: '• What did I eat today?\n• How did I feel before eating?\n• How did I feel after?\n• What patterns am I noticing?',
    accent: '#fff0dc',
  },
  {
    id: 'overthinking-dump',
    tier: 'Pro',
    name: 'Overthinking dump',
    useWhen: 'Use this when your head is loud and you need to clear mental noise.',
    description: 'A fast release for thoughts that keep circling.',
    prompt: "What's on your mind?",
    starter: '• What is on my mind right now?\n• What am I overthinking?\n• What is in my control?\n• What can I ignore for now?',
    accent: '#dff1ff',
  },
  {
    id: 'unsent-message',
    tier: 'Pro',
    name: 'Unsent message',
    useWhen: 'Use this when there is something you wish you could say.',
    description: 'A private place for emotional release without sending anything.',
    prompt: 'What do I wish I could say?',
    starter: '• What do I wish I could say?\n• Why haven’t I said it?\n• How do I truly feel about this?',
    accent: '#fce1ea',
  },
  {
    id: 'reality-check',
    tier: 'Pro',
    name: 'Reality check',
    useWhen: 'Use this when you need to stop softening the truth.',
    description: 'A sharper mirror for the thing you keep avoiding.',
    prompt: 'What truth am I avoiding?',
    starter: '• What am I avoiding?\n• What excuse have I been repeating?\n• What is the truth I don’t want to admit?',
    accent: '#efe6ff',
  },
  {
    id: 'decision-helper',
    tier: 'Pro',
    name: 'Decision helper',
    useWhen: 'Use this when you feel stuck between options.',
    description: 'A clear path for making the next honest choice.',
    prompt: 'What decision am I trying to make?',
    starter: '• What decision am I trying to make?\n• What are my options?\n• What feels right long term?\n• What is the next small step?',
    accent: '#e5f7ef',
  },
  {
    id: 'energy-audit',
    tier: 'Pro',
    name: 'Energy audit',
    useWhen: 'Use this when you want to see what is feeding or draining you.',
    description: 'A simple awareness reset for your day and your body.',
    prompt: 'What gave me energy today?',
    starter: '• What gave me energy today?\n• What drained me?\n• What should I do more of?\n• What should I reduce?',
    accent: '#fff7d8',
  },
  {
    id: 'future-self-check',
    tier: 'Pro',
    name: 'Future self check',
    useWhen: 'Use this when you want direction and long-term honesty.',
    description: 'A check-in between where you are and where you want to be.',
    prompt: 'Where do I want to be in 3 months?',
    starter: '• Where do I want to be in 3 months?\n• What am I doing today that supports that?\n• What needs to change?',
    accent: '#e6f0ff',
  },
]

const BACKGROUNDS = [
  { id: 'original', name: 'Original', style: { background: '#ffffff' } },
  { id: 'rosy', name: 'Rosy', style: { background: 'linear-gradient(180deg, #fff8fb 0%, #ffe9f2 100%)' } },
  { id: 'dark-cute', name: 'Dark Cute', style: { background: 'linear-gradient(180deg, #2d1730 0%, #4f274d 100%)', color: '#fff7fb' } },
  { id: 'butterfly', name: 'Butterfly', style: { background: 'linear-gradient(180deg, #eef1ff 0%, #f7ebff 100%)' } },
  { id: 'bows', name: 'Bows', style: { background: 'linear-gradient(180deg, #fff3f7 0%, #fffdfd 100%)' } },
]

const BACKGROUND_DECOR = {
  original: '',
  rosy: '🌹 ✿ 🌷',
  'dark-cute': '✦ ☾ ✦',
  butterfly: '🦋 ✦ 🦋',
  bows: '🎀 ✿ 🎀',
}

const STICKERS = ['💖', '🎀', '🧸', '🌨️', '✨', '🌸']

const FONT_OPTIONS = [
  { id: 'dm', name: 'Default', family: "'DM Sans', sans-serif" },
  { id: 'playfair', name: 'Playfair', family: "'Playfair Display', serif" },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
  { id: 'arial', name: 'Arial', family: 'Arial, sans-serif' },
]

const COLOR_OPTIONS = ['#2f1e2a', '#7b243e', '#b03060', '#e8407a', '#ff7aaa', '#6e2fb8']

const TOOLBAR_ITEMS = [
  { id: 'background', icon: Paintbrush },
  { id: 'image', icon: ImageIcon },
  { id: 'emoji', icon: Smile },
  { id: 'font', icon: Type },
  { id: 'list', icon: List },
  { id: 'tag', icon: Tag },
  { id: 'mic', icon: Mic },
]

const JOURNAL_ANALYSIS_PROMPT = `You are Sage, Phasr's reflective journal coach.
Read the journal entry and return strict JSON with these keys:
generatedTitle, clarityScore, clarityLabel, summary, sageResponse, actions.
Clarity score must be an integer from 1 to 10.
Clarity label must be one of Calm, Focused, Stressed, Confused, Energised, Reflective, Grounded, Tender.
Sage response should be warm, honest, and direct.
Return JSON only.`

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

function loadEntries() {
  const modern = safeRead(STORAGE_KEY, null)
  if (Array.isArray(modern)) return modern
  const legacy = safeRead(LEGACY_STORAGE_KEY, [])
  return Array.isArray(legacy) ? legacy : []
}

function getTodayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateString) {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${dateString}T12:00:00`))
  } catch {
    return dateString
  }
}

function formatFullDate(dateString) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${dateString}T12:00:00`))
  } catch {
    return dateString
  }
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function makePreview(content) {
  return String(content || '').replace(/\s+/g, ' ').trim().slice(0, 110)
}

function parseJsonResponse(text) {
  const cleaned = String(text || '').trim().replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
  return JSON.parse(cleaned)
}

function createBlankDraft() {
  return {
    date: getTodayString(),
    title: '',
    content: '',
    prompt: PROMPTS[0],
    mood: MOODS[0],
    backgroundId: 'original',
    fontId: 'dm',
    color: '#2f1e2a',
    listStyle: 'bullet',
    tags: [],
    images: [],
  }
}

async function generateSageAnalysis({ content, title, prompt, mood }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_KEY || ''

  if (!apiKey) {
    return {
      generatedTitle: title || 'Journal reflection',
      clarityScore: mood?.score || 7,
      clarityLabel: mood?.label || 'Reflective',
      summary: makePreview(content) || 'Saved journal reflection.',
      sageResponse:
        'You captured something important here. Keep following the feeling that is asking for clarity, and turn it into one small next step.',
      actions: ['Name the clearest next step.', 'Protect your energy.', 'Return to this reflection tomorrow.'],
    }
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: JOURNAL_ANALYSIS_PROMPT },
        {
          role: 'user',
          content: JSON.stringify({ prompt, title, mood: mood?.label || '', content }),
        },
      ],
    }),
  })

  if (!response.ok) throw new Error('journal_analysis_failed')

  const payload = await response.json()
  const text = payload?.choices?.[0]?.message?.content || ''
  return parseJsonResponse(text)
}

function BottomSheet({ open, onClose, title, children, dim = true }) {
  if (!open) return null
  return (
    <>
      {dim ? (
        <button type="button" aria-label="Close sheet" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(32, 20, 28, 0.24)', border: 'none', zIndex: 30 }} />
      ) : null}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, background: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26, boxShadow: '0 -10px 34px rgba(58, 28, 39, 0.15)', zIndex: 31, padding: '1rem 1rem 1.2rem', maxHeight: '58vh', overflowY: 'auto' }}>
        {title ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}><p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#3c2430' }}>{title}</p><button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.3rem', color: '#8b6977', cursor: 'pointer' }}>×</button></div> : null}
        {children}
      </div>
    </>
  )
}
function JournalList({ entries, search, setSearch, sortOrder, setSortOrder, onNew, onOpen }) {
  const [showSortSheet, setShowSortSheet] = useState(false)

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1rem 1rem 5.5rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fff6fa', border: '1px solid var(--app-border)', borderRadius: 22, padding: '0.8rem 0.85rem', boxShadow: '0 12px 28px rgba(86,53,66,0.05)' }}>
          <Search size={18} color="#8b6977" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search entries..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.98rem', color: 'var(--app-text)', fontFamily: "'DM Sans', sans-serif", minWidth: 0 }} />
          <button
            type="button"
            onClick={() => setShowSortSheet(true)}
            style={{
              width: 42,
              height: 42,
              border: '1px solid var(--app-border)',
              borderRadius: 16,
              background: '#fff',
              color: 'var(--app-accent)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
          >
            <ArrowUpDown size={18} />
          </button>
        </div>

        <div style={{ display: 'grid', gap: '0.6rem' }}>
          {entries.map(entry => (
            <button key={entry.id} type="button" onClick={() => onOpen(entry)} style={{ border: 'none', background: '#fff', borderBottom: '1px solid var(--app-border)', padding: '0.4rem 0.1rem 1rem', textAlign: 'left', cursor: 'pointer', display: 'grid', gap: '0.32rem', fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
                <span style={{ color: '#8f7180', fontSize: '0.96rem' }}>{formatDate(entry.date)}</span>
                <span style={{ color: 'var(--app-accent)', fontSize: '0.86rem', fontWeight: 700 }}>{entry.title || 'Untitled'}</span>
              </div>
              <p style={{ margin: 0, color: '#3c2430', fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.4 }}>{entry.title || 'Untitled reflection'}</p>
              <p style={{ margin: 0, color: '#8f7180', fontSize: '0.94rem', lineHeight: 1.55 }}>{makePreview(entry.transcript || entry.content) || 'Start writing...'}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.22rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', borderRadius: 999, border: '1px solid var(--app-border)', padding: '0.35rem 0.72rem', color: '#6d5862', fontSize: '0.84rem', fontWeight: 700, background: '#fff9fb' }}>
                  <span>{entry.mood?.emoji || '😊'}</span>
                  <span>{entry.clarityLabel || entry.mood?.label || 'Reflective'}</span>
                  <span>· {entry.clarityScore || 7}/10</span>
                </span>
              </div>
            </button>
          ))}
          {!entries.length ? <div style={{ borderRadius: 24, border: '1px solid var(--app-border)', background: '#fff', padding: '1.2rem', color: '#8f7180', textAlign: 'center' }}>No entries yet. Tap the plus button to start.</div> : null}
        </div>
      </div>

      <button type="button" onClick={onNew} style={{ position: 'fixed', right: '50%', transform: 'translateX(50%)', bottom: '1.2rem', width: 68, height: 68, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', boxShadow: '0 18px 28px rgba(232,64,122,0.28)', display: 'grid', placeItems: 'center', cursor: 'pointer', zIndex: 8 }}>
        <Plus size={30} />
      </button>

      <BottomSheet open={showSortSheet} onClose={() => setShowSortSheet(false)} title="Sort entries">
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {[
            { id: 'latest', label: 'Latest first' },
            { id: 'oldest', label: 'Oldest first' },
          ].map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setSortOrder(option.id)
                setShowSortSheet(false)
              }}
              style={{
                ...menuRowStyle,
                border: option.id === sortOrder ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
                padding: '0.95rem 0.9rem',
              }}
            >
              <span>{option.label}</span>
              {option.id === sortOrder ? <Check size={18} /> : null}
            </button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

function TemplatePicker({ onBack, onSelect }) {
  const groupedTemplates = TEMPLATES.reduce((accumulator, template) => {
    accumulator[template.tier] = [...(accumulator[template.tier] || []), template]
    return accumulator
  }, {})

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#eef6ff', padding: '0.8rem 0.8rem 1.4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.3rem 0.1rem' }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1d2430' }}>Templates</h2>
        </div>
        {Object.entries(groupedTemplates).map(([group, templates]) => (
          <div key={group} style={{ display: 'grid', gap: '0.85rem' }}>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e7fa1' }}>{group}</p>
            {templates.map(template => (
              <div key={template.id} style={{ background: template.accent, borderRadius: 24, padding: '1.15rem', display: 'grid', gap: '0.55rem', boxShadow: '0 12px 26px rgba(66, 72, 90, 0.08)' }}>
                <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#2f2530' }}>{template.name}</p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#5c5564', fontWeight: 700 }}>{template.useWhen}</p>
                <p style={{ margin: 0, color: '#6c6170', lineHeight: 1.55 }}>{template.description}</p>
                <button type="button" onClick={() => onSelect(template)} style={{ justifySelf: 'start', marginTop: '0.35rem', border: 'none', borderRadius: 14, padding: '0.72rem 1rem', background: '#fff', color: '#6f4fe6', fontWeight: 800, cursor: 'pointer' }}>START</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProcessingScreen() {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center', background: '#fff', padding: '2rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
        <div style={{ width: 88, height: 88, margin: '0 auto', borderRadius: '50%', border: '6px solid #fde2ec', borderTopColor: 'var(--app-accent)', animation: 'phasr-spin 1s linear infinite' }} />
        <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#3b2330' }}>Sage is reading your entry...</p>
        <p style={{ margin: 0, color: '#8f7180', lineHeight: 1.7 }}>Pulling out the title, clarity score, and the response that fits what you wrote.</p>
        <style>{`@keyframes phasr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

function EntryDetail({ entry, onBack }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p style={{ margin: 0, fontSize: '0.98rem', color: '#7f6672' }}>{formatFullDate(entry.date)}</p>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.2rem 1rem 5rem', display: 'grid', gap: '1.2rem' }}>
        <div>
          <p style={{ margin: 0, color: '#7f6672', fontSize: '0.95rem' }}>{formatFullDate(entry.date)} {entry.mood?.emoji || ''}</p>
          <h1 style={{ margin: '0.55rem 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 7vw, 3.1rem)', fontWeight: 500, color: '#2f1e2a' }}>{entry.title || 'Untitled reflection'}</h1>
        </div>
        <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', color: '#2f1e2a', fontSize: '1.05rem', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{entry.transcript || entry.content}</div>
        <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
          <p style={sectionLabelStyle}>Clarity Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 94, height: 94, borderRadius: '50%', border: '8px solid #fde3ec', display: 'grid', placeItems: 'center', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1.2rem', flexShrink: 0 }}>{entry.clarityScore || 7}/10</div>
            <div>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2f1e2a' }}>{entry.clarityLabel || 'Reflective'}</p>
              <p style={{ margin: '0.3rem 0 0', color: '#7f6672', lineHeight: 1.6 }}>{entry.summary || 'A clear reflection was saved for this moment.'}</p>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
          <p style={sectionLabelStyle}>Sage’s Response</p>
          <div style={{ borderRadius: 22, background: '#fff5fa', border: '1px solid #f2c4d0', padding: '1rem', color: '#4b3240', lineHeight: 1.75 }}>{entry.sageResponse || 'Sage will respond here once your reflection is saved.'}</div>
        </div>
      </div>
    </div>
  )
}
function JournalWriter({ draft, setDraft, onBack, onSave, onOpenTemplates, isSaving }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeTray, setActiveTray] = useState(null)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)

  const wordCount = countWords(draft.content)
  const charCount = String(draft.content || '').length
  const currentBackground = BACKGROUNDS.find(item => item.id === draft.backgroundId) || BACKGROUNDS[0]
  const currentFont = FONT_OPTIONS.find(item => item.id === draft.fontId) || FONT_OPTIONS[0]

  useEffect(() => () => { recognitionRef.current?.stop?.() }, [])

  function applyListStyle(type) {
    const prefixes = { bullet: '• ', check: '✓ ', star: '★ ' }
    const prefix = prefixes[type] || '• '
    setDraft(prev => ({ ...prev, listStyle: type, content: `${prev.content}${prev.content.endsWith('\n') || !prev.content ? '' : '\n'}${prefix}` }))
    setActiveTray(null)
  }

  function insertEmoji(emoji) {
    setDraft(prev => ({ ...prev, content: `${prev.content}${emoji}` }))
    setActiveTray(null)
  }

  function insertTag(tag) {
    setDraft(prev => ({ ...prev, content: `${prev.content}${prev.content && !prev.content.endsWith(' ') ? ' ' : ''}#${tag} ` }))
    setActiveTray(null)
  }

  function handleImagePick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(prev => ({
        ...prev,
        images: [
          ...prev.images,
          {
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            url: reader.result,
          },
        ],
      }))
      setActiveTray(null)
    }
    reader.readAsDataURL(file)
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setDraft(prev => ({ ...prev, content: `${prev.content}${prev.content ? '\n' : ''}[Voice note unavailable on this browser]` }))
      setActiveTray(null)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    let finalTranscript = ''
    recognition.onresult = event => {
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        if (result.isFinal) {
          finalTranscript += `${result[0]?.transcript || ''} `
        }
      }
      if (finalTranscript.trim()) {
        setDraft(prev => ({ ...prev, content: `${prev.content}${prev.content ? '\n' : ''}${finalTranscript.trim()}` }))
        finalTranscript = ''
      }
    }
    recognition.onerror = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }
    recognition.onend = () => {
      setIsRecording(false)
      recognitionRef.current = null
    }
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
    setActiveTray(null)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p style={{ margin: 0, flex: 1, fontSize: '1.02rem', fontWeight: 800, color: 'var(--app-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{draft.prompt}</p>
        <button type="button" onClick={() => setMenuOpen(true)} style={{ border: 'none', background: 'transparent', color: '#6e4a58', cursor: 'pointer' }}><MoreHorizontal size={24} /></button>
        <button type="button" onClick={onSave} disabled={isSaving} style={{ border: 'none', borderRadius: 999, padding: '0.8rem 1.25rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 12px 20px rgba(232,64,122,0.2)' }}>{isSaving ? 'Saving...' : 'Save'}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...currentBackground.style }}>
        <div style={{ position: 'relative', padding: '1rem 1rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#7f6672', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.85rem', color: currentBackground.id === 'dark-cute' ? '#fff' : '#d1588b' }}>
            {BACKGROUND_DECOR[draft.backgroundId] || ''}
          </div>
          <button
            type="button"
            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
            style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, color: '#7f6672', fontSize: '0.96rem', cursor: 'pointer' }}
          >
            {formatFullDate(draft.date)}
          </button>
          <input
            ref={dateInputRef}
            type="date"
            value={draft.date}
            onChange={event => setDraft(prev => ({ ...prev, date: event.target.value }))}
            style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
          />
          <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{draft.mood?.emoji || '😊'}</span>
        </div>
        <div style={{ padding: '0 1rem 1rem', display: 'grid', gap: '1rem', flex: 1 }}>
          <input value={draft.title} onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))} placeholder="Title" style={{ border: 'none', borderBottom: '1px solid var(--app-border)', background: 'transparent', padding: '0.2rem 0 0.7rem', outline: 'none', color: draft.color, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 500 }} />
          {draft.images.length ? (
            <div style={{ display: 'flex', gap: '0.7rem', overflowX: 'auto', paddingBottom: '0.2rem' }}>
              {draft.images.map(image => (
                <div key={image.id} style={{ flex: '0 0 auto', width: 112, height: 148, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--app-border)', background: '#fff' }}>
                  <img src={image.url} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          ) : null}
          <textarea value={draft.content} onChange={event => setDraft(prev => ({ ...prev, content: event.target.value }))} placeholder="Start writing..." style={{ flex: 1, minHeight: '42vh', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: draft.color, fontFamily: currentFont.family, fontSize: '1.12rem', lineHeight: 1.9 }} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.7rem 0.8rem max(0.9rem, env(safe-area-inset-bottom))', display: 'grid', gap: '0.7rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8f7180', fontSize: '0.82rem' }}><span>{wordCount} words</span><span>{draft.images.length ? `${draft.images.length} image${draft.images.length === 1 ? '' : 's'}` : 'Ready to write'}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.45rem' }}>
          {TOOLBAR_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" onClick={() => {
                if (item.id === 'image') { fileInputRef.current?.click(); return }
                if (item.id === 'mic') {
                  if (recognitionRef.current) {
                    recognitionRef.current.stop()
                    setIsRecording(false)
                    return
                  }
                  startRecording()
                  return
                }
                setActiveTray(current => (current === item.id ? null : item.id))
              }} style={{ border: 'none', background: '#fff', color: activeTray === item.id ? 'var(--app-accent)' : '#5d4450', display: 'grid', justifyItems: 'center', gap: '0.22rem', padding: '0.25rem 0', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                <Icon size={18} />
              </button>
            )
          })}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
      </div>

      <BottomSheet open={menuOpen} onClose={() => setMenuOpen(false)} title="">
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <button type="button" onClick={() => { setMenuOpen(false); onOpenTemplates() }} style={menuRowStyle}><span>Templates</span><span>→</span></button>
          <div style={menuStatStyle}><span>Preview</span><strong>{makePreview(draft.content) || 'Nothing yet'}</strong></div>
          <div style={menuStatStyle}><span>Characters</span><strong>{charCount}</strong></div>
          <div style={menuStatStyle}><span>Words</span><strong>{wordCount}</strong></div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'background'} onClose={() => setActiveTray(null)} title="Background" dim={false}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
          {BACKGROUNDS.map(item => (
            <button key={item.id} type="button" onClick={() => { setDraft(prev => ({ ...prev, backgroundId: item.id })); setActiveTray(null) }} style={{ border: item.id === draft.backgroundId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 18, overflow: 'hidden', padding: 0, background: '#fff', cursor: 'pointer' }}>
              <div style={{ height: 76, ...item.style }} />
              <div style={{ padding: '0.7rem', textAlign: 'left', fontWeight: 700, color: '#3c2430' }}>{item.name}</div>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'emoji'} onClose={() => setActiveTray(null)} title="Emojis & stickers" dim={false}>
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8f7180' }}>Emojis</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem' }}>
              {MOODS.map(mood => (
                <button key={mood.label} type="button" onClick={() => { setDraft(prev => ({ ...prev, mood })); insertEmoji(mood.emoji) }} style={{ border: '1px solid var(--app-border)', borderRadius: 18, background: '#fff', padding: '0.7rem 0.2rem', cursor: 'pointer' }}>
                  <div style={{ fontSize: '1.55rem' }}>{mood.emoji}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7f6672', marginTop: '0.35rem' }}>{mood.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p style={{ margin: '0 0 0.55rem', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#8f7180' }}>Cute stickers</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.7rem' }}>
              {STICKERS.map(sticker => (
                <button key={sticker} type="button" onClick={() => insertEmoji(sticker)} style={{ border: '1px solid var(--app-border)', borderRadius: 18, background: '#fff', padding: '0.9rem', cursor: 'pointer', fontSize: '1.8rem' }}>
                  {sticker}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
      <BottomSheet open={activeTray === 'font'} onClose={() => setActiveTray(null)} title="Font" dim={false}>
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            {COLOR_OPTIONS.map(color => (
              <button key={color} type="button" onClick={() => setDraft(prev => ({ ...prev, color }))} style={{ width: 30, height: 30, borderRadius: '50%', border: color === draft.color ? '2px solid #2f1e2a' : '1px solid #e5cdd8', background: color, cursor: 'pointer' }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
            {FONT_OPTIONS.map(option => (
              <button key={option.id} type="button" onClick={() => setDraft(prev => ({ ...prev, fontId: option.id }))} style={{ border: option.id === draft.fontId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 16, background: '#fff', padding: '0.9rem', cursor: 'pointer', fontFamily: option.family, fontSize: '1.1rem', color: '#2f1e2a' }}>{option.name}</button>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'list'} onClose={() => setActiveTray(null)} title="List style" dim={false}>
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <button type="button" onClick={() => applyListStyle('bullet')} style={menuRowStyle}><span>• Bullet points</span><span>• • •</span></button>
          <button type="button" onClick={() => applyListStyle('check')} style={menuRowStyle}><span>☐ Check list</span><span>☐ ☐ ☐</span></button>
          <button type="button" onClick={() => applyListStyle('star')} style={menuRowStyle}><span>★ Star list</span><span>★ ★ ★</span></button>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'tag'} onClose={() => setActiveTray(null)} title="Tags" dim={false}>
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          {['gratitude', 'clarity', 'work', 'rest', 'mindset', 'healing'].map(tag => (
            <button key={tag} type="button" onClick={() => insertTag(tag)} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: '#fff6fa', color: 'var(--app-accent)', padding: '0.55rem 0.8rem', fontWeight: 700, cursor: 'pointer' }}>#{tag}</button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
}

const menuRowStyle = {
  border: 'none',
  background: '#fff',
  borderRadius: 18,
  padding: '1rem 0.3rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  cursor: 'pointer',
  color: '#2f1e2a',
  fontWeight: 700,
  fontSize: '1.05rem',
  fontFamily: "'DM Sans', sans-serif",
}

const menuStatStyle = {
  borderTop: '1px solid var(--app-border)',
  padding: '0.9rem 0.3rem 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#7f6672',
  fontSize: '1rem',
}

const sectionLabelStyle = {
  margin: 0,
  fontSize: '0.74rem',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--app-accent)',
}

const ghostIconButtonStyle = {
  width: 42,
  height: 42,
  borderRadius: 12,
  border: 'none',
  background: '#f7f1f4',
  color: '#3d1f2b',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
}

export default function Journal() {
  const [entries, setEntries] = useState(() => loadEntries())
  const [screen, setScreen] = useState('list')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('latest')
  const [draft, setDraft] = useState(() => createBlankDraft())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    safeWrite(STORAGE_KEY, entries)
  }, [entries])

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase()
    const next = entries.filter(entry => {
      if (!query) return true
      return [entry.title, entry.transcript, entry.summary, entry.prompt].join(' ').toLowerCase().includes(query)
    })
    next.sort((a, b) => {
      const first = String(a.createdAt || a.date || '')
      const second = String(b.createdAt || b.date || '')
      return sortOrder === 'latest' ? second.localeCompare(first) : first.localeCompare(second)
    })
    return next
  }, [entries, search, sortOrder])

  function handleNewEntry() {
    setDraft(createBlankDraft())
    setShowMoodPicker(true)
  }

  function handlePickMood(mood) {
    setDraft(prev => ({ ...prev, mood }))
    setShowMoodPicker(false)
    setScreen('write')
  }

  function handleSelectTemplate(template) {
    setDraft(prev => ({ ...prev, prompt: template.prompt, content: template.starter, title: '' }))
    setShowTemplates(false)
    setScreen('write')
  }

  async function handleSaveEntry() {
    if (!draft.content.trim()) return
    setIsSaving(true)
    setScreen('processing')
    try {
      const analysis = await generateSageAnalysis({ content: draft.content, title: draft.title, prompt: draft.prompt, mood: draft.mood })
      const nextEntry = {
        id: Date.now(),
        date: draft.date,
        createdAt: new Date().toISOString(),
        title: draft.title.trim() || analysis.generatedTitle || 'Untitled reflection',
        content: draft.content,
        transcript: draft.content,
        prompt: draft.prompt,
        mood: draft.mood,
        clarityScore: Number(analysis.clarityScore || draft.mood?.score || 7),
        clarityLabel: analysis.clarityLabel || draft.mood?.label || 'Reflective',
        sageResponse: analysis.sageResponse || '',
        summary: analysis.summary || makePreview(draft.content),
        actions: Array.isArray(analysis.actions) ? analysis.actions : [],
        score: `${analysis.clarityLabel || draft.mood?.label || 'Reflective'} · ${Number(analysis.clarityScore || draft.mood?.score || 7)}/10`,
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        tags: draft.tags,
        images: draft.images,
      }
      setEntries([nextEntry, ...entries])
      setSelectedEntry(nextEntry)
      setScreen('detail')
    } catch {
      const fallbackEntry = {
        id: Date.now(),
        date: draft.date,
        createdAt: new Date().toISOString(),
        title: draft.title.trim() || 'Untitled reflection',
        content: draft.content,
        transcript: draft.content,
        prompt: draft.prompt,
        mood: draft.mood,
        clarityScore: draft.mood?.score || 7,
        clarityLabel: draft.mood?.label || 'Reflective',
        sageResponse: 'I can tell there is something honest here. Keep this entry close and come back to it when you want the next layer of clarity.',
        summary: makePreview(draft.content),
        actions: [],
        score: `${draft.mood?.label || 'Reflective'} · ${draft.mood?.score || 7}/10`,
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        tags: draft.tags,
        images: draft.images,
      }
      setEntries([fallbackEntry, ...entries])
      setSelectedEntry(fallbackEntry)
      setScreen('detail')
    } finally {
      setIsSaving(false)
    }
  }
  if (screen === 'write') {
    return (
      <>
        <JournalWriter draft={draft} setDraft={setDraft} onBack={() => setScreen('list')} onSave={handleSaveEntry} onOpenTemplates={() => setShowTemplates(true)} isSaving={isSaving} />
        {showTemplates ? <TemplatePicker onBack={() => setShowTemplates(false)} onSelect={handleSelectTemplate} /> : null}
      </>
    )
  }

  if (screen === 'processing') return <ProcessingScreen />
  if (screen === 'detail' && selectedEntry) return <EntryDetail entry={selectedEntry} onBack={() => setScreen('list')} />

  return (
    <>
      <JournalList entries={filteredEntries} search={search} setSearch={setSearch} sortOrder={sortOrder} setSortOrder={setSortOrder} onNew={handleNewEntry} onOpen={entry => { setSelectedEntry(entry); setScreen('detail') }} />
      <BottomSheet open={showMoodPicker} onClose={() => setShowMoodPicker(false)} title={null}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}><p style={{ margin: 0, color: '#af8396', fontSize: '1rem' }}>How are you feeling right now?</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.8rem' }}>
          {MOODS.map(mood => (
            <button key={mood.label} type="button" onClick={() => handlePickMood(mood)} style={{ border: 'none', background: 'transparent', display: 'grid', justifyItems: 'center', gap: '0.3rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ fontSize: '1.8rem' }}>{mood.emoji}</span>
              <span style={{ fontSize: '0.72rem', color: '#8f7180' }}>{mood.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setDraft(prev => ({ ...prev, mood: MOODS[0] })); setShowMoodPicker(false); setScreen('write') }} style={{ marginTop: '1rem', border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1rem', width: '100%', cursor: 'pointer' }}>Skip for now →</button>
      </BottomSheet>
    </>
  )
}
