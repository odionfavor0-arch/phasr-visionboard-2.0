import { useEffect, useMemo, useRef, useState } from 'react'
// eslint-disable-next-line no-unused-vars -- used via JSX member expressions (motion.div, motion.button)
import { motion, AnimatePresence } from 'framer-motion'
import EmojiPicker from 'emoji-picker-react'
import {
  ArrowRight,
  ArrowUpDown,
  ArrowLeft,
  CheckSquare,
  Heart,
  Image as ImageIcon,
  List,
  ListOrdered,
  Mic,
  Minus,
  MoreHorizontal,
  Paintbrush,
  Pencil,
  Plus,
  Search,
  Smile,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Type,
  Volume2,
  X,
} from 'lucide-react'
import { calculateUserPoints } from '../lib/userLevel'
import { applyDifficultyDial, getDateKeyFromDate, getTodayTask, getWeekCompletionSummary } from '../lib/lockIn'
import { getDialPayoffLine } from '../lib/dialCopy'
import { syncJournalEntriesDelta } from '../lib/supabaseSync'
import { supabase } from '../lib/supabase'

const ACTIVE_USER_KEY = 'phasr_active_user'
const STORAGE_KEY = 'phasr_journal_v2'
const WEEKLY_PULSE_DATE_KEY = 'phasr_weekly_pulse_date'
const WEEKLY_PULSE_COMPLETION_KEY = 'phasr_weekly_pulse_completion'
const WEEKLY_PULSE_W1_DONE_KEY = 'phasr_weekly_pulse_w1_done'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const MS_IN_DAY = 24 * 60 * 60 * 1000

const WEEKLY_WORKED_CHIPS = ['Routine clicked', 'Had energy', 'Kept it small']
const WEEKLY_SLIPPED_CHIPS = ['Needed rest', 'Got busy', 'Lost steam']

const PROMPTS = [
  "What's on your mind?",
  'What needs attention?',
  'What shifted today?',
]

const MOODS = [
  { emoji: '😌', label: 'Calm', score: 8 },
  { emoji: '🎯', label: 'Focused', score: 9 },
  { emoji: '🌙', label: 'Reflective', score: 5 },
  { emoji: '😣', label: 'Stressed', score: 3 },
  { emoji: '💪', label: 'Confident', score: 8 },
  { emoji: '⚡', label: 'Energised', score: 9 },
]

const TEMPLATES = [
  {
    id: 'daily-quick-start',
    tier: 'Basic',
    name: 'Daily quick start',
    useWhen: 'Use this when you open the app and need a grounded starting point.',
    accent: '#f6d7f7',
    fields: [
      { label: 'What matters most today?', subtext: 'Name the one thing that deserves your strongest focus.' },
      { label: 'What is one thing I must complete?', subtext: 'Be specific about the task that truly needs to get done.' },
      { label: 'What might distract me?', subtext: 'Write down the pattern, person, or habit that could pull you off course.' },
      { label: 'How do I want to feel today?', subtext: 'Choose the energy you want to carry into your day.' },
    ],
  },
  {
    id: 'gratitude-diary',
    tier: 'Basic',
    name: 'Gratitude diary',
    useWhen: 'Use this when you want to slow down and notice what is good.',
    accent: '#ffe8cc',
    fields: [
      { label: 'What am I grateful for today?', subtext: 'Name the people, moments, or things that mattered today.' },
      { label: 'Why does this matter to me?', subtext: 'Go one layer deeper and write why it touched you.' },
      { label: 'What moment made me smile today?', subtext: 'Capture the smallest bright moment you want to remember.' },
    ],
  },
  {
    id: 'clarity-reset',
    tier: 'Basic',
    name: 'Clarity reset',
    useWhen: 'Use this when your mind feels crowded and you need clarity.',
    accent: '#ffe3ef',
    fields: [
      { label: 'What is bothering me right now?', subtext: 'Be specific about the thought, pressure, or situation.' },
      { label: 'Why is this affecting me?', subtext: 'Write what part of this feels heavy or hard to carry.' },
      { label: 'What do I need instead?', subtext: 'Name the clarity, space, support, or action you need.' },
      { label: 'What is one step I can take today?', subtext: 'Choose the smallest move that would change the energy.' },
    ],
  },
  {
    id: 'overthinking-dump',
    tier: 'Pro',
    name: 'Overthinking dump',
    useWhen: 'Use this when your head is loud and you need to clear mental noise.',
    accent: '#dff1ff',
    fields: [
      { label: 'What is on my mind right now?', subtext: 'Let the first thought out without cleaning it up.' },
      { label: 'What am I overthinking?', subtext: 'Name the loop you keep replaying in your head.' },
      { label: 'What is in my control?', subtext: 'Separate what you can act on from what you cannot.' },
      { label: 'What can I ignore for now?', subtext: 'Give yourself permission to put something down.' },
    ],
  },
  {
    id: 'unsent-message',
    tier: 'Pro',
    name: 'Unsent message',
    useWhen: 'Use this when there is something you wish you could say.',
    accent: '#fce1ea',
    fields: [
      { label: 'What do I wish I could say?', subtext: 'Write the message exactly as it wants to come out.' },
      { label: "Why haven't I said it?", subtext: 'Be honest about fear, timing, or what is holding you back.' },
      { label: 'How do I truly feel about this?', subtext: 'Name the feeling under the words.' },
    ],
  },
  {
    id: 'decision-helper',
    tier: 'Pro',
    name: 'Decision helper',
    useWhen: 'Use this when you feel stuck between options.',
    accent: '#e5f7ef',
    fields: [
      { label: 'What decision am I trying to make?', subtext: 'State the decision clearly in one sentence.' },
      { label: 'What are my options?', subtext: 'List the real choices in front of you.' },
      { label: 'What feels right long term?', subtext: 'Think beyond pressure and focus on the life you are building.' },
      { label: 'What is the next small step?', subtext: 'Pick one move that gives you more clarity.' },
      { label: 'What would you tell a friend in this situation?', subtext: "You'd see it clearly if it were someone else." },
      { label: 'What are you actually afraid of?', subtext: 'The blocker is usually fear, not missing information.' },
      // {{PILLARS}} is resolved at template-apply time (see resolveTemplateFields)
      // by reading her actual vision board pillars — this question has to name
      // HER goals, not a generic "what you want" prompt.
      { label: 'Which option moves you toward what you said you wanted?', subtext: 'Think about {{PILLARS}} — which option actually moves you toward that?' },
    ],
  },
  {
    id: 'bible-study',
    tier: 'Pro',
    name: 'Bible study',
    useWhen: 'Use this when you want to sit with scripture and let it speak to your life.',
    accent: '#f5ecd7',
    fields: [
      { label: 'What passage did I read today?', subtext: 'Note the book, chapter, and verses.' },
      { label: 'What stood out to me?', subtext: 'Write the verse or phrase that caught your attention.' },
      { label: 'What is this saying to me?', subtext: 'Consider the meaning behind what stood out.' },
      { label: 'How will I apply this today?', subtext: 'Name one concrete way to live this out.' },
      { label: 'What is my prayer in response?', subtext: 'Write it in your own words.' },
    ],
  },
]

// `bg` + `gradient` kept separate (rather than one opaque `background` shorthand)
// so the paper system below can layer its own pattern as an additional
// background-image on top of a theme's gradient without one clobbering the
// other — a shorthand `background` and a longhand `backgroundImage` applied as
// two separate React style keys fight over the same CSS property.
const BACKGROUNDS = [
  { id: 'original', name: 'Original', bg: '#ffffff', gradient: null, deco: '' },
  { id: 'rosy', name: 'Rosy', bg: '#fff8fb', gradient: 'linear-gradient(180deg, #fff8fb 0%, #ffe9f2 100%)', deco: '🌸 ✨ 🌸' },
  { id: 'dark-cute', name: 'Dark Cute', bg: '#2d1730', gradient: 'linear-gradient(180deg, #2d1730 0%, #4f274d 100%)', textColor: '#fff7fb', deco: '🌙 ✨ 🌙' },
  { id: 'butterfly', name: 'Butterfly', bg: '#eef1ff', gradient: 'linear-gradient(180deg, #eef1ff 0%, #f7ebff 100%)', deco: '🦋 ✨ 🦋' },
  { id: 'bows', name: 'Bows', bg: '#fff3f7', gradient: 'linear-gradient(180deg, #fff3f7 0%, #fffdfd 100%)', deco: '🎀 ✨ 🎀' },
]

// Combines a background theme's own color/gradient with the paper pattern
// selected on top of it — the two systems are picked independently but must
// render as one coherent surface, paper lines drawn above the theme wash.
function getPaperLayeredStyle(theme, paperStyleId, lineColor, spacingPx) {
  const paperImage = getPaperBackgroundImage(paperStyleId, lineColor, spacingPx)
  const hasPaper = paperImage !== 'none'
  const imageLayers = []
  const sizeLayers = []
  if (hasPaper) {
    imageLayers.push(paperImage)
    sizeLayers.push(getPaperBackgroundSize(paperStyleId, spacingPx))
  }
  if (theme.gradient) {
    imageLayers.push(theme.gradient)
    sizeLayers.push('auto')
  }
  return {
    backgroundColor: theme.bg,
    backgroundImage: imageLayers.length ? imageLayers.join(', ') : 'none',
    backgroundSize: sizeLayers.length ? sizeLayers.join(', ') : undefined,
    color: theme.textColor,
  }
}

const COLORS = ['#2f1e2a', '#7b243e', '#b03060', 'var(--app-accent)', '#ff7aaa', '#6e2fb8', '#3a4a6b', '#2f6b4f', '#8a5a2f', '#5b4636']

// A few of each register, per the brief: sans for clean default reading, serif for
// warmth (Fraunces already carries the app's own voice elsewhere), handwriting for
// a genuinely personal page. All three already load in index.html.
const FONTS = [
  { id: 'general-sans', name: 'Sans', tier: 'sans', family: "'General Sans', sans-serif" },
  { id: 'fraunces', name: 'Fraunces', tier: 'serif', family: "'Fraunces', serif" },
  { id: 'playfair', name: 'Playfair', tier: 'serif', family: "'Playfair Display', serif" },
  { id: 'georgia', name: 'Georgia', tier: 'serif', family: 'Georgia, serif' },
  { id: 'caveat', name: 'Caveat', tier: 'handwriting', family: "'Caveat', cursive" },
  { id: 'patrick-hand', name: 'Patrick Hand', tier: 'handwriting', family: "'Patrick Hand', cursive" },
]

const TEXT_TIERS = [
  { id: 'headline', label: 'Headline', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
  { id: 'subheadline', label: 'Subheadline', fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.35 },
  { id: 'body', label: 'Body', fontSize: '1.08rem', fontWeight: 400, lineHeight: 1.9 },
]

// Paper is a texture layered on top of a background theme's color, not a
// replacement for it — every function below returns only a background-image
// (lines/grid/dots), leaving the theme's own background/gradient untouched
// underneath. CSS patterns, not images, so they tint correctly over any theme.
const PAPER_STYLES = [
  { id: 'plain', name: 'Plain' },
  { id: 'lined', name: 'Lined' },
  { id: 'grid', name: 'Grid' },
  { id: 'dotted', name: 'Dotted' },
]

const PAPER_LINE_COLORS = [
  { id: 'rose', value: 'rgba(232,64,122,0.22)' },
  { id: 'lavender', value: 'rgba(120,100,200,0.2)' },
  { id: 'slate', value: 'rgba(90,100,120,0.22)' },
  { id: 'graphite', value: 'rgba(40,30,35,0.16)' },
  { id: 'gold', value: 'rgba(180,140,40,0.22)' },
]

const PAPER_SPACINGS = [
  { id: 'tight', label: 'Tight', px: 22 },
  { id: 'regular', label: 'Regular', px: 30 },
  { id: 'wide', label: 'Wide', px: 40 },
]

function getPaperBackgroundImage(paperStyleId, lineColor, spacingPx) {
  const gap = Number(spacingPx) || 30
  if (paperStyleId === 'lined') {
    return `repeating-linear-gradient(to bottom, transparent 0, transparent ${gap - 1}px, ${lineColor} ${gap - 1}px, ${lineColor} ${gap}px)`
  }
  if (paperStyleId === 'grid') {
    return `repeating-linear-gradient(to bottom, transparent 0, transparent ${gap - 1}px, ${lineColor} ${gap - 1}px, ${lineColor} ${gap}px), repeating-linear-gradient(to right, transparent 0, transparent ${gap - 1}px, ${lineColor} ${gap - 1}px, ${lineColor} ${gap}px)`
  }
  if (paperStyleId === 'dotted') {
    return `radial-gradient(circle, ${lineColor} 1.2px, transparent 1.2px)`
  }
  return 'none'
}

function getPaperBackgroundSize(paperStyleId, spacingPx) {
  const gap = Number(spacingPx) || 30
  return paperStyleId === 'dotted' || paperStyleId === 'grid' ? `${gap}px ${gap}px` : `100% ${gap}px`
}

// ── Stickers ────────────────────────────────────────────────────────────────
// Real vector graphics, not emoji characters — per the brief, this must not be
// text. A handful of hand-picked shapes, each recolored across the app's own
// Petal/slate/gold palette, gets us a real ~30-piece sheet without needing 30
// one-off illustrations.
const STICKER_PALETTE = {
  petal: '#f06090',
  petalLight: '#f78fb0',
  petalBlush: '#fcc0d4',
  slate: '#4a6cf7',
  gold: '#dba53c',
  mint: '#4fb286',
}

const STICKER_SHAPE_PATHS = {
  heart: 'M12 21s-7.5-4.6-10-9.3C.5 8.4 2.3 5 5.8 5c2 0 3.4 1.1 4.2 2.4C10.8 6.1 12.2 5 14.2 5 17.7 5 19.5 8.4 22 11.7 19.5 16.4 12 21 12 21z',
  star: 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7L2 9.2l7.1-.6L12 2z',
  sparkle: 'M12 1c.7 4.6 2.7 6.7 7 7.4-4.3.7-6.3 2.8-7 7.4-.7-4.6-2.7-6.7-7-7.4 4.3-.7 6.3-2.8 7-7.4z',
  moon: 'M20 14.8A8.7 8.7 0 1 1 9.2 4a7.2 7.2 0 1 0 10.8 10.8z',
  bow: 'M12 12 5.4 7.3A2 2 0 0 0 2 8.9v6.2a2 2 0 0 0 3.4 1.6L12 12Zm0 0 6.6 4.7A2 2 0 0 0 22 15.1V8.9a2 2 0 0 0-3.4-1.6L12 12Z',
  flame: 'M12 2c1.2 3.3-2.6 4.4-2.6 8.2a2.6 2.6 0 0 0 5.2 0c0-1-.4-1.9-.9-2.4.7 2.8 2.8 3.4 2.8 6.1a5 5 0 0 1-10 0c0-5 4.3-6.2 5.5-11.9z',
  drop: 'M12 2c3.6 4.6 6.5 8.6 6.5 12.3a6.5 6.5 0 1 1-13 0C5.5 10.6 8.4 6.6 12 2z',
}

function StickerGlyph({ shapeId, color, size = 26 }) {
  const path = STICKER_SHAPE_PATHS[shapeId] || STICKER_SHAPE_PATHS.heart
  if (shapeId === 'flower') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <g fill={color}>
          <circle cx="12" cy="6.6" r="3.1" /><circle cx="17.4" cy="12" r="3.1" />
          <circle cx="12" cy="17.4" r="3.1" /><circle cx="6.6" cy="12" r="3.1" />
        </g>
        <circle cx="12" cy="12" r="2.4" fill="#fff8fa" />
      </svg>
    )
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={path} fill={color} />
    </svg>
  )
}

