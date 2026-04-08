import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Copy, Pencil, RotateCcw, Trash2, Volume2 } from 'lucide-react'
import { getLockInSummary, getTodayTask, loadBoardData, loadLockInState } from '../lib/lockIn'
import { getUserAccess } from '../lib/access'
import { getSageAvatarUrl, getVoicePreference } from '../lib/userPreferences'

const QUICK_SESSION_KEY = 'phasr_sage_float'
const FULL_SESSION_KEY = 'phasr_sage_full'
const FULL_THREADS_KEY = 'phasr_sage_threads'
const FULL_ACTIVE_THREAD_KEY = 'phasr_sage_active_thread'
const QUICK_POSITION_KEY = 'phasr_sage_quick_position'
const THINK_USAGE_KEY = 'phasr_sage_think_usage'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_CHAT_MODEL = 'llama-3.1-8b-instant'
const GROQ_THINK_MODEL = 'llama-3.3-70b-versatile'
const SAGE_RAG_URL = import.meta.env.VITE_SAGE_RAG_URL || ''
const INWORLD_API_KEY =
  import.meta.env.VITE_INWORLD_API_KEY ||
  (typeof process !== 'undefined' ? process.env.INWORLD_API_KEY : '') ||
  ''
const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice'
const INWORLD_TTS_MODEL = import.meta.env.VITE_INWORLD_TTS_MODEL || 'inworld-tts-1'
const INWORLD_TTS_VOICE = import.meta.env.VITE_INWORLD_TTS_VOICE || 'Eleanor'
const QUICK_WIDTH = 360
const QUICK_HEIGHT = 480
const THINK_DAILY_WORD_LIMIT = 500
const RESEARCH_TRIGGER_RE = /\b(how|why|what is required|what do i need|steps|process|requirements|visa|move to|relocate|problem|issue|fix|troubleshoot|not working|error|current|latest)\b/i
let activeSageAudio = null
let activeSageSpeechRequest = false

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

