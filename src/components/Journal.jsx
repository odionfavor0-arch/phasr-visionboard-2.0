import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpDown,
  ArrowLeft,
  Image as ImageIcon,
  List,
  Mic,
  MoreHorizontal,
  Paintbrush,
  Pencil,
  Plus,
  Search,
  Smile,
  Tag,
  Trash2,
  Type,
  Volume2,
} from 'lucide-react'

const STORAGE_KEY = 'phasr_journal_v2'
const WEEKLY_PULSE_DATE_KEY = 'phasr_weekly_pulse_date'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const MS_IN_DAY = 24 * 60 * 60 * 1000

const PHASE_QUESTIONS = {
  'phase 1': [
    'Who did I show up as this week?',
    'Was that the person I want to be?',
  ],
  'phase 2': [
    'Who did I show up for this week?',
    'Who did I neglect — including myself?',
  ],
  'phase 3': [
    'What did I avoid this week that I know mattered?',
    'What was underneath that avoidance?',
  ],
  'phase 4': [
    'Did my actions this week match what I say I value?',
    'What one shift would make next week feel different?',
  ],
}

const PILLAR_QUESTIONS = {
  'health and fitness': [
    'Close your eyes. The version of you that has already achieved your health goal is looking back at this exact week. She is not judging you. She is just watching. What does she see?',
    'Your body kept score this week. What did it register that your mind tried to ignore?',
    'There is a habit you keep almost starting. Not almost — you have started it and stopped it. What would it mean about you if you actually kept it this week?',
    'The goal is not the body. The goal is the feeling on the other side of the body. What feeling are you really chasing — and did anything this week give you a taste of it?',
    'Who in your life would notice first if you became the healthiest version of yourself? What would they see that is not there yet?',
    'You already know what you need to do. The question is what you are using as a reason not to do it. What is the real reason?',
  ],
  'career and business': [
    'You are building something. But building requires believing before there is proof. Where did your belief waver this week — and what was underneath that?',
    'Imagine the moment you hit your biggest career goal. Not the achievement. The feeling in your chest in the room where it happens. What did this week do to get you closer to that room?',
    'What are you still waiting for permission to do? Who are you waiting to get it from?',
    'The work you avoid the most is usually the work that matters the most. What did you avoid this week that you already know was important?',
    'Five years from now you will either look back at this phase as the moment everything changed or the moment you played it safe. Which one is this week pointing toward?',
    'What would you be building right now if you were not afraid of what people would think?',
  ],
  'wealth and finance': [
    'Money follows decision. What financial decision have you been postponing that you already know the answer to?',
    'What is your relationship with money telling you about your relationship with yourself right now?',
    'Visualize the version of you who is financially free. Not rich. Free. What does her week look like compared to yours right now?',
    'Where are you spending money to feel something you have not dealt with yet?',
    'What belief about money did you inherit that is quietly running your decisions right now?',
    'The gap between where you are financially and where you want to be — is it a knowledge gap or a behaviour gap? Be honest.',
  ],
  relationships: [
    'Think about the most important relationship in your life right now. How present have you actually been — not how busy, how present?',
    'There is something you have not said to someone that needs to be said. Not to hurt them. Because it is true. What is stopping you?',
    'Who showed up for you this week? Did you let them?',
    'The version of you achieving your goals — is she someone the people you love would recognise? Or is she someone they would have to get used to?',
    'Where are you keeping the peace at the cost of your own truth?',
    'What does the most important relationship in your life need from you right now that you have not been giving?',
  ],
  'inner life': [
    'Underneath the week, underneath the tasks and the noise — what were you actually feeling? Not what you told people. What you felt alone.',
    'There is a version of peace that you have experienced before. Briefly, quietly. What was happening when you last felt it?',
    'What are you carrying right now that is not yours to carry?',
    'Your intuition spoke to you this week. You may have called it anxiety or overthinking. But it was trying to tell you something. What was it?',
    'When did you last feel fully like yourself — not performing, not managing, just present? What made that possible?',
    'What would you do differently this week if you genuinely believed you were enough exactly as you are right now?',
  ],
  'personal growth': [
    'Who were you this week compared to who you were a month ago? Name one specific thing that is different.',
    'What uncomfortable thing did you do this week that the old version of you would have avoided?',
    'The pattern you keep repeating — you know the one. What would it take to actually break it this week?',
    'What have you learned recently that you have not yet applied? What is stopping you from applying it?',
    'Growth is not always visible. Sometimes it is just choosing differently in a quiet moment. Where did you choose differently this week?',
    'What version of yourself are you most afraid of becoming? And are any of your current habits moving you toward that?',
  ],
}

const THERAPIST_MOVES = {
  'health and fitness': 'Before one meal this week, sit with your food for 60 seconds before eating. Notice what you feel — hunger, habit, stress, boredom. Write one word about it afterward.',
  'career and business': 'Say out loud, alone in a room, exactly what you are building and why it matters. Say it like you mean it. Notice where your voice gets quiet. That is where the doubt lives.',
  'wealth and finance': 'Open your bank account or spending history and look at the last 30 days without judgment. Notice your first feeling. Not the numbers — the feeling. Write it down.',
  relationships: 'Send one message this week to someone you have been meaning to reach out to. Not a long message. Just the one that says you thought of them. Notice how long it takes you to press send.',
  'inner life': 'Sit somewhere quiet for 5 minutes this week with no phone, no music, nothing. Just you. If thoughts come, let them. If nothing comes, stay anyway. Write one sentence about what came up.',
  'personal growth': 'Do one thing this week that the version of you from a year ago would not have done. It does not have to be big. It just has to be real. Write what it was and how it felt.',
}

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
    ],
  },
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