const STICKERS = [
  ...['petal', 'petalLight', 'petalBlush', 'slate'].map(c => ({ id: `heart-${c}`, shape: 'heart', color: STICKER_PALETTE[c] })),
  ...['petal', 'gold', 'petalLight', 'slate'].map(c => ({ id: `star-${c}`, shape: 'star', color: STICKER_PALETTE[c] })),
  ...['petal', 'gold', 'petalLight', 'petalBlush'].map(c => ({ id: `sparkle-${c}`, shape: 'sparkle', color: STICKER_PALETTE[c] })),
  ...['petal', 'petalLight', 'gold', 'mint'].map(c => ({ id: `flower-${c}`, shape: 'flower', color: STICKER_PALETTE[c] })),
  ...['slate', 'petal', 'gold'].map(c => ({ id: `moon-${c}`, shape: 'moon', color: STICKER_PALETTE[c] })),
  ...['petal', 'petalLight', 'petalBlush'].map(c => ({ id: `bow-${c}`, shape: 'bow', color: STICKER_PALETTE[c] })),
  ...['petal', 'gold', 'slate'].map(c => ({ id: `flame-${c}`, shape: 'flame', color: STICKER_PALETTE[c] })),
  ...['slate', 'petal', 'mint'].map(c => ({ id: `drop-${c}`, shape: 'drop', color: STICKER_PALETTE[c] })),
  { id: 'heart-mint', shape: 'heart', color: STICKER_PALETTE.mint },
  { id: 'star-mint', shape: 'star', color: STICKER_PALETTE.mint },
]

// ── List styles ─────────────────────────────────────────────────────────────
// The old picker inserted the literal string '?' for both Check list and Star
// list — a real glyph-loss bug. Every marker below is a plain-text character
// that renders everywhere (content must stay plain text for Sage), paired with
// a real lucide icon in the picker row itself instead of a second unicode char.
const LIST_STYLES = [
  { id: 'bullet', label: 'Bullet points', icon: List, prefix: '• ' },
  { id: 'check', label: 'Check list', icon: CheckSquare, prefix: '☐ ' },
  { id: 'star', label: 'Star list', icon: Star, prefix: '★ ' },
  { id: 'arrow', label: 'Arrows', icon: ArrowRight, prefix: '→ ' },
  { id: 'dash', label: 'Dashes', icon: Minus, prefix: '– ' },
  { id: 'heart', label: 'Hearts', icon: Heart, prefix: '♥ ' },
  { id: 'numbered', label: 'Numbered', icon: ListOrdered, prefix: null },
]

const TAG_SUGGESTIONS = ['gratitude', 'clarity', 'work', 'rest', 'mindset', 'healing']

const MAX_JOURNAL_IMAGE_WIDTH = 1280

function resizeImageFileToJpegDataUrl(file, maxDim = MAX_JOURNAL_IMAGE_WIDTH, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const probe = new Image()
    probe.onload = () => {
      const scale = Math.min(1, maxDim / probe.naturalWidth, maxDim / probe.naturalHeight)
      const outWidth = Math.round(probe.naturalWidth * scale)
      const outHeight = Math.round(probe.naturalHeight * scale)
      const canvas = document.createElement('canvas')
      canvas.width = outWidth
      canvas.height = outHeight
      canvas.getContext('2d').drawImage(probe, 0, 0, outWidth, outHeight)
      URL.revokeObjectURL(objectUrl)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    probe.onerror = () => { URL.revokeObjectURL(objectUrl); reject(new Error('Could not read image')) }
    probe.src = objectUrl
  })
}

// Never throws — a failed Storage upload falls back to the local data URL so the
// photo (and everything she wrote around it) is never lost, matching the same
// graceful-degradation pattern VisionBoard.jsx already uses for its own uploads.
async function uploadJournalImage(file) {
  const dataUrl = await resizeImageFileToJpegDataUrl(file)
  if (!supabase) return dataUrl
  try {
    const userId = localStorage.getItem(ACTIVE_USER_KEY) || 'local'
    const path = `journal/${userId}/${Date.now()}-${Math.round(Math.random() * 1e6)}.jpg`
    const byteStr = atob(dataUrl.split(',')[1])
    const bytes = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i)
    const { error: uploadError } = await supabase.storage
      .from('room-feed')
      .upload(path, new Blob([bytes], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: true })
    if (uploadError) throw uploadError
    const { data: urlData } = supabase.storage.from('room-feed').getPublicUrl(path)
    return urlData?.publicUrl || dataUrl
  } catch (error) {
    console.warn('[Phasr] Journal image storage upload failed, keeping photo local-only:', error?.message || error)
    return dataUrl
  }
}

const IMAGE_SIZE_PRESETS = [
  { id: 'small', label: 'S', width: 96 },
  { id: 'medium', label: 'M', width: 160 },
  { id: 'large', label: 'L', width: 240 },
]

function getScopedKey(base) {
  const id = localStorage.getItem(ACTIVE_USER_KEY) || ''
  return id ? `${base}:${id}` : base
}

function scopedGetItem(base) {
  const scopedKey = getScopedKey(base)
  const scopedValue = localStorage.getItem(scopedKey)
  if (scopedValue != null) return scopedValue
  const legacyValue = localStorage.getItem(base)
  if (legacyValue != null) localStorage.setItem(scopedKey, legacyValue)
  return legacyValue
}

function scopedSetItem(base, value) {
  localStorage.setItem(getScopedKey(base), value)
}

function safeRead() {
  try {
    const raw = scopedGetItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return dedupeEntriesById(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}

function safeWrite(entries) {
  scopedSetItem(STORAGE_KEY, JSON.stringify(entries))
}

// Local calendar date, not UTC — see lib/lockIn.js's getDateKeyFromDate for why
// .toISOString() silently shifts a day backward at positive UTC offsets.
function getToday() {
  return getDateKeyFromDate()
}

function markWeeklyPulseDoneIfWeekOne(weekNumber) {
  if (Number(weekNumber) !== 1) return
  scopedSetItem(WEEKLY_PULSE_W1_DONE_KEY, 'true')
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

function makeTwoParagraphPreview(text) {
  const raw = String(text || '').trim()
  if (!raw) return ''

  // Prefer real paragraphs, otherwise fall back to "two chunks" split by line breaks.
  const paragraphs = raw
    .split(/\n\s*\n+/)
    .map(part => part.trim())
    .filter(Boolean)

  const picked = (paragraphs.length ? paragraphs : raw.split(/\n+/).map(p => p.trim()).filter(Boolean))
    .slice(0, 2)
    .join('\n\n')

  if (!picked) return ''
  // Keep it readable on mobile: ~2 paragraphs or ~360 chars max.
  const clean = picked.replace(/[ \t]+\n/g, '\n').trim()
  return clean.length > 360 ? `${clean.slice(0, 360).trim()}...` : clean
}

function getTemplateSummary(entry) {
  if (!entry?.templateFields || !entry?.templateAnswers) return String(entry?.content || '')
  return entry.templateFields
    .map(field => `${field.label}\n${entry.templateAnswers?.[field.label] || ''}`.trim())
    .filter(Boolean)
    .join('\n\n')
}

function getEntryTitle(entryOrDraft, generatedTitle = '') {
  if (entryOrDraft?.templateFields && entryOrDraft?.prompt) return entryOrDraft.prompt
  const manualTitle = String(entryOrDraft?.title || '').trim()
  if (manualTitle) return manualTitle
  return String(generatedTitle || generateFallbackTitle(entryOrDraft)).trim() || 'Journal entry'
}

function generateFallbackTitle(draft) {
  if (draft.templateFields) {
    return draft.prompt || 'Journal entry'
  }
  return makePreview(draft.content).split(/[.!?]/)[0] || 'Journal entry'
}

function normalizeLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// One reflection = one entry, no matter which local/Supabase copy it was loaded from.
// Keeps the first-seen occurrence of each id (arrays here are already newest-first).
function dedupeEntriesById(entries) {
  const seen = new Set()
  const deduped = []
  for (const entry of entries || []) {
    const key = String(entry?.id ?? '')
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(entry)
  }
  return deduped
}

// A weekly reflection is uniquely identified by (phase, week number), not by id —
// the completion flag that gates re-prompting lives in a separate, device-local
// localStorage key that never syncs to Supabase, so it can go stale (new device,
// cleared storage) while the actual entry already exists. Falling back to this
// check on the synced `entries` array is what stops that stale flag from letting
// the same reflection be saved twice under two different ids/dates.
function findExistingWeeklyPulseEntry(entries, phaseName, weekNumber) {
  const phaseKey = normalizeLabel(phaseName || 'phase 1')
  const week = Number(weekNumber || 1)
  return (entries || []).find(entry =>
    entry?.weeklyPulseMeta &&
    normalizeLabel(entry.weeklyPulseMeta.phaseName || 'phase 1') === phaseKey &&
    Number(entry.weeklyPulseMeta.weekNumber || 1) === week
  ) || null
}

// Retroactive repair for duplicates the pre-fix bug already created: before
// findExistingWeeklyPulseEntry existed, every weekly-pulse save minted a new
// id + `date: getToday()` with no check for an existing reflection, so a
// second trigger for the same (phase, week) — e.g. a stale/unsynced
// completion flag — wrote a second entry under a different id, dated
// whatever day that second write happened to land on. Those two rows share
// no id, so id-based dedupeEntriesById can't merge them. Group by the same
// (phase, week) identity findExistingWeeklyPulseEntry uses, keep the
// earliest-dated copy (the true original write date), drop the rest.
function mergeWeeklyPulseDuplicates(entries) {
  const list = entries || []
  const keepByKey = new Map()
  const dropIds = new Set()
  list.forEach(entry => {
    if (!entry?.weeklyPulseMeta) return
    const key = `${normalizeLabel(entry.weeklyPulseMeta.phaseName || 'phase 1')}::${Number(entry.weeklyPulseMeta.weekNumber || 1)}`
    const current = keepByKey.get(key)
    if (!current) {
      keepByKey.set(key, entry)
      return
    }
    const earlier = String(current.date || '') <= String(entry.date || '') ? current : entry
    const later = earlier === current ? entry : current
    keepByKey.set(key, earlier)
    dropIds.add(String(later.id))
  })
  if (!dropIds.size) return entries
  return list.filter(entry => !dropIds.has(String(entry.id)))
}

function removeDashPunctuation(text) {
  return String(text || '').replace(/[-—–]/g, '').replace(/\s+/g, ' ').trim()
}

function readVisionBoardData() {
  try {
    const direct = scopedGetItem('phasr_vb')
    if (direct) return JSON.parse(direct)
  } catch {
    // ignore
  }
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('phasr_vb:'))
    for (const key of keys) {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw)
      if (parsed && Array.isArray(parsed.phases) && parsed.phases.length) return parsed
    }
  } catch {
    // ignore
  }
  return null
}

function getActivePhase(boardData) {
  const phases = Array.isArray(boardData?.phases) ? boardData.phases : []
  if (!phases.length) return null
  if (typeof boardData?.activePhaseIndex === 'number' && phases[boardData.activePhaseIndex]) {
    return phases[boardData.activePhaseIndex]
  }
  if (boardData?.activePhaseId) {
    const activeById = phases.find(phase => phase?.id === boardData.activePhaseId)
    if (activeById) return activeById
  }
  return phases[0]
}

// Reads her actual vision board pillars (not a placeholder) so the Decision
// helper's "what you said you wanted" question names her real goals.
function getActivePillarNames() {
  const boardData = readVisionBoardData()
  const phase = getActivePhase(boardData)
  return (phase?.pillars || []).map(pillar => String(pillar?.name || '').trim()).filter(Boolean)
}

function resolveTemplateFields(fields) {
  const pillarNames = getActivePillarNames()
  const pillarText = pillarNames.length
    ? pillarNames.length === 1
      ? pillarNames[0]
      : `${pillarNames.slice(0, -1).join(', ')} or ${pillarNames[pillarNames.length - 1]}`
    : 'what you said you wanted'
  return fields.map(field => ({
    ...field,
    subtext: String(field.subtext || '').replace('{{PILLARS}}', pillarText),
  }))
}

function getPlatformDaysIn() {
  const boardData = readVisionBoardData()
  const phase = getActivePhase(boardData)
  const savedStart =
    localStorage.getItem('phasr_joined_at') ||
    localStorage.getItem('phasr_phase1_start_date') ||
    phase?.startDate ||
    getDateKeyFromDate()
  const start = new Date(`${String(savedStart).slice(0, 10)}T12:00:00`)
  if (Number.isNaN(start.getTime())) return 1
  return Math.max(1, Math.floor((Date.now() - start.getTime()) / MS_IN_DAY) + 1)
}