function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function createThread(messages = []) {
  const now = Date.now()
  return {
    id: `sage-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: 'New chat',
    messages,
    updatedAt: now,
  }
}

function buildThreadTitle(messages) {
  const firstUserMessage = (messages || []).find(message => message?.role === 'user')?.content || ''
  const cleaned = String(firstUserMessage).replace(/\s+/g, ' ').trim()
  if (!cleaned) return 'New chat'
  return cleaned.length > 38 ? `${cleaned.slice(0, 38).trim()}...` : cleaned
}

function migrateThreads() {
  const savedThreads = safeRead(FULL_THREADS_KEY, null)
  if (Array.isArray(savedThreads) && savedThreads.length) {
    return savedThreads
  }

  const legacySession = safeRead(FULL_SESSION_KEY, [])
  if (Array.isArray(legacySession) && legacySession.length) {
    return [
      {
        ...createThread(legacySession.slice(-60)),
        title: buildThreadTitle(legacySession),
      },
    ]
  }

  return [createThread()]
}

function formatThreadTime(timestamp) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(timestamp))
  } catch {
    return ''
  }
}

function buildStatsContext() {
  const summary = getLockInSummary(loadLockInState())
  const journalEntries = safeRead('phasr_journal_v2', [])
  const weeklyGoals = safeRead('phasr_weekly_goals', [])
  const statsLog = safeRead('phasr_stats_log', [])
  const streakState = safeRead('phasr_streak', {})
  const todayTaskState = safeRead('phasr_today_task', null)
  const showUpState = safeRead('phasr_showup_state', {})
  const journalCount = Array.isArray(journalEntries) ? journalEntries.length : 0
  const boardData = loadBoardData()
  const todayTask = getTodayTask(boardData)
  const activeRoomCount = Array.isArray(showUpState?.joinedRoomIds) ? showUpState.joinedRoomIds.length : 0
  return {
    currentStreak: summary.currentStreak || 0,
    rank: summary.rank || 'Beginner',
    sageLevel: summary.sageLevel || 'Sage',
    modeLabel: summary.modeLabel || 'Active',
    warning: Boolean(summary.warning),
    points: summary.points || 0,
    journalCount,
    weeklyGoalCount: Array.isArray(weeklyGoals) ? weeklyGoals.length : 0,
    statsLogCount: Array.isArray(statsLog) ? statsLog.length : 0,
    streakRisk: Boolean(streakState?.risk),
    activeRoomCount,
    storedTodayTask: todayTaskState?.task || '',
    todayTask: todayTask.task || 'No task set yet',
  }
}

function getBoardContext(boardData) {
  const phase =
    boardData?.phases?.find(item => item.id === boardData?.activePhaseId) ||
    boardData?.phases?.[0]

  if (!phase) {
    return {
      phaseName: 'Current Phase',
      phasePeriod: 'Q1',
      goalsText: 'No vision board goals have been set yet.',
    }
  }

  const goals = (phase.pillars || [])
    .map(pillar => {
      const target = String(pillar.afterState || '').trim()
      const weekly = (pillar.weeklyActions || []).filter(Boolean).join(', ')
      if (!target && !weekly) return null
      return `${pillar.name}: target ${target || 'not set'}, weekly actions ${weekly || 'not set'}`
    })
    .filter(Boolean)
    .join('\n')

  return {
    phaseName: phase.name || 'Current Phase',
    phasePeriod: phase.period || 'Q1',
    goalsText: goals || 'No clear vision board goals have been set yet.',
  }
}

function buildUserContextSection(user, boardData) {
  const context = getBoardContext(boardData)
  const stats = buildStatsContext()
  const pillars =
    boardData?.pillars?.map(pillar => pillar?.name).filter(Boolean).join(', ') ||
    boardData?.phases?.find(item => item.id === boardData?.activePhaseId)?.pillars?.map(pillar => pillar?.name).filter(Boolean).join(', ') ||
    boardData?.phases?.[0]?.pillars?.map(pillar => pillar?.name).filter(Boolean).join(', ') ||
    'Health & Fitness, Career & Business, Inner Life'
  const journalEntries = safeRead('phasr_journal_v2', [])
  const todayKey = getTodayKey()
  const todayJournalEntry = Array.isArray(journalEntries)
    ? journalEntries.find(entry => String(entry?.date || '').slice(0, 10) === todayKey)
    : null
  const weekProgress = safeRead('phasr_week_progress', {})
  const progressValues = Object.values(weekProgress || {}).filter(Boolean)
  const latestProgress = progressValues.sort((a, b) => Number(b?.week || 0) - Number(a?.week || 0))[0]
  const completed = Number(latestProgress?.completedTasks || latestProgress?.completed || 0)
  const assigned = Number(latestProgress?.assignedTasks || latestProgress?.totalTasks || latestProgress?.target || 0)
  const weeklyCompletionRate = assigned ? `${Math.round((completed / assigned) * 100)} percent` : '0 percent'

  return `USER CONTEXT
The user's name is: ${user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || 'there'}
Their vision board is called: ${boardData?.boardTitle || 'My Vision Board'}
Current phase: ${boardData?.currentPhase || context.phaseName || 'Phase 1'}
Current phase period: ${context.phasePeriod || 'Q1'}
Pillars: ${pillars}
Current streak count: ${stats.currentStreak} day(s)
Weekly completion rate: ${weeklyCompletionRate}
Weekly goals tracked: ${stats.weeklyGoalCount}
Current phase goals:
${context.goalsText}
Today's journal entry: ${todayJournalEntry?.transcript || todayJournalEntry?.summary || 'No journal entry yet today.'}`
}

function buildPatternDataSection() {
  const weekProgress = safeRead('phasr_week_progress', {})
  const values = Object.values(weekProgress || {})
    .filter(Boolean)
    .sort((a, b) => Number(a?.week || 0) - Number(b?.week || 0))
    .slice(-3)

  const lines = values.length
    ? values.map(item => {
        const week = Number(item?.week || 0)
        const completed = Number(item?.completedTasks || item?.completed || 0)
        const assigned = Number(item?.assignedTasks || item?.totalTasks || item?.target || 0)
        const rate = assigned ? Math.round((completed / assigned) * 100) : 0
        return `Week ${week}: ${rate} percent.`
      })
    : ['Week 1: 0 percent.', 'Week 2: 0 percent.', 'Week 3: 0 percent.']

  return `PATTERN DATA
${lines.join('\n')}`
}

function buildUnifiedSagePrompt(user, boardData) {
  return `SAGE AI - UNIFIED SYSTEM PROMPT

You are Sage, Phasr’s structured clarity coach.

Your role is to help users think clearly, stay consistent, and take action using structured systems. You do not give vague motivation. You guide behavior change.

⸻

CORE PRINCIPLES
	•	Clarity before action
	•	Consistency over intensity
	•	Action over theory

⸻

PERSONALITY

You are warm, honest, and emotionally aware. You feel like a smart best friend who supports the user but also corrects them when needed.

Tone:
	•	Conversational and natural
	•	Light Gen Z energy, not forced
	•	Calm, confident, and direct

Behavior:
	•	Validate first
	•	Then challenge flawed thinking
	•	Then guide action

You do not:
	•	enable excuses
	•	sound robotic
	•	overuse slang
	•	give generic advice

⸻

  HOW TO RESPOND:
  You are Sage. You are not a framework. You are not running a session.
  You read what someone wrote and you respond like a person who actually absorbed it.
  If they ask a question, answer it directly. Do not hedge.
  If they share something, respond to what they actually said, not a summary of it.
  If there are multiple things in their message, address all of them naturally.
  Do not use bullet points unless they ask for a list.
  Do not start with affirmations like "That's great" or "I hear you."
  Do not end every message with a question.
  Be warm. Be direct. Be honest. Sound like you showed up.
  Do not use m-dashes.
  Keep responses focused. One or two paragraphs is usually enough unless the topic needs more.
  You have context on the user's vision board goals and current phase. Use it when relevant. Do not force it.

  MULTI-TOPIC RULE:
  If the user wrote about more than one thing, address all of them. Do not pick the most prominent topic and ignore the rest. Do not summarise them into one theme. Each thing they wrote about deserves a response.
  If they wrote about their relationship, their business, and feeling tired, respond to all three. Not in a list. Not with headers. Just naturally, the way a conversation moves between topics.
  If there is a thread connecting the topics, find it. If there is not one, address each thing on its own terms.
  The rule is simple: if they wrote it, it mattered enough to put in their journal. Sage does not get to decide what was important. Respond to all of it.
  The response can be longer when there are multiple topics. Do not rush through them to keep it short. Give each thing the space it deserves without being repetitive or padded.

⸻

RESPONSE FORMAT (USE WHEN HELPFUL)

Insight:
Explain what’s happening and why it matters. Use relevant modules.

Your Week:
Show progress using the 80% rule.

Do This:
Give 1 to 2 simple actions only.

⸻

DECISION LOGIC

Before responding, identify:
	•	Real problem
	•	Affected pillar (Health, Career, Wealth, Relationships, Inner, Growth)
	•	Current consistency level
	•	User state (emotional, confused, avoidant, consistent)

Adapt:
	•	Confused → simplify
	•	Emotional → validate first
	•	Inconsistent → reduce difficulty
	•	Consistent → increase intensity
	•	Avoiding → challenge gently

⸻

EXECUTION RULES
	•	80% or more → increase intensity
	•	Below 80% → reset or reduce
	•	Always prioritize consistency over difficulty
	•	Always give clear, small actions

⸻

MODULE KNOWLEDGE

[VISION-BOARD]

Vision boards clarify goals and maintain focus through daily visual exposure.

They work by reinforcing goals, increasing awareness of opportunities, and strengthening emotional connection.

Rules:
	•	Goals must be specific
	•	Visuals must be meaningful
	•	Must be seen daily
	•	Must connect to action

Do not present as manifestation. It is a focus tool.

Success = aligned decisions and action.

⸻

[GOAL-SETTING]

Clear goals improve execution.

Use:
	•	Specific targets
	•	Measurable outcomes
	•	Time constraints

Apply:
	•	If-then planning
	•	MCII (goal + obstacle + plan)

Convert vague goals into measurable outputs.

Track weekly. Adjust based on results, not emotion.

⸻

[HABIT-TRACKING]

Consistency builds identity.

Rules:
	•	Track daily actions
	•	Aim for 80% weekly completion
	•	Increase difficulty after consistency
	•	Reduce if consistency fails

Focus on identity:
“I follow through” over “I feel motivated”

⸻

[PLATFORM-MECHANICS]

Phasr structure:

Pillars → Phases → Weekly locks → Daily streaks → Stats → Unlocks

Progression:
	•	80% or more → advance
	•	Below 80% → reset

Sage uses stats and journals to:
	•	detect patterns
	•	identify gaps
	•	guide adjustments

⸻

[EMOTIONAL-REGULATION]

Emotions guide behavior but should not control decisions.

Process:
	1.	Label emotion
	2.	Validate
	3.	Regulate
	4.	Reframe
	5.	Act

Tools:
	•	Breathing
	•	Reframing
	•	Journaling

Always move user from emotion to action.

⸻

USER MEMORY & ADAPTATION

Sage learns from the user over time.

Track:
	•	Consistency patterns
	•	Habit drop-off points
	•	Emotional triggers
	•	Strong vs weak pillars
	•	Follow-through rate

Use this to:
	•	Identify patterns
	•	Personalize advice
	•	Adjust difficulty
	•	Call out repeated behavior

Sage does not treat each interaction as new.

⸻

MODULE USAGE RULE
	•	Reference modules naturally when relevant
	•	Do not overload responses with multiple modules
	•	Keep it clean and readable

Example:
“Missing 3 days breaks your streak loop [HABIT-TRACKING]”

⸻

JOURNAL MODE

When user is emotional or reflective:

Flow:
	•	Validate
	•	Go deeper
	•	Reframe
	•	Give 2 actions:
	•	one internal
	•	one external

⸻

FORWARD PUSH

Always end with direction tied to progress.

Examples:
	•	“This gets your streak back on track”
	•	“That’s how you secure the week”
	•	“Stay consistent, then we level up”

⸻

HARD RULES

Reject:
	•	Magic thinking
	•	Passive motivation
	•	Gender bias
	•	Vague advice

Enforce:
	•	Action
	•	Structure
	•	Consistency

⸻

GOAL

Help the user:
	•	think clearly
	•	act consistently
	•	build systems
	•	improve over time

 PATTERN CALL-OUTS (THIS MAKES IT FEEL SMART)

This is where your memory layer kicks in.

Instead of:
“You missed 3 days”

Say:
“You start strong, then drop mid-week. That’s your pattern.”

That alone upgrades everything.

⸻

3. MICRO-REACTIONS (THIS MAKES IT FEEL LIKE A PERSON)

Small lines like:
	•	“That makes sense”
	•	“I get why that happened”
	•	“Yeah, that throws people off”
	•	“That’s where most people slip”

Not too many. Just enough.


1. OPENING / CLARIFY
	•	Quick check-in, validate the user:
	•	“I see what happened this week”
	•	“Yeah, that pattern popped again”
	•	Tie to stats/pillar:
	•	“Looking at your Week 2 streaks, steps dipped to 60%” [HABIT-TRACKING]
	•	Keep tone: casual, warm, slightly teasing:
	•	“That gym skip stings—real. But we handle it.”

⸻

2. STRUCTURED INSIGHT
	•	Show what’s happening, why it matters:
	•	“Your streaks drop when you skip mornings → dopamine chain breaks” [PLATFORM-MECHANICS][HABIT-TRACKING]
	•	Connect to Pinecone chunks:
	•	“[VISION-BOARD] reminder: 90% visual brain → opportunity spotting. Seeing your missed streaks should cue action, not guilt.”
	•	Small call-outs, like a friend noticing a pattern:
	•	“This is exactly where most users stall”

⸻

3. EXECUTION / MICRO-ACTIONS
	•	1–2 simple steps, no overwhelm:
	•	“Today: 20-min walk + journal ‘what blocked this week?’”
	•	“Lock Week 2 streak at 80% → move forward”
	•	Optional subtle encouragement:
	•	“You’ll rebuild momentum fast if you hit this”

⸻

4. FORWARD PUSH / CLOSING
	•	Tie to progression/unlocks:
	•	“This locks your week—Phase 2 features ready”
	•	Close with warmth + accountability:
	•	“You’ve got the system—show up today and it sticks”

⸻

5. MICRO-HUMAN TOUCHES
	•	Sprinkle empathy, voice, humor where appropriate:
	•	“Yeah, that throws people off”
	•	“That makes sense, life happens”
	•	“Let’s fix it calmly, no stress”

${buildUserContextSection(user, boardData)}

${buildPatternDataSection()}`
}

function buildQuickSystemPrompt(task, boardData) {
  return `You are Sage. You are speaking in a floating chat bubble.

Tone and greeting:
- Start with a polite, natural greeting.
- If the user says "hi", "hey", or "hello", respond with: "Hi, how are you doing today?"
- Be formal but warm, calm, and respectful.
- Do not jump straight into instructions. Acknowledge the user first, then guide them.

Behavior:
- Keep replies short unless the user asks for depth.
- Be helpful without being abrupt.
- You can ask one simple follow-up if it adds value.

${buildUserContextSection(null, boardData)}`
}

function buildFullSystemPrompt(user, boardData) {
  return buildUnifiedSagePrompt(user, boardData)
}

function buildResearchSystemPrompt(user, boardData) {
  return buildUnifiedSagePrompt(user, boardData)
}

async function requestSageReply({ system, messages, mode = 'chat' }) {
  const conversationHistory = messages
    .filter(message => message?.role === 'user' || message?.role === 'assistant')
    .map(message => ({
      role: message.role,
      content: String(message.content || ''),
    }))

  const latestQuestion = [...conversationHistory].reverse().find(message => message.role === 'user')?.content || ''

  if (SAGE_RAG_URL && mode === 'think' && latestQuestion) {
    const ragRes = await fetch(`${SAGE_RAG_URL.replace(/\/$/, '')}/api/sage/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: latestQuestion,
        system_prompt: system,
        messages: conversationHistory,
        top_k: 6,
      }),
    })

    const ragData = await ragRes.json()
    if (!ragRes.ok) {
      throw new Error(ragData?.detail || 'rag_request_failed')
    }
    return ragData?.answer || 'Something went wrong. Try again.'
  }

  const groqKey = import.meta.env.VITE_GROQ_KEY
  const groqModel = system.includes('Deep Research Mode') ? GROQ_THINK_MODEL : GROQ_CHAT_MODEL

  if (!groqKey) throw new Error('missing_api_key')

  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${groqKey}`,
    },
    body: JSON.stringify({
      model: groqModel,
      max_tokens: 1000,
      messages: [
        { role: 'system', content: system },
        ...conversationHistory,
      ],
    }),
  })

  const data = await res.json()
  console.log('Sage response:', data)
  return data.choices?.[0]?.message?.content || 'Something went wrong. Try again.'
}

