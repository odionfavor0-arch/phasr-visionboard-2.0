import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
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
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const PROMPTS = [
  "What's on your mind?",
  'What needs attention?',
  'What shifted today?',
]

const MOODS = [
  { emoji: '😊', label: 'Calm', score: 8 },
  { emoji: '🔥', label: 'Focused', score: 9 },
  { emoji: '😔', label: 'Reflective', score: 5 },
  { emoji: '😤', label: 'Stressed', score: 3 },
  { emoji: '😎', label: 'Confident', score: 8 },
  { emoji: '💪', label: 'Energised', score: 9 },
]

const TEMPLATES = [
  { id: 'daily-quick-start', tier: 'Basic', name: 'Daily quick start', useWhen: 'Use this when you open the app and need a grounded starting point.', starter: '• What matters most today?\n• What is one thing I must complete?\n• What might distract me?\n• How do I want to feel today?', accent: '#f6d7f7' },
  { id: 'gratitude-diary', tier: 'Basic', name: 'Gratitude diary', useWhen: 'Use this when you want to slow down and notice what is good.', starter: '• What am I grateful for today?\n• Why does this matter to me?\n• What moment made me smile today?', accent: '#ffe8cc' },
  { id: 'clarity-reset', tier: 'Basic', name: 'Clarity reset', useWhen: 'Use this when your mind feels crowded and you need clarity.', starter: '• What is bothering me right now?\n• Why is this affecting me?\n• What do I need instead?\n• What is the next step I can take?', accent: '#ffe3ef' },
  { id: 'overthinking-dump', tier: 'Pro', name: 'Overthinking dump', useWhen: 'Use this when your head is loud and you need to clear mental noise.', starter: '• What is on my mind right now?\n• What am I overthinking?\n• What is in my control?\n• What can I ignore for now?', accent: '#dff1ff' },
  { id: 'unsent-message', tier: 'Pro', name: 'Unsent message', useWhen: 'Use this when there is something you wish you could say.', starter: '• What do I wish I could say?\n• Why haven’t I said it?\n• How do I truly feel about this?', accent: '#fce1ea' },
  { id: 'decision-helper', tier: 'Pro', name: 'Decision helper', useWhen: 'Use this when you feel stuck between options.', starter: '• What decision am I trying to make?\n• What are my options?\n• What feels right long term?\n• What is the next small step?', accent: '#e5f7ef' },
]

const BACKGROUNDS = [
  { id: 'original', name: 'Original', style: { background: '#ffffff' }, deco: '' },
  { id: 'rosy', name: 'Rosy', style: { background: 'linear-gradient(180deg, #fff8fb 0%, #ffe9f2 100%)' }, deco: '🌹 ✿ 🌷' },
  { id: 'dark-cute', name: 'Dark Cute', style: { background: 'linear-gradient(180deg, #2d1730 0%, #4f274d 100%)', color: '#fff7fb' }, deco: '✦ ☾ ✦' },
  { id: 'butterfly', name: 'Butterfly', style: { background: 'linear-gradient(180deg, #eef1ff 0%, #f7ebff 100%)' }, deco: '🦋 ✦ 🦋' },
  { id: 'bows', name: 'Bows', style: { background: 'linear-gradient(180deg, #fff3f7 0%, #fffdfd 100%)' }, deco: '🎀 ✿ 🎀' },
]

const STICKERS = ['💖', '🎀', '🧸', '✨', '🌸']
const COLORS = ['#2f1e2a', '#7b243e', '#b03060', '#e8407a', '#ff7aaa', '#6e2fb8']
const FONTS = [
  { id: 'dm', name: 'Default', family: "'DM Sans', sans-serif" },
  { id: 'playfair', name: 'Playfair', family: "'Playfair Display', serif" },
  { id: 'georgia', name: 'Georgia', family: 'Georgia, serif' },
]