// Only feeds the "is a reflection due" gate below (weeklyPulseDue) — kept separate from
// the actual reflection content, which now pulls its real numbers straight from
// lib/lockIn.js's getWeekCompletionSummary instead of this file's own day-counting.
function buildWeeklyPulsePayload() {
  const boardData = readVisionBoardData()
  const phase = getActivePhase(boardData) || (Array.isArray(boardData?.phases) ? boardData.phases[0] : null)
  const phaseName = String(phase?.name || 'Phase 1').trim()
  const phaseStart = phase?.startDate ? new Date(`${phase.startDate}T12:00:00`) : null
  const currentWeekNumber = phaseStart && !Number.isNaN(phaseStart.getTime())
    ? Math.max(1, Math.floor((Date.now() - phaseStart.getTime()) / (7 * MS_IN_DAY)) + 1)
    : 1

  return {
    phaseName: removeDashPunctuation(phaseName),
    currentWeekNumber,
  }
}

function countWords(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length
}

function localEmotionProfile(content = '') {
  const text = String(content || '').toLowerCase()
  const hasAny = (...terms) => terms.some(term => text.includes(term))

  if (hasAny('overwhelmed', 'stressed', 'anxious', 'panic', 'drained', 'tired', 'heavy')) {
    return { clarityScore: 4, clarityLabel: 'Stressed' }
  }
  if (hasAny('avoiding', 'avoid', 'procrastinat', 'stuck', 'confused', 'unsure')) {
    return { clarityScore: 5, clarityLabel: 'Avoidant' }
  }
  if (hasAny('angry', 'frustrated', 'annoyed', 'upset', 'mad')) {
    return { clarityScore: 5, clarityLabel: 'Angry' }
  }
  if (hasAny('grateful', 'calm', 'peace', 'grounded', 'steady')) {
    return { clarityScore: 8, clarityLabel: 'Calm' }
  }
  if (hasAny('focused', 'productive', 'momentum', 'clear', 'decided', 'progress')) {
    return { clarityScore: 8, clarityLabel: 'Focused' }
  }
  return { clarityScore: 6, clarityLabel: 'Reflective' }
}

function localSageResponse({ content = '', prompt = '', clarityLabel = 'Reflective' }) {
  const text = String(content || '').trim()
  const preview = makePreview(text)
  const lowerPrompt = String(prompt || '').toLowerCase()
  const isWeekly = lowerPrompt.includes('week') || lowerPrompt.includes('check-in') || lowerPrompt.includes('weekly')

  if (isWeekly) {
    let pattern = 'You are showing effort and there is real intention here. The pattern is that pressure still changes your rhythm.'
    let correction = 'Protect one non negotiable block this week and treat it like a promise to yourself.'
    let focus = 'Coming week focus: be consistent on hard days, not only on easy ones.'

    const low = text.toLowerCase()
    if (low.includes('avoid') || low.includes('fear')) {
      pattern = 'Fear is quietly deciding what gets postponed. That is the thread running through your week.'
      correction = 'Start with the one task you have been avoiding and give it a fixed time.'
      focus = 'Coming week focus: one uncomfortable action each day.'
    } else if (low.includes('relationship') || low.includes('friend') || low.includes('partner') || low.includes('family')) {
      pattern = 'You are carrying unsaid things and that emotional weight is spilling into everything else.'
      correction = 'Have one direct conversation you have been delaying and keep it honest and simple.'
      focus = 'Coming week focus: clarity in relationships over silent assumptions.'
    } else if (low.includes('identity') || low.includes('perform') || low.includes('approval')) {
      pattern = 'You are torn between being real and being accepted. That tension is showing in your choices.'
      correction = 'Choose one decision this week that reflects your values, not performance.'
      focus = 'Coming week focus: identity before image.'
    }

    return `${pattern}\n\n${correction}\n\n${focus}`
  }

  const toneLine = clarityLabel === 'Stressed'
    ? 'That weight is real. You are carrying a lot right now.'
    : clarityLabel === 'Focused'
      ? 'Your momentum is visible. You are not just thinking, you are moving.'
      : `I can feel where your head is right now: ${clarityLabel.toLowerCase()}.`

  const step = clarityLabel === 'Stressed'
    ? 'Pick one small action you can finish in 15 minutes and let that reset your energy.'
    : clarityLabel === 'Avoidant'
      ? 'Start with the task you are avoiding for just 10 minutes. Action will clear the fog.'
      : 'Choose one sentence from this entry as your anchor for tomorrow, and act on it first.'

  return `${toneLine} ${preview ? `You said: "${preview}". ` : ''}${step}`.trim()
}

function blankDraft() {
  return {
    date: getToday(),
    title: '',
    subheadline: '',
    content: '',
    prompt: PROMPTS[0],
    mood: MOODS[0],
    tags: [],
    backgroundId: 'original',
    paperStyleId: 'plain',
    paperLineColorId: 'rose',
    paperSpacingId: 'regular',
    bookFrame: false,
    templateAccent: '',
    templateFields: null,
    templateAnswers: {},
    weeklyPulsePhaseName: '',
    weeklyPulsePillars: [],
    weeklyPulseWeekNumber: 1,
    color: '#2f1e2a',
    fontId: 'general-sans',
    images: [],
    stickers: [],
  }
}