function buildFallbackReply({ mode, task, input, boardData }) {
  const message = String(input || '').toLowerCase()
  const context = getBoardContext(boardData)
  const hasPlan = Boolean(boardData?.phases?.some(phase => phase?.pillars?.some(pillar => {
    const target = String(pillar?.afterState || '').trim()
    const weekly = Array.isArray(pillar?.weeklyActions) && pillar.weeklyActions.some(Boolean)
    return target || weekly
  })))

  if (mode === 'quick') {
    if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('how are you')) {
      if (!hasPlan) {
        return `Hi, I'm Sage. I'm good, and yes, we can talk normally here. If you want help with your goals too, I can help you shape the plan when you're ready.`
      }
      return `Hi, I'm good. What's up?\n\nYou can ask me anything and I'll keep it clear and useful.`
    }
    if (!hasPlan) {
      return `You can still talk to me normally. If your question is about your goals, I may need a bit more detail from your board to make the answer actually useful.`
    }
    if (message.includes('stuck') || message.includes('block')) {
      return `It sounds like the task feels bigger than it needs to right now. Shrink "${task}" down to the smallest part you can do in the next 5 minutes.`
    }
    if (message.includes('how') || message.includes('start')) {
      return `Start with the smallest visible part of "${task}". Once that first step is done, the rest usually gets easier to see.`
    }
    return `Let's keep it simple. Right now the clearest move is "${task}". If you want, tell me what feels unclear about it and I'll help you break it down.`
  }

  if (message.includes('plan my week')) {
    return `Anchor the week around your current phase, ${context.phaseName}. Put one important task on each active day, then schedule the first one for today.\n\nNext step: write the first three tasks for this week in order.`
  }
  if (message.includes("i'm stuck") || message.includes('stuck')) {
    return `You are likely mixing the whole problem with the next move. Strip it down to one decision, then one action.\n\nNext step: name the exact step you have been avoiding and do only that.`
  }
  if (message.includes('reflect on progress')) {
    return `Measure progress against your phase, not your mood. What moved, what stalled, and what needs correction are the only three things that matter.\n\nNext step: write one win, one drag, and one adjustment for this week.`
  }
  if (message.includes('adjust my goals')) {
    return `Do not rewrite everything. Tighten the goal so it matches the phase you are actually in and the actions you can repeat.\n\nNext step: cut one vague goal into a measurable weekly target today.`
  }
  if (message.includes('focus')) {
    return `Your focus should stay with the phase you are in, ${context.phaseName}. Ignore side quests and finish the task that moves the board forward.\n\nNext step: complete today's primary task before starting anything else.`
  }

  return `Use this session to get clear, not to stay in your head. Keep your answers tied to ${context.phaseName} and ${context.phasePeriod}.\n\nNext step: decide the one action that matters most today and do it first.`
}

function buildResearchFallbackReply(input) {
  const message = String(input || '').trim()
  if (!message) {
    return `Ask me the question plainly and I’ll give you a clear answer and the best next step.`
  }

  return `I can help with that. Ask it plainly and I’ll give you a clear answer, a practical direction, and the next best step based on what you actually need.`
}

function shouldUseDeepResearch(input) {
  return RESEARCH_TRIGGER_RE.test(String(input || ''))
}

function stopRecognitionInstance(recognitionRef, setRecording) {
  try {
    recognitionRef.current?.stop?.()
  } catch {
    // ignore stop failures
  }
  recognitionRef.current = null
  setRecording(false)
}

function startSpeechTranscription({ recognitionRef, setRecording, setInput }) {
  const SpeechRecognition = getSpeechRecognition()
  if (!SpeechRecognition) return false

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-US'
  recognition.interimResults = true
  recognition.continuous = false

  recognition.onresult = event => {
    const transcript = Array.from(event.results || [])
      .map(result => result?.[0]?.transcript || '')
      .join(' ')
      .trim()

    setInput(transcript)
  }

  recognition.onerror = () => {
    recognitionRef.current = null
    setRecording(false)
  }

  recognition.onend = () => {
    recognitionRef.current = null
    setRecording(false)
  }

  recognitionRef.current = recognition
  recognition.start()
  setRecording(true)
  return true
}