function safeRead() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function safeWrite(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateString) {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${dateString}T12:00:00`))
  } catch {
    return dateString
  }
}

function makePreview(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 100)
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function blankDraft() {
  return {
    date: getToday(),
    title: '',
    content: '',
    prompt: PROMPTS[0],
    mood: null,
    backgroundId: 'original',
    color: '#2f1e2a',
    fontId: 'dm',
    images: [],
  }
}

async function generateSageAnalysis({ title, content, mood, prompt }) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_KEY || ''
  if (!apiKey) {
    return {
      generatedTitle: title || makePreview(content) || 'Journal entry',
      clarityScore: mood?.score || 7,
      clarityLabel: mood?.label || 'Reflective',
      sageResponse: 'You captured something honest here. Hold onto the clearest sentence and let that become your next step.',
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
        {
          role: 'system',
          content: 'You are Sage, a reflective journal coach. Return strict JSON with: generatedTitle, clarityScore, clarityLabel, sageResponse. Clarity score must be an integer 1 to 10. Clarity label must be one of Calm, Focused, Stressed, Reflective, Confident, Energised.',
        },
        {
          role: 'user',
          content: JSON.stringify({ title, content, mood: mood?.label || '', prompt }),
        },
      ],
    }),
  })

  if (!response.ok) throw new Error('journal_analysis_failed')
  const payload = await response.json()
  const raw = String(payload?.choices?.[0]?.message?.content || '').replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
  return JSON.parse(raw)
}

function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <button type="button" onClick={onClose} aria-label="Close" style={{ position: 'fixed', inset: 0, border: 'none', background: 'rgba(32, 20, 28, 0.24)', zIndex: 40 }} />
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 41, background: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, boxShadow: '0 -10px 34px rgba(58, 28, 39, 0.15)', padding: '1rem 1rem 1.2rem', maxHeight: '62vh', overflowY: 'auto' }}>
        {title ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#3c2430' }}>{title}</p>
            <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.3rem', color: '#8b6977' }}>×</button>
          </div>
        ) : null}
        {children}
      </div>
    </>
  )
}

function sortEntries(entries, search, sortOrder) {
  const query = search.trim().toLowerCase()
  const next = entries.filter(entry => !query ? true : [entry.title, entry.content, entry.prompt, entry.clarityLabel].join(' ').toLowerCase().includes(query))
  next.sort((a, b) => {
    const left = String(a.createdAt || a.date || '')
    const right = String(b.createdAt || b.date || '')
    return sortOrder === 'latest' ? right.localeCompare(left) : left.localeCompare(right)
  })
  return next
}

function TemplatesPage({ onBack, onSelect }) {
  const grouped = TEMPLATES.reduce((acc, item) => {
    acc[item.tier] = [...(acc[item.tier] || []), item]
    return acc
  }, {})

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#eef6ff', padding: '0.9rem 0.9rem 1.4rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1d2430' }}>Templates</h2>
        </div>
        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} style={{ display: 'grid', gap: '0.85rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e7fa1' }}>{group}</p>
            {items.map(item => (
              <div key={item.id} style={{ background: item.accent, borderRadius: 24, padding: '1.1rem', display: 'grid', gap: '0.55rem' }}>
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#2f2530' }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#5c5564', fontWeight: 700 }}>{item.useWhen}</p>
                <button type="button" onClick={() => onSelect(item)} style={{ justifySelf: 'start', border: 'none', borderRadius: 14, padding: '0.72rem 1rem', background: '#fff', color: '#6f4fe6', fontWeight: 800, cursor: 'pointer' }}>START</button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function EntryDetail({ entry, onBack }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p style={{ margin: 0, fontSize: '0.98rem', color: '#7f6672' }}>{formatDate(entry.date)}</p>
      </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.2rem 1rem 5rem', display: 'grid', gap: '1.2rem' }}>
        <div>
          <p style={{ margin: 0, color: '#7f6672', fontSize: '0.95rem' }}>{formatDate(entry.date)} {entry.mood?.emoji || ''}</p>
          <h1 style={{ margin: '0.55rem 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 500, color: '#2f1e2a' }}>{entry.title || 'Untitled reflection'}</h1>
        </div>
        <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', color: '#2f1e2a', fontSize: '1.05rem', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{entry.content}</div>
        <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
          <p style={sectionLabelStyle}>Clarity Score</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 92, height: 92, borderRadius: '50%', border: '8px solid #fde3ec', display: 'grid', placeItems: 'center', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{entry.clarityScore || 7}/10</div>
            <div>
              <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2f1e2a' }}>{entry.clarityLabel || 'Reflective'}</p>
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
  const [showMenu, setShowMenu] = useState(false)
  const [activeTray, setActiveTray] = useState(null)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const currentBackground = BACKGROUNDS.find(item => item.id === draft.backgroundId) || BACKGROUNDS[0]
  const currentFont = FONTS.find(item => item.id === draft.fontId) || FONTS[0]
  const wordCount = countWords(draft.content)

  useEffect(() => () => recognitionRef.current?.stop?.(), [])

  function insertText(text) {
    setDraft(prev => ({ ...prev, content: `${prev.content}${text}` }))
  }

  function insertList(prefix) {
    setDraft(prev => ({ ...prev, content: `${prev.content}${prev.content && !prev.content.endsWith('\n') ? '\n' : ''}${prefix}` }))
    setActiveTray(null)
  }

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      insertText('\n[Voice input unavailable on this browser]')
      setActiveTray(null)
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = true
    recognition.interimResults = false
    recognition.onresult = event => {
      const transcript = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim()
      if (transcript) {
        setDraft(prev => ({ ...prev, content: `${prev.content}${prev.content ? '\n' : ''}${transcript}` }))
      }
    }
    recognition.onend = () => {
      recognitionRef.current = null
    }
    recognition.start()
    recognitionRef.current = recognition
    setActiveTray(null)
  }

  function handleImagePick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setDraft(prev => ({
        ...prev,
        images: [...prev.images, { id: `${Date.now()}-${file.name}`, name: file.name, url: reader.result }],
      }))
      setActiveTray(null)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p style={{ margin: 0, flex: 1, fontSize: '1.02rem', fontWeight: 800, color: 'var(--app-accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{draft.prompt}</p>
        <button type="button" onClick={() => setShowMenu(true)} style={{ border: 'none', background: 'transparent', color: '#6e4a58' }}><MoreHorizontal size={24} /></button>
        <button type="button" onClick={onSave} disabled={isSaving} style={{ border: 'none', borderRadius: 999, padding: '0.8rem 1.25rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{isSaving ? 'Saving...' : 'Save'}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...currentBackground.style }}>
        <div style={{ position: 'relative', padding: '1rem 1rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#7f6672', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.85rem', color: currentBackground.id === 'dark-cute' ? '#fff' : '#d1588b' }}>{currentBackground.deco}</div>
          <button type="button" onClick={() => dateInputRef.current?.click()} style={{ border: 'none', background: 'transparent', padding: 0, color: '#7f6672', fontSize: '0.96rem' }}>{formatDate(draft.date)}</button>
          <input ref={dateInputRef} type="date" value={draft.date} onChange={event => setDraft(prev => ({ ...prev, date: event.target.value }))} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
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
          <textarea value={draft.content} onChange={event => setDraft(prev => ({ ...prev, content: event.target.value }))} placeholder="Start writing..." style={{ flex: 1, minHeight: '42vh', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: draft.color, fontFamily: currentFont.family, fontSize: '1.08rem', lineHeight: 1.9 }} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.7rem 0.8rem max(0.9rem, env(safe-area-inset-bottom))', display: 'grid', gap: '0.7rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8f7180', fontSize: '0.82rem' }}><span>{wordCount} words</span><span>{draft.images.length ? `${draft.images.length} image${draft.images.length === 1 ? '' : 's'}` : 'Ready to write'}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.45rem' }}>
          {[{ id: 'background', icon: Paintbrush }, { id: 'image', icon: ImageIcon }, { id: 'emoji', icon: Smile }, { id: 'font', icon: Type }, { id: 'list', icon: List }, { id: 'tag', icon: Tag }, { id: 'mic', icon: Mic }].map(item => {
            const Icon = item.icon
            return (
              <button key={item.id} type="button" onClick={() => {
                if (item.id === 'image') { fileInputRef.current?.click(); return }
                if (item.id === 'mic') { startRecording(); return }
                setActiveTray(current => (current === item.id ? null : item.id))
              }} style={{ border: 'none', background: '#fff', color: activeTray === item.id ? 'var(--app-accent)' : '#5d4450', display: 'grid', placeItems: 'center', padding: '0.25rem 0' }}>
                <Icon size={18} />
              </button>
            )
          })}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
      </div>

      <BottomSheet open={showMenu} onClose={() => setShowMenu(false)} title="">
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <button type="button" onClick={() => { setShowMenu(false); onOpenTemplates() }} style={menuRowStyle}><span>Templates</span><span>→</span></button>
          <div style={menuStatStyle}><span>Preview</span><strong>{makePreview(draft.content) || 'Nothing yet'}</strong></div>
          <div style={menuStatStyle}><span>Words</span><strong>{wordCount}</strong></div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'background'} onClose={() => setActiveTray(null)} title="Background">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
          {BACKGROUNDS.map(item => (
            <button key={item.id} type="button" onClick={() => { setDraft(prev => ({ ...prev, backgroundId: item.id })); setActiveTray(null) }} style={{ border: item.id === draft.backgroundId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 18, overflow: 'hidden', padding: 0, background: '#fff' }}>
              <div style={{ height: 76, ...item.style }} />
              <div style={{ padding: '0.7rem', textAlign: 'left', fontWeight: 700, color: '#3c2430' }}>{item.name}</div>
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'emoji'} onClose={() => setActiveTray(null)} title="Emojis & stickers">
        <div style={{ display: 'grid', gap: '1rem' }}>
          <div>
            <p style={sheetLabelStyle}>Emojis</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem' }}>
              {['😊', '😌', '🔥', '😔', '😤', '😎', '💖', '✨', '🌸', '🫶'].map(emoji => (
                <button key={emoji} type="button" onClick={() => { insertText(emoji); setActiveTray(null) }} style={emojiButtonStyle}>{emoji}</button>
              ))}
            </div>
          </div>
          <div>
            <p style={sheetLabelStyle}>Cute stickers</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.75rem' }}>
              {STICKERS.map(sticker => (
                <button key={sticker} type="button" onClick={() => { insertText(sticker); setActiveTray(null) }} style={emojiButtonStyle}>{sticker}</button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'font'} onClose={() => setActiveTray(null)} title="Font">
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
            {COLORS.map(color => (
              <button key={color} type="button" onClick={() => setDraft(prev => ({ ...prev, color }))} style={{ width: 30, height: 30, borderRadius: '50%', border: color === draft.color ? '2px solid #2f1e2a' : '1px solid #e5cdd8', background: color }} />
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
            {FONTS.map(font => (
              <button key={font.id} type="button" onClick={() => setDraft(prev => ({ ...prev, fontId: font.id }))} style={{ border: font.id === draft.fontId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 16, background: '#fff', padding: '0.9rem', fontFamily: font.family, fontSize: '1.05rem', color: '#2f1e2a' }}>{font.name}</button>
            ))}
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'list'} onClose={() => setActiveTray(null)} title="List style">
        <div style={{ display: 'grid', gap: '0.55rem' }}>
          <button type="button" onClick={() => insertList('• ')} style={menuRowStyle}><span>• Bullet points</span><span>• • •</span></button>
          <button type="button" onClick={() => insertList('☐ ')} style={menuRowStyle}><span>☐ Check list</span><span>☐ ☐ ☐</span></button>
          <button type="button" onClick={() => insertList('★ ')} style={menuRowStyle}><span>★ Star list</span><span>★ ★ ★</span></button>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'tag'} onClose={() => setActiveTray(null)} title="Tags">
        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          {['gratitude', 'clarity', 'work', 'rest', 'mindset', 'healing'].map(tag => (
            <button key={tag} type="button" onClick={() => { insertText(`${draft.content && !draft.content.endsWith(' ') ? ' ' : ''}#${tag}`); setActiveTray(null) }} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: '#fff6fa', color: 'var(--app-accent)', padding: '0.55rem 0.8rem', fontWeight: 700 }}>#{tag}</button>
          ))}
        </div>
      </BottomSheet>
    </div>
  )
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