function readVisionBoardData() {
  try {
    const direct = localStorage.getItem('phasr_vb')
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

function buildWeeklyPulsePayload() {
  const boardData = readVisionBoardData()
  const phase = getActivePhase(boardData)
  const phaseName = String(phase?.name || 'Phase 1').trim()
  const fixedQuestions = PHASE_QUESTIONS[normalizeLabel(phaseName)] || PHASE_QUESTIONS['phase 1']

  const pillars = Array.isArray(phase?.pillars)
    ? phase.pillars.map(item => String(item?.name || '').trim()).filter(Boolean)
    : []

  const weekIndexSeed = Math.floor(Date.now() / (7 * MS_IN_DAY))
  const firstTwoPillars = pillars.slice(0, 2)

  const pillarQuestions = firstTwoPillars.map((pillarName) => {
    const key = normalizeLabel(pillarName)
    const pool = PILLAR_QUESTIONS[key] || []
    if (!pool.length) return ''
    return pool[weekIndexSeed % pool.length]
  }).filter(Boolean)

  // Guarantee 4 questions when possible by reusing first available pool if user has only one pillar.
  if (pillarQuestions.length < 2 && firstTwoPillars[0]) {
    const key = normalizeLabel(firstTwoPillars[0])
    const pool = PILLAR_QUESTIONS[key] || []
    if (pool.length > 1) {
      const fallbackIndex = (weekIndexSeed + 1) % pool.length
      const fallbackQuestion = pool[fallbackIndex]
      if (fallbackQuestion && !pillarQuestions.includes(fallbackQuestion)) {
        pillarQuestions.push(fallbackQuestion)
      }
    }
  }

  const safePillars = firstTwoPillars.length ? firstTwoPillars : ['Personal Growth']
  const therapistMove = THERAPIST_MOVES[normalizeLabel(safePillars[0])] || THERAPIST_MOVES['personal growth']
  const weeklyQuestions = [...fixedQuestions.slice(0, 2), ...pillarQuestions.slice(0, 2)].slice(0, 4)

  while (weeklyQuestions.length < 4) {
    weeklyQuestions.push('What truth from this week do I need to carry into next week?')
  }

  return {
    phaseName,
    pillars: safePillars,
    weeklyQuestions,
    therapistMove,
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
    let pattern = 'You are showing effort, but your consistency shifts when pressure rises.'
    let correction = 'Pick one non-negotiable block this week and protect it daily.'
    let focus = 'Show up as the same person on hard days, not only on easy days.'

    const low = text.toLowerCase()
    if (low.includes('avoid') || low.includes('fear')) {
      pattern = 'Fear is quietly deciding what gets postponed.'
      correction = 'Start with the one task you have been avoiding in a fixed time block.'
      focus = 'Courage through one uncomfortable action each day.'
    } else if (low.includes('relationship') || low.includes('friend') || low.includes('partner') || low.includes('family')) {
      pattern = 'You are carrying unsaid things that need honest expression.'
      correction = 'Have one direct conversation you have been delaying.'
      focus = 'Clarity in relationships over silent assumptions.'
    } else if (low.includes('identity') || low.includes('perform') || low.includes('approval')) {
      pattern = 'You are torn between being real and being accepted.'
      correction = 'Choose one decision this week that reflects your values, not performance.'
      focus = 'Lead with identity before image.'
    }

    return `You’re growing faster than you think.

=== Key pattern Sage noticed ===
${pattern}

=== One correction ===
${correction}

=== Next focus ===
${focus}

Ready to start your next week aligned.`
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
    content: '',
    prompt: PROMPTS[0],
    mood: null,
    backgroundId: 'original',
    templateAccent: '',
    templateFields: null,
    templateAnswers: {},
    weeklyPulsePhaseName: '',
    weeklyPulsePillars: [],
    color: '#2f1e2a',
    fontId: 'dm',
    images: [],
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

  const apiKey = import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROQ_KEY || ''
  if (!apiKey) {
    return localFallback
  }

  try {
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
            content: isWeeklyPulse
              ? `The user just completed their weekly pulse reflection. They answered 4 deeply personal questions about their goals and inner life. Read all 4 answers together as one picture of where this person is right now.

Respond the way a sharp warm honest friend would respond if they received this as a voice note. Not a therapist. Not a coach. A real person who absorbed everything they said.

Address everything they wrote about. Do not pick one theme and ignore the rest. If something they said connects to something else they said, name that connection.

Do not use bullet points. Do not end with a question unless it genuinely opens something up. Keep it to 2 to 3 paragraphs maximum. Be direct. Be warm. Sound like you showed up.

Do not use m-dashes. Do not use clinical phrases.

Return strict JSON only with this shape:
{
  "generatedTitle": "Weekly Pulse",
  "clarityScore": 8,
  "clarityLabel": "Calm",
  "sageResponse": "string"
}`
              : `You are Sage, Phasr's reflective journal guide.

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

HOW TO RESPOND â€” read this carefully.
Do not follow a formula. Do not validate then explain then suggest then ask a question then close. That pattern feels scripted and the user will feel it.
Instead read what they wrote and respond the way a sharp, warm, honest friend would respond if they received this as a voice note. Not a therapist. Not a coach reading from a framework. A real person who actually absorbed what was said.
Sometimes the right response is two sentences. Sometimes it is a paragraph. Let the content decide the length, not a template.
Do not always end with a question. Questions at the end of every response feel like a technique. Only ask something if it genuinely opens something up. If the person just needed to be heard, hear them and close with something that lands, not something that probes.
Do not use phrases like: "this is a common phenomenon", "it is likely that", "if it feels comfortable", "you might consider", "taking a brave step." These sound clinical.
Do use: short sentences when something is heavy. Directness when something needs naming. Warmth without softening the truth. Silence when nothing needs to be added â€” meaning end the response when it is done, not when a checklist is complete.
If someone writes something personal and emotional â€” match that energy first before anything else. Feel it with them before you move them.
If someone writes something practical and goal-focused â€” be direct and action-oriented without emotional preamble.
Read the room. Every time. That is the whole job.
Never sound like you are running a session. Sound like you showed up.

MULTI-TOPIC RULE â€” this is important.
If the user wrote about more than one thing in their journal entry, address all of them. Do not pick the most prominent topic and ignore the rest. Do not summarize them into one theme. Each thing they wrote about deserves a response.
If they wrote about their relationship, their business, and feeling tired â€” respond to all three. Not in a list. Not with headers. Just naturally, the way a conversation moves between topics.
Example of wrong approach: User writes about feeling overwhelmed with work, a fight with a friend, and excitement about a new idea. Sage only addresses the overwhelm and ignores the other two.
Example of right approach: Move through all three naturally. Maybe the overwhelm connects to the fight. Maybe the new idea is the thing that is actually keeping them going underneath all of it. Find the thread if there is one. If there is not one, just address each thing on its own terms.
The rule is simple: if they wrote it, it mattered enough to them to put it in their journal. Sage does not get to decide what was important and what was not. Respond to all of it.
The response can be longer when there are multiple topics. That is fine. Do not rush through them to keep it short. Give each thing the space it deserves without being repetitive or padded.
Sage response rules:
- sageResponse should feel personal, emotionally aware, grounded, and useful.
- It should reflect what the user is truly feeling, name the pattern underneath the words, and offer one meaningful next step only when that makes sense.
- Do not use markdown.
  - Do not include any explanation outside the JSON.`,
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
  const orderedGroups = ['Basic', 'Pro']

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#eef6ff', padding: '0.9rem 0.9rem 1.4rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#1d2430' }}>Templates</h2>
        </div>
        {orderedGroups.filter(group => grouped[group]?.length).map(group => (
          <div key={group} style={{ display: 'grid', gap: '0.85rem' }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6e7fa1' }}>{group}</p>
            {grouped[group].map(item => (
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

function buildTemplateContent(template, answers) {
  return template.fields
    .map(field => `${field.label}\n${answers[field.label] || ''}`.trim())
    .join('\n\n')
}

function TemplateDetail({ template, answers, onChange, onBack, onApply }) {
  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'linear-gradient(180deg, #7b4a88 0%, #f8f0fb 100%)', padding: '0.9rem 0.9rem 1.5rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button type="button" onClick={onBack} style={{ ...ghostIconButtonStyle, background: 'rgba(255,255,255,0.86)' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '2rem', fontWeight: 600, color: '#fff' }}>{template.name}</h2>
        </div>
        <p style={{ margin: 0, color: '#fff6fb', fontSize: '1rem', lineHeight: 1.65 }}>{template.useWhen}</p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          {template.fields.map(field => (
            <div key={field.label} style={{ background: 'rgba(255,255,255,0.93)', borderRadius: 22, padding: '1rem', display: 'grid', gap: '0.55rem' }}>
              <p style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#342138' }}>{field.label}</p>
              <p style={{ margin: 0, color: '#6b5b6e', lineHeight: 1.6 }}>{field.subtext}</p>
              <textarea
                value={answers[field.label] || ''}
                onChange={event => onChange(field.label, event.target.value)}
                placeholder="Enter your thoughts..."
                style={{ width: '100%', minHeight: 86, border: '1px solid #ead8e7', borderRadius: 16, padding: '0.9rem', outline: 'none', resize: 'vertical', fontSize: '0.98rem', lineHeight: 1.6, color: '#2f1e2a', background: '#fff' }}
              />
            </div>
          ))}
        </div>

        <button type="button" onClick={onApply} style={{ width: '100%', border: 'none', borderRadius: 16, padding: '1rem', background: 'linear-gradient(135deg, #d35ac0, #8d59da)', color: '#fff', fontWeight: 800, fontSize: '1.05rem', boxShadow: '0 14px 28px rgba(141,89,218,0.26)' }}>
          Save entry
        </button>
      </div>
    </div>
  )
}

function WeeklyPulseWriter({
  phaseName,
  questions,
  therapistMove,
  answers,
  setAnswer,
  questionIndex,
  onPrev,
  onNext,
  onSave,
  isSaving,
}) {
  const currentQuestion = questions[questionIndex] || ''
  const isLastQuestion = questionIndex === questions.length - 1

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onPrev} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <p style={{ margin: 0, fontWeight: 800, color: '#3d1f2b' }}>Weekly Pulse</p>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.38rem' }}>
          {questions.map((_, idx) => (
            <span
              key={`pulse-dot-${idx}`}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: idx === questionIndex ? '#e8407a' : '#f2c4d0',
                display: 'inline-block',
              }}
            />
          ))}
          <span style={{ fontSize: '0.72rem', color: '#8f7180', marginLeft: 6 }}>{questionIndex + 1} / {questions.length}</span>
        </div>
      </div>

      <div style={{ padding: '20px 16px', display: 'grid', gap: '1rem', flex: 1 }}>
        <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#e8407a', margin: 0 }}>
          Weekly Pulse — {phaseName}
        </p>
        <p style={{ fontFamily: "'Cormorant Garamond, serif", fontSize: '1.15rem', fontWeight: 400, color: '#3d1f2b', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
          {currentQuestion}
        </p>
        <textarea
          value={answers[questionIndex] || ''}
          onChange={event => setAnswer(questionIndex, event.target.value)}
          placeholder="Write your reflection..."
          style={{
            width: '100%',
            minHeight: '36vh',
            border: '1.5px solid #f2c4d0',
            borderRadius: 12,
            padding: '0.9rem',
            outline: 'none',
            resize: 'vertical',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.98rem',
            lineHeight: 1.7,
            color: '#3d1f2b',
          }}
        />
        {isLastQuestion ? (
          <div style={{ background: '#fff5f7', border: '1px solid #f2c4d0', borderRadius: 10, padding: '10px 12px', marginTop: '0.2rem' }}>
            <p style={{ fontSize: '0.58rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#e8407a', margin: '0 0 4px 0' }}>
              This week&apos;s practice
            </p>
            <p style={{ fontSize: '0.78rem', color: '#3d1f2b', lineHeight: 1.7, margin: 0 }}>{therapistMove}</p>
          </div>
        ) : null}
      </div>

      <div style={{ borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.8rem 1rem max(0.9rem, env(safe-area-inset-bottom))' }}>
        {isLastQuestion ? (
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            style={{ width: '100%', border: 'none', borderRadius: 14, padding: '0.86rem 1rem', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontWeight: 800, fontSize: '0.96rem', boxShadow: '0 10px 22px rgba(232,64,122,0.24)' }}
          >
            {isSaving ? 'Saving...' : 'Save Weekly Pulse'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            style={{ width: '100%', border: 'none', borderRadius: 14, padding: '0.86rem 1rem', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontWeight: 800, fontSize: '0.96rem', boxShadow: '0 10px 22px rgba(232,64,122,0.24)' }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

function EntryDetail({ entry, onBack, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const detailBody = entry.content || getTemplateSummary(entry) || ''
  const isWeeklyPulse = String(entry?.prompt || '').toLowerCase() === 'weekly pulse'

  function speakResponse() {
    if (!window.speechSynthesis || !entry?.sageResponse) return
    const utterance = new SpeechSynthesisUtterance(entry.sageResponse)
    utterance.rate = 0.95
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.9rem 1rem', borderBottom: '1px solid var(--app-border)', position: 'sticky', top: 0, background: '#fff', zIndex: 5 }}>
          <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
          <p style={{ margin: 0, fontSize: '0.98rem', color: '#7f6672', marginLeft: 'auto' }}>{formatDate(entry.date)}</p>
          <button type="button" onClick={onEdit} style={ghostIconButtonStyle}><Pencil size={16} /></button>
        </div>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '1.2rem 1rem 5rem', display: 'grid', gap: '1.2rem' }}>
        <div>
          <p style={{ margin: 0, color: '#7f6672', fontSize: '0.95rem' }}>{entry.mood?.emoji || ''}</p>
          <h1 style={{ margin: '0.55rem 0 0', fontFamily: "'Playfair Display', serif", fontSize: 'clamp(2rem, 7vw, 3rem)', fontWeight: 500, color: '#2f1e2a' }}>{getEntryTitle(entry) || 'Untitled reflection'}</h1>
        </div>
        {isWeeklyPulse ? (
          <>
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                <p style={sectionLabelStyle}>Sage's Response</p>
                <button type="button" onClick={speakResponse} style={{ ...ghostMiniActionStyle, color: 'var(--app-accent)' }}><Volume2 size={16} /></button>
              </div>
              <div style={{ borderRadius: 22, background: '#fff5fa', border: '1px solid #f2c4d0', padding: '1rem', color: '#4b3240', lineHeight: 1.75 }}>{entry.sageResponse || 'Sage will respond here once your reflection is saved.'}</div>
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
              Weekly Pulse • {entry.weeklyPulseMeta?.phaseName || 'Phase'} • {(entry.weeklyPulseMeta?.pillars || []).join(' • ')}
            </p>
          </>
        ) : (
          <>
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
            <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: '1rem', display: 'grid', gap: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
                <p style={sectionLabelStyle}>Sage's Response</p>
                <button type="button" onClick={speakResponse} style={{ ...ghostMiniActionStyle, color: 'var(--app-accent)' }}><Volume2 size={16} /></button>
              </div>
              <div style={{ borderRadius: 22, background: '#fff5fa', border: '1px solid #f2c4d0', padding: '1rem', color: '#4b3240', lineHeight: 1.75 }}>{entry.sageResponse || 'Sage will respond here once your reflection is saved.'}</div>
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
  const [activeImageActionsId, setActiveImageActionsId] = useState(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const fileInputRef = useRef(null)
  const dateInputRef = useRef(null)
  const recognitionRef = useRef(null)
  const longPressTimerRef = useRef(null)
  const dragRef = useRef(null)
  const contentRef = useRef(null)
  const currentBackground = BACKGROUNDS.find(item => item.id === draft.backgroundId) || BACKGROUNDS[0]
  const currentFont = FONTS.find(item => item.id === draft.fontId) || FONTS[0]
  const writerBackgroundStyle = draft.templateAccent
    ? { background: `linear-gradient(180deg, ${draft.templateAccent}33 0%, ${draft.templateAccent}14 100%)` }
    : currentBackground.style
  const wordCount = countWords(draft.content)

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
        images: [
          ...prev.images,
          {
            id: `${Date.now()}-${file.name}`,
            name: file.name,
            url: reader.result,
            x: 0,
            y: 0,
          },
        ],
      }))
      setActiveTray(null)
    }
    reader.readAsDataURL(file)
  }

  function startImageHold(image) {
    clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = setTimeout(() => {
      setActiveImageActionsId(current => (current === image.id ? null : image.id))
    }, 420)
  }

  function clearImageHold() {
    clearTimeout(longPressTimerRef.current)
  }

  function beginDrag(event, image) {
    dragRef.current = {
      id: image.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: image.x || 0,
      originY: image.y || 0,
    }
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function moveDrag(event) {
    if (!dragRef.current) return
    const nextX = Math.max(0, dragRef.current.originX + (event.clientX - dragRef.current.startX))
    const nextY = Math.max(0, dragRef.current.originY + (event.clientY - dragRef.current.startY))
    setDraft(prev => ({
      ...prev,
      images: prev.images.map(image => (
        image.id === dragRef.current.id ? { ...image, x: nextX, y: nextY } : image
      )),
    }))
  }

  function endDrag() {
    dragRef.current = null
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderBottom: '1px solid var(--app-border)' }}>
        <button type="button" onClick={onBack} style={ghostIconButtonStyle}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={() => setShowMenu(true)} style={{ border: 'none', background: 'transparent', color: '#6e4a58' }}><MoreHorizontal size={24} /></button>
        <button type="button" onClick={onSave} disabled={isSaving} style={{ border: 'none', borderRadius: 999, padding: '0.8rem 1.25rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{isSaving ? 'Saving...' : 'Save'}</button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...writerBackgroundStyle }}>
        <div style={{ position: 'relative', padding: '1rem 1rem 0.6rem', display: 'flex', alignItems: 'center', gap: '0.7rem', color: '#7f6672', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.16, fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '0.85rem', color: currentBackground.id === 'dark-cute' ? '#fff' : '#d1588b' }}>{currentBackground.deco}</div>
          <button type="button" onClick={() => dateInputRef.current?.click()} style={{ border: 'none', background: 'transparent', padding: 0, color: '#7f6672', fontSize: '0.96rem' }}>{formatDate(draft.date)}</button>
          <input ref={dateInputRef} type="date" value={draft.date} onChange={event => setDraft(prev => ({ ...prev, date: event.target.value }))} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }} />
            <span style={{ fontSize: '1.6rem', lineHeight: 1 }}>{draft.mood?.emoji || '😊'}</span>
        </div>

        <div style={{ padding: '0 1rem 1rem', display: 'grid', gap: '1rem', flex: 1 }}>
            {!draft.templateFields ? (
              <input value={draft.title} onChange={event => setDraft(prev => ({ ...prev, title: event.target.value }))} onFocus={() => setEditorFocused(true)} onBlur={() => setEditorFocused(false)} placeholder="Title" style={{ border: 'none', borderBottom: '1px solid var(--app-border)', background: 'transparent', padding: '0.1rem 0 0.55rem', outline: 'none', color: draft.color, fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 500 }} />
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 500, color: draft.color, fontFamily: "'Playfair Display', serif" }}>{draft.prompt}</p>
                {draft.templateFields.map((field, index) => (
                  <div key={field.label} style={{ display: 'grid', gap: '0.42rem' }}>
                    <p style={{ margin: 0, color: '#4f9bff', fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.5 }}>
                      {index + 1}. {field.label}
                    </p>
                    <p style={{ margin: 0, color: '#6f7d8b', lineHeight: 1.55 }}>{field.subtext}</p>
                    <textarea
                      value={draft.templateAnswers?.[field.label] || ''}
                      onChange={event => setDraft(prev => ({
                        ...prev,
                        templateAnswers: { ...(prev.templateAnswers || {}), [field.label]: event.target.value },
                      }))}
                      onFocus={() => setEditorFocused(true)}
                      onBlur={() => setEditorFocused(false)}
                      placeholder="Enter your thoughts..."
                      style={{ width: '100%', minHeight: 72, border: '1px solid var(--app-border)', borderRadius: 14, padding: '0.7rem 0.8rem', outline: 'none', resize: 'vertical', background: '#fff', color: draft.color, fontFamily: currentFont.family, fontSize: '1rem', lineHeight: 1.6 }}
                    />
                  </div>
                ))}
              </div>
            )}
          {draft.images.length ? (
            <div style={{ position: 'relative', minHeight: 190, marginBottom: '0.2rem' }}>
              {draft.images.map(image => (
                <button
                  key={image.id}
                  type="button"
                  onPointerDown={event => {
                    startImageHold(image)
                    beginDrag(event, image)
                  }}
                  onPointerMove={moveDrag}
                  onPointerUp={() => {
                    clearImageHold()
                    endDrag()
                  }}
                  onPointerLeave={() => {
                    clearImageHold()
                    endDrag()
                  }}
                  onContextMenu={event => {
                    event.preventDefault()
                    setActiveImageActionsId(image.id)
                  }}
                  onClick={() => {
                    if (activeImageActionsId === image.id) {
                      setActiveImageActionsId(null)
                      return
                    }
                  }}
                  style={{ width: 112, height: 148, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--app-border)', background: '#fff', padding: 0, position: 'absolute', left: image.x || 0, top: image.y || 0, boxShadow: '0 12px 20px rgba(80,52,65,0.12)', touchAction: 'none' }}
                >
                  <img src={image.url} alt={image.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {activeImageActionsId === image.id ? (
                    <button type="button" onClick={event => { event.stopPropagation(); setDraft(prev => ({ ...prev, images: prev.images.filter(item => item.id !== image.id) })); setActiveImageActionsId(null) }} style={{ position: 'absolute', right: 8, top: 8, width: 28, height: 28, borderRadius: '50%', border: 'none', background: '#ffffffeb', color: '#d24b78', fontWeight: 800 }}>×</button>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
            {!draft.templateFields ? (
              <textarea ref={contentRef} value={draft.content} onChange={event => setDraft(prev => ({ ...prev, content: event.target.value }))} onFocus={() => setEditorFocused(true)} onBlur={() => setEditorFocused(false)} placeholder="Start writing..." style={{ flex: 1, minHeight: '42vh', border: 'none', outline: 'none', resize: 'none', background: 'transparent', color: draft.color, fontFamily: currentFont.family, fontSize: '1.08rem', lineHeight: 1.9 }} />
            ) : null}
        </div>
      </div>

      <div style={{ position: editorFocused || activeTray ? 'fixed' : 'sticky', left: 0, right: 0, bottom: 0, zIndex: 22, borderTop: '1px solid var(--app-border)', background: '#fff', padding: '0.55rem 0.8rem max(0.75rem, env(safe-area-inset-bottom))', display: 'grid', gap: '0.55rem' }}>
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

const ghostMiniActionStyle = {
  width: 34,
  height: 34,
  borderRadius: 12,
  border: '1px solid var(--app-border)',
  background: '#fff',
  display: 'grid',
  placeItems: 'center',
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
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateAnswers, setTemplateAnswers] = useState({})
  const [editingEntryId, setEditingEntryId] = useState(null)
  const [entryActionId, setEntryActionId] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [weeklyPulseDate, setWeeklyPulseDate] = useState(() => localStorage.getItem(WEEKLY_PULSE_DATE_KEY) || '')
  const [weeklyPulseState, setWeeklyPulseState] = useState(() => ({
    phaseName: 'Phase 1',
    pillars: [],
    questions: [],
    therapistMove: '',
    answers: ['', '', '', ''],
    index: 0,
  }))

  useEffect(() => {
    safeWrite(entries)
  }, [entries])

  useEffect(() => {
    if (weeklyPulseDate) {
      localStorage.setItem(WEEKLY_PULSE_DATE_KEY, weeklyPulseDate)
    }
  }, [weeklyPulseDate])

  const filteredEntries = useMemo(() => sortEntries(entries, search, sortOrder), [entries, search, sortOrder])
  const weeklyPulseDue = useMemo(() => {
    if (!weeklyPulseDate) return true
    const last = new Date(`${weeklyPulseDate}T00:00:00`).getTime()
    if (Number.isNaN(last)) return true
    return (Date.now() - last) >= (7 * MS_IN_DAY)
  }, [weeklyPulseDate])

  function openWeeklyPulse() {
    const payload = buildWeeklyPulsePayload()
    setWeeklyPulseState({
      phaseName: payload.phaseName,
      pillars: payload.pillars,
      questions: payload.weeklyQuestions,
      therapistMove: payload.therapistMove,
      answers: payload.weeklyQuestions.map(() => ''),
      index: 0,
    })
    setScreen('weekly-pulse')
  }

  function startNewEntry() {
    setDraft(blankDraft())
    setShowMoodPicker(true)
  }

  function pickMood(mood) {
    setDraft(prev => ({ ...prev, mood }))
    setShowMoodPicker(false)
    setEditingEntryId(null)
    setScreen('write')
  }

  function selectTemplate(template) {
    setSelectedTemplate(template)
    setTemplateAnswers(Object.fromEntries(template.fields.map(field => [field.label, ''])))
    setScreen('template-detail')
  }

  function setWeeklyPulseAnswer(index, value) {
    setWeeklyPulseState(current => {
      const nextAnswers = [...current.answers]
      nextAnswers[index] = value
      return { ...current, answers: nextAnswers }
    })
  }

  function nextWeeklyPulseQuestion() {
    setWeeklyPulseState(current => ({ ...current, index: Math.min(current.index + 1, current.questions.length - 1) }))
  }

  async function saveWeeklyPulseToDraft() {
    const questions = weeklyPulseState.questions
    const templateFields = questions.map(question => ({ label: question, subtext: '' }))
    const templateAnswers = Object.fromEntries(questions.map((question, index) => [question, weeklyPulseState.answers[index] || '']))
    const content = questions
      .map((question, index) => `${question}\n${weeklyPulseState.answers[index] || ''}`.trim())
      .join('\n\n')
      .trim()

    if (!content) return
    const weeklyDraft = {
      ...blankDraft(),
      date: getToday(),
      title: 'Weekly Pulse',
      prompt: 'Weekly Pulse',
      content,
      templateAccent: '#fff5f7',
      templateFields,
      templateAnswers,
      weeklyPulsePhaseName: weeklyPulseState.phaseName,
      weeklyPulsePillars: weeklyPulseState.pillars,
      mood: MOODS[0],
    }

    setIsSaving(true)
    setScreen('processing')
    try {
      const analysis = await generateSageAnalysis({
        ...weeklyDraft,
        isWeeklyPulse: true,
      })
      const entry = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        date: weeklyDraft.date,
        title: getEntryTitle(weeklyDraft, analysis.generatedTitle),
        content: weeklyDraft.content,
        prompt: weeklyDraft.prompt,
        mood: weeklyDraft.mood,
        clarityScore: Number(analysis.clarityScore || 7),
        clarityLabel: analysis.clarityLabel || 'Reflective',
        sageResponse: analysis.sageResponse || '',
        backgroundId: weeklyDraft.backgroundId,
        fontId: weeklyDraft.fontId,
        color: weeklyDraft.color,
        images: weeklyDraft.images,
        templateAccent: weeklyDraft.templateAccent,
        templateFields: weeklyDraft.templateFields,
        templateAnswers: weeklyDraft.templateAnswers,
        weeklyPulseMeta: {
          phaseName: weeklyDraft.weeklyPulsePhaseName,
          pillars: weeklyDraft.weeklyPulsePillars,
        },
      }
      setEntries(current => [entry, ...current])
      setSelectedEntry(entry)
      setWeeklyPulseDate(getToday())
      setScreen('detail')
    } catch {
      const fallback = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        date: weeklyDraft.date,
        title: 'Weekly Pulse',
        content: weeklyDraft.content,
        prompt: weeklyDraft.prompt,
        mood: weeklyDraft.mood,
        clarityScore: 6,
        clarityLabel: 'Reflective',
        sageResponse: localSageResponse({ content: weeklyDraft.content, prompt: 'Weekly Pulse', clarityLabel: 'Reflective' }),
        backgroundId: weeklyDraft.backgroundId,
        fontId: weeklyDraft.fontId,
        color: weeklyDraft.color,
        images: weeklyDraft.images,
        templateAccent: weeklyDraft.templateAccent,
        templateFields: weeklyDraft.templateFields,
        templateAnswers: weeklyDraft.templateAnswers,
        weeklyPulseMeta: {
          phaseName: weeklyDraft.weeklyPulsePhaseName,
          pillars: weeklyDraft.weeklyPulsePillars,
        },
      }
      setEntries(current => [fallback, ...current])
      setSelectedEntry(fallback)
      setWeeklyPulseDate(getToday())
      setScreen('detail')
    } finally {
      setIsSaving(false)
    }
  }

    async function saveEntry() {
      if (!draft.content.trim()) return
      setIsSaving(true)
      setScreen('processing')
      try {
        const isWeeklyPulse = String(draft.prompt || '').toLowerCase() === 'weekly pulse'
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
          content: normalizedContent,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        clarityScore: Number(analysis.clarityScore || draft.mood?.score || 7),
        clarityLabel: analysis.clarityLabel || draft.mood?.label || 'Reflective',
        sageResponse: analysis.sageResponse || '',
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
        templateAccent: draft.templateAccent,
        templateFields: draft.templateFields,
        templateAnswers: draft.templateAnswers,
        weeklyPulseMeta: isWeeklyPulse ? {
          phaseName: draft.weeklyPulsePhaseName || '',
          pillars: draft.weeklyPulsePillars || [],
        } : null,
      }
      setEntries(current => editingEntryId ? current.map(item => item.id === editingEntryId ? entry : item) : [entry, ...current])
      setSelectedEntry(entry)
      if (isWeeklyPulse) {
        setWeeklyPulseDate(getToday())
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
          content: normalizedContent,
        prompt: draft.prompt,
        mood: draft.mood || MOODS[0],
        clarityScore: draft.mood?.score || 7,
        clarityLabel: draft.mood?.label || 'Reflective',
        sageResponse: 'You captured something real here. Come back to the clearest sentence and let it guide your next step.',
        backgroundId: draft.backgroundId,
        fontId: draft.fontId,
        color: draft.color,
        images: draft.images,
        templateAccent: draft.templateAccent,
        templateFields: draft.templateFields,
        templateAnswers: draft.templateAnswers,
        weeklyPulseMeta: String(draft.prompt || '').toLowerCase() === 'weekly pulse' ? {
          phaseName: draft.weeklyPulsePhaseName || '',
          pillars: draft.weeklyPulsePillars || [],
        } : null,
      }
      setEntries(current => editingEntryId ? current.map(item => item.id === editingEntryId ? fallback : item) : [fallback, ...current])
      setSelectedEntry(fallback)
      if (String(draft.prompt || '').toLowerCase() === 'weekly pulse') {
        setWeeklyPulseDate(getToday())
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

  function removeImage(target) {
    setDraft(prev => ({ ...prev, images: prev.images.filter(image => image.id !== target.id) }))
  }

  function editEntry(entry) {
    setDraft({
      date: entry.date || getToday(),
      title: entry.title || '',
      content: entry.content || '',
      prompt: entry.prompt || PROMPTS[0],
      mood: entry.mood || MOODS[0],
      backgroundId: entry.backgroundId || 'original',
      templateAccent: entry.templateAccent || '',
      templateFields: entry.templateFields || null,
      templateAnswers: entry.templateAnswers || {},
      weeklyPulsePhaseName: entry.weeklyPulseMeta?.phaseName || '',
      weeklyPulsePillars: entry.weeklyPulseMeta?.pillars || [],
      color: entry.color || '#2f1e2a',
      fontId: entry.fontId || 'dm',
      images: Array.isArray(entry.images) ? entry.images : [],
    })
    setEditingEntryId(entry.id)
    setEntryActionId(null)
    setScreen('write')
  }

  if (screen === 'weekly-pulse') {
    return (
      <WeeklyPulseWriter
        phaseName={weeklyPulseState.phaseName}
        questions={weeklyPulseState.questions}
        therapistMove={weeklyPulseState.therapistMove}
        answers={weeklyPulseState.answers}
        setAnswer={setWeeklyPulseAnswer}
        questionIndex={weeklyPulseState.index}
        onPrev={() => {
          if (weeklyPulseState.index === 0) {
            setScreen('list')
            return
          }
          setWeeklyPulseState(current => ({ ...current, index: Math.max(0, current.index - 1) }))
        }}
        onNext={nextWeeklyPulseQuestion}
        onSave={saveWeeklyPulseToDraft}
        isSaving={isSaving}
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
          <p style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', lineHeight: 1.25, color: '#3b2330' }}>Sage is reading your entry...</p>
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
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: '#fff6fa', border: '1px solid var(--app-border)', borderRadius: 22, padding: '0.8rem 0.85rem', boxShadow: '0 12px 28px rgba(86,53,66,0.05)' }}>
            <Search size={18} color="#8b6977" />
            <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search entries..." style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.98rem', color: 'var(--app-text)', minWidth: 0 }} />
              <button type="button" onClick={() => setShowSortSheet(true)} style={{ width: 42, height: 42, border: '1px solid var(--app-border)', borderRadius: 16, background: '#fff', color: 'var(--app-accent)', display: 'grid', placeItems: 'center' }}><ArrowUpDown size={16} /></button>
          </div>

          {weeklyPulseDue ? (
            <div style={{ borderRadius: 20, border: '1px solid #f2c4d0', background: '#fff', padding: '0.9rem', display: 'grid', gap: '0.55rem' }}>
              <p style={{ margin: 0, fontWeight: 800, color: '#2f1e2a' }}>Before starting a new week, complete your weekly reset.</p>
              <p style={{ margin: 0, color: '#7b6671', fontSize: '0.9rem', lineHeight: 1.5 }}>Tap to open Weekly Pulse. Sage returns 1 key pattern, 1 correction, and 1 sharp focus.</p>
              <button type="button" onClick={openWeeklyPulse} style={{ justifySelf: 'start', border: 'none', borderRadius: 12, padding: '0.62rem 0.9rem', background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))', color: '#fff', fontWeight: 800 }}>
                Open Weekly Pulse
              </button>
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {filteredEntries.map(entry => (
              <button key={entry.id} type="button" onClick={() => { setSelectedEntry(entry); setScreen('detail') }} style={{ border: 'none', background: '#fff', borderBottom: '1px solid var(--app-border)', padding: '0.55rem 0.1rem 1rem', textAlign: 'left', display: 'grid', gap: '0.42rem' }}>
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
                      <span>{entry.mood?.emoji || '😊'}</span>
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
        <button type="button" onClick={() => { setDraft(prev => ({ ...prev, mood: MOODS[0] })); setShowMoodPicker(false); setScreen('write') }} style={{ marginTop: '0.7rem', border: 'none', background: 'transparent', color: 'var(--app-accent)', fontWeight: 700, fontSize: '0.7rem', width: '100%' }}>Skip for now →</button>
      </BottomSheet>

    </>
  )
}