function getPreferredVoice(voices, preference) {
  if (!Array.isArray(voices) || !voices.length) return null
  const rankedFemaleTokens = [
    'microsoft aria',
    'microsoft jenny',
    'samantha',
    'ava',
    'victoria',
    'zira',
    'google us english',
    'female',
    'woman',
  ]
  const rankedMaleTokens = ['microsoft guy', 'david', 'james', 'male', 'man']
  const desired = preference === 'male' ? rankedMaleTokens : rankedFemaleTokens

  const matched = desired
    .map(token => voices.find(voice => `${voice.name} ${voice.voiceURI}`.toLowerCase().includes(token)))
    .find(Boolean)

  if (matched) return matched

  const englishVoices = voices.filter(voice => /en-/i.test(voice.lang))
  const englishMatched = englishVoices.find(voice => {
    const haystack = `${voice.name} ${voice.voiceURI}`.toLowerCase()
    return desired.some(token => haystack.includes(token))
  })
  return englishMatched || englishVoices[0] || voices[0]
}

function speakText(text, preference) {
  const content = String(text || '').replace(/\s+/g, ' ').trim()
  if (!content) return

  if (typeof window === 'undefined') return

  if (activeSageSpeechRequest) return

  if (activeSageAudio && !activeSageAudio.paused) {
    return
  }

  if (activeSageAudio) {
    activeSageAudio.pause()
    activeSageAudio = null
  }

  if (!INWORLD_API_KEY) {
    console.error('Inworld TTS unavailable', 'missing_api_key')
    return
  }

  activeSageSpeechRequest = true
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
      console.info('Inworld TTS success', response.status)
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
      activeSageAudio = audio
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        if (activeSageAudio === audio) activeSageAudio = null
      }
      audio.play().catch(() => {
        URL.revokeObjectURL(audioUrl)
        activeSageAudio = null
        throw new Error('audio_play_failed')
      })
    })
    .catch(error => {
      console.error('Inworld TTS error', error?.message || error)
    })
    .finally(() => {
      activeSageSpeechRequest = false
    })
}

async function copyText(text) {
  const value = String(text || '').trim()
  if (!value || typeof window === 'undefined') return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const input = document.createElement('textarea')
    input.value = value
    input.style.position = 'fixed'
    input.style.opacity = '0'
    document.body.appendChild(input)
    input.focus()
    input.select()
    try {
      document.execCommand('copy')
    } catch {
      // ignore
    }
    document.body.removeChild(input)
  }
}

function FemaleSageAvatar({ size = 36, soft = false, imageUrl = '' }) {
  const background = imageUrl
    ? 'transparent'
    : soft
    ? 'rgba(255,255,255,0.16)'
    : 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))'

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Sage"
          draggable={false}
          onDragStart={event => event.preventDefault()}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center top',
            display: 'block',
            userSelect: 'none',
            WebkitUserDrag: 'none',
            pointerEvents: 'none',
          }}
        />
      ) : (
      <svg width={Math.round(size * 0.72)} height={Math.round(size * 0.72)} viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <path d="M8.6 13.1c.7-4.7 3.5-7.5 7.4-7.5s6.7 2.8 7.4 7.5c-.7-1.1-1.7-1.9-2.8-2.3-.6-1.9-2.2-3-4.6-3s-4 1.1-4.6 3c-1.1.4-2.1 1.2-2.8 2.3Z" fill="rgba(255,255,255,0.92)" />
        <circle cx="16" cy="15" r="5.4" stroke="rgba(255,255,255,0.96)" strokeWidth="1.5" />
        <circle cx="14" cy="14.4" r="0.7" fill="rgba(255,255,255,0.96)" />
        <circle cx="18" cy="14.4" r="0.7" fill="rgba(255,255,255,0.96)" />
        <path d="M14 17.3c1.1.7 2.9.7 4 0" stroke="rgba(255,255,255,0.96)" strokeWidth="1.25" strokeLinecap="round" />
        <path d="M9.8 26.2c1.4-3.2 3.5-4.7 6.2-4.7s4.8 1.5 6.2 4.7" stroke="rgba(255,255,255,0.92)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="22.2" cy="8.2" r="1.4" fill="rgba(255,255,255,0.82)" />
      </svg>
      )}
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', minHeight: 18 }}>
      <span className="sage-dot" />
      <span className="sage-dot" style={{ animationDelay: '0.2s' }} />
      <span className="sage-dot" style={{ animationDelay: '0.4s' }} />
    </div>
  )
}

function ChatBubble({ role, children, onSpeak, onCopy, onEdit, onRerun }) {
  return (
    <div style={{ display: 'flex', justifyContent: role === 'user' ? 'flex-end' : 'flex-start' }}>
      <div style={{ maxWidth: '88%', display: 'grid', gap: '0.28rem' }}>
        <div
          style={{
            padding: '0.72rem 0.9rem',
            borderRadius: role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background:
              role === 'user'
                ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))'
                : '#fff',
            border: role === 'assistant' ? '1px solid var(--app-border)' : 'none',
            color: role === 'user' ? '#fff' : 'var(--app-text)',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.84rem',
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {children}
        </div>
        {((role === 'assistant' && (typeof onSpeak === 'function' || onCopy || onRerun)) || (role === 'user' && (onCopy || onEdit))) && (
          <div
            style={{
              display: 'flex',
              justifyContent: role === 'user' ? 'flex-end' : 'flex-start',
              gap: '0.35rem',
              paddingInline: '0.2rem',
            }}
          >
            {role === 'assistant' && typeof onSpeak === 'function' && (
              <button
                type="button"
                onClick={onSpeak}
                title="Read aloud"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--app-accent)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  width: 16,
                  height: 16,
                }}
              >
                <Volume2 size={12} />
              </button>
            )}
            {typeof onCopy === 'function' && (
              <button
                type="button"
                onClick={onCopy}
                title="Copy message"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--app-accent)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  width: 16,
                  height: 16,
                  opacity: 0.9,
                }}
              >
                <Copy size={11} />
              </button>
            )}
            {role === 'user' && typeof onEdit === 'function' && (
              <button
                type="button"
                onClick={onEdit}
                title="Edit message"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--app-accent)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  width: 16,
                  height: 16,
                  opacity: 0.9,
                }}
              >
                <Pencil size={11} />
              </button>
            )}
            {role === 'assistant' && typeof onRerun === 'function' && (
              <button
                type="button"
                onClick={onRerun}
                title="Rerun response"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--app-accent)',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  padding: 0,
                  width: 16,
                  height: 16,
                  opacity: 0.9,
                }}
              >
                <RotateCcw size={11} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageContent({ text, role }) {
  const featureMap = {
    journal: { view: 'journal', label: 'Journal' },
    journaling: { view: 'journal', label: 'Journaling' },
    jonah: { view: 'journal', label: 'Jonah' },
    'vision board': { view: 'board', label: 'Vision Board' },
    'daily streaks': { view: 'checkin', label: 'Daily Streaks' },
    'daily streak': { view: 'checkin', label: 'Daily Streak' },
    'show up': { view: 'showup', label: 'Show Up' },
    statistics: { view: 'analytics', label: 'Statistics' },
    settings: { view: 'settings', label: 'Settings' },
  }
  const parts = String(text || '').split(/(\bvision board\b|\bdaily streaks?\b|\bshow up\b|\bstatistics\b|\bsettings\b|\bjournal(?:ing)?\b|\bjonah\b)/gi)

  return parts.map((part, index) => {
    const key = String(part || '').toLowerCase()
    if (featureMap[key]) {
      return (
        <button
          key={`${part}-${index}`}
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('phasr-open-view', { detail: { view: featureMap[key].view } }))}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            color: role === 'user' ? '#fff' : 'var(--app-accent)',
            textDecoration: 'underline',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {part}
        </button>
      )
    }

    return <span key={`${part}-${index}`}>{part}</span>
  })
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function getDefaultBubblePosition() {
  return { right: 24, bottom: 24 }
}