const menuRowStyle = {
  border: '1px solid var(--app-border)',
  background: '#fff',
  borderRadius: 18,
  padding: '0.95rem 0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#2f1e2a',
  fontWeight: 700,
  fontSize: '1rem',
}

const menuStatStyle = {
  borderTop: '1px solid var(--app-border)',
  padding: '0.9rem 0.2rem 0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  color: '#7f6672',
}

const sectionLabelStyle = {
  margin: 0,
  fontSize: '0.74rem',
  fontWeight: 800,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--app-accent)',
}

const sheetLabelStyle = {
  margin: '0 0 0.55rem',
  fontSize: '0.76rem',
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: '#8f7180',
}

const emojiButtonStyle = {
  border: '1px solid var(--app-border)',
  borderRadius: 18,
  background: '#fff',
  padding: '0.8rem 0.2rem',
  fontSize: '1.5rem',
}

export default function Journal() {
  const [entries, setEntries] = useState(() => safeRead())
  const [screen, setScreen] = useState('list')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('latest')
  const [draft, setDraft] = useState(() => blankDraft())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    safeWrite(entries)
  }, [entries])

  const filteredEntries = useMemo(() => sortEntries(entries, search, sortOrder), [entries, search, sortOrder])

  function startNewEntry() {
    setDraft(blankDraft())
    setShowMoodPicker(true)
  }

  function pickMood(mood) {
    setDraft(prev => ({ ...prev, mood }))
    setShowMoodPicker(false)
    setScreen('write')
  }

  function selectTemplate(template) {
    setDraft(prev => ({ ...prev, prompt: template.name, title: '', content: template.starter }))
    setShowTemplates(false)
  }

  async function saveEntry() {
    if (!draft.content.trim()) return
    setIsSaving(true)
    setScreen('processing')
    try {
      const analysis = await generateSageAnalysis(draft)
      const entry = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        date: draft.date,
        title: draft.title.trim() || analysis.generatedTitle || 'Journal entry',
        content: draft.content,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        clarityScore: Number(analysis.clarityScore || draft.mood?.score || 7),
        clarityLabel: analysis.clarityLabel || draft.mood?.label || 'Reflective',
        sageResponse: analysis.sageResponse || '',
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
      }
      setEntries(current => [entry, ...current])
      setSelectedEntry(entry)
      setScreen('detail')
    } catch {
      const fallback = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        date: draft.date,
        title: draft.title.trim() || 'Journal entry',
        content: draft.content,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        clarityScore: draft.mood?.score || 7,
        clarityLabel: draft.mood?.label || 'Reflective',
        sageResponse: 'You captured something real here. Come back to the clearest sentence and let it guide your next step.',
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
      }
      setEntries(current => [fallback, ...current])
      setSelectedEntry(fallback)
      setScreen('detail')
    } finally {
      setIsSaving(false)
    }
  }

  if (screen === 'write') {
    return (
      <>
        <JournalWriter
          draft={draft}
          setDraft={setDraft}
          onBack={() => setScreen('list')}
          onSave={saveEntry}
          onOpenTemplates={() => setShowTemplates(true)}
          isSaving={isSaving}
        />
        {showTemplates ? <TemplatesPage onBack={() => setShowTemplates(false)} onSelect={selectTemplate} /> : null}
      </>
    )
  }

  if (screen === 'processing') {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center', background: '#fff', padding: '2rem' }}>
        <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <div style={{ width: 88, height: 88, margin: '0 auto', borderRadius: '50%', border: '6px solid #fde2ec', borderTopColor: 'var(--app-accent)', animation: 'phasr-spin 1s linear infinite' }} />
          <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#3b2330' }}>Sage is reading your entry...</p>
          <style>{`@keyframes phasr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (screen === 'detail' && selectedEntry) {
    return <EntryDetail entry={selectedEntry} onBack={() => setScreen('list')} />
  }

  return (
    <>
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1rem 1rem 5.5rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fff6fa', border: '1px solid var(--app-border)', borderRadius: 22, padding: '0.8rem 0.85rem', boxShadow: '0 12px 28px rgba(86,53,66,0.05)' }}>
            <Search size={18} color="#8b6977" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search entries..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.98rem', color: 'var(--app-text)', minWidth: 0 }} />
            <button type="button" onClick={() => setShowSortSheet(true)} style={{ width: 42, height: 42, border: '1px solid var(--app-border)', borderRadius: 16, background: '#fff', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' }}>↕</button>
          </div>

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {filteredEntries.map(entry => (
              <button key={entry.id} type="button" onClick={() => { setSelectedEntry(entry); setScreen('detail') }} style={{ border: 'none', background: '#fff', borderBottom: '1px solid var(--app-border)', padding: '0.4rem 0.1rem 1rem', textAlign: 'left', display: 'grid', gap: '0.32rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
                  <span style={{ color: '#8f7180', fontSize: '0.96rem' }}>{formatDate(entry.date)}</span>
                  <span style={{ color: 'var(--app-accent)', fontSize: '0.86rem', fontWeight: 700 }}>{entry.title || 'Untitled'}</span>
                </div>
                <p style={{ margin: 0, color: '#3c2430', fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.4 }}>{entry.title || 'Untitled reflection'}</p>
                <p style={{ margin: 0, color: '#8f7180', fontSize: '0.94rem', lineHeight: 1.55 }}>{makePreview(entry.content) || 'Start writing...'}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.22rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', borderRadius: 999, border: '1px solid var(--app-border)', padding: '0.35rem 0.72rem', color: '#6d5862', fontSize: '0.84rem', fontWeight: 700, background: '#fff9fb' }}>
                    <span>{entry.mood?.emoji || '😊'}</span>
                    <span>{entry.clarityLabel || 'Reflective'}</span>
                    <span>· {entry.clarityScore || 7}/10</span>
                  </span>
                </div>
              </button>
            ))}

            {!filteredEntries.length ? <div style={{ borderRadius: 24, border: '1px solid var(--app-border)', background: '#fff', padding: '1.2rem', color: '#8f7180', textAlign: 'center' }}>No entries yet. Tap the plus button to start.</div> : null}
          </div>
        </div>

        <button type="button" onClick={startNewEntry} style={{ position: 'fixed', right: '50%', transform: 'translateX(50%)', bottom: '1.2rem', width: 68, height: 68, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', boxShadow: '0 18px 28px rgba(232,64,122,0.28)', display: 'grid', placeItems: 'center', zIndex: 8 }}>
          <Plus size={30} />
        </button>
      </div>

      <BottomSheet open={showSortSheet} onClose={() => setShowSortSheet(false)} title="Sort entries">
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {[{ id: 'latest', label: 'Latest first' }, { id: 'oldest', label: 'Oldest first' }].map(option => (
            <button key={option.id} type="button" onClick={() => { setSortOrder(option.id); setShowSortSheet(false) }} style={menuRowStyle}>
              <span>{option.label}</span>
              {option.id === sortOrder ? <span>✓</span> : null}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showMoodPicker} onClose={() => setShowMoodPicker(false)} title={null}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}><p style={{ margin: 0, color: '#af8396', fontSize: '1rem' }}>How are you feeling right now?</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.8rem' }}>
          {MOODS.map(mood => (
            <button key={mood.label} type="button" onClick={() => pickMood(mood)} style={{ border: 'none', background: 'transparent', display: 'grid', justifyItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{mood.emoji}</span>
              <span style={{ fontSize: '0.72rem', color: '#8f7180' }}>{mood.label}</span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setDraft(prev => ({ ...prev, mood: MOODS[0] })); setShowMoodPicker(false); setScreen('write') }} style={{ marginTop: '1rem', border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1rem', width: '100%' }}>Skip for now →</button>
      </BottomSheet>
    </>
  )
}