async function generateSageAnalysis({ title, content, mood, prompt, isWeeklyPulse = false }) {
  const localProfile = localEmotionProfile(content)
  const localFallback = {
    generatedTitle: title || prompt || makePreview(content) || 'Journal entry',
    clarityScore: Number(localProfile.clarityScore || 6),
    clarityLabel: localProfile.clarityLabel || 'Reflective',
    sageResponse: localSageResponse({
      content,
      prompt,
      clarityLabel: localProfile.clarityLabel || 'Reflective',
    }),
  }

  try {
    const systemPrompt = isWeeklyPulse
               ? `The user just completed Weekly Reflection. They answered 2 deeply personal questions about their goals and inner life. Read both answers together as one picture of where this person is right now.

Weekly Reflection is the weekly rhythm. Phase Review is a separate quarterly transformation checkpoint. Do not mix them. Do not mention Phase Review unless the user explicitly asks.

Respond the way a sharp warm honest friend would respond if they received this as a voice note. Not a therapist. Not a coach. A real person who absorbed everything they said.

Address everything they wrote about. Do not pick one theme and ignore the rest. If something they said connects to something else they said, name that connection.

Do not use bullet points. Do not end with a question unless it genuinely opens something up. Keep it to 2 to 3 paragraphs maximum. Be direct. Be warm. Sound like you showed up.

Do not use m-dashes. Do not use clinical phrases.

Return strict JSON only with this shape:
{
  "generatedTitle": "Weekly Reflection",
  "clarityScore": 8,
  "clarityLabel": "Calm",
  "sageResponse": "string"
}`
              : `You are Sage, PHASR's reflective journal guide.

Return strict JSON only with this shape:
{
  "generatedTitle": "string",
  "clarityScore": 8,
  "clarityLabel": "Calm",
  "sageResponse": "string"
}

Title rules:
- If the user used a template, generatedTitle must be the template title exactly.
- If the user did not use a template and did not write a title, generate a short natural title from what they wrote.

Weekly reflection response format:
- If prompt includes Weekly, Identity check-in, Relationship check-in, Fear & avoidance check-in, or Alignment check-in, sageResponse must use this exact structure:
You’re growing faster than you think.

=== Key pattern Sage noticed ===
[short insight]

=== One correction ===
[one clear change]

=== Next focus ===
[one sharp focus for next week]

Ready to start your next week aligned.

Scoring rules:
- clarityScore must be an integer from 1 to 10.
- clarityLabel must be one short emotional or mental-state label such as Calm, Focused, Stressed, Reflective, Avoidant, Productive, Angry, Happy, Confused, Clear, Heavy, Energised, Confident, or Decisive.
- Do not judge only how organized the writing sounds. Rate the emotional and mental state underneath it too, including clarity, decision, stress, avoidance, productivity, anger, happiness, confidence, confusion, focus, emotional heaviness, and energy.

HOW TO RESPOND - read this carefully.
Do not follow a formula. Do not validate then explain then suggest then ask a question then close. That pattern feels scripted and the user will feel it.
Instead read what they wrote and respond the way a sharp, warm, honest friend would respond if they received this as a voice note. Not a therapist. Not a coach reading from a framework. A real person who actually absorbed what was said.
Sometimes the right response is two sentences. Sometimes it is a paragraph. Let the content decide the length, not a template.
Do not always end with a question. Questions at the end of every response feel like a technique. Only ask something if it genuinely opens something up. If the person just needed to be heard, hear them and close with something that lands, not something that probes.
Do not use phrases like: "this is a common phenomenon", "it is likely that", "if it feels comfortable", "you might consider", "taking a brave step." These sound clinical.
Do use: short sentences when something is heavy. Directness when something needs naming. Warmth without softening the truth. Silence when nothing needs to be added - meaning end the response when it is done, not when a checklist is complete.
If someone writes something personal and emotional - match that energy first before anything else. Feel it with them before you move them.
If someone writes something practical and goal-focused - be direct and action-oriented without emotional preamble.
Read the room. Every time. That is the whole job.
Never sound like you are running a session. Sound like you showed up.

MULTI-TOPIC RULE - this is important.
If the user wrote about more than one thing in their journal entry, address all of them. Do not pick the most prominent topic and ignore the rest. Do not summarize them into one theme. Each thing they wrote about deserves a response.
If they wrote about their relationship, their business, and feeling tired - respond to all three. Not in a list. Not with headers. Just naturally, the way a conversation moves between topics.
Example of wrong approach: User writes about feeling overwhelmed with work, a fight with a friend, and excitement about a new idea. Sage only addresses the overwhelm and ignores the other two.
Example of right approach: Move through all three naturally. Maybe the overwhelm connects to the fight. Maybe the new idea is the thing that is actually keeping them going underneath all of it. Find the thread if there is one. If there is not one, just address each thing on its own terms.
The rule is simple: if they wrote it, it mattered enough to them to put it in their journal. Sage does not get to decide what was important and what was not. Respond to all of it.
The response can be longer when there are multiple topics. That is fine. Do not rush through them to keep it short. Give each thing the space it deserves without being repetitive or padded.
Sage response rules:
- sageResponse should feel personal, emotionally aware, grounded, and useful.
- It should reflect what the user is truly feeling, name the pattern underneath the words, and offer one meaningful next step only when that makes sense.
- Do not use markdown.
  - Do not include any explanation outside the JSON.`

    const response = await fetch('/api/groq/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        system: systemPrompt,
        model: GROQ_MODEL,
        temperature: 0.6,
        messages: [
          {
            role: 'user',
            content: JSON.stringify({ title, content, mood: mood?.label || '', prompt }),
          },
        ],
      }),
    })

    if (!response.ok) throw new Error('journal_analysis_failed')
    const payload = await response.json()
    const raw = String(payload?.content || '').replace(/^```json/i, '').replace(/^```/i, '').replace(/```$/i, '').trim()
    const parsed = JSON.parse(raw)
    return {
      generatedTitle: parsed?.generatedTitle || localFallback.generatedTitle,
      clarityScore: Number(parsed?.clarityScore || localFallback.clarityScore),
      clarityLabel: parsed?.clarityLabel || localFallback.clarityLabel,
      sageResponse: parsed?.sageResponse || localFallback.sageResponse,
    }
  } catch {
    return localFallback
  }
}

function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <>
      <button type="button" onClick={onClose} aria-label="Close" style={{ position: 'fixed', inset: 0, border: 'none', background: 'rgba(32, 20, 28, 0.24)', zIndex: 40 }} />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 41, background: '#fff', borderTopLeftRadius: 'var(--app-radius-lg)', borderTopRightRadius: 'var(--app-radius-lg)', boxShadow: 'var(--app-shadow-lg)', padding: '1rem 1rem 1.2rem', maxHeight: '62vh', overflowY: 'auto' }}
      >
        {title ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#3c2430' }}>{title}</p>
              <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: '1.3rem', color: '#8b6977' }}>×</button>
          </div>
        ) : null}
        {children}
      </motion.div>
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
  const orderedGroups = ['Basic', 'Pro']

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#eef6ff', padding: '0.9rem 0.9rem 1.4rem' }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: 0, display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <h2 className="font-display" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1d2430' }}>Templates</h2>
        </div>
        {orderedGroups.filter(group => grouped[group]?.length).map(group => (
          <div key={group} style={{ display: 'grid', gap: '0.85rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e7fa1' }}>{group}</p>
            {grouped[group].map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ background: item.accent, borderRadius: 'var(--app-radius-lg)', padding: '1.1rem', display: 'grid', gap: '0.55rem', boxShadow: 'var(--app-shadow-md)' }}
              >
                <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#2f2530' }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#5c5564', fontWeight: 700 }}>{item.useWhen}</p>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={() => onSelect(item)} style={{ justifySelf: 'start', border: 'none', borderRadius: 'var(--app-radius-sm)', padding: '0.72rem 1rem', background: '#fff', color: '#6f4fe6', fontWeight: 800, fontSize: '0.92rem', letterSpacing: '0.02em', cursor: 'pointer' }}>START</motion.button>
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function buildTemplateContent(template, answers) {
  return template.fields
    .map(field => `${field.label}\n${answers[field.label] || ''}`.trim())
    .join('\n\n')
}

function TemplateDetail({ template, answers, onChange, onBack, onApply }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(180deg, #7b4a88 0%, #f8f0fb 100%)', padding: '0.9rem 0.9rem 1.5rem' }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: 0, display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={onBack} style={{ ...ghostIconButtonStyle, background: 'rgba(255,255,255,0.86)' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-display" style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: '2rem', fontWeight: 600, color: '#fff' }}>{template.name}</h2>
        </div>
        <p style={{ margin: 0, color: '#fff6fb', fontSize: '1rem', lineHeight: 1.65 }}>{template.useWhen}</p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {template.fields.map((field, i) => (
            <motion.div
              key={field.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.04 }}
              style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 'var(--app-radius-md)', padding: '1rem', display: 'grid', gap: '0.55rem', boxShadow: 'var(--app-shadow-md)' }}
            >
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#342138' }}>{field.label}</p>
              <p style={{ margin: 0, color: '#6b5b6e', lineHeight: 1.6 }}>{field.subtext}</p>
              <textarea
                value={answers[field.label] || ''}
                onChange={event => onChange(field.label, event.target.value)}
                placeholder="Enter your thoughts..."
                style={{ width: '100%', minHeight: 86, border: '1px solid #ead8e7', borderRadius: 'var(--app-radius-sm)', padding: '0.9rem', outline: 'none', resize: 'vertical', fontSize: '0.98rem', lineHeight: 1.6, color: '#2f1e2a', background: '#fff' }}
              />
            </motion.div>
          ))}
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onApply} style={{ width: '100%', border: 'none', borderRadius: 'var(--app-radius-sm)', padding: '1rem', background: 'linear-gradient(135deg, var(--app-accent), var(--app-accent2))', color: '#fff', fontWeight: 800, fontSize: '1.05rem', boxShadow: 'var(--app-shadow-lg)' }}>
          Save entry
        </motion.button>
      </div>
    </div>
  )
}

function WeeklyChipRow({ options, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map(option => {
        const isActive = selected === option
        return (
          <button
            key={option}
            type="button"
            onClick={() => onSelect(isActive ? '' : option)}
            style={{
              border: isActive ? '1.5px solid var(--app-accent)' : '1px solid #f2c4d0',
              background: isActive ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : '#fff',
              color: isActive ? '#fff' : '#3d1f2b',
              borderRadius: 999,
              padding: '0.5rem 0.9rem',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

// The ~60-second flow: Sage opens with real proof (no guilt), two chip questions with
// optional typing/voice, then the easier-or-push dial. One screen, not a step wizard —
// she can see and answer everything at once.
function WeeklyReflectionFlow({
  phaseName,
  completedDays,
  totalDays,
  workedChoice,
  workedCustom,
  onWorkedChoice,
  onWorkedCustom,
  slippedChoice,
  slippedCustom,
  onSlippedChoice,
  onSlippedCustom,
  difficulty,
  onDifficulty,
  onVoiceCapture,
  onBack,
  onSave,
  canSave,
}) {
  const inputStyle = { flex: 1, border: '1.5px solid #f2c4d0', borderRadius: 'var(--app-radius-sm)', padding: '0.6rem 0.75rem', outline: 'none', fontFamily: "'General Sans', sans-serif", fontSize: '0.9rem', color: '#3d1f2b' }
  const voiceButtonStyle = { border: '1px solid #f2c4d0', background: '#fff', color: '#7a5567', borderRadius: 999, width: 40, height: 40, display: 'grid', placeItems: 'center', flexShrink: 0, cursor: 'pointer' }
  const dialButtonStyle = active => ({
    flex: 1,
    border: active ? '1.5px solid var(--app-accent)' : '1px solid #f2c4d0',
    background: active ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : '#fff',
    color: active ? '#fff' : '#3d1f2b',
    borderRadius: 'var(--app-radius-sm)',
    padding: '0.85rem 0.6rem',
    fontWeight: 800,
    fontSize: '0.88rem',
    cursor: 'pointer',
  })

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p className="font-display" style={{ margin: 0, fontWeight: 800, color: '#3d1f2b', fontSize: '1.05rem' }}>Weekly Reflection</p>
      </div>

      <div style={{ padding: '20px 16px', display: 'grid', gap: '1.4rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ background: 'linear-gradient(135deg,#fff8fb,#fff0f7)', border: '1px solid rgba(232,64,122,0.2)', borderRadius: 'var(--app-radius-md)', padding: '1rem' }}>
          <p style={{ margin: 0, fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>{phaseName}</p>
          <p style={{ margin: '0.4rem 0 0', fontFamily: "'Fraunces', serif", fontSize: '1.2rem', color: '#3d1f2b', lineHeight: 1.6 }}>
            You showed up <strong>{completedDays} of {totalDays}</strong> days this week. That&apos;s real.
          </p>
        </div>

        <div>
          <p style={{ fontWeight: 800, color: '#3d1f2b', marginBottom: '0.5rem' }}>What worked?</p>
          <WeeklyChipRow options={WEEKLY_WORKED_CHIPS} selected={workedChoice} onSelect={onWorkedChoice} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input value={workedCustom} onChange={event => onWorkedCustom(event.target.value)} placeholder="or type your own..." style={inputStyle} />
            <button type="button" onClick={() => onVoiceCapture('worked')} style={voiceButtonStyle} aria-label="Say what worked"><Mic size={15} /></button>
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 800, color: '#3d1f2b', marginBottom: '0.5rem' }}>What slipped?</p>
          <WeeklyChipRow options={WEEKLY_SLIPPED_CHIPS} selected={slippedChoice} onSelect={onSlippedChoice} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input value={slippedCustom} onChange={event => onSlippedCustom(event.target.value)} placeholder="or type your own..." style={inputStyle} />
            <button type="button" onClick={() => onVoiceCapture('slipped')} style={voiceButtonStyle} aria-label="Say what slipped"><Mic size={15} /></button>
          </div>
        </div>

        <div>
          <p style={{ fontWeight: 800, color: '#3d1f2b', marginBottom: '0.5rem' }}>Next week — easier, or push?</p>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button type="button" onClick={() => onDifficulty('easier')} style={dialButtonStyle(difficulty === 'easier')}>Make it easier</button>
            <button type="button" onClick={() => onDifficulty('push')} style={dialButtonStyle(difficulty === 'push')}>Push a bit more</button>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.8rem 1rem max(0.9rem, env(safe-area-inset-bottom))' }}>
        <motion.button
          whileHover={{ scale: canSave ? 1.02 : 1 }}
          whileTap={{ scale: canSave ? 0.98 : 1 }}
          type="button"
          onClick={onSave}
          disabled={!canSave}
          style={{ width: '100%', border: 'none', borderRadius: 'var(--app-radius-sm)', padding: '0.86rem 1rem', background: canSave ? 'linear-gradient(135deg, var(--app-accent), var(--app-accent2))' : '#f2c4d0', color: '#fff', fontWeight: 800, fontSize: '0.96rem', boxShadow: canSave ? 'var(--app-shadow-md)' : 'none', cursor: canSave ? 'pointer' : 'not-allowed' }}
        >
          Save Weekly Reflection
        </motion.button>
      </div>
    </div>
  )
}

function EntryDetail({ entry, onBack, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const hideSessionCtaTapRef = useRef(0)
  const detailBody = entry.content || getTemplateSummary(entry) || ''
  const isWeeklyPulse = ['weekly reflection', 'sage reflect'].includes(String(entry?.prompt || '').toLowerCase())
  // Everything chosen while writing (theme, paper, font, color, book frame,
  // images, stickers) used to be thrown away the moment the entry was saved —
  // this view rendered plain white regardless. The page she designed should
  // still look like that page when she comes back to read it.
  const entryBackground = BACKGROUNDS.find(item => item.id === entry.backgroundId) || BACKGROUNDS[0]
  const entryFont = FONTS.find(item => item.id === entry.fontId) || FONTS[0]
  const entryTextColor = entry.color || '#2f1e2a'
  const entryPaperLineColor = (PAPER_LINE_COLORS.find(item => item.id === entry.paperLineColorId) || PAPER_LINE_COLORS[0]).value
  const entryPaperSpacingPx = (PAPER_SPACINGS.find(item => item.id === entry.paperSpacingId) || PAPER_SPACINGS[1]).px
  const entryPageStyle = entry.templateAccent
    ? { background: `linear-gradient(180deg, ${entry.templateAccent}33 0%, ${entry.templateAccent}14 100%)` }
    : getPaperLayeredStyle(entryBackground, entry.paperStyleId, entryPaperLineColor, entryPaperSpacingPx)
  const entryBookFrameStyle = entry.bookFrame ? {
    borderLeft: '11px solid rgba(58,28,38,0.16)',
    borderRadius: '3px 12px 12px 3px',
    boxShadow: 'inset 14px 0 22px -16px rgba(0,0,0,0.4), 7px 7px 0 -3px rgba(0,0,0,0.05), 13px 13px 0 -6px rgba(0,0,0,0.035)',
  } : {}
  const weeklySession = entry?.weeklyPulseSession || null
  const sessionMessages = Array.isArray(weeklySession?.messages) ? weeklySession.messages : []
  const sessionCompleted = Boolean(weeklySession?.completedAt || weeklySession?.status === 'completed')
  const todayIso = getDateKeyFromDate()
  const tomorrowIso = (() => {
    const next = new Date()
    next.setDate(next.getDate() + 1)
    return getDateKeyFromDate(next)
  })()
  const sessionCtaHideKey = entry?.id ? `phasr_weekly_session_cta_hidden_until_${entry.id}` : ''
  const [sessionCtaHidden, setSessionCtaHidden] = useState(() => {
    if (!sessionCtaHideKey) return false
    const hiddenUntil = scopedGetItem(sessionCtaHideKey)
    return Boolean(hiddenUntil && hiddenUntil > todayIso)
  })

  function speakResponse() {
    if (!window.speechSynthesis || !entry?.sageResponse) return
    const utterance = new SpeechSynthesisUtterance(entry.sageResponse)
    utterance.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  function openWeeklySession() {
    if (!entry?.id) return
    window.dispatchEvent(new CustomEvent('phasr-weekly-session-start', { detail: { entryId: entry.id } }))
    window.dispatchEvent(new Event('phasr-open-sage-float'))
  }

  function hideWeeklySessionCtaForToday() {
    if (!sessionCtaHideKey) return
    scopedSetItem(sessionCtaHideKey, tomorrowIso)
    setSessionCtaHidden(true)
  }

  function handleWeeklySessionCtaPointerUp(event) {
    if (!sessionCtaHideKey) return
    if (event.pointerType && event.pointerType !== 'touch') return
    const now = Date.now()
    if (now - hideSessionCtaTapRef.current < 320) hideWeeklySessionCtaForToday()
    hideSessionCtaTapRef.current = now
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <p style={{ margin: 0, fontSize: '0.98rem', color: '#7f6672', marginLeft: 'auto' }}>{formatDate(entry.date)}</p>
          <button type="button" onClick={onEdit} style={ghostIconButtonStyle}><Pencil size={16} /></button>
        </div>
      <div style={{ width: '100%', maxWidth: '100%', margin: 0, padding: '1.2rem 1rem 5rem', display: 'grid', gap: '1.2rem', ...entryPageStyle, ...entryBookFrameStyle }}>
        <div>
          <p style={{ margin: 0, color: entryTextColor, opacity: 0.75, fontSize: '0.95rem' }}>{entry.mood?.emoji || ''}</p>
          <h1 style={{ margin: '0.55rem 0 0', fontFamily: entryFont.family, fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 700, color: entryTextColor }}>{getEntryTitle(entry) || 'Untitled reflection'}</h1>
          {entry.subheadline ? (
            <p style={{ margin: '0.4rem 0 0', fontFamily: entryFont.family, fontSize: '1.15rem', fontWeight: 600, color: entryTextColor, opacity: 0.8 }}>{entry.subheadline}</p>
          ) : null}
        </div>
        {Array.isArray(entry.stickers) && entry.stickers.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {entry.stickers.map(sticker => (
              <div key={sticker.id} style={{ border: '1px solid var(--app-border)', borderRadius: 12, background: 'rgba(255,255,255,0.7)', padding: 6, display: 'grid', placeItems: 'center' }}>
                <StickerGlyph shapeId={sticker.shape} color={sticker.color} size={26} />
              </div>
            ))}
          </div>
        ) : null}
        {Array.isArray(entry.images) && entry.images.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
            {entry.images.map(image => {
              const preset = IMAGE_SIZE_PRESETS.find(item => item.id === (image.size || 'medium')) || IMAGE_SIZE_PRESETS[1]
              return (
                <div key={image.id} style={{ width: preset.width, aspectRatio: '3 / 4', borderRadius: 'var(--app-radius-sm)', overflow: 'hidden', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow-sm)', flexShrink: 0 }}>
                  <img src={image.url} alt={image.name || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )
            })}
          </div>
        ) : null}
        {Array.isArray(entry.tags) && entry.tags.length ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {entry.tags.map(tag => (
              <span key={tag} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: 'rgba(255,255,255,0.6)', color: entryTextColor, padding: '0.3rem 0.65rem', fontSize: '0.76rem', fontWeight: 700 }}>#{tag}</span>
            ))}
          </div>
        ) : null}
        {isWeeklyPulse ? (
          <>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                <p style={sectionLabelStyle}>Sage's Response</p>
                <button type="button" onClick={speakResponse} style={{ ...ghostMiniActionStyle, color: 'var(--app-accent)' }}><Volume2 size={16} /></button>
              </div>
               <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ borderRadius: 'var(--app-radius-md)', background: '#fff5fa', border: '1px solid #f2c4d0', padding: '1rem', color: '#4b3240', lineHeight: 1.75, boxShadow: 'var(--app-shadow-md)' }}>{entry.sageResponse || 'Sage will respond here once your reflection is saved.'}</motion.div>
              {!sessionCtaHidden ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }} onPointerUp={handleWeeklySessionCtaPointerUp}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={openWeeklySession}
                    style={{
                      justifySelf: 'start',
                      border: 'none',
                      background: 'var(--app-cta)',
                      borderRadius: 'var(--app-radius-sm)',
                      padding: '0.72rem 1rem',
                      fontWeight: 800,
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      boxShadow: 'var(--app-shadow-md)',
                    }}
                  >
                    {sessionCompleted ? 'View your session with Sage' : 'Talk it through with Sage'}
                  </motion.button>
                  <button
                    type="button"
                    onClick={hideWeeklySessionCtaForToday}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 999,
                      border: '1px solid #f2c4d0',
                      background: 'rgba(255,255,255,0.96)',
                      color: '#b08090',
                      fontSize: '1rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      padding: 0,
                      lineHeight: 1,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                    aria-label="Hide for now"
                    title="Hide for now"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setSessionCtaHidden(false)}
                  style={{
                    justifySelf: 'start',
                    border: '1px solid #f2c4d0',
                    background: '#fff',
                    borderRadius: 999,
                    padding: '0.45rem 0.8rem',
                    fontWeight: 800,
                    color: 'var(--app-accent)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                  }}
                >
                  Session with Sage
                </button>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.7rem' }}>
              <div style={{ color: '#2f1e2a', fontSize: '1.05rem', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                {expanded ? detailBody : makeTwoParagraphPreview(detailBody)}
              </div>
              {detailBody.length > 180 ? (
                <button type="button" onClick={() => setExpanded(current => !current)} style={{ border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800, justifySelf: 'start', padding: 0 }}>
                  {expanded ? 'See less' : 'See more'}
                </button>
              ) : null}
            </div>
            {sessionMessages.length ? (
              <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.7rem' }}>
                <p style={sectionLabelStyle}>Session with Sage</p>
                <div style={{ display: 'grid', gap: '0.55rem' }}>
                  {sessionMessages.map((message, index) => {
                    const roleRaw = String(message?.role || '').toLowerCase()
                    const role = roleRaw === 'user' ? 'user' : 'sage'
                    const text = String(message?.text || message?.content || '').trim()
                    if (!text) return null
                    return (
                      <div key={`${role}-${index}`} style={{ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}>
                        <motion.div
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: index * 0.04 }}
                          style={{
                            maxWidth: '88%',
                            padding: '0.72rem 0.9rem',
                            borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            background: role === 'user' ? 'linear-gradient(135deg, var(--app-accent), var(--app-accent2))' : '#fff',
                            border: role === 'user' ? 'none' : '1px solid var(--app-border)',
                            color: role === 'user' ? '#fff' : 'var(--app-text)',
                            fontFamily: "'General Sans', sans-serif",
                            fontSize: '0.84rem',
                            lineHeight: 1.65,
                            whiteSpace: 'pre-wrap',
                            boxShadow: 'var(--app-shadow-sm)',
                          }}
                        >
                          {text}
                        </motion.div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <p style={sectionLabelStyle}>Clarity Score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 92, height: 92, borderRadius: '50%', border: '8px solid #fde3ec', display: 'grid', placeItems: 'center', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{entry.clarityScore || 7}/10</div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2f1e2a' }}>{entry.clarityLabel || 'Reflective'}</p>
                </div>
              </div>
            </div>
            <p style={{ margin: 0, paddingTop: '0.3rem', color: '#8f7180', fontSize: '0.82rem' }}>
              Weekly Reflection • {entry.weeklyPulseMeta?.phaseName || 'Phase'} • {(entry.weeklyPulseMeta?.pillars || []).join(' • ')}
            </p>
          </>
        ) : (
          <>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.7rem' }}>
              <div style={{ color: entryTextColor, fontFamily: entryFont.family, fontSize: '1.05rem', lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>
                {expanded ? detailBody : makeTwoParagraphPreview(detailBody)}
              </div>
              {detailBody.length > 180 ? (
                <button type="button" onClick={() => setExpanded(current => !current)} style={{ border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800, justifySelf: 'start', padding: 0 }}>
                  {expanded ? 'See less' : 'See more'}
                </button>
              ) : null}
            </div>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                <p style={sectionLabelStyle}>Sage's Response</p>
                <button type="button" onClick={speakResponse} style={{ ...ghostMiniActionStyle, color: 'var(--app-accent)' }}><Volume2 size={16} /></button>
              </div>
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ borderRadius: 'var(--app-radius-md)', background: '#fff5fa', border: '1px solid #f2c4d0', padding: '1rem', color: '#4b3240', lineHeight: 1.75, boxShadow: 'var(--app-shadow-md)' }}>{entry.sageResponse || 'Sage will respond here once your reflection is saved.'}</motion.div>
            </div>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <p style={sectionLabelStyle}>Clarity Score</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 92, height: 92, borderRadius: '50%', border: '8px solid #fde3ec', display: 'grid', placeItems: 'center', color: 'var(--app-accent)', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{entry.clarityScore || 7}/10</div>
                <div>
                  <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#2f1e2a' }}>{entry.clarityLabel || 'Reflective'}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function JournalWriter({ draft, setDraft, onBack, onSave, onOpenTemplates, isSaving }) {
  const [showMenu, setShowMenu] = useState(false)
  const [activeTray, setActiveTray] = useState(null)
  // Local to this component, unlike the old bug — the "Change emoji" button used
  // to call setShowMoodPicker from the *outer* Journal component's scope, which
  // JournalWriter (a separate top-level component) never had access to. Tapping
  // it threw a ReferenceError and did nothing.
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [customTagDraft, setCustomTagDraft] = useState('')
  const [keyboardInset, setKeyboardInset] = useState(0)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const contentRef = useRef(null)
  const objectUrlsRef = useRef(new Set())
  const currentBackground = BACKGROUNDS.find(item => item.id === draft.backgroundId) || BACKGROUNDS[0]
  const currentFont = FONTS.find(item => item.id === draft.fontId) || FONTS[0]
  const paperLineColor = (PAPER_LINE_COLORS.find(item => item.id === draft.paperLineColorId) || PAPER_LINE_COLORS[0]).value
  const paperSpacingPx = (PAPER_SPACINGS.find(item => item.id === draft.paperSpacingId) || PAPER_SPACINGS[1]).px
  const writerBackgroundStyle = draft.templateAccent
    ? { background: `linear-gradient(180deg, ${draft.templateAccent}33 0%, ${draft.templateAccent}14 100%)` }
    : getPaperLayeredStyle(currentBackground, draft.paperStyleId, paperLineColor, paperSpacingPx)
  const wordCount = countWords(draft.content)
  const headline = TEXT_TIERS[0]
  const subheadlineTier = TEXT_TIERS[1]
  const bodyTier = TEXT_TIERS[2]

  // A book frame is a real physical page, not a flat rectangle — a spine shadow
  // on the left, a thicker cover edge, and stacked shadows on the trailing edges
  // to suggest pages underneath. Pure CSS decoration; no page-turn interaction.
  const bookFrameStyle = draft.bookFrame ? {
    borderLeft: '11px solid rgba(58,28,38,0.16)',
    borderRadius: '3px 12px 12px 3px',
    boxShadow: 'inset 14px 0 22px -16px rgba(0,0,0,0.4), 7px 7px 0 -3px rgba(0,0,0,0.05), 13px 13px 0 -6px rgba(0,0,0,0.035)',
  } : {}

  useEffect(() => () => recognitionRef.current?.stop?.(), [])
  useEffect(() => {
    const node = contentRef.current
    if (!node || draft.templateFields) return
    const value = String(node.value || '')
    if (!value.trim()) return
    requestAnimationFrame(() => {
      try {
        node.focus()
        const end = node.value.length
        node.setSelectionRange(end, end)
      } catch {
        // ignore
      }
    })
  }, [])

  // The bottom toolbar used to sit at the literal bottom of the page, which on
  // mobile is *behind* the software keyboard — the mic button in particular was
  // unreachable while typing. visualViewport reports the actually-visible area
  // once the keyboard is up; the gap between that and the full layout height is
  // exactly how far to lift the toolbar.
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return undefined
    const handleViewportChange = () => {
      const inset = Math.max(0, Math.round(window.innerHeight - viewport.height - viewport.offsetTop))
      setKeyboardInset(inset)
    }
    handleViewportChange()
    viewport.addEventListener('resize', handleViewportChange)
    viewport.addEventListener('scroll', handleViewportChange)
    return () => {
      viewport.removeEventListener('resize', handleViewportChange)
      viewport.removeEventListener('scroll', handleViewportChange)
    }
  }, [])

  useEffect(() => () => {
    objectUrlsRef.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  function startRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setDraft(prev => ({ ...prev, content: `${prev.content}\n[Voice input unavailable on this browser]` }))
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

  // Images live in their own structured array rather than being interspersed as
  // characters — `content` stays pure plain text for Sage either way, and a real
  // graphic could never live inside a plain-text string regardless.
  async function addImageFile(file) {
    if (!file || !String(file.type || '').startsWith('image/')) return
    const id = `${Date.now()}-${Math.round(Math.random() * 1e6)}`
    const previewUrl = URL.createObjectURL(file)
    objectUrlsRef.current.add(previewUrl)
    setDraft(prev => ({
      ...prev,
      images: [...prev.images, { id, name: file.name || 'photo', url: previewUrl, size: 'medium', uploading: true }],
    }))
    const finalUrl = await uploadJournalImage(file)
    setDraft(prev => ({
      ...prev,
      images: prev.images.map(image => (image.id === id ? { ...image, url: finalUrl, uploading: false } : image)),
    }))
  }

  function handleImagePick(event) {
    const file = event.target.files?.[0]
    if (file) addImageFile(file)
    event.target.value = ''
    setActiveTray(null)
  }

  function handlePaste(event) {
    const items = Array.from(event.clipboardData?.items || [])
    const imageItem = items.find(item => item.type?.startsWith('image/'))
    if (!imageItem) return
    const file = imageItem.getAsFile()
    if (!file) return
    event.preventDefault()
    addImageFile(file)
  }

  function handleDrop(event) {
    const files = Array.from(event.dataTransfer?.files || []).filter(file => file.type?.startsWith('image/'))
    if (!files.length) return
    event.preventDefault()
    files.forEach(addImageFile)
  }

  function addSticker(sticker) {
    setDraft(prev => ({
      ...prev,
      stickers: [...prev.stickers, { id: `${Date.now()}-${Math.round(Math.random() * 1e6)}`, shape: sticker.shape, color: sticker.color }],
    }))
  }

  function insertList(style) {
    setDraft(prev => {
      let prefix = style.prefix
      if (style.id === 'numbered') {
        const lines = prev.content.split('\n')
        const lastLine = lines[lines.length - 1] || ''
        const match = lastLine.match(/^(\d+)\.\s/)
        prefix = `${match ? Number(match[1]) + 1 : 1}. `
      }
      return { ...prev, content: `${prev.content}${prev.content && !prev.content.endsWith('\n') ? '\n' : ''}${prefix}` }
    })
    setActiveTray(null)
  }

  function toggleTag(tag) {
    setDraft(prev => {
      const has = (prev.tags || []).includes(tag)
      return { ...prev, tags: has ? prev.tags.filter(item => item !== tag) : [...(prev.tags || []), tag] }
    })
  }

  function commitCustomTag() {
    const clean = customTagDraft.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!clean) return
    setDraft(prev => ((prev.tags || []).includes(clean) ? prev : { ...prev, tags: [...(prev.tags || []), clean] }))
    setCustomTagDraft('')
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setShowMenu(true)} style={{ border: 'none', background: 'transparent', color: '#6e4a58' }}><MoreHorizontal size={24} /></button>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={onSave} disabled={isSaving} style={{ border: 'none', borderRadius: 999, padding: '0.8rem 1.25rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{isSaving ? 'Saving...' : 'Save'}</motion.button>
      </div>

      <div
        onPaste={handlePaste}
        onDragOver={event => event.preventDefault()}
        onDrop={handleDrop}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', ...writerBackgroundStyle, ...bookFrameStyle }}
      >
        <div style={{ position: 'relative', padding: '1rem 1rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#7f6672', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.85rem', color: currentBackground.id === 'dark-cute' ? '#fff' : '#d1588b' }}>{currentBackground.deco}</div>
          <button type="button" onClick={() => dateInputRef.current?.click()} style={{ border: 'none', background: 'transparent', padding: 0, color: '#7f6672', fontSize: '0.96rem' }}>{formatDate(draft.date)}</button>
          <input ref={dateInputRef} type="date" value={draft.date} onChange={event => setDraft(prev => ({ ...prev, date: event.target.value }))} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
          <div style={{ flex: 1 }} />
          <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} type="button" onClick={() => setShowMoodPicker(true)} aria-label="Set mood" title="Set mood" style={{ border: 'none', background: 'transparent', padding: 0, color: 'var(--app-accent)' }}>
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{draft.mood?.emoji || MOODS[0]?.emoji || '😌'}</span>
          </motion.button>
        </div>

        <div style={{ padding: '0 1rem 1rem', display: 'grid', gap: '1rem', flex: 1 }}>
            {!draft.templateFields ? (
              <>
                <input
                  value={draft.title}
                  onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))}
                  placeholder="Title"
                  style={{ border: 'none', borderBottom: '1px solid var(--app-border)', background: 'transparent', padding: '0.1rem 0 0.4rem', outline: 'none', color: draft.color, fontFamily: currentFont.family, fontSize: headline.fontSize, fontWeight: headline.fontWeight, lineHeight: headline.lineHeight }}
                />
                <input
                  value={draft.subheadline}
                  onChange={event => setDraft(prev => ({ ...prev, subheadline: event.target.value }))}
                  placeholder="Subheadline (optional)"
                  style={{ border: 'none', background: 'transparent', padding: 0, outline: 'none', color: draft.color, opacity: 0.8, fontFamily: currentFont.family, fontSize: subheadlineTier.fontSize, fontWeight: subheadlineTier.fontWeight, lineHeight: subheadlineTier.lineHeight }}
                />
              </>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 700, color: draft.color, fontFamily: "'Fraunces', serif" }}>{draft.prompt}</p>
                {draft.templateFields.map((field, index) => (
                  <div key={field.label} style={{ display: 'grid', gap: '0.42rem' }}>
                    <p style={{ margin: 0, color: 'var(--app-accent)', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.5 }}>
                      {index + 1}. {field.label}
                    </p>
                    <p style={{ margin: 0, color: '#6f7d8b', lineHeight: 1.55 }}>{field.subtext}</p>
                    <textarea
                      value={draft.templateAnswers?.[field.label] || ''}
                      onChange={event => setDraft(prev => ({
                        ...prev,
                        templateAnswers: { ...(prev.templateAnswers || {}), [field.label]: event.target.value },
                      }))}
                      placeholder="Enter your thoughts..."
                      style={{ width: '100%', minHeight: 72, border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-sm)', padding: '0.7rem 0.8rem', outline: 'none', resize: 'vertical', background: '#fff', color: draft.color, fontFamily: currentFont.family, fontSize: '1rem', lineHeight: 1.6 }}
                    />
                  </div>
                ))}
              </div>
            )}
          {draft.stickers.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {draft.stickers.map(sticker => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, stickers: prev.stickers.filter(item => item.id !== sticker.id) }))}
                  aria-label="Remove sticker"
                  title="Tap to remove"
                  style={{ border: '1px solid var(--app-border)', borderRadius: 12, background: 'rgba(255,255,255,0.7)', padding: 6, cursor: 'pointer', display: 'grid', placeItems: 'center' }}
                >
                  <StickerGlyph shapeId={sticker.shape} color={sticker.color} size={26} />
                </button>
              ))}
            </div>
          ) : null}
          {draft.images.length ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem' }}>
              {draft.images.map(image => {
                const preset = IMAGE_SIZE_PRESETS.find(item => item.id === (image.size || 'medium')) || IMAGE_SIZE_PRESETS[1]
                return (
                  <div key={image.id} style={{ width: preset.width, flexShrink: 0 }}>
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '3 / 4', borderRadius: 'var(--app-radius-sm)', overflow: 'hidden', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow-sm)', background: '#f3e9ee' }}>
                      <img src={image.url} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: image.uploading ? 0.5 : 1 }} />
                      {image.uploading ? (
                        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', border: '3px solid #fde2ec', borderTopColor: 'var(--app-accent)', animation: 'phasr-spin 0.8s linear infinite' }} />
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 4 }}>
                      {IMAGE_SIZE_PRESETS.map(sizeOption => (
                        <button
                          key={sizeOption.id}
                          type="button"
                          onClick={() => setDraft(prev => ({ ...prev, images: prev.images.map(item => (item.id === image.id ? { ...item, size: sizeOption.id } : item)) }))}
                          style={{ width: 20, height: 20, borderRadius: 6, border: sizeOption.id === (image.size || 'medium') ? '1.5px solid var(--app-accent)' : '1px solid var(--app-border)', background: '#fff', fontSize: 9, fontWeight: 800, color: '#5d4450', cursor: 'pointer', padding: 0 }}
                        >
                          {sizeOption.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDraft(prev => ({ ...prev, images: prev.images.filter(item => item.id !== image.id) }))}
                        aria-label="Remove image"
                        style={{ width: 20, height: 20, borderRadius: 6, border: '1px solid #f2c4d0', background: '#fff6fa', color: '#d24b78', cursor: 'pointer', padding: 0, fontSize: 11, fontWeight: 800 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
            {!draft.templateFields ? (
              <textarea ref={contentRef} value={draft.content} onChange={event => setDraft(prev => ({ ...prev, content: event.target.value }))} placeholder="Start writing..." style={{ flex: 1, minHeight: '42vh', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: draft.color, fontFamily: currentFont.family, fontSize: bodyTier.fontSize, lineHeight: bodyTier.lineHeight }} />
            ) : null}
        </div>
      </div>

      <style>{`@keyframes phasr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: keyboardInset, zIndex: 22, borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.55rem 0.8rem max(0.75rem, env(safe-area-inset-bottom))', display: 'grid', gap: '0.55rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8f7180', fontSize: '0.82rem' }}><span>{wordCount} words</span><span>{draft.images.length ? `${draft.images.length} image${draft.images.length === 1 ? '' : 's'}` : 'Ready to write'}</span></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: '0.45rem' }}>
          {[{ id: 'background', icon: Paintbrush }, { id: 'image', icon: ImageIcon }, { id: 'sticker', icon: Sparkles }, { id: 'font', icon: Type }, { id: 'list', icon: List }, { id: 'tag', icon: Tag }, { id: 'mic', icon: Mic }].map(item => {
            const Icon = item.icon
            return (
              <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} key={item.id} type="button" onClick={() => {
                if (item.id === 'image') { fileInputRef.current?.click(); return }
                if (item.id === 'mic') { startRecording(); return }
                setActiveTray(current => (current === item.id ? null : item.id))
              }} style={{ border: 'none', background: '#fff', color: activeTray === item.id ? 'var(--app-accent)' : '#5d4450', display: 'grid', placeItems: 'center', padding: '0.25rem 0' }}>
                <Icon size={18} />
              </motion.button>
            )
          })}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImagePick} style={{ display: 'none' }} />
      </div>

      <BottomSheet open={showMenu} onClose={() => setShowMenu(false)} title="">
        <div style={{ display: 'grid', gap: '0.2rem' }}>
          <button type="button" onClick={() => { setShowMenu(false); onOpenTemplates() }} style={menuRowStyle}><span>Templates</span></button>
          <div style={menuStatStyle}><span>Words</span><strong>{wordCount}</strong></div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'background'} onClose={() => setActiveTray(null)} title="Background & paper">
        <div style={{ display: 'grid', gap: '1.1rem' }}>
          <div>
            <p style={sheetLabelStyle}>Theme</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem' }}>
              {BACKGROUNDS.map(item => (
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={item.id} type="button" onClick={() => setDraft(prev => ({ ...prev, backgroundId: item.id }))} style={{ border: item.id === draft.backgroundId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', overflow: 'hidden', padding: 0, background: '#fff' }}>
                  <div style={{ height: 60, background: item.gradient || item.bg }} />
                  <div style={{ padding: '0.6rem', textAlign: 'left', fontWeight: 700, color: '#3c2430', fontSize: '0.85rem' }}>{item.name}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <p style={sheetLabelStyle}>Paper</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.5rem' }}>
              {PAPER_STYLES.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDraft(prev => ({ ...prev, paperStyleId: item.id }))}
                  style={{ border: item.id === draft.paperStyleId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 'var(--app-radius-sm)', overflow: 'hidden', padding: 0, background: '#fff', cursor: 'pointer' }}
                >
                  <div style={{ height: 44, backgroundColor: '#fffdfb', backgroundImage: getPaperBackgroundImage(item.id, paperLineColor, paperSpacingPx), backgroundSize: getPaperBackgroundSize(item.id, paperSpacingPx) }} />
                  <div style={{ padding: '0.4rem', fontSize: '0.7rem', fontWeight: 700, color: '#3c2430' }}>{item.name}</div>
                </button>
              ))}
            </div>
          </div>

          {draft.paperStyleId !== 'plain' ? (
            <>
              <div>
                <p style={sheetLabelStyle}>Line color</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {PAPER_LINE_COLORS.map(item => (
                    <button key={item.id} type="button" onClick={() => setDraft(prev => ({ ...prev, paperLineColorId: item.id }))} aria-label={item.id} style={{ width: 30, height: 30, borderRadius: '50%', border: item.id === draft.paperLineColorId ? '2px solid #2f1e2a' : '1px solid #e5cdd8', background: item.value.replace(/[\d.]+\)$/, '0.9)') }} />
                  ))}
                </div>
              </div>
              <div>
                <p style={sheetLabelStyle}>Line spacing</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {PAPER_SPACINGS.map(item => (
                    <button key={item.id} type="button" onClick={() => setDraft(prev => ({ ...prev, paperSpacingId: item.id }))} style={{ flex: 1, border: item.id === draft.paperSpacingId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 999, background: '#fff', padding: '0.45rem 0', fontWeight: 700, fontSize: '0.78rem', color: '#3c2430', cursor: 'pointer' }}>{item.label}</button>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-sm)', padding: '0.7rem 0.9rem', cursor: 'pointer' }}>
            <span>
              <span style={{ display: 'block', fontWeight: 700, color: '#3c2430', fontSize: '0.85rem' }}>Book frame</span>
              <span style={{ display: 'block', fontSize: '0.72rem', color: '#8f7180' }}>Cover edge, spine shadow, page-edge detail</span>
            </span>
            <input type="checkbox" checked={draft.bookFrame} onChange={event => setDraft(prev => ({ ...prev, bookFrame: event.target.checked }))} style={{ width: 20, height: 20, accentColor: 'var(--app-accent)' }} />
          </label>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'sticker'} onClose={() => setActiveTray(null)} title="Stickers">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '0.65rem' }}>
          {STICKERS.map(sticker => (
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={sticker.id} type="button" onClick={() => addSticker(sticker)} style={emojiButtonStyle}>
              <StickerGlyph shapeId={sticker.shape} color={sticker.color} size={26} />
            </motion.button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showMoodPicker} onClose={() => setShowMoodPicker(false)} title="Mood">
        <div style={{ display: 'grid', gap: '0.85rem' }}>
          <div>
            <p style={sheetLabelStyle}>Quick picks</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {MOODS.map(mood => (
                <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} key={mood.label} type="button" onClick={() => { setDraft(prev => ({ ...prev, mood })); setShowMoodPicker(false) }} style={{ border: '1px solid var(--app-border)', borderRadius: 12, background: '#fff', padding: '0.5rem 0.65rem', display: 'grid', justifyItems: 'center', gap: 2, cursor: 'pointer' }}>
                  <span style={{ fontSize: '1.3rem' }}>{mood.emoji}</span>
                  <span style={{ fontSize: '0.62rem', color: '#8f7180' }}>{mood.label}</span>
                </motion.button>
              ))}
            </div>
          </div>
          <div>
            <p style={sheetLabelStyle}>All emoji</p>
            <EmojiPicker
              onEmojiClick={data => { setDraft(prev => ({ ...prev, mood: { emoji: data.emoji, label: '', score: null } })); setShowMoodPicker(false) }}
              width="100%"
              height={340}
              previewConfig={{ showPreview: false }}
              searchPlaceholder="Search all emoji..."
            />
          </div>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'font'} onClose={() => setActiveTray(null)} title="Font & color">
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div>
            <p style={sheetLabelStyle}>Color</p>
            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
              {COLORS.map(color => (
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} key={color} type="button" onClick={() => setDraft(prev => ({ ...prev, color }))} style={{ width: 30, height: 30, borderRadius: '50%', border: color === draft.color ? '2px solid #2f1e2a' : '1px solid #e5cdd8', background: color }} />
              ))}
            </div>
          </div>
          {['sans', 'serif', 'handwriting'].map(tier => (
            <div key={tier}>
              <p style={sheetLabelStyle}>{tier === 'sans' ? 'Sans' : tier === 'serif' ? 'Serif' : 'Handwriting'}</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.6rem' }}>
                {FONTS.filter(font => font.tier === tier).map(font => (
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} key={font.id} type="button" onClick={() => setDraft(prev => ({ ...prev, fontId: font.id }))} style={{ border: font.id === draft.fontId ? '2px solid var(--app-accent)' : '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', background: '#fff', padding: '0.75rem', fontFamily: font.family, fontSize: '1.05rem', color: '#2f1e2a' }}>{font.name}</motion.button>
                ))}
              </div>
            </div>
          ))}
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#8f7180' }}>Applies to Headline, Subheadline and Body — each keeps its own size.</p>
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'list'} onClose={() => setActiveTray(null)} title="List style">
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          {LIST_STYLES.map(style => {
            const Icon = style.icon
            return (
              <button key={style.id} type="button" onClick={() => insertList(style)} style={menuRowStyle}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}><Icon size={16} />{style.label}</span>
                <Icon size={14} color="#b08090" />
              </button>
            )
          })}
        </div>
      </BottomSheet>

      <BottomSheet open={activeTray === 'tag'} onClose={() => setActiveTray(null)} title="Tags">
        <div style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {TAG_SUGGESTIONS.map(tag => {
              const active = (draft.tags || []).includes(tag)
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: active ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : '#fff6fa', color: active ? '#fff' : 'var(--app-accent)', padding: '0.55rem 0.8rem', fontWeight: 700, cursor: 'pointer' }}>#{tag}</button>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              value={customTagDraft}
              onChange={event => setCustomTagDraft(event.target.value)}
              onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); commitCustomTag() } }}
              placeholder="Add your own tag"
              style={{ flex: 1, border: '1px solid var(--app-border)', borderRadius: 10, padding: '0.55rem 0.7rem', outline: 'none', fontFamily: "'General Sans', sans-serif" }}
            />
            <button type="button" onClick={commitCustomTag} style={{ border: 'none', borderRadius: 10, padding: '0.55rem 0.9rem', background: 'var(--app-accent)', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Add</button>
          </div>
          {(draft.tags || []).length ? (
            <div>
              <p style={sheetLabelStyle}>On this entry</p>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {draft.tags.map(tag => (
                  <button key={tag} type="button" onClick={() => toggleTag(tag)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, border: '1px solid var(--app-border)', borderRadius: 999, background: '#fff', color: 'var(--app-text)', padding: '0.4rem 0.7rem', fontSize: '0.78rem', cursor: 'pointer' }}>#{tag} <X size={12} /></button>
                ))}
              </div>
            </div>
          ) : null}
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

const ghostMiniActionStyle = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: '1px solid var(--app-border)',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
}