function getPanelPosition(position, panelWidth = QUICK_WIDTH, panelHeight = QUICK_HEIGHT) {
  const width = window.innerWidth
  const height = window.innerHeight
  const sidebarWidth = document.querySelector('.hamburger-menu-shell')?.getBoundingClientRect().width || 0
  const maxRight = Math.max(16, width - panelWidth - sidebarWidth - 12)
  const right = clamp(position.right + 18, 16, maxRight)
  const bottom = clamp(position.bottom + 82, 16, Math.max(16, height - panelHeight - 16))
  return { right, bottom }
}

function QuickSagePanel({ task, open, onClose, position, boardData, voicePreference, avatarUrl }) {
  const [messages, setMessages] = useState(() => safeRead(QUICK_SESSION_KEY, []))
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const bodyRef = useRef(null)
  const mediaRecorder = useRef(null)
  const mediaStreamRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    safeWrite(QUICK_SESSION_KEY, messages.slice(-30))
  }, [messages])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    return () => {
      stopRecognitionInstance(recognitionRef, setRecording)
      mediaRecorder.current?.stop?.()
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  async function sendQuickMessage() {
    const content = input.trim()
    if (!content || loading) return

    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    try {
      const reply = await requestSageReply({
        system: buildQuickSystemPrompt(task, boardData),
        messages: nextMessages,
        mode: 'chat',
      })
      setMessages(current => [...current, { role: 'assistant', content: reply }])
    } catch {
      setMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: buildFallbackReply({ mode: 'quick', task, input: content, boardData }),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function editQuickMessage(content) {
    setInput(String(content || ''))
  }

  function rerunQuickAssistant(index) {
    const userMessage = [...messages.slice(0, index)].reverse().find(message => message.role === 'user')?.content || ''
    if (!userMessage || loading) return
    setInput('')
    const nextMessages = messages.slice(0, index)
    setMessages(nextMessages)
    void (async () => {
      setLoading(true)
      try {
        const reply = await requestSageReply({
          system: buildQuickSystemPrompt(task, boardData),
          messages: nextMessages,
          mode: 'chat',
        })
        setMessages(current => [...current, { role: 'assistant', content: reply }])
      } catch {
        setMessages(current => [
          ...current,
          {
            role: 'assistant',
            content: buildFallbackReply({ mode: 'quick', task, input: userMessage, boardData }),
          },
        ])
      } finally {
        setLoading(false)
      }
    })()
  }

  async function toggleQuickRecording() {
    if (recording) {
      stopRecognitionInstance(recognitionRef, setRecording)
      return
    }

    startSpeechTranscription({ recognitionRef, setRecording, setInput })
  }

  if (!open) return null

  const isMobile = window.innerWidth <= 768
  const panelWidth = isMobile ? Math.min(320, window.innerWidth - 48) : QUICK_WIDTH
  const panelHeight = isMobile ? Math.min(430, Math.max(300, Math.round(window.innerHeight * 0.52))) : QUICK_HEIGHT
  const panelPosition = getPanelPosition(position, panelWidth, panelHeight)

  return (
    <div
        style={{
          position: 'fixed',
          right: panelPosition.right,
          bottom: panelPosition.bottom,
          width: panelWidth,
          height: panelHeight,
          background: '#fffafc',
          border: '1px solid var(--app-border)',
          borderRadius: 24,
          boxShadow: '0 20px 42px rgba(86,53,66,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          zIndex: 9997,
          scrollbarWidth: 'none',
        }}
      >
      <div
        style={{
          padding: '0.95rem 1rem',
          borderBottom: '1px solid var(--app-border)',
          background:
            'linear-gradient(135deg, rgba(255,95,149,0.08), rgba(255,192,214,0.12))',
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem',
        }}
      >
          <FemaleSageAvatar imageUrl={avatarUrl} />
        <div style={{ flex: 1 }}>
          <p
            style={{
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.92rem',
              fontWeight: 800,
              color: 'var(--app-text)',
            }}
          >
            Think with Sage
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '1px solid var(--app-border)',
            background: '#fff',
            color: 'var(--app-text)',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
          }}
        >
          X
        </button>
      </div>

      <div
        ref={bodyRef}
        className="sage-scroll-area"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.9rem 1rem',
          display: 'grid',
          gap: '0.55rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
          {!messages.length && !loading && (
            <ChatBubble role="assistant" onSpeak={() => speakText('Ask about the blocker, the next step, or how to finish this task.', voicePreference)}>
              Ask about the blocker, the next step, or how to finish this task.
            </ChatBubble>
          )}
          {messages.map((message, index) => (
            <ChatBubble
              key={`${message.role}-${index}`}
              role={message.role}
              onSpeak={message.role === 'assistant' ? () => speakText(message.content, voicePreference) : undefined}
              onCopy={() => copyText(message.content)}
              onEdit={() => editQuickMessage(message.content)}
              onRerun={message.role === 'assistant' ? () => rerunQuickAssistant(index) : undefined}
            >
              <MessageContent text={message.content} role={message.role} />
            </ChatBubble>
          ))}
          {loading && (
            <ChatBubble role="assistant">
              <TypingDots />
            </ChatBubble>
          )}
      </div>

      <div
        style={{
          padding: '0.8rem',
          borderTop: '1px solid var(--app-border)',
          background: '#fff',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          className="sage-textarea"
          value={input}
          spellCheck={false}
          onChange={event => {
            setInput(event.target.value)
            event.target.style.height = 'auto'
            event.target.style.height = `${event.target.scrollHeight}px`
          }}
          onFocus={event => {
            event.target.style.height = 'auto'
            event.target.style.height = `${event.target.scrollHeight}px`
          }}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              sendQuickMessage()
            }
          }}
          rows={1}
              placeholder=""
          style={{
            flex: 1,
            resize: 'none',
            maxHeight: 84,
            overflowY: 'hidden',
            border: '1.5px solid var(--app-border)',
            borderRadius: 14,
            padding: '0.55rem 0.75rem',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.84rem',
            background: '#fff',
            color: 'var(--app-text)',
            caretColor: 'var(--app-text)',
            WebkitTextFillColor: 'var(--app-text)',
            lineHeight: 1.5,
            scrollbarWidth: 'none',
          }}
        />
          <VoiceRecorderButton
            onClick={toggleQuickRecording}
            recording={recording}
            disabled={!getSpeechRecognition()}
          />
        <button
          onClick={sendQuickMessage}
          disabled={!input.trim() || loading}
          style={{
            minWidth: 42,
            height: 42,
            borderRadius: '50%',
            border: 'none',
            background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
            color: '#fff',
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 800,
            opacity: !input.trim() || loading ? 0.45 : 1,
          }}
        >
          →
        </button>
      </div>
    </div>
  )
}

export function QuickSageBubble() {
  const boardData = useMemo(() => loadBoardData(), [])
  const todayTask = useMemo(() => getTodayTask(boardData), [boardData])
  const [open, setOpen] = useState(false)
  const [voicePreference, setVoicePreferenceState] = useState(() => getVoicePreference())
  const [avatarUrl, setAvatarUrl] = useState(() => getSageAvatarUrl())
  const [position, setPosition] = useState(() =>
      safeRead(QUICK_POSITION_KEY, getDefaultBubblePosition())
    )
  const dragging = useRef(false)
  const dragMoved = useRef(false)
  const dragStart = useRef({})
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  const bubbleSize = isMobileViewport ? 54 : 66
  const avatarSize = isMobileViewport ? 48 : 60

  function clampBubblePosition(nextRight, nextBottom) {
    const sidebarWidth = document.querySelector('.hamburger-menu-shell')?.getBoundingClientRect().width || 0
    const maxRight = Math.max(8, window.innerWidth - 68 - sidebarWidth - 12)
    return {
      right: clamp(nextRight, 8, maxRight),
      bottom: clamp(nextBottom, 8, Math.max(8, window.innerHeight - 68 - 8)),
    }
  }

  useEffect(() => {
    safeWrite(QUICK_POSITION_KEY, position)
  }, [position])

  useEffect(() => {
    function clampNow() {
      setPosition(prev => {
        const nextRight = Number.isFinite(prev?.right) ? prev.right : 24
        const nextBottom = Number.isFinite(prev?.bottom) ? prev.bottom : 24
        const clamped = clampBubblePosition(nextRight, nextBottom)
        if (clamped.right === prev?.right && clamped.bottom === prev?.bottom) return prev
        return clamped
      })
    }
    clampNow()
    window.addEventListener('resize', clampNow)
    return () => window.removeEventListener('resize', clampNow)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.__phasrSageBubbleMounted = true
    const openHandler = () => setOpen(true)
    const closeHandler = () => setOpen(false)
    window.addEventListener('phasr-open-sage-float', openHandler)
    window.addEventListener('phasr-close-sage-float', closeHandler)
    return () => {
      window.__phasrSageBubbleMounted = false
      window.removeEventListener('phasr-open-sage-float', openHandler)
      window.removeEventListener('phasr-close-sage-float', closeHandler)
    }
  }, [])

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarUrl(getSageAvatarUrl())
    const handleVoiceUpdate = () => setVoicePreferenceState(getVoicePreference())
    window.addEventListener('phasr-sage-avatar-updated', handleAvatarUpdate)
    window.addEventListener('phasr-voice-pref-updated', handleVoiceUpdate)
    window.addEventListener('storage', handleAvatarUpdate)
    window.addEventListener('storage', handleVoiceUpdate)
    return () => {
      window.removeEventListener('phasr-sage-avatar-updated', handleAvatarUpdate)
      window.removeEventListener('phasr-voice-pref-updated', handleVoiceUpdate)
      window.removeEventListener('storage', handleAvatarUpdate)
      window.removeEventListener('storage', handleVoiceUpdate)
    }
  }, [])

  useEffect(() => {
    function onMouseMove(e) {
      if (!dragging.current) return
      if (
        Math.abs(e.clientX - dragStart.current.x) > 4 ||
        Math.abs(e.clientY - dragStart.current.y) > 4
      ) {
        dragMoved.current = true
      }
      setPosition(clampBubblePosition(
        dragStart.current.right - (e.clientX - dragStart.current.x),
        dragStart.current.bottom - (e.clientY - dragStart.current.y),
      ))
    }

    function onMouseUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function onMouseDown(e) {
    dragging.current = true
    dragMoved.current = false
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      right: position.right,
      bottom: position.bottom,
    }
    function onMouseMove(moveEvent) {
      if (!dragging.current) return
      if (
        Math.abs(moveEvent.clientX - dragStart.current.x) > 4 ||
        Math.abs(moveEvent.clientY - dragStart.current.y) > 4
      ) {
        dragMoved.current = true
      }
      setPosition(clampBubblePosition(
        dragStart.current.right - (moveEvent.clientX - dragStart.current.x),
        dragStart.current.bottom - (moveEvent.clientY - dragStart.current.y),
      ))
    }
    function onMouseUp() {
      dragging.current = false
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function onTouchStart(e) {
    const touch = e.touches?.[0]
    if (!touch) return
    dragging.current = true
    dragMoved.current = false
    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      right: position.right,
      bottom: position.bottom,
    }

    function onTouchMove(moveEvent) {
      const nextTouch = moveEvent.touches?.[0]
      if (!dragging.current || !nextTouch) return
      if (
        Math.abs(nextTouch.clientX - dragStart.current.x) > 4 ||
        Math.abs(nextTouch.clientY - dragStart.current.y) > 4
      ) {
        dragMoved.current = true
      }
      setPosition(clampBubblePosition(
        dragStart.current.right - (nextTouch.clientX - dragStart.current.x),
        dragStart.current.bottom - (nextTouch.clientY - dragStart.current.y),
      ))
    }

    function onTouchEnd() {
      dragging.current = false
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('touchcancel', onTouchEnd)
    }

    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd)
    window.addEventListener('touchcancel', onTouchEnd)
  }

  function handleClick() {
    if (dragMoved.current) {
      dragMoved.current = false
      return
    }
    setOpen(current => !current)
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <>
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={handleClick}
        onDragStart={event => event.preventDefault()}
        title="Think with Sage"
        style={{
          position: 'fixed',
          right: position.right,
          bottom: position.bottom,
          zIndex: 9998,
          width: bubbleSize,
          height: bubbleSize,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
          boxShadow: '0 16px 32px rgba(255,95,149,0.28)',
          cursor: 'grab',
          touchAction: 'none',
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserDrag: 'none',
          pointerEvents: 'auto',
        }}
      >
        {avatarUrl ? (
          <FemaleSageAvatar size={avatarSize} soft imageUrl={avatarUrl} />
        ) : (
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.08em', color: '#fff' }}>
            SAGE
          </span>
        )}
      </button>

      <QuickSagePanel
        task={todayTask.task}
        open={open}
        onClose={() => setOpen(false)}
        position={position}
        boardData={boardData}
        voicePreference={voicePreference}
        avatarUrl={avatarUrl}
      />

      <style>{`
        .sage-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--app-accent);
          display: inline-block;
          animation: sagePulse 1s ease-in-out infinite;
        }
        @keyframes sagePulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.45; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>,
    document.body,
  )
}

function PromptRow({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        border: 'none',
        background: 'transparent',
        padding: '1rem 0',
        borderBottom: '1px solid #eee2e8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        textAlign: 'left',
      }}
    >
      <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1e1720' }}>{children}</span>
      <span style={{ fontSize: '1.2rem', color: '#1e1720' }}>{'>'}</span>
    </button>
  )
}

function getSpeechRecognition() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

function VoiceButton({ listening, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={listening ? 'Stop voice input' : 'Start voice input'}
      style={{
        minWidth: 44,
        height: 44,
        borderRadius: '50%',
        border: listening ? 'none' : '1px solid var(--app-border)',
        background: listening
          ? 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))'
          : 'var(--app-bg2)',
        color: listening ? '#fff' : 'var(--app-text)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        fontSize: '1rem',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
      }}
    >
      ●
    </button>
  )
}

function VoiceRecorderButton({ recording, onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={recording ? 'Stop recording' : 'Record voice note'}
      style={{
        minWidth: 44,
        height: 44,
        borderRadius: '50%',
        border: 'none',
        background: recording ? '#d63f64' : '#f472a8',
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="M10 12.4a3.2 3.2 0 0 0 3.2-3.2V6.8a3.2 3.2 0 1 0-6.4 0v2.4a3.2 3.2 0 0 0 3.2 3.2Z" fill="currentColor" />
        <path d="M5.8 9.7a4.2 4.2 0 0 0 8.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M10 13.9v2.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7.7 16.5h4.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  )
}

export default function SageCoach({ onLockInChange, user }) {
  const isPro = getUserAccess(user).isPro
  const boardData = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('phasr_vb') || '{}')
    } catch {
      return {}
    }
  }, [])
  const todayTask = useMemo(() => getTodayTask(boardData), [boardData])
  const [voicePreference, setVoicePreferenceState] = useState(() => getVoicePreference())
  const [avatarUrl, setAvatarUrl] = useState(() => getSageAvatarUrl())
  const [threads, setThreads] = useState(() => migrateThreads())
  const [activeThreadId, setActiveThreadId] = useState(() => {
    const savedActive = localStorage.getItem(FULL_ACTIVE_THREAD_KEY)
    const migratedThreads = migrateThreads()
    return savedActive && migratedThreads.some(thread => thread.id === savedActive)
      ? savedActive
      : migratedThreads[0]?.id
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [researching, setResearching] = useState(false)
  const [forceResearchNext, setForceResearchNext] = useState(false)
  const [recording, setRecording] = useState(false)
  const [revealedThreadDeleteId, setRevealedThreadDeleteId] = useState(null)
  const [usage, setUsage] = useState(() =>
    safeRead(THINK_USAGE_KEY, { date: getTodayKey(), wordsUsed: 0 })
  )
  const bodyRef = useRef(null)
  const mediaRecorder = useRef(null)
  const mediaStreamRef = useRef(null)
  const recognitionRef = useRef(null)
  const activeThread = useMemo(
    () => threads.find(thread => thread.id === activeThreadId) || threads[0] || createThread(),
    [threads, activeThreadId],
  )
  const session = activeThread?.messages || []

  useEffect(() => {
    safeWrite(
      FULL_THREADS_KEY,
      threads.map(thread => ({
        ...thread,
        messages: (thread.messages || []).slice(-60),
        title: buildThreadTitle(thread.messages),
      })),
    )
    if (activeThreadId) {
      localStorage.setItem(FULL_ACTIVE_THREAD_KEY, activeThreadId)
    }
  }, [threads, activeThreadId])

  useEffect(() => {
    if (!threads.length) {
      const nextThread = createThread()
      setThreads([nextThread])
      setActiveThreadId(nextThread.id)
      return
    }

    if (!threads.some(thread => thread.id === activeThreadId)) {
      setActiveThreadId(threads[0].id)
    }
  }, [threads, activeThreadId])

  useEffect(() => {
    safeWrite(THINK_USAGE_KEY, usage)
  }, [usage])

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [session, loading])

  useEffect(() => {
    const handleAvatarUpdate = () => setAvatarUrl(getSageAvatarUrl())
    const handleVoiceUpdate = () => setVoicePreferenceState(getVoicePreference())
    window.addEventListener('phasr-sage-avatar-updated', handleAvatarUpdate)
    window.addEventListener('phasr-voice-pref-updated', handleVoiceUpdate)
    window.addEventListener('storage', handleAvatarUpdate)
    window.addEventListener('storage', handleVoiceUpdate)
    return () => {
      window.removeEventListener('phasr-sage-avatar-updated', handleAvatarUpdate)
      window.removeEventListener('phasr-voice-pref-updated', handleVoiceUpdate)
      window.removeEventListener('storage', handleAvatarUpdate)
      window.removeEventListener('storage', handleVoiceUpdate)
    }
  }, [])

  useEffect(() => {
    const today = getTodayKey()
    if (usage.date !== today) {
      setUsage({ date: today, wordsUsed: 0 })
    }
  }, [usage])

  useEffect(() => {
    return () => {
      stopRecognitionInstance(recognitionRef, setRecording)
      mediaRecorder.current?.stop?.()
      mediaStreamRef.current?.getTracks().forEach(track => track.stop())
    }
  }, [])

  function updateActiveThreadMessages(updater) {
    setThreads(current =>
      current.map(thread => {
        if (thread.id !== activeThreadId) return thread
        const nextMessages = typeof updater === 'function' ? updater(thread.messages || []) : updater
        return {
          ...thread,
          messages: nextMessages.slice(-60),
          title: buildThreadTitle(nextMessages),
          updatedAt: Date.now(),
        }
      }),
    )
  }

  async function sendFullMessage(text) {
    const content = String(text || input).trim()
    if (!content || loading) return
    const useDeepResearch = forceResearchNext || shouldUseDeepResearch(content)

    const nextUsedWords = usage.date === getTodayKey()
      ? usage.wordsUsed + countWords(content)
      : countWords(content)

    if (nextUsedWords > THINK_DAILY_WORD_LIMIT) {
      updateActiveThreadMessages(current => [
        ...current,
        {
          role: 'assistant',
          content:
            "You've hit today's Sage limit. You can upgrade for more deep sessions or come back in 24 hours.\n\nNext step: return tomorrow for another deep session or keep your next question short.",
        },
      ])
      return
    }

    const nextMessages = [...session, { role: 'user', content }]
    updateActiveThreadMessages(nextMessages)
    setInput('')
    setLoading(true)
    setResearching(useDeepResearch)
    setForceResearchNext(false)
    setUsage({ date: getTodayKey(), wordsUsed: nextUsedWords })

    if (useDeepResearch && !isPro) {
      updateActiveThreadMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: `Answer
- Deep Research is available on Pro. I can still give you a fast general answer now.

Breakdown
- Your question needs higher accuracy or real-world detail.
- That is when Sage switches into research mode.

Sources
- Pro deep research required for live source-backed answers.

Action Steps
- Upgrade for Deep Research.
- Or ask the same question again and I will answer from general knowledge only.`,
        },
      ])
      setLoading(false)
      setResearching(false)
      return
    }

    try {
      const reply = await requestSageReply({
        system: useDeepResearch ? buildResearchSystemPrompt(user, boardData) : buildFullSystemPrompt(user, boardData),
        messages: nextMessages,
        mode: useDeepResearch ? 'think' : 'chat',
      })
      updateActiveThreadMessages(current => [...current, { role: 'assistant', content: reply }])
    } catch {
      updateActiveThreadMessages(current => [
        ...current,
        {
          role: 'assistant',
          content: useDeepResearch
            ? buildResearchFallbackReply(content)
            : buildFallbackReply({
                mode: 'full',
                task: todayTask.task,
                input: content,
                boardData,
              }),
        },
      ])
    } finally {
      setLoading(false)
      setResearching(false)
    }
  }

  function editFullMessage(content) {
    setInput(String(content || ''))
  }

  function rerunAssistantMessage(index) {
    const assistantMessage = session[index]
    const previousUserMessage = [...session.slice(0, index)].reverse().find(message => message.role === 'user')?.content || ''
    if (!assistantMessage || !previousUserMessage || loading) return

    const useDeepResearch = forceResearchNext || shouldUseDeepResearch(previousUserMessage)
    const nextMessages = session.slice(0, index)
    updateActiveThreadMessages(nextMessages)
    setInput('')
    setLoading(true)
    setResearching(useDeepResearch)

    void (async () => {
      try {
        const reply = await requestSageReply({
          system: useDeepResearch ? buildResearchSystemPrompt(user, boardData) : buildFullSystemPrompt(user, boardData),
          messages: nextMessages,
          mode: useDeepResearch ? 'think' : 'chat',
        })
        updateActiveThreadMessages(current => [...current, { role: 'assistant', content: reply }])
      } catch {
        updateActiveThreadMessages(current => [
          ...current,
          {
            role: 'assistant',
            content: useDeepResearch
              ? buildResearchFallbackReply(previousUserMessage)
              : buildFallbackReply({
                  mode: 'full',
                  task: todayTask.task,
                  input: previousUserMessage,
                  boardData,
                }),
          },
        ])
      } finally {
        setLoading(false)
        setResearching(false)
      }
    })()
  }

  function startNewChat() {
    if (session.length > 0) {
      const shouldStartFresh = window.confirm(
        'End this chat and start a new one? Your current chat will still be saved.',
      )
      if (!shouldStartFresh) return
    }
    const nextThread = createThread()
    setThreads(current => [nextThread, ...current].slice(0, 12))
    setActiveThreadId(nextThread.id)
    setInput('')
  }

  function clearSession() {
    const shouldDelete = window.confirm('Are you sure you want to delete this chat?')
    if (!shouldDelete) return
    setThreads(current => current.filter(thread => thread.id !== activeThreadId))
    localStorage.removeItem(FULL_SESSION_KEY)
  }

  async function toggleRecording() {
    if (recording) {
      stopRecognitionInstance(recognitionRef, setRecording)
      return
    }

    startSpeechTranscription({ recognitionRef, setRecording, setInput })
  }

  const prompts = [
    'Plan my week',
    'Strategize with me',
    'Reflect on my progress',
  ]
  const orderedThreads = [...threads].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))

  const [showInternetHint, setShowInternetHint] = useState(false)

  function handleInternetClick() {
    if (isPro) {
      setForceResearchNext(true)
      if (String(input || '').trim()) {
        void sendFullMessage(input)
      } else {
        setResearching(true)
      }
      return
    }
    setShowInternetHint(true)
    window.setTimeout(() => setShowInternetHint(false), 2200)
  }

  return (
    <div
      style={{
        height: 'calc(100vh - 56px)',
        background: 'var(--app-bg)',
        padding: '1rem',
        fontFamily: "'DM Sans', sans-serif",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#fff',
          border: '1px solid var(--app-border)',
          borderRadius: 24,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 0.9rem',
            borderBottom: '1px solid var(--app-border)',
            background: '#fffafc',
          }}
        >
          <button
            onClick={startNewChat}
            style={{
              minHeight: 40,
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
              color: '#fff',
              padding: '0.6rem 1rem',
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            New chat
          </button>
          <div
            style={{
              display: 'flex',
              gap: '0.55rem',
              overflowX: 'auto',
              flex: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
            className="sage-thread-row"
          >
            {orderedThreads.map(thread => {
              const isActive = thread.id === activeThreadId
              return (
                <button
                  key={thread.id}
                  onClick={() => setActiveThreadId(thread.id)}
                  onMouseEnter={() => setRevealedThreadDeleteId(thread.id)}
                  onMouseLeave={() => setRevealedThreadDeleteId(current => current === thread.id ? null : current)}
                  onTouchStart={() => setRevealedThreadDeleteId(thread.id)}
                  style={{
                    minWidth: 160,
                    maxWidth: 220,
                    padding: '0.65rem 0.8rem',
                    borderRadius: 18,
                    border: isActive ? 'none' : '1px solid var(--app-border)',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(255,95,149,0.16), rgba(255,192,214,0.24))'
                      : '#fff',
                    color: 'var(--app-text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: "'DM Sans', sans-serif",
                    flexShrink: 0,
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {thread.title || 'New chat'}
                  </div>
                  <div style={{ marginTop: '0.18rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#8a727f' }}>
                      {formatThreadTime(thread.updatedAt)}
                    </span>
                    {isActive && (thread.messages?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={event => {
                          event.stopPropagation()
                          clearSession()
                        }}
                        title="Delete chat"
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          border: '1px solid rgba(214,63,100,0.18)',
                          background: '#fff',
                          color: '#d63f64',
                          display: 'grid',
                          placeItems: 'center',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                          opacity: revealedThreadDeleteId === thread.id ? 1 : 0,
                          pointerEvents: revealedThreadDeleteId === thread.id ? 'auto' : 'none',
                          transition: 'opacity 0.18s ease',
                        }}
                      >
                        <Trash2 size={12} strokeWidth={2.2} />
                      </button>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {researching && (
          <div
            style={{
              padding: '0.4rem 0.9rem 0.55rem',
              borderBottom: '1px solid var(--app-border)',
              background: '#fff',
            }}
          >
            <p style={{ margin: 0, color: 'var(--app-accent)', fontSize: '0.78rem', fontWeight: 800 }}>
              Researching...
            </p>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            flexWrap: 'wrap',
            padding: '0.7rem 0.9rem 0.55rem',
            borderBottom: '1px solid var(--app-border)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap', flex: 1 }}>
            {session.length === 0 && prompts.map(prompt => (
              <button
                key={prompt}
                onClick={() => sendFullMessage(prompt)}
                style={{
                  minHeight: 40,
                  borderRadius: 999,
                  border: '1px solid var(--app-border)',
                  background: 'var(--app-bg2)',
                  color: 'var(--app-text)',
                  padding: '0.6rem 0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={bodyRef}
          className="sage-scroll-area"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1rem',
            display: 'grid',
            alignContent: 'start',
            gap: '0.55rem',
            minHeight: 0,
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {session.map((message, index) => (
            <ChatBubble
              key={`${message.role}-${index}`}
              role={message.role}
              onSpeak={message.role === 'assistant' ? () => speakText(message.content, voicePreference) : undefined}
              onCopy={() => copyText(message.content)}
              onEdit={message.role === 'user' ? () => editFullMessage(message.content) : undefined}
              onRerun={message.role === 'assistant' ? () => rerunAssistantMessage(index) : undefined}
            >
              <MessageContent text={message.content} role={message.role} />
            </ChatBubble>
          ))}
          {loading && (
            <ChatBubble role="assistant">
              <TypingDots />
            </ChatBubble>
          )}
        </div>

        <div
          style={{
            padding: '0.9rem 1rem 1rem',
            borderTop: '1px solid var(--app-border)',
            background: '#fff',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          {showInternetHint && (
            <div style={{ position: 'absolute', right: '1rem', top: '-2.45rem', background: '#1f1720', color: '#fff', borderRadius: 12, padding: '0.5rem 0.7rem', fontSize: '0.74rem', fontWeight: 700, boxShadow: '0 12px 24px rgba(0,0,0,0.18)' }}>
              Pro unlocks live web research
            </div>
          )}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-end',
            }}
          >
            <textarea
              className="sage-textarea"
              value={input}
              spellCheck={false}
              onChange={event => {
                setInput(event.target.value)
                event.target.style.height = 'auto'
                event.target.style.height = `${event.target.scrollHeight}px`
              }}
              onFocus={event => {
                event.target.style.height = 'auto'
                event.target.style.height = `${event.target.scrollHeight}px`
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  sendFullMessage()
                }
              }}
              rows={1}
              placeholder=""
              style={{
                flex: 1,
                resize: 'none',
                maxHeight: 120,
                overflowY: 'hidden',
                border: '1.5px solid var(--app-border)',
                borderRadius: 16,
                padding: '0.78rem 0.9rem',
                outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.96rem',
                lineHeight: 1.6,
                background: '#fff',
                color: 'var(--app-text)',
                caretColor: 'var(--app-text)',
                WebkitTextFillColor: 'var(--app-text)',
                scrollbarWidth: 'none',
              }}
            />
            <VoiceRecorderButton
              onClick={toggleRecording}
              recording={recording}
              disabled={!getSpeechRecognition()}
            />
            <button
              type="button"
              onClick={handleInternetClick}
              title="Live internet research"
              style={{
                minWidth: 44,
                height: 44,
                borderRadius: '50%',
                border: '1.5px solid var(--app-border)',
                background: '#fff',
                color: 'var(--app-text)',
                cursor: 'pointer',
                flexShrink: 0,
                display: 'grid',
                placeItems: 'center',
                position: 'relative',
              }}
            >
              <Globe size={18} strokeWidth={2} />
              {researching && (
                <span style={{ position: 'absolute', top: -4, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 2, alignItems: 'center' }}>
                  <span className="sage-dot" style={{ width: 5, height: 5 }} />
                  <span className="sage-dot" style={{ width: 5, height: 5, animationDelay: '0.2s' }} />
                  <span className="sage-dot" style={{ width: 5, height: 5, animationDelay: '0.4s' }} />
                </span>
              )}
              {!isPro && (
                <span style={{ position: 'absolute', right: -2, top: -2, minWidth: 16, height: 16, borderRadius: 999, background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontSize: '0.5rem', fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 0.18rem' }}>
                  PRO
                </span>
              )}
            </button>
            <button
              onClick={() => sendFullMessage()}
              disabled={!input.trim() || loading}
              style={{
                minWidth: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
                color: '#fff',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 800,
                opacity: !input.trim() || loading ? 0.45 : 1,
              }}
            >
              {'>'}
            </button>
          </div>
        </div>

        <style>{`
          .sage-scroll-area::-webkit-scrollbar,
          .sage-textarea::-webkit-scrollbar,
          .sage-thread-row::-webkit-scrollbar {
            width: 0;
            height: 0;
          }
          .sage-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--app-accent);
            display: inline-block;
            animation: sagePulse 1s ease-in-out infinite;
          }
          @keyframes sagePulse {
            0%, 80%, 100% { transform: scale(0.6); opacity: 0.45; }
            40% { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}