export default function Journal({ autoOpenWeeklyPulse = false, onWeeklyPulseOpened = () => {}, onWeeklyPulseSaved = () => {}, openTemplatesToken = 0 }) {
  const [entries, setEntries] = useState(() => safeRead())
  const [screen, setScreen] = useState('list')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState('latest')
  const [activeTagFilter, setActiveTagFilter] = useState(null)
  const [draft, setDraft] = useState(() => blankDraft())
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showMoodPicker, setShowMoodPicker] = useState(false)
  const [showSortSheet, setShowSortSheet] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateAnswers, setTemplateAnswers] = useState({})
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [entryActionId, setEntryActionId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [weeklyPulseDate, setWeeklyPulseDate] = useState(() => scopedGetItem(WEEKLY_PULSE_DATE_KEY) || '')
  const [weeklyPulseState, setWeeklyPulseState] = useState(() => ({
    phaseName: 'Phase 1',
    weekIndex: 1,
    completedDays: 0,
    totalDays: 7,
    workedChoice: '',
    workedCustom: '',
    slippedChoice: '',
    slippedCustom: '',
    difficulty: '',
  }))

  const previousEntriesRef = useRef(entries)

  useEffect(() => {
    safeWrite(entries)
    calculateUserPoints()
    // Push only the delta (added/changed/removed by id) to journal_entries —
    // hydration/one-time migration itself happens centrally in AppShell.jsx
    // before this component mounts (see supabaseSync.hydrateAllFromSupabase),
    // this is just the ongoing save-time push.
    syncJournalEntriesDelta(previousEntriesRef.current, entries)
    previousEntriesRef.current = entries
  }, [entries])

  // One-time repair on mount: collapse any pre-existing weekly-pulse duplicates
  // left over from before findExistingWeeklyPulseEntry existed (see
  // mergeWeeklyPulseDuplicates above). Runs after the effect above has already
  // captured the raw, duplicate-containing list in previousEntriesRef, so the
  // resulting setEntries is seen as a removal by the next run of that effect —
  // the dropped id gets a deleteMatch pushed to Supabase too, not just cleared
  // locally, so it doesn't come back on the next hydrate.
  useEffect(() => {
    setEntries(current => mergeWeeklyPulseDuplicates(current))
  }, [])

  useEffect(() => {
    if (weeklyPulseDate) {
      scopedSetItem(WEEKLY_PULSE_DATE_KEY, weeklyPulseDate)
    }
  }, [weeklyPulseDate])

  // Structured, not text search — a tag is a real field on the entry (see
  // blankDraft/saveEntry), so filtering by it is an exact array membership
  // check, not a "#tagname" substring match against the prose.
  const allTags = useMemo(() => (
    Array.from(new Set(entries.flatMap(entry => (Array.isArray(entry.tags) ? entry.tags : [])))).sort()
  ), [entries])
  const filteredEntries = useMemo(() => {
    const bySearch = sortEntries(entries, search, sortOrder)
    return activeTagFilter ? bySearch.filter(entry => Array.isArray(entry.tags) && entry.tags.includes(activeTagFilter)) : bySearch
  }, [entries, search, sortOrder, activeTagFilter])
  const currentWeeklyPulsePayload = useMemo(() => buildWeeklyPulsePayload(), [weeklyPulseDate, entries])
  const daysIn = useMemo(() => getPlatformDaysIn(), [entries, weeklyPulseDate])
  const weeklyPulseDue = useMemo(() => {
    if (daysIn < 7) return false
    const phaseKey = normalizeLabel(currentWeeklyPulsePayload?.phaseName || 'phase 1')
    const currentWeekNumber = Number(currentWeeklyPulsePayload?.currentWeekNumber || 1)
    if (currentWeekNumber <= 1) return false
    const previousWeekNumber = String(Math.max(1, currentWeekNumber - 1))
    const completionStore = (() => {
      try { return JSON.parse(scopedGetItem(WEEKLY_PULSE_COMPLETION_KEY) || '{}') } catch { return {} }
    })()
    if (completionStore?.[phaseKey]?.[previousWeekNumber]) return false
    // The completion flag above is device-local and never synced to Supabase, so it
    // can go stale (new device, cleared storage) even though the reflection was
    // already saved. Fall back to the synced entries themselves before calling it due.
    return !findExistingWeeklyPulseEntry(entries, currentWeeklyPulsePayload?.phaseName, previousWeekNumber)
  }, [currentWeeklyPulsePayload, weeklyPulseDate, daysIn, entries])

  function prepareWeeklyPulseState() {
    const boardData = readVisionBoardData()
    const phase = getActivePhase(boardData) || (Array.isArray(boardData?.phases) ? boardData.phases[0] : null)
    const summary = getWeekCompletionSummary(boardData)
    setWeeklyPulseState({
      phaseName: removeDashPunctuation(String(phase?.name || 'Phase 1').trim()),
      weekIndex: summary.weekIndex,
      completedDays: summary.completedDays,
      totalDays: summary.totalDays,
      workedChoice: '',
      workedCustom: '',
      slippedChoice: '',
      slippedCustom: '',
      difficulty: '',
    })
  }

  function openWeeklyPulse() {
    if (daysIn < 7) return
    setScreen('weekly-pulse')
  }

  useEffect(() => {
    if (screen !== 'weekly-pulse') return
    prepareWeeklyPulseState()
  }, [screen])

  useEffect(() => {
    if (!autoOpenWeeklyPulse) return
    if (daysIn < 7) return
    openWeeklyPulse()
    onWeeklyPulseOpened?.()
  }, [autoOpenWeeklyPulse, daysIn])

  useEffect(() => {
    if (!openTemplatesToken) return
    setSelectedTemplate(null)
    setTemplateAnswers({})
    setEditingEntryId(null)
    setDraft(blankDraft())
    setShowMoodPicker(false)
    setScreen('templates')
  }, [openTemplatesToken])

  function startNewEntry() {
    setDraft(blankDraft())
    setSelectedTemplate(null)
    setTemplateAnswers({})
    setEditingEntryId(null)
    setShowMoodPicker(false)
    setScreen('write')
  }

  function pickMood(mood) {
    setDraft(prev => ({ ...prev, mood }))
    setShowMoodPicker(false)
    setEditingEntryId(null)
    setScreen('write')
  }

  function selectTemplate(template) {
    // Resolved once here so both this detail screen and the later save both see
    // the same real pillar names, not the raw {{PILLARS}} token.
    const resolved = { ...template, fields: resolveTemplateFields(template.fields) }
    setSelectedTemplate(resolved)
    setTemplateAnswers(Object.fromEntries(resolved.fields.map(field => [field.label, ''])))
    setScreen('template-detail')
  }

  function setWeeklyPulseField(field, value) {
    setWeeklyPulseState(current => ({ ...current, [field]: value }))
  }

  // Chips answer the question by default; "or say it" reuses the same SpeechRecognition
  // capture already used elsewhere in this flow, just retargeted at the custom-text field.
  function captureWeeklyPulseVoice(field) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      return
    }
    const customField = field === 'worked' ? 'workedCustom' : 'slippedCustom'
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result?.[0]?.transcript || '')
        .join(' ')
        .trim()
      if (!transcript) return
      setWeeklyPulseState(current => {
        const base = (current[customField] || '').trim()
        return { ...current, [customField]: base ? `${base} ${transcript}` : transcript }
      })
    }
    recognition.start()
  }

  function saveWeeklyPulseToDraft() {
    if (!weeklyPulseState.difficulty) return
    const workedAnswer = (weeklyPulseState.workedCustom || '').trim() || weeklyPulseState.workedChoice
    const slippedAnswer = (weeklyPulseState.slippedCustom || '').trim() || weeklyPulseState.slippedChoice
    const nextWeekChoiceLabel = weeklyPulseState.difficulty === 'easier' ? 'Make it easier' : 'Push a bit more'
    const proofLine = `You showed up ${weeklyPulseState.completedDays} of ${weeklyPulseState.totalDays} days this week. That's real.`

    const boardData = readVisionBoardData()
    const phase = getActivePhase(boardData)
    const dialResult = applyDifficultyDial({
      phase,
      difficultyChoice: weeklyPulseState.difficulty,
      completedDays: weeklyPulseState.completedDays,
      totalDays: weeklyPulseState.totalDays,
      weekIndexJustFinished: weeklyPulseState.weekIndex || 1,
    })
    const nextTask = getTodayTask(boardData)
    const payoffLine = getDialPayoffLine(dialResult, {
      nextTaskLabel: nextTask?.task || '',
      weekIndex: weeklyPulseState.weekIndex || 1,
    })

    const templateFields = [
      { label: 'What worked', subtext: '' },
      { label: 'What slipped', subtext: '' },
      { label: 'Next week', subtext: '' },
    ]
    const templateAnswers = {
      'What worked': workedAnswer || 'Not answered',
      'What slipped': slippedAnswer || 'Not answered',
      'Next week': nextWeekChoiceLabel,
    }
    const content = [
      proofLine,
      workedAnswer ? `What worked: ${workedAnswer}` : '',
      slippedAnswer ? `What slipped: ${slippedAnswer}` : '',
      `Next week: ${nextWeekChoiceLabel}`,
    ]
      .join('\n\n')
      .trim()

    const weeklyPulseTitle = `Weekly Reflection — Week ${weeklyPulseState.weekIndex || 1}`

    // A stale completion flag (see findExistingWeeklyPulseEntry above) can make this
    // screen reappear for a week that was already reflected on — reuse that entry's id
    // and original write date instead of minting a new one, so a repeat submission
    // updates the one true entry rather than adding a second one dated "today".
    const existingEntry = findExistingWeeklyPulseEntry(entries, weeklyPulseState.phaseName, weeklyPulseState.weekIndex || 1)

    // Deterministic copy, not an AI call: the payoff is a mechanical reflection of a
    // two-choice answer (CLAUDE.md's "use deterministic code for product rules" — AI is
    // for interpretation, not for restating a choice she just made). This also means the
    // ~60-second flow doesn't wait on a network round trip.
    const entry = {
      id: existingEntry?.id ?? Date.now(),
      createdAt: existingEntry?.createdAt || new Date().toISOString(),
      date: existingEntry?.date || getToday(),
      title: weeklyPulseTitle,
      content,
      prompt: 'Weekly Reflection',
      mood: MOODS[0],
      clarityScore: 7,
      clarityLabel: 'Reflective',
      sageResponse: payoffLine,
      templateAccent: '#fff5f7',
      templateFields,
      templateAnswers,
      weeklyPulseMeta: {
        phaseName: weeklyPulseState.phaseName,
        pillars: [],
        weekNumber: weeklyPulseState.weekIndex || 1,
        completedDays: weeklyPulseState.completedDays,
        totalDays: weeklyPulseState.totalDays,
        difficultyChoice: weeklyPulseState.difficulty,
        // What the dial actually did with that choice — see lib/lockIn.js's
        // applyDifficultyDial. outcome: 'lighter' | 'harder' | 'held'.
        dialOutcome: dialResult.outcome,
        dialReason: dialResult.reason,
        dialStep: dialResult.step,
        whatWorked: workedAnswer,
        whatSlipped: slippedAnswer,
      },
    }

    setEntries(current => existingEntry
      ? current.map(item => item.id === existingEntry.id ? entry : item)
      : [entry, ...current])
    setSelectedEntry(entry)
    setWeeklyPulseDate(getToday())
    const phaseKey = normalizeLabel(weeklyPulseState.phaseName || 'phase 1')
    const completionStore = (() => {
      try { return JSON.parse(scopedGetItem(WEEKLY_PULSE_COMPLETION_KEY) || '{}') } catch { return {} }
    })()
    completionStore[phaseKey] = completionStore[phaseKey] || {}
    completionStore[phaseKey][String(weeklyPulseState.weekIndex || 1)] = getToday()
    scopedSetItem(WEEKLY_PULSE_COMPLETION_KEY, JSON.stringify(completionStore))
    scopedSetItem(`phasr_weekly_pulse_w${weeklyPulseState.weekIndex || 1}_done`, 'true')
    markWeeklyPulseDoneIfWeekOne(weeklyPulseState.weekIndex || 1)
    onWeeklyPulseSaved?.()
    setScreen('detail')
  }

    async function saveEntry() {
      if (!draft.content.trim()) return
      setIsSaving(true)
      setScreen('processing')
      try {
        const isWeeklyPulse = ['weekly reflection', 'sage reflect'].includes(String(draft.prompt || '').toLowerCase())
        const normalizedContent = draft.templateFields
          ? getTemplateSummary({ templateFields: draft.templateFields, templateAnswers: draft.templateAnswers })
          : draft.content
        const analysisInput = {
          ...draft,
          content: normalizedContent,
          isWeeklyPulse,
        }
        const analysis = await generateSageAnalysis(analysisInput)
        const entry = {
          id: editingEntryId || Date.now(),
          createdAt: new Date().toISOString(),
          date: draft.date,
          title: getEntryTitle(draft, analysis.generatedTitle),
          subheadline: draft.subheadline || '',
          content: normalizedContent,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        // Structured, queryable — not buried in the text. Sage (or a future filter UI)
        // reads this array directly instead of parsing "#tagname" out of prose.
        tags: Array.isArray(draft.tags) ? draft.tags : [],
        clarityScore: Number(analysis.clarityScore || draft.mood?.score || 7),
        clarityLabel: analysis.clarityLabel || draft.mood?.label || 'Reflective',
        sageResponse: analysis.sageResponse || '',
        backgroundId: draft.backgroundId,
        paperStyleId: draft.paperStyleId || 'plain',
        paperLineColorId: draft.paperLineColorId || 'rose',
        paperSpacingId: draft.paperSpacingId || 'regular',
        bookFrame: Boolean(draft.bookFrame),
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
        stickers: Array.isArray(draft.stickers) ? draft.stickers : [],
        templateAccent: draft.templateAccent,
        templateFields: draft.templateFields,
        templateAnswers: draft.templateAnswers,
        weeklyPulseMeta: isWeeklyPulse ? {
          phaseName: draft.weeklyPulsePhaseName || '',
          pillars: draft.weeklyPulsePillars || [],
          weekNumber: draft.weeklyPulseWeekNumber || 1,
        } : null,
      }
      setEntries(current => editingEntryId ? current.map(item => item.id === editingEntryId ? entry : item) : [entry, ...current])
      setSelectedEntry(entry)
      if (isWeeklyPulse) {
        setWeeklyPulseDate(getToday())
        const completionStore = (() => {
          try { return JSON.parse(scopedGetItem(WEEKLY_PULSE_COMPLETION_KEY) || '{}') } catch { return {} }
        })()
        const phaseKey = normalizeLabel(draft.weeklyPulsePhaseName || 'phase 1')
        completionStore[phaseKey] = completionStore[phaseKey] || {}
        completionStore[phaseKey][String(draft.weeklyPulseWeekNumber || 1)] = getToday()
        scopedSetItem(WEEKLY_PULSE_COMPLETION_KEY, JSON.stringify(completionStore))
        scopedSetItem(`phasr_weekly_pulse_w${draft.weeklyPulseWeekNumber || 1}_done`, 'true')
        markWeeklyPulseDoneIfWeekOne(draft.weeklyPulseWeekNumber || 1)
        onWeeklyPulseSaved?.()
      }
      setEditingEntryId(null)
      setScreen('detail')
      } catch {
        const normalizedContent = draft.templateFields
          ? getTemplateSummary({ templateFields: draft.templateFields, templateAnswers: draft.templateAnswers })
          : draft.content
        const fallback = {
          id: editingEntryId || Date.now(),
          createdAt: new Date().toISOString(),
          date: draft.date,
          title: getEntryTitle(draft),
          subheadline: draft.subheadline || '',
          content: normalizedContent,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        tags: Array.isArray(draft.tags) ? draft.tags : [],
        clarityScore: draft.mood?.score || 7,
        clarityLabel: draft.mood?.label || 'Reflective',
        sageResponse: 'You captured something real here. Come back to the clearest sentence and let it guide your next step.',
        backgroundId: draft.backgroundId,
        paperStyleId: draft.paperStyleId || 'plain',
        paperLineColorId: draft.paperLineColorId || 'rose',
        paperSpacingId: draft.paperSpacingId || 'regular',
        bookFrame: Boolean(draft.bookFrame),
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
        stickers: Array.isArray(draft.stickers) ? draft.stickers : [],
        templateAccent: draft.templateAccent,
        templateFields: draft.templateFields,
        templateAnswers: draft.templateAnswers,
        weeklyPulseMeta: ['weekly reflection', 'sage reflect'].includes(String(draft.prompt || '').toLowerCase()) ? {
          phaseName: draft.weeklyPulsePhaseName || '',
          pillars: draft.weeklyPulsePillars || [],
          weekNumber: draft.weeklyPulseWeekNumber || 1,
        } : null,
      }
      setEntries(current => editingEntryId ? current.map(item => item.id === editingEntryId ? fallback : item) : [fallback, ...current])
      setSelectedEntry(fallback)
      if (['weekly reflection', 'sage reflect'].includes(String(draft.prompt || '').toLowerCase())) {
        setWeeklyPulseDate(getToday())
        const completionStore = (() => {
          try { return JSON.parse(scopedGetItem(WEEKLY_PULSE_COMPLETION_KEY) || '{}') } catch { return {} }
        })()
        const phaseKey = normalizeLabel(draft.weeklyPulsePhaseName || 'phase 1')
        completionStore[phaseKey] = completionStore[phaseKey] || {}
        completionStore[phaseKey][String(draft.weeklyPulseWeekNumber || 1)] = getToday()
        scopedSetItem(WEEKLY_PULSE_COMPLETION_KEY, JSON.stringify(completionStore))
        scopedSetItem(`phasr_weekly_pulse_w${draft.weeklyPulseWeekNumber || 1}_done`, 'true')
        markWeeklyPulseDoneIfWeekOne(draft.weeklyPulseWeekNumber || 1)
        onWeeklyPulseSaved?.()
      }
      setEditingEntryId(null)
      setScreen('detail')
    } finally {
      setIsSaving(false)
    }
  }

  function applyTemplateAnswers() {
    if (!selectedTemplate) return
    const nextContent = buildTemplateContent(selectedTemplate, templateAnswers)
    setDraft(prev => ({
      ...prev,
      prompt: selectedTemplate.name,
      title: prev.title,
      content: nextContent,
      templateAccent: selectedTemplate.accent,
      templateFields: selectedTemplate.fields,
      templateAnswers,
    }))
    setScreen('write')
  }

  function editEntry(entry) {
    setDraft({
      date: entry.date || getToday(),
      title: entry.title || '',
      subheadline: entry.subheadline || '',
      content: entry.content || '',
      prompt: entry.prompt || PROMPTS[0],
      mood: entry.mood || MOODS[0],
      tags: Array.isArray(entry.tags) ? entry.tags : [],
      backgroundId: entry.backgroundId || 'original',
      paperStyleId: entry.paperStyleId || 'plain',
      paperLineColorId: entry.paperLineColorId || 'rose',
      paperSpacingId: entry.paperSpacingId || 'regular',
      bookFrame: Boolean(entry.bookFrame),
      templateAccent: entry.templateAccent || '',
      templateFields: entry.templateFields || null,
      templateAnswers: entry.templateAnswers || {},
      weeklyPulsePhaseName: entry.weeklyPulseMeta?.phaseName || '',
      weeklyPulsePillars: entry.weeklyPulseMeta?.pillars || [],
      weeklyPulseWeekNumber: entry.weeklyPulseMeta?.weekNumber || 1,
      color: entry.color || '#2f1e2a',
      fontId: entry.fontId || 'general-sans',
      images: Array.isArray(entry.images) ? entry.images : [],
      stickers: Array.isArray(entry.stickers) ? entry.stickers : [],
    })
    setEditingEntryId(entry.id)
    setEntryActionId(null)
    setScreen('write')
  }

  if (screen === 'weekly-pulse') {
    return (
      <WeeklyReflectionFlow
        phaseName={weeklyPulseState.phaseName}
        completedDays={weeklyPulseState.completedDays}
        totalDays={weeklyPulseState.totalDays}
        workedChoice={weeklyPulseState.workedChoice}
        workedCustom={weeklyPulseState.workedCustom}
        onWorkedChoice={value => setWeeklyPulseField('workedChoice', value)}
        onWorkedCustom={value => setWeeklyPulseField('workedCustom', value)}
        slippedChoice={weeklyPulseState.slippedChoice}
        slippedCustom={weeklyPulseState.slippedCustom}
        onSlippedChoice={value => setWeeklyPulseField('slippedChoice', value)}
        onSlippedCustom={value => setWeeklyPulseField('slippedCustom', value)}
        difficulty={weeklyPulseState.difficulty}
        onDifficulty={value => setWeeklyPulseField('difficulty', value)}
        onVoiceCapture={captureWeeklyPulseVoice}
        onBack={() => setScreen('list')}
        onSave={saveWeeklyPulseToDraft}
        canSave={Boolean(weeklyPulseState.difficulty)}
      />
    )
  }

  if (screen === 'write') {
    return (
        <JournalWriter
          draft={draft}
          setDraft={setDraft}
          onBack={() => setScreen('list')}
          onSave={saveEntry}
          onOpenTemplates={() => setScreen('templates')}
          isSaving={isSaving}
        />
      )
  }

  if (screen === 'templates') {
    return <TemplatesPage onBack={() => setScreen('write')} onSelect={selectTemplate} />
  }

  if (screen === 'template-detail' && selectedTemplate) {
    return (
      <TemplateDetail
        template={selectedTemplate}
        answers={templateAnswers}
        onChange={(key, value) => setTemplateAnswers(current => ({ ...current, [key]: value }))}
        onBack={() => setScreen('templates')}
        onApply={applyTemplateAnswers}
      />
    )
  }

  if (screen === 'processing') {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', display: 'grid', placeItems: 'center', background: '#fff', padding: '2rem' }}>
        <div style={{ textAlign: 'center', display: 'grid', gap: '1rem' }}>
          <div style={{ width: 88, height: 88, margin: '0 auto', borderRadius: '50%', border: '6px solid #fde2ec', borderTopColor: 'var(--app-accent)', animation: 'phasr-spin 1s linear infinite' }} />
          <div style={{ width: 82, height: 82, margin: '0 auto', borderRadius: '50%', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>SAGE</div>
          <p style={{ margin: 0, fontFamily: "'Fraunces', serif", fontSize: '1.8rem', lineHeight: 1.25, color: '#3b2330' }}>Sage is reading your entry...</p>
          <p style={{ margin: 0, color: '#8f7180', lineHeight: 1.8 }}>Generating your clarity score and personal response.</p>
          <style>{`@keyframes phasr-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  if (screen === 'detail' && selectedEntry) {
    return <EntryDetail entry={selectedEntry} onBack={() => setScreen('list')} onEdit={() => editEntry(selectedEntry)} />
  }

  return (
    <>
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1rem 1rem 5.5rem' }}>
        <div style={{ width: '100%', maxWidth: '100%', margin: 0, display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fff6fa', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-lg)', padding: '0.8rem 0.85rem', boxShadow: 'var(--app-shadow-sm)' }}>
            <Search size={18} color="#8b6977" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search entries..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.98rem', color: 'var(--app-text)', minWidth: 0 }} />
              <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} type="button" onClick={() => setShowSortSheet(true)} style={{ width: 42, height: 42, border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', background: '#fff', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' }}><ArrowUpDown size={16} /></motion.button>
          </div>

          {allTags.length ? (
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 2 }}>
              {allTags.map(tag => {
                const active = activeTagFilter === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setActiveTagFilter(current => (current === tag ? null : tag))}
                    style={{ flexShrink: 0, border: '1px solid var(--app-border)', borderRadius: 999, background: active ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))' : '#fff', color: active ? '#fff' : 'var(--app-accent)', padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    #{tag}
                  </button>
                )
              })}
            </div>
          ) : null}

          {daysIn < 7 ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ borderRadius: 'var(--app-radius-md)', border: '1px solid #f2c4d0', background: '#fff', padding: '0.9rem', display: 'grid', gap: '0.55rem', boxShadow: 'var(--app-shadow-md)' }}>
              <p style={{ margin: 0, fontWeight: 800, color: '#2f1e2a' }}>Weekly Reflection unlocks after your first 7 days</p>
            </motion.div>
          ) : weeklyPulseDue ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }} style={{ borderRadius: 'var(--app-radius-md)', border: '1px solid #f2c4d0', background: '#fff', padding: '0.9rem', display: 'grid', gap: '0.55rem', boxShadow: 'var(--app-shadow-md)' }}>
              <p style={{ margin: 0, fontWeight: 800, color: '#2f1e2a' }}>Your week is done.</p>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="button" onClick={openWeeklyPulse} style={{ justifySelf: 'start', border: 'none', borderRadius: 'var(--app-radius-sm)', padding: '0.62rem 0.9rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800 }}>
                Weekly Reflection
              </motion.button>
            </motion.div>
          ) : null}

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {filteredEntries.map((entry, i) => (
              <motion.button
                key={entry.id}
                type="button"
                onClick={() => { setSelectedEntry(entry); setScreen('detail') }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.04 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{ border: 'none', background: '#fff', borderRadius: 'var(--app-radius-sm)', boxShadow: 'var(--app-shadow-sm)', padding: '0.7rem 0.85rem 1rem', textAlign: 'left', display: 'grid', gap: '0.42rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.9rem' }}>
                  <p style={{ margin: 0, color: '#3c2430', fontSize: '1.08rem', fontWeight: 700, lineHeight: 1.35, flex: 1 }}>{getEntryTitle(entry) || 'Untitled reflection'}</p>
                  <p style={{ margin: 0, color: '#8f7180', fontSize: '0.9rem', flexShrink: 0, textAlign: 'right' }}>{formatDate(entry.date)}</p>
                </div>
                  <p style={{ margin: 0, color: '#8f7180', fontSize: '0.94rem', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {makePreview(entry.content || getTemplateSummary(entry) || 'Start writing...')}
                  </p>
                <button type="button" onClick={event => { event.stopPropagation(); setSelectedEntry(entry); setScreen('detail') }} style={{ border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800, justifySelf: 'start', padding: 0 }}>See more</button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginTop: '0.22rem' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', borderRadius: 999, border: '1px solid var(--app-border)', padding: '0.35rem 0.72rem', color: '#6d5862', fontSize: '0.84rem', fontWeight: 700, background: '#fff9fb' }}>
                      <span>{entry.mood?.emoji || '😌'}</span>
                      <span>{entry.clarityLabel || 'Reflective'}</span>
                      <span>· {entry.clarityScore || 7}/10</span>
                    </span>
                    <button type="button" onClick={event => { event.stopPropagation(); setEntryActionId(current => current === entry.id ? null : entry.id) }} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 800 }}><MoreHorizontal size={18} /></button>
                  </div>
                <p style={{ display: 'none' }}>{entry.sageResponse || 'Sage response will appear here.'}</p>
                {entryActionId === entry.id ? (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.55rem', marginTop: '0.4rem' }}>
                      <button type="button" onClick={event => { event.stopPropagation(); editEntry(entry) }} style={{ ...ghostMiniActionStyle, color: 'var(--app-accent)' }}><Pencil size={16} /></button>
                      <button type="button" onClick={event => { event.stopPropagation(); setEntries(current => current.filter(item => item.id !== entry.id)); setEntryActionId(null) }} style={{ ...ghostMiniActionStyle, color: '#d24b78' }}><Trash2 size={16} /></button>
                    </div>
                  ) : null}
              </motion.button>
            ))}

            {!filteredEntries.length ? (
              <div style={{ borderRadius: 'var(--app-radius-lg)', border: '1px solid var(--app-border)', background: '#fff', padding: '1.2rem', color: '#8f7180', textAlign: 'center' }}>
                {activeTagFilter ? `No entries tagged #${activeTagFilter}.` : 'No entries yet. Tap the plus button to start.'}
              </div>
            ) : null}
          </div>
        </div>

        {/* Plain wrapper does the centering via flexbox, not transform — the
            button itself uses framer-motion's own transform for whileHover/
            whileTap scale, and a manual `transform: translateX(50%)` on the
            same element gets silently overwritten by that, which is what
            made the button appear to "move" out from under a tap. */}
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: '1.2rem', display: 'flex', justifyContent: 'center', zIndex: 8, pointerEvents: 'none' }}>
          <motion.button whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }} type="button" onClick={startNewEntry} style={{ width: 68, height: 68, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', boxShadow: 'var(--app-shadow-lg)', display: 'grid', placeItems: 'center', pointerEvents: 'auto' }}>
            <Plus size={30} />
          </motion.button>
        </div>
      </div>

      <BottomSheet open={showSortSheet} onClose={() => setShowSortSheet(false)} title="Sort entries">
        <div style={{ display: 'grid', gap: '0.65rem' }}>
          {[{ id: 'latest', label: 'Latest first' }, { id: 'oldest', label: 'Oldest first' }].map(option => (
            <button key={option.id} type="button" onClick={() => { setSortOrder(option.id); setShowSortSheet(false) }} style={menuRowStyle}>
              <span>{option.label}</span>
              {option.id === sortOrder ? <span>?</span> : null}
            </button>
          ))}
        </div>
      </BottomSheet>

      <BottomSheet open={showMoodPicker} onClose={() => setShowMoodPicker(false)} title={null}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}><p style={{ margin: 0, color: '#af8396', fontSize: '1rem' }}>How are you feeling right now?</p></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.8rem' }}>
          {MOODS.map(mood => (
            <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} key={mood.label} type="button" onClick={() => pickMood(mood)} style={{ border: 'none', background: 'transparent', display: 'grid', justifyItems: 'center', gap: '0.3rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{mood.emoji}</span>
              <span style={{ fontSize: '0.72rem', color: '#8f7180' }}>{mood.label}</span>
            </motion.button>
          ))}
        </div>
        <button type="button" onClick={() => { setDraft(prev => ({ ...prev, mood: MOODS[0] })); setShowMoodPicker(false); setScreen('write') }} style={{ marginTop: '0.7rem', border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 700, fontSize: '0.7rem', width: '100%' }}>Skip for now ?</button>
      </BottomSheet>

    </>
  )
}

