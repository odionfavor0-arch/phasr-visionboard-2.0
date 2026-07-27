// src/components/VisionBoard.jsx
// ---------------------------------------------------------
// Full vision board - phase lock, pillar presets,
// independent collapse (max 3 open), Today's Target,
// before/after upload, quarterly review, export
// ---------------------------------------------------------

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
// eslint-disable-next-line no-unused-vars -- used via JSX member expressions (motion.div, motion.button)
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { BookOpen, Briefcase, Camera, Compass, Coffee, Dumbbell, Flame, Gift, Hand, HandHeart, HeartPulse, Home, ImageDown, Leaf, Lock, Mountain, Music, Plus, Rocket, Sparkles, Star, Sun, Target, Trash2, Wallet } from 'lucide-react'
import { getDailyTaskPlan, getPhaseWeeks } from '../lib/lockIn'
import { fetchPillarPlanWithGroq } from '../lib/sageIntelligence'
import { FOCUS_AREA_CATEGORIES, getFocusAreaLabel } from '../lib/focusAreas'
import { supabase } from '../lib/supabase'
import { pushBoardData } from '../lib/supabaseSync'
import phasrMark from '../assets/phasr-mark.png'

const FOCUS_AREA_TERRITORY = {
  'Health and Fitness': {
    covers: 'body, food, sleep, gym, energy, physical habits, nutrition, movement, recovery',
    guidance: 'Plans should focus on physical habits, nutrition, movement, and recovery.',
  },
  'Career and Business': {
    covers: 'job search, entrepreneurship, income streams, professional skills, career strategy, building a business',
    guidance: 'Plans should focus on skill building, application habits, income generation, and career strategy.',
  },
  Wealth: {
    covers: 'savings, investing, debt reduction, budgeting, financial habits, money systems',
    guidance: 'Plans should focus on budgeting, saving habits, debt reduction, and building financial systems.',
  },
  Relationships: {
    covers: 'love, family, friendships, community, communication, connection, boundaries',
    guidance: 'Plans should focus on communication habits, quality time, boundaries, and building deeper connections.',
  },
  'Inner Life': {
    covers: 'spirituality, religion, mindfulness, mental health, reflection, emotional regulation, peace',
    guidance: 'Plans should focus on reflection practices, prayer or meditation, emotional regulation, and peace-building habits.',
  },
  'Personal Growth': {
    covers: 'learning, reading, creativity, self-development, skill building, knowledge, creative output',
    guidance: 'Plans should focus on reading, skill acquisition, creative output, and building knowledge systems. Never suggest gym or fitness activities for this pillar.',
  },
  Travel: {
    covers: 'trip planning, travel savings, destination research, booking, travel habits',
    guidance: 'Plans should focus on destination research, travel savings, booking habits, and trip preparation.',
  },
}

const FOCUS_AREA_KNOWLEDGE = {
  'Health & Fitness': {
    resources: [
      'A training app or workout tracker like Strava or Nike Run Club',
      'A nutrition tracking app like MyFitnessPal or Cronometer',
      'A sleep tracker — phone or wearable',
      'A gym membership or home equipment that removes friction',
      'A workout partner or accountability buddy',
    ],
    activities: [
      'Complete your planned workouts before the week closes',
      'Prep your meals for the busiest three days of the week',
      'Hit your daily step or movement target',
      'Log what you eat for at least four days this week',
      'Sleep seven to eight hours on at least five nights',
      'Do one active recovery session — walk, stretch, or swim',
    ],
    nonNegotiables: [
      'Train at least three times this week no matter what',
      'Eat one home-cooked meal every day',
      'Move your body for at least 20 minutes daily',
      'Track your progress at least once this week',
    ],
    outcome: 'By the end of this phase you will have built a consistent movement and nutrition rhythm. Your energy will be different. Your relationship with your body will be different.',
  },

  'Career & Business': {
    resources: [
      'A project management tool — Notion, Trello, or Asana',
      'A mentor or someone one level ahead of you in your field',
      'Industry newsletters or podcasts relevant to your role',
      'A portfolio or LinkedIn presence that reflects your current level',
      'A income tracking spreadsheet',
    ],
    activities: [
      'Do your most important career task before checking messages',
      'Reach out to one person in your network this week',
      'Spend 30 minutes learning something directly relevant to your goal',
      'Review what you worked on this week and document one win',
      'Identify and remove one thing wasting your professional time',
    ],
    nonNegotiables: [
      'Complete your highest priority deliverable before Friday',
      'Have one meaningful professional conversation this week',
      'Spend at least two hours on deep work with no distractions',
      'Review your career goal and adjust your plan if needed',
    ],
    outcome: 'By the end of this phase you will have moved from thinking about your career goal to actively building toward it with evidence you can point to.',
  },

  'Wealth & Finance': {
    resources: [
      'A budgeting app — YNAB, Copilot, or a simple spreadsheet',
      'Your bank statements for the last three months',
      'A savings account separate from your spending account',
      'One book or course on personal finance or investing',
      'A financial advisor or accountability partner',
    ],
    activities: [
      'Review your spending from last week every Sunday',
      'Transfer a fixed amount to savings before spending on anything else',
      'Identify one recurring expense to cut or reduce',
      'Research one investment or income stream you have been putting off',
      'Track every purchase above a set threshold this week',
    ],
    nonNegotiables: [
      'Do not spend outside your weekly budget',
      'Move money to savings before the week ends',
      'Review your financial goal and check your progress',
      'Identify one financial decision you have been avoiding',
    ],
    outcome: 'By the end of this phase you will have real data on where your money goes and a savings habit that runs automatically.',
  },

  Relationships: {
    resources: [
      'A journal specifically for processing relationship patterns',
      'A therapist or counsellor if deeper work is needed',
      'Books on attachment, communication, or boundaries',
      'Intentional time carved out for the people who matter most',
    ],
    activities: [
      'Have one real conversation with someone you care about — no phones',
      'Send one message to someone you have been meaning to reach out to',
      'Do something for a person in your life with no expectation of return',
      'Identify one relationship pattern you want to change',
      'Spend one hour fully present with your most important person',
    ],
    nonNegotiables: [
      'Show up for at least one important relationship intentionally this week',
      'Say something true that you have been holding back',
      'Protect time for connection — do not cancel on people who matter',
      'Check in with yourself on how you are showing up in relationships',
    ],
    outcome: 'By the end of this phase your relationships will feel more intentional. You will have said things that needed saying and shown up in ways you were proud of.',
  },

  'Inner Life': {
    resources: [
      'A meditation app — Insight Timer is free and good',
      'A journal for morning or evening reflection',
      'A spiritual community, practice, or text that resonates with you',
      'Time alone with no input — no podcast, no phone, no noise',
    ],
    activities: [
      'Sit in silence for five minutes every morning before picking up your phone',
      'Write one page in your journal three times this week',
      'Spend time in a spiritual practice that is meaningful to you',
      'Identify one belief you hold about yourself and examine if it is true',
      'Do one thing this week that makes you feel deeply like yourself',
    ],
    nonNegotiables: [
      'Protect at least 20 minutes of quiet time daily',
      'Complete your journal entry at least three times this week',
      'Engage with your spiritual practice at least once',
      'Notice and write down one moment of real peace this week',
    ],
    outcome: 'By the end of this phase you will have built a relationship with your own inner life. The noise will be quieter. The clarity will come faster.',
  },

  'Personal Growth': {
    resources: [
      'One book directly relevant to the person you are trying to become',
      'A course, mentor, or coach in your specific area of growth',
      'A reflection practice — journaling, therapy, or honest conversation',
      'An environment that pulls you toward who you want to be',
      'A clear definition of what growth looks like for you specifically',
    ],
    activities: [
      'Do the hardest 30-minute task related to your growth goal first each day',
      'Read or learn something that challenges how you currently think',
      'Remove one blocker from your environment this week',
      'Have one honest conversation about where you are versus where you want to be',
      'Track progress visibly and review what is working every Sunday',
    ],
    nonNegotiables: [
      'Do one thing this week the old version of you would have avoided',
      'Finish at least one measurable task that moves your goal forward',
      'Review proof of your progress and reset the week',
      'Identify and address one pattern that is holding you back',
    ],
    outcome: 'By the end of this phase you will have evidence that you are not the same person who started. Small but real. That proof is what changes the belief.',
  },
}

const uid = () => Math.random().toString(36).slice(2, 9)

const QUARTER_MONTHS = {
  Q1: ['Jan', 'Feb', 'Mar'],
  Q2: ['Apr', 'May', 'Jun'],
  Q3: ['Jul', 'Aug', 'Sep'],
  Q4: ['Oct', 'Nov', 'Dec'],
}

function buildDefaultPhaseWindow(index, totalPhases, baseDate = new Date()) {
  const year = baseDate.getFullYear()
  const startMonth = baseDate.getMonth()
  const remainingMonths = 12 - startMonth
  const safeTotal = Math.max(totalPhases || 1, 1)
  const baseShare = Math.floor(remainingMonths / safeTotal)
  const remainder = remainingMonths % safeTotal

  let cursor = startMonth
  for (let current = 0; current <= index; current += 1) {
    const segmentLength = Math.max(1, baseShare + (current < remainder ? 1 : 0))
    const segmentStart = cursor
    const segmentEnd = Math.min(11, cursor + segmentLength - 1)

    if (current === index) {
      const startDate = new Date(year, segmentStart, 1)
      const endDate = new Date(year, segmentEnd + 1, 0)
      return {
        startDate: getTodayKey(startDate),
        endDate: getTodayKey(endDate),
      }
    }

    cursor = segmentEnd + 1
  }

  const fallbackStart = new Date(year, startMonth, 1)
  const fallbackEnd = new Date(year, 11, 31)
  return {
    startDate: getTodayKey(fallbackStart),
    endDate: getTodayKey(fallbackEnd),
  }
}

function getQuarterDates(period, year = new Date().getFullYear()) {
  const cleanPeriod = String(period || '').toUpperCase()
  const quarter = QUARTER_MONTHS[cleanPeriod] ? cleanPeriod : 'Q1'
  const quarterIndex = Number(quarter.replace('Q', '')) - 1
  const startMonth = quarterIndex * 3
  const startDate = new Date(year, startMonth, 1)
  const endDate = new Date(year, startMonth + 3, 0)
  return {
    period: quarter,
    months: QUARTER_MONTHS[quarter],
    startDate: getTodayKey(startDate),
    endDate: getTodayKey(endDate),
  }
}

function formatMonthRange(startDate, endDate) {
  if (!startDate || !endDate) return ''
  const start = new Date(`${startDate}T12:00:00`)
  const end = new Date(`${endDate}T12:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
  const startLabel = start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  const endLabel = end.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
}

function getPhaseTimelineLabel(phase) {
  return phase?.timeframeLabel || formatMonthRange(phase?.startDate, phase?.endDate)
}

// The only fields that actually change what would land on a calendar: the
// phase window and each pillar's weekly non-negotiables. Used to tell "she
// re-saved without touching anything schedulable" apart from "she actually
// changed her week," so the calendar popup doesn't reappear on every edit.
function getScheduleFingerprint(ph) {
  return JSON.stringify({
    start: ph?.startDate || '',
    end: ph?.endDate || '',
    actions: (ph?.pillars || []).map(pl => (pl.weeklyActions || []).map(a => cleanText(a)).filter(Boolean)),
  })
}

// Boards saved before the category/name split only have `name` (which used
// to double as the category) and `emoji` (the 2-letter icon code, which for
// preset-applied pillars already matches a category id). Recover `category`
// from whichever of those still points at one of the six real categories, so
// Sage's territory/knowledge lookups keep working for boards saved pre-migration.
function inferLegacyPillarCategory(pillar) {
  if (!pillar) return null
  const byEmoji = FOCUS_AREA_CATEGORIES.find(category => category.id === pillar.emoji)
  if (byEmoji) return byEmoji.id
  const normalizedName = normalizeFocusAreaName(pillar.name)
  const byName = FOCUS_AREA_CATEGORIES.find(category => normalizeFocusAreaName(category.name) === normalizedName)
  return byName?.id || null
}

function normalizePillarShape(pillar) {
  const category = pillar?.category || inferLegacyPillarCategory(pillar)
  return {
    ...freshPillar(pillar?.emoji || category || 'NP', pillar?.name || 'New Pillar', category),
    ...pillar,
    category,
    resources: Array.isArray(pillar?.resources) && pillar.resources.length ? pillar.resources : [''],
    activities: Array.isArray(pillar?.activities) && pillar.activities.length ? pillar.activities : [''],
    outputs: Array.isArray(pillar?.outputs) && pillar.outputs.length ? pillar.outputs : [''],
    weeklyActions: Array.isArray(pillar?.weeklyActions) && pillar.weeklyActions.length ? pillar.weeklyActions : [''],
  }
}

function normalizePhaseShape(phase, index, totalPhases) {
  const fallbackQuarter = `Q${Math.min(index + 1, 4)}`
  const quarterMeta = getQuarterDates(phase?.period || fallbackQuarter)
  const distributedWindow = buildDefaultPhaseWindow(index, totalPhases)
  return {
    ...freshPhase(index + 1),
    ...phase,
    period: quarterMeta.period,
    startDate: distributedWindow.startDate,
    endDate: distributedWindow.endDate,
    timeframeLabel: phase?.timeframeLabel || formatMonthRange(distributedWindow.startDate, distributedWindow.endDate),
    pillars: (phase?.pillars || freshPhase(index + 1).pillars).map(normalizePillarShape),
  }
}

function normalizeBoardData(raw) {
  const base = raw && typeof raw === 'object' ? raw : { boardTitle: 'My Vision Board', phases: [freshPhase(1)] }
  const phaseSource = base.phases && base.phases.length ? base.phases : [freshPhase(1)]
  const phases = phaseSource.map((phase, index) => normalizePhaseShape(phase, index, phaseSource.length))
  const activePhaseId = phases.some(phase => phase.id === base.activePhaseId) ? base.activePhaseId : phases[0]?.id
  return {
    boardTitle: base.boardTitle || 'My Vision Board',
    phases,
    activePhaseId,
  }
}

const PILLAR_ICONS = {
  HF: HeartPulse,
  FH: Dumbbell,
  CB: Briefcase,
  WC: Briefcase,
  WE: Wallet,
  FW: Wallet,
  RE: HandHeart,
  IL: Sparkles,
  SP: Sparkles,
  MF: Sparkles,
  PG: BookOpen,
  PL: Home,
  NP: Briefcase,
  CU: Plus,
  ST: Star,
  FL: Flame,
  RK: Rocket,
  MU: Music,
  CM: Camera,
  MT: Mountain,
  SU: Sun,
  CF: Coffee,
  GF: Gift,
  CP: Compass,
  LF: Leaf,
  TG: Target,
}

// Distinct icon choices for a custom ("Add your own") pillar — separate from
// the six category glyphs, so a pillar she invents gets its own identity
// instead of every custom pillar sharing the same generic plus-sign icon.
const CUSTOM_ICON_OPTIONS = ['ST', 'FL', 'RK', 'MU', 'CM', 'MT', 'SU', 'CF', 'GF', 'CP', 'LF', 'TG']

function PillarGlyph({ code, size = 16 }) {
  const Icon = PILLAR_ICONS[code] || Briefcase
  return <Icon size={size} strokeWidth={2} />
}

// Desktop keeps the original inline panel (it never had the disruption problem).
// Mobile renders the same content through a portal as a fixed bottom sheet, so
// opening it can never push the pillar cards up or down the page.
function FocusAreaSheet({ pillar, isMobile, onClose, onSelectCategory, onNameChange, onVisionStyleChange, onIconChange }) {
  const shouldReduceMotion = useReducedMotion()
  const nameInputRef = useRef(null)
  if (!pillar) return null

  // "Add your own" jumps her straight to naming it — no need to read a
  // sub-header first, she already knows why she's here.
  function selectCustomCategory() {
    onSelectCategory(null)
    nameInputRef.current?.scrollIntoView({ behavior: shouldReduceMotion ? 'auto' : 'smooth', block: 'center' })
    nameInputRef.current?.focus()
  }

  const visionOptions = [
    { value: 'transformation', label: 'Transformation' },
    { value: 'destination', label: 'Destination' },
  ]

  const body = (
    <div
      style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 980,
        borderRadius: isMobile ? '20px 20px 0 0' : 'var(--app-radius-md)',
        border: isMobile ? 'none' : '1px solid var(--app-border)',
        background: '#fff',
        boxShadow: isMobile ? '0 -12px 40px rgba(0,0,0,0.16)' : 'var(--app-shadow-md)',
        padding: isMobile ? '0.7rem 1rem 1.5rem' : '0.8rem',
        boxSizing: 'border-box',
        maxHeight: isMobile ? '82vh' : 'none',
        overflowY: isMobile ? 'auto' : 'visible',
      }}
    >
      {isMobile && (
        <div style={{ width: 36, height: 4, borderRadius: 99, background: 'var(--app-border)', margin: '0 auto 0.85rem' }} />
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
          <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', flexShrink: 0 }}>
            <PillarGlyph code={pillar.emoji} size={15} />
          </span>
          <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Focus area</p>
        </div>
        <button type="button" onClick={onClose} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: '#fff', color: 'var(--app-muted)', padding: '0.45rem 0.8rem', cursor: 'pointer', fontFamily: "'General Sans',sans-serif", fontWeight: 700 }}>
          Close
        </button>
      </div>

      <div style={{ marginBottom: '0.75rem' }}>
        <p style={{ margin: '0 0 0.32rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Name it your way</p>
        <input
          ref={nameInputRef}
          value={pillar.name}
          onChange={e => onNameChange(e.target.value)}
          placeholder="e.g. Operation Glow Up"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.62rem 0.75rem', borderRadius: 10, border: '1.5px solid var(--app-border)', fontFamily: "'General Sans',sans-serif", fontSize: '0.9rem', fontWeight: 700, color: 'var(--app-text)', background: '#fff', outline: 'none' }}
        />
      </div>

      {pillar.category == null && (
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ margin: '0 0 0.4rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Pick its icon</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {CUSTOM_ICON_OPTIONS.map(code => {
              const isActive = pillar.emoji === code
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => onIconChange(code)}
                  style={{
                    width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', cursor: 'pointer',
                    border: isActive ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
                    background: isActive ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff',
                    color: isActive ? '#fff' : 'var(--app-text)', flexShrink: 0,
                  }}
                >
                  <PillarGlyph code={code} size={16} />
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.7rem', paddingBottom: '0.7rem', borderBottom: '1px solid var(--app-border)' }}>
        <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Vision style</p>
        <div style={{ display: 'inline-flex', border: '1px solid var(--app-border)', borderRadius: 999, padding: 3, background: 'var(--app-bg2)' }}>
          {visionOptions.map(option => {
            const isActive = (pillar.visionStyle || 'transformation') === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onVisionStyleChange(option.value)}
                style={{
                  border: 'none', borderRadius: 999, padding: '0.4rem 0.85rem', fontSize: '0.76rem', fontWeight: 700,
                  fontFamily: "'General Sans',sans-serif", cursor: 'pointer',
                  background: isActive ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'transparent',
                  color: isActive ? '#fff' : 'var(--app-muted)', transition: 'all 0.18s',
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--app-muted)' }}>
          {(pillar.visionStyle || 'transformation') === 'destination'
            ? 'One photo, full width — where you’re going.'
            : 'Two photos side by side — where you are and where you’re going.'}
        </span>
      </div>

      <p style={{ margin: '0 0 0.45rem', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Category</p>
      <p style={{ margin: '0 0 0.55rem', fontSize: '0.7rem', color: 'var(--app-muted)' }}>System-only — Sage uses this to plan, your name above is what you'll actually see.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
        {FOCUS_AREA_CATEGORIES.map((category, categoryIndex) => (
          <motion.button
            key={category.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: shouldReduceMotion ? 0 : categoryIndex * 0.04 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => onSelectCategory(category)}
            style={{
              display: 'inline-flex', alignItems: 'flex-start', gap: '0.45rem', padding: '0.7rem 0.8rem',
              borderRadius: 'var(--app-radius-md)',
              border: category.id === pillar.category ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
              background: category.id === pillar.category ? 'var(--app-bg2)' : '#fff',
              boxShadow: 'var(--app-shadow-sm)', cursor: 'pointer', fontSize: '0.76rem', color: 'var(--app-text)',
              fontFamily: "'General Sans',sans-serif", textAlign: 'left', maxWidth: 260,
            }}
          >
            <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', flexShrink: 0 }}>
              <PillarGlyph code={category.id} size={15} />
            </span>
            <span style={{ display: 'grid', gap: '0.15rem' }}>
              <span style={{ fontWeight: 700 }}>{category.name}</span>
              <span style={{ fontSize: '0.7rem', lineHeight: 1.45, color: 'var(--app-muted)' }}>{category.details}</span>
            </span>
          </motion.button>
        ))}
        <motion.button
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: shouldReduceMotion ? 0 : FOCUS_AREA_CATEGORIES.length * 0.04 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={selectCustomCategory}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.7rem 0.8rem',
            borderRadius: 'var(--app-radius-md)',
            border: pillar.category == null ? '1px solid var(--app-accent)' : '1.5px dashed var(--app-border)',
            background: pillar.category == null ? 'var(--app-bg2)' : '#fff',
            boxShadow: 'var(--app-shadow-sm)', cursor: 'pointer', fontSize: '0.76rem', color: 'var(--app-text)',
            fontFamily: "'General Sans',sans-serif", textAlign: 'left', maxWidth: 260,
          }}
        >
          <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: pillar.category == null ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'var(--app-bg2)', color: pillar.category == null ? '#fff' : 'var(--app-accent2)', flexShrink: 0 }}>
            {pillar.category == null ? <PillarGlyph code={pillar.emoji} size={15} /> : <Plus size={16} strokeWidth={2.4} />}
          </span>
          <span style={{ fontWeight: 700 }}>Add your own</span>
        </motion.button>
      </div>
    </div>
  )

  if (!isMobile) {
    return (
      <div id="vb-preset-panel" style={{ marginBottom: '0.95rem', display: 'flex', justifyContent: 'center' }}>
        {body}
      </div>
    )
  }

  return createPortal(
    <>
      <motion.div
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: shouldReduceMotion ? 0.12 : 0.2 }}
        style={{ position: 'fixed', inset: 0, zIndex: 900, background: 'rgba(20,10,15,0.4)' }}
      />
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        animate={shouldReduceMotion ? { opacity: 1 } : { y: 0 }}
        exit={shouldReduceMotion ? { opacity: 0 } : { y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 901 }}
      >
        {body}
      </motion.div>
    </>,
    document.body,
  )
}

function freshPillar(emoji = 'NP', name = 'New Pillar', category = null) {
  return {
    id: uid(), emoji, name, category,
    visionStyle: 'transformation',
    beforeImage: null, afterImage: null,
    beforeState: '', beforeDesc: '',
    afterState: '', afterDesc: '',
    resources: [''], activities: [''],
    outputs: [''], weeklyActions: [''],
    shortOutcome: '', longOutcome: '',
    planGeneratedFrom: '',
    planGenerationTier: 'free',
    planGenerationCount: 0,
    planWasEdited: false,
    collapsed: false,
  }
}

function freshPhase(n) {
  const quarterMeta = getQuarterDates(`Q${n}`)
  const distributedWindow = buildDefaultPhaseWindow(n - 1, PHASES_PER_YEAR)
  return {
    id: uid(), name: `Phase ${n}`, period: quarterMeta.period,
    startDate: distributedWindow.startDate, endDate: distributedWindow.endDate,
    timeframeLabel: formatMonthRange(distributedWindow.startDate, distributedWindow.endDate),
    affirmation: 'I am becoming who I was always meant to be.',
    pillars: [
      freshPillar('HF', 'Health & Fitness', 'HF'),
      freshPillar('CB', 'Career & Business', 'CB'),
    ],
    impact: 'Write your ultimate transformation for this phase.',
    reviewWorked: '', reviewDrained: '', reviewPaid: '', reviewStrategy: '',
    futureMessage: '',
    futureMessageDate: '',
  }
}

function getBoardStorageKey(user) {
  const id = user?.id || user?.email || user?.user_metadata?.email || ''
  return id ? `phasr_vb:${id}` : 'phasr_vb'
}

function load(user) {
  try {
    const key = getBoardStorageKey(user)
    const scoped = localStorage.getItem(key)
    if (scoped) return JSON.parse(scoped)
    const legacy = localStorage.getItem('phasr_vb')
    if (legacy) {
      const parsed = JSON.parse(legacy)
      localStorage.setItem(key, JSON.stringify(parsed))
      return parsed
    }
    return null
  } catch {
    return null
  }
}

const RECENT_LOCAL_SAVE_WINDOW_MS = 30000

function wasSavedLocallyRecently(user) {
  try {
    const savedAt = Number(localStorage.getItem(`${getBoardStorageKey(user)}:savedAt`) || 0)
    return savedAt > 0 && Date.now() - savedAt < RECENT_LOCAL_SAVE_WINDOW_MS
  } catch {
    return false
  }
}

// Returns true if the save went through with images intact, false if the
// quota-exceeded fallback below had to strip them — the caller uses this to
// warn the user instead of letting photos silently vanish on next load.
function save(d, user) {
  const key = getBoardStorageKey(user)
  // Board hydration/one-time migration happens once, centrally, in
  // AppShell.jsx before this component ever mounts (see
  // lib/supabaseSync.js's hydrateAllFromSupabase) — this is just the
  // ongoing push half, mirroring every local board save to Supabase's
  // board_data table (replaces an earlier, never-verified attempt at this
  // that guessed at a `vision_boards` table/column shape and a user_id
  // that could fall back to an email address; RLS requires the real auth
  // uuid, which getBoardUserId's fallback chain did not guarantee).
  if (user?.id) pushBoardData(d)
  try {
    localStorage.setItem(key, JSON.stringify(d))
    try { localStorage.setItem(`${key}:savedAt`, String(Date.now())) } catch {}
    return true
  } catch {
    // Storage is full (usually base64 images). Strip images and retry so text/plans still persist.
    try {
      const stripped = {
        ...d,
        phases: (d.phases || []).map(ph => ({
          ...ph,
          pillars: (ph.pillars || []).map(pl => ({
            ...pl,
            beforeImage: null,
            afterImage: null,
          })),
        })),
      }
      localStorage.setItem(key, JSON.stringify(stripped))
      try { localStorage.setItem(`${key}:savedAt`, String(Date.now())) } catch {}
      console.warn('[Phasr] Board saved without images (storage quota reached).')
    } catch (e2) {
      console.warn('[Phasr] Board save failed even without images:', e2)
    }
    return false
  }
}

const MAX_PILLAR_LIMIT = 5
// Shared subgrid row tracks pillar cards snap their sections to, so Resources/Weekly
// Non-Negotiables/Activities/Outcome line up across pillars regardless of content length:
// header, photo slots, generate-plan button, divider, resources, weekly, activities, outcome.
const PILLAR_ROW_COUNT = 7
// Not a tier limit — just the default assumption for splitting a year's worth
// of dates across phases (quarters) when a new phase needs a default window.
const PHASES_PER_YEAR = 4
const TODO_STATE_KEY = 'phasr_daily_todo_state'
// Hard ceiling on the source file picked from disk/camera roll, before it's
// downscaled — not the stored size. A phone camera photo (commonly 3-8MB) is
// well under this; it exists only to stop a pathological file from hanging the browser.
const MAX_UPLOAD_SOURCE_FILE_BYTES = 20 * 1024 * 1024
const MAX_UPLOAD_WIDTH = 2400
const MAX_UPLOAD_HEIGHT = 2400

const PLAN_EDIT_KEYS = new Set(['resources', 'activities', 'weeklyActions', 'outputs', 'shortOutcome', 'longOutcome'])

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

function normalizeFocusAreaName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getFocusAreaTerritory(name) {
  const normalized = normalizeFocusAreaName(name)
  const map = {
    'health and fitness': FOCUS_AREA_TERRITORY['Health and Fitness'],
    'career and business': FOCUS_AREA_TERRITORY['Career and Business'],
    wealth: FOCUS_AREA_TERRITORY.Wealth,
    relationships: FOCUS_AREA_TERRITORY.Relationships,
    'inner life': FOCUS_AREA_TERRITORY['Inner Life'],
    'personal growth': FOCUS_AREA_TERRITORY['Personal Growth'],
    travel: FOCUS_AREA_TERRITORY.Travel,
  }
  return map[normalized] || null
}

function getFocusAreaKnowledge(name) {
  const normalized = normalizeFocusAreaName(name)
  const map = {
    'health and fitness': FOCUS_AREA_KNOWLEDGE['Health & Fitness'],
    'career and business': FOCUS_AREA_KNOWLEDGE['Career & Business'],
    wealth: FOCUS_AREA_KNOWLEDGE['Wealth & Finance'],
    relationships: FOCUS_AREA_KNOWLEDGE.Relationships,
    'inner life': FOCUS_AREA_KNOWLEDGE['Inner Life'],
    'personal growth': FOCUS_AREA_KNOWLEDGE['Personal Growth'],
  }
  return map[normalized] || null
}

function getWeekStartDate(date = new Date()) {
  const next = new Date(date)
  const diff = (next.getDay() + 6) % 7
  next.setDate(next.getDate() - diff)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + (Number(days) || 0))
  return next
}

const NON_NEGOTIABLE_DAY_OFFSETS = [0, 1, 2, 3] // Mon, Tue, Wed, Thu

// The Monday of the current week is the right anchor most of the week, but
// once "today" is already past the last offset day (Thursday), every
// assigned date would land in the past — scheduling a non-negotiable for a
// day that's already gone. Roll forward to next week's Monday in that case,
// so a plan generated on a Friday/Saturday/Sunday always schedules into days
// that haven't happened yet.
function getNonNegotiableWindowStart(now = new Date()) {
  const weekStart = getWeekStartDate(now)
  const lastOffsetDay = addDays(weekStart, NON_NEGOTIABLE_DAY_OFFSETS[NON_NEGOTIABLE_DAY_OFFSETS.length - 1])
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return today > lastOffsetDay ? addDays(weekStart, 7) : weekStart
}

function getCalendarUrl(taskText, pillarName, weekStartDate, dayIndex) {
  const taskDate = new Date(weekStartDate)
  taskDate.setDate(taskDate.getDate() + dayIndex)

  // Set event time to 9am on that day
  taskDate.setHours(9, 0, 0, 0)
  const endDate = new Date(taskDate)
  endDate.setHours(10, 0, 0, 0)

  // Format for Google Calendar: YYYYMMDDTHHmmss
  function fmt(date) {
    return date.getFullYear().toString()
      + String(date.getMonth() + 1).padStart(2, '0')
      + String(date.getDate()).padStart(2, '0') + 'T'
      + String(date.getHours()).padStart(2, '0')
      + String(date.getMinutes()).padStart(2, '0') + '00'
  }

  const title = encodeURIComponent(`PHASR: ${taskText}`)
  const details = encodeURIComponent(
    `Your weekly non-negotiable from PHASR.\n\nPillar: ${pillarName}\n\nOpen PHASR to log your completion.`
  )
  const dates = `${fmt(taskDate)}/${fmt(endDate)}`

  // Add reminder via crm parameter (30 min before)
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&crm=ALERT`
}

function getActiveUserId(user) {
  return user?.id || user?.email || user?.user_metadata?.email || localStorage.getItem('phasr_active_user') || ''
}

function getTodayKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getHistoryStorageKey(userId, pillarName) {
  const cleanUser = String(userId || '').trim()
  const cleanPillar = String(pillarName || '').trim()
  return `phasr_pillar_history:${cleanUser || 'guest'}:${cleanPillar || 'pillar'}`
}

function getScheduleStorageKey({ userId, phaseId, pillarId, weekStartKey }) {
  const cleanUser = String(userId || '').trim() || 'guest'
  const cleanPhase = String(phaseId || '').trim() || 'phase'
  const cleanPillar = String(pillarId || '').trim() || 'pillar'
  const cleanWeek = String(weekStartKey || '').trim() || 'week'
  return `phasr_non_negotiable_schedule:${cleanUser}:${cleanPhase}:${cleanPillar}:${cleanWeek}`
}

function loadNonNegotiableSchedule({ userId, phaseId, pillarId, weekStartKey }) {
  const key = getScheduleStorageKey({ userId, phaseId, pillarId, weekStartKey })
  return safeJsonParse(localStorage.getItem(key), {})
}

function saveNonNegotiableSchedule({ userId, phaseId, pillarId, weekStartKey }, value) {
  const key = getScheduleStorageKey({ userId, phaseId, pillarId, weekStartKey })
  localStorage.setItem(key, JSON.stringify(value || {}))
}

function hasScheduledNonNegotiable({ userId, phaseId, pillars, weekStartKey }) {
  if (!userId || !phaseId || !weekStartKey) return false
  return (Array.isArray(pillars) ? pillars : []).some(pillar => {
    const schedule = loadNonNegotiableSchedule({ userId, phaseId, pillarId: pillar?.id, weekStartKey })
    return Object.values(schedule || {}).some(item => item?.scheduled && item?.assignedDate)
  })
}

function buildCheckinScope(phase) {
  const text = [
    phase?.id || '',
    phase?.name || '',
    phase?.startDate || '',
    phase?.endDate || '',
    ...(Array.isArray(phase?.pillars) ? phase.pillars.flatMap((pillar, index) => [
      pillar?.id || index,
      pillar?.name || '',
    ]) : []),
  ].join('|')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) hash = ((hash << 5) - hash + text.charCodeAt(i)) | 0
  return `${phase?.id || 'phase'}_${Math.abs(hash)}`
}

function getCurrentPhaseWeekIndex(phase, today = new Date()) {
  const weeks = getPhaseWeeks(phase)
  if (!weeks.length) return 1
  const todayKey = getTodayKey(today)
  const activeWeek = weeks.find(week => todayKey >= week.startDate && todayKey <= week.endDate)
  if (activeWeek) return activeWeek.index
  if (todayKey < weeks[0].startDate) return 1
  return weeks[weeks.length - 1]?.index || 1
}

function formatAssignedDateLabel(dateKey) {
  if (!dateKey) return ''
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function formatAssignedDateTooltip(dateKey) {
  if (!dateKey) return ''
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateKey
  }
}

function getGoogleCalendarDayViewUrl(dateKey) {
  if (!dateKey) return 'https://calendar.google.com/calendar/u/0/r'
  try {
    const date = new Date(`${dateKey}T12:00:00`)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `https://calendar.google.com/calendar/u/0/r/day/${yyyy}/${mm}/${dd}`
  } catch {
    return 'https://calendar.google.com/calendar/u/0/r'
  }
}

function loadPillarHistory(userId, pillarName) {
  const key = getHistoryStorageKey(userId, pillarName)
  return safeJsonParse(localStorage.getItem(key), [])
}

function savePillarHistory(userId, pillarName, entries) {
  const key = getHistoryStorageKey(userId, pillarName)
  localStorage.setItem(key, JSON.stringify(Array.isArray(entries) ? entries : []))
}

function formatPillarHistory(entries) {
  const list = Array.isArray(entries) ? entries : []
  return list
    .slice(0, 6)
    .map(week => {
      const weekNumber = Number(week?.weekNumber || 0) || ''
      const activities = Array.isArray(week?.activities) ? week.activities.filter(Boolean).join(', ') : ''
      const nonNegotiables = Array.isArray(week?.nonNegotiables) ? week.nonNegotiables.filter(Boolean).join(', ') : ''
      const reflections = Array.isArray(week?.reflections) ? week.reflections.filter(Boolean).join(' ') : String(week?.reflections || '').trim()
      return `Week ${weekNumber || '?'}: Activities: ${activities} Non-negotiables: ${nonNegotiables} Reflections: ${reflections}`.trim()
    })
    .filter(Boolean)
    .join('\n')
}

function computeBehaviorHint(lockInSummary) {
  const weeklyConsistency = Number(lockInSummary?.weeklyConsistency || 0) || 0
  if (weeklyConsistency >= 75) return 'progress → slightly increase difficulty (one small stretch), keep it realistic'
  if (weeklyConsistency >= 45) return 'mixed consistency → keep difficulty steady, remove friction'
  return 'inconsistency → simplify hard, fewer moving parts, focus on showing up'
}

async function getWebContextFromRag(query) {
  const ragUrl = import.meta.env.VITE_SAGE_RAG_URL || ''
  if (!ragUrl) return ''
  try {
    const res = await fetch(`${ragUrl.replace(/\/$/, '')}/api/sage/rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: String(query || '').trim(),
        system_prompt: 'Return only a compact list of 6-10 current real-world tool/app/resource suggestions relevant to the question. No filler. No disclaimers. One item per line.',
        messages: [],
        top_k: 6,
      }),
    })
    if (!res.ok) return ''
    const data = await res.json()
    const fromMatches = Array.isArray(data?.matches)
      ? data.matches
          .map(hit => hit?.fields?.text || hit?.metadata?.text || '')
          .filter(Boolean)
          .slice(0, 6)
          .join('\n')
      : ''
    const answer = String(data?.answer || '').trim()
    return [answer, fromMatches].filter(Boolean).join('\n').trim()
  } catch {
    return ''
  }
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function shortenText(value, maxChars = 96) {
  const text = cleanText(value)
  if (!text) return ''
  if (text.length <= maxChars) return text
  return `${text.slice(0, Math.max(0, maxChars - 1)).trim()}…`
}

function shortenList(items, limit = 3, maxChars = 34) {
  return compactList(items, limit).map(item => shortenText(item, maxChars))
}

function wrapSvgLines(text, maxChars = 26, maxLines = 4) {
  const words = cleanText(text).split(' ').filter(Boolean)
  if (!words.length) return ['']

  const lines = []
  let current = ''

  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length <= maxChars || !current) {
      current = next
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }

  if (current && lines.length < maxLines) lines.push(current)
  if (lines.length < words.length && lines.length) {
    lines[lines.length - 1] = shortenText(lines[lines.length - 1], maxChars)
  }
  return lines.slice(0, maxLines)
}

function compactList(items, limit) {
  return [...new Set(items.map(cleanText).filter(Boolean))].slice(0, limit)
}

function getExportSnapshot(pillar) {
  const description = shortenText(pillar?.afterDesc || pillar?.beforeDesc || pillar?.shortOutcome || pillar?.afterState || pillar?.name, 120)
  const focusAreas = shortenList(
    pillar?.outputs?.length ? pillar.outputs : pillar?.weeklyActions?.length ? pillar.weeklyActions : pillar?.activities,
    3,
    24,
  )
  const resources = shortenList(pillar?.resources, 2, 24)
  return {
    name: shortenText(pillar?.name || 'Focus Pillar', 36),
    beforeCaption: shortenText(pillar?.beforeState || pillar?.beforeDesc || 'Before', 42),
    afterCaption: shortenText(pillar?.afterState || pillar?.afterDesc || 'After', 42),
    description: description || 'This is your focus for the week.',
    focusAreas: focusAreas.length ? focusAreas : ['Main focus'],
    resources: resources.length ? resources : ['Resource list coming soon'],
    beforeImage: pillar?.beforeImage || '',
    afterImage: pillar?.afterImage || '',
  }
}

function buildExportMarkup(snapshot, boardTitle, qrUrl, brandUrl) {
  const resourceMarkup = snapshot.resources.map(label => `<span class="tag resource">${escapeHtml(label)}</span>`).join('')

  return `<!doctype html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${escapeHtml(snapshot.name)} - PHASR</title>
      <style>
        * { box-sizing: border-box; }
        body {
          margin: 0;
          font-family: 'DM Sans', Arial, sans-serif;
          background: #fff7fb;
          color: #42172b;
          padding: 28px;
        }
        .sheet {
          width: min(100%, 760px);
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #f3cad8;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 20px 48px rgba(209, 92, 132, 0.14);
        }
        .brand {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 18px;
          margin-bottom: 20px;
        }
        .brand img {
          width: 56px;
          height: 56px;
          object-fit: contain;
        }
        .brand h1 {
          margin: 0 0 4px;
          font-size: 1.4rem;
          color: #601d3b;
        }
        .brand p {
          margin: 0;
          font-size: 0.82rem;
          color: #8f6777;
        }
        .goal {
          font-size: 1rem;
          line-height: 1.6;
          margin: 0 0 18px;
          color: #6a3550;
        }
        .images {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .image-card {
          border-radius: 20px;
          overflow: hidden;
          background: #fff1f6;
          border: 1px solid #f4d5df;
        }
        .image-card img,
        .image-card .placeholder {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          display: block;
        }
        .placeholder {
          display: grid;
          place-items: center;
          color: #b26a88;
          font-weight: 700;
          background: linear-gradient(135deg, #ffe8f0, #fff7fb);
        }
        .caption {
          padding: 10px 12px 12px;
          font-size: 0.84rem;
          color: #7c4d63;
        }
        .section-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: #d44e7c;
          margin-bottom: 10px;
          font-weight: 800;
        }
        .tag-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-bottom: 18px;
        }
        .tag {
          display: inline-flex;
          align-items: center;
          min-height: 34px;
          padding: 0.42rem 0.86rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .resource {
          background: #fff7ea;
          color: #9a6734;
          border: 1px solid #f2ddb8;
        }
        .bottom {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 180px;
          gap: 18px;
          padding-top: 18px;
          border-top: 1px solid #f2d9e2;
        }
        .qr-wrap {
          display: grid;
          gap: 8px;
          justify-items: center;
          text-align: center;
        }
        .qr-wrap img {
          width: 110px;
          height: 110px;
          border-radius: 16px;
          border: 1px solid #f1d4de;
          background: #fff;
          padding: 8px;
        }
        .cta {
          display: inline-flex;
          min-height: 42px;
          align-items: center;
          justify-content: center;
          padding: 0.78rem 1rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #ef6b98, #d9487c);
          color: #fff;
          font-weight: 800;
          text-align: center;
        }
        .foot {
          margin-top: 16px;
          font-size: 0.78rem;
          color: #8f6777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="brand">
          <img src="${brandUrl}" alt="PHASR" />
          <div>
            <div class="section-label">Weekly export</div>
            <h1>PHASR</h1>
            <p>${escapeHtml(snapshot.name)}</p>
          </div>
        </div>
        <p class="goal">${escapeHtml(snapshot.description)}</p>
        <div class="images">
          <div class="image-card">
            ${snapshot.beforeImage ? `<img src="${snapshot.beforeImage}" alt="Before" />` : `<div class="placeholder">Before</div>`}
            <div class="caption">${escapeHtml(snapshot.beforeCaption)}</div>
          </div>
          <div class="image-card">
            ${snapshot.afterImage ? `<img src="${snapshot.afterImage}" alt="After" />` : `<div class="placeholder">After</div>`}
            <div class="caption">${escapeHtml(snapshot.afterCaption)}</div>
          </div>
        </div>
        <div class="section-label">Resources</div>
        <div class="tag-row">${resourceMarkup}</div>
        <div class="bottom">
          <div>
            <div class="cta">Update your progress inside PHASR</div>
          </div>
          <div class="qr-wrap">
            <img src="${qrUrl}" alt="QR code" />
            <div>Check in daily with Sage to build momentum</div>
          </div>
        </div>
        <div class="foot">This plan is valid for one week. Create your next phase inside PHASR.</div>
      </div>
    </body>
  </html>`
}

function buildExportSvg(snapshot, qrUrl, brandUrl) {
  const descriptionLines = wrapSvgLines(snapshot.description, 28, 4)
  const resources = snapshot.resources.slice(0, 2)

  const chip = (label, x, y, fill, stroke, textColor) => `
    <g transform="translate(${x} ${y})">
      <rect width="184" height="38" rx="19" fill="${fill}" stroke="${stroke}" />
      <text x="92" y="24" text-anchor="middle" font-size="15" font-family="Arial, sans-serif" font-weight="700" fill="${textColor}">${escapeHtml(label)}</text>
    </g>`

  const resourceMarkup = resources.map((label, index) => chip(label, 70 + ((index % 2) * 206), 860 + (Math.floor(index / 2) * 52), '#fff7ea', '#f2ddb8', '#9a6734')).join('')
  const descriptionMarkup = descriptionLines.map((line, index) => `<text x="70" y="${150 + (index * 40)}" font-size="32" font-family="Arial, sans-serif" font-weight="700" fill="#5c1a39">${escapeHtml(line)}</text>`).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="#fff7fb" />
    <rect x="40" y="40" width="1000" height="1270" rx="34" fill="#ffffff" stroke="#f3cad8" />
    <image href="${brandUrl}" x="70" y="68" width="56" height="56" />
    <text x="70" y="88" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#d44e7c" letter-spacing="2">WEEKLY EXPORT</text>
    <text x="140" y="96" font-size="32" font-family="Arial, sans-serif" font-weight="700" fill="#7a2a4a">PHASR</text>
    <text x="140" y="126" font-size="22" font-family="Arial, sans-serif" fill="#8f6777">${escapeHtml(snapshot.name)}</text>
    ${descriptionMarkup}
    <rect x="70" y="290" width="430" height="300" rx="28" fill="#fff1f6" stroke="#f4d5df" />
    <rect x="580" y="290" width="430" height="300" rx="28" fill="#fff1f6" stroke="#f4d5df" />
    ${snapshot.beforeImage ? `<image href="${snapshot.beforeImage}" x="70" y="290" width="430" height="240" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 28px 28px 0 0)" />` : ''}
    ${snapshot.afterImage ? `<image href="${snapshot.afterImage}" x="580" y="290" width="430" height="240" preserveAspectRatio="xMidYMid slice" clip-path="inset(0 round 28px 28px 0 0)" />` : ''}
    ${!snapshot.beforeImage ? `<text x="285" y="430" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#b26a88">Before</text>` : ''}
    ${!snapshot.afterImage ? `<text x="795" y="430" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="700" fill="#b26a88">After</text>` : ''}
    <text x="90" y="565" font-size="20" font-family="Arial, sans-serif" fill="#7c4d63">${escapeHtml(snapshot.beforeCaption)}</text>
    <text x="600" y="565" font-size="20" font-family="Arial, sans-serif" fill="#7c4d63">${escapeHtml(snapshot.afterCaption)}</text>
    <text x="70" y="820" font-size="18" font-family="Arial, sans-serif" font-weight="700" fill="#d44e7c" letter-spacing="2">RESOURCES</text>
    ${resourceMarkup}
    <rect x="70" y="1088" width="220" height="220" rx="24" fill="#fff" stroke="#f1d4de" />
    <image href="${qrUrl}" x="100" y="1118" width="160" height="160" />
    <text x="180" y="1290" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#6c5361">Check in daily with Sage</text>
    <text x="180" y="1316" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#6c5361">to build momentum</text>
    <rect x="350" y="1148" width="620" height="70" rx="35" fill="url(#ctaGradient)" />
    <text x="660" y="1191" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#fff">Update your progress inside PHASR</text>
    <text x="540" y="1278" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#8f6777">This plan is valid for one week. Create your next phase inside PHASR.</text>
    <defs>
      <linearGradient id="ctaGradient" x1="0%" x2="100%" y1="0%" y2="100%">
        <stop offset="0%" stop-color="#ef6b98" />
        <stop offset="100%" stop-color="#d9487c" />
      </linearGradient>
    </defs>
  </svg>`
}

function downloadTextFile(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 400)
}

async function fetchAsDataUrl(url) {
  if (!url) return ''
  if (url.startsWith('data:')) return url
  const response = await fetch(url)
  const blob = await response.blob()
  return await new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

function loadRemoteScript(src, readyCheck) {
  if (typeof window === 'undefined') return Promise.resolve()
  if (readyCheck?.()) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.src = src
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.body.appendChild(script)
  })
}

function rotateList(items, offset = 0) {
  const cleanItems = [...items]
  if (!cleanItems.length) return cleanItems
  const shift = ((offset % cleanItems.length) + cleanItems.length) % cleanItems.length
  return [...cleanItems.slice(shift), ...cleanItems.slice(0, shift)]
}

function getPlanDescription(pillar) {
  return [pillar.beforeDesc, pillar.afterDesc].map(cleanText).filter(Boolean).join(' | ') || cleanText(pillar?.name)
}

function hasCorePlanInputs(pillar) {
  const before = cleanText(pillar?.beforeState) || cleanText(pillar?.beforeDesc)
  const after = cleanText(pillar?.afterState) || cleanText(pillar?.afterDesc)
  return Boolean(before && after)
}

function hasVisualPlanInputs(pillar) {
  return hasCorePlanInputs(pillar) && Boolean(pillar?.beforeImage || pillar?.afterImage)
}

function getPlanSignature(pillar) {
  return [
    pillar.beforeState,
    pillar.afterState,
    getPlanDescription(pillar),
    pillar.beforeImage ? 'before-image' : '',
    pillar.afterImage ? 'after-image' : '',
  ].map(cleanText).join(' | ')
}

function isPlanBlank(pillar) {
  const listKeys = ['resources', 'activities', 'weeklyActions', 'outputs']
  const listEmpty = listKeys.every(key => !(pillar[key] || []).some(item => cleanText(item)))
  return listEmpty && !cleanText(pillar.shortOutcome) && !cleanText(pillar.longOutcome)
}

/* â"€â"€ Shared input styles â"€â"€ */
const inp = (extra = {}) => ({
  width: '100%', padding: '0.38rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'General Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  marginBottom: '0.28rem', transition: 'border-color 0.2s',
  ...extra,
})
const ta = (extra = {}) => ({
  width: '100%', padding: '0.4rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'General Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  resize: 'vertical', minHeight: 56, lineHeight: 1.5,
  transition: 'border-color 0.2s', ...extra,
})
const focus = e => { e.target.style.borderColor = 'var(--app-accent)' }
const blur  = e => { e.target.style.borderColor = 'var(--app-border)' }

export default function VisionBoard({ user, lockInSummary, editing: editingProp, onEditingChange, onOpenDailyStreak, autoOpenQuarterlyReviewPhaseId = null, onQuarterlyReviewOpened }) {
  const activeUserId = getActiveUserId(user)
  const weekStartKey = useMemo(() => getTodayKey(getWeekStartDate(new Date())), [])

  const [data, setData] = useState(() => {
    const saved = load(user)
    const board = normalizeBoardData(saved || { boardTitle: 'My Vision Board', phases: [freshPhase(1)] })
    if (!saved) {
      try {
        const onboardingPillars = JSON.parse(localStorage.getItem('phasr_onboarding_pillars') || 'null')
        const letter = JSON.parse(localStorage.getItem('phasr_future_letter_p1') || 'null')
        const boardType = localStorage.getItem('phasr_onboarding_board_type') || 'transformation'
        if (onboardingPillars?.length && board.phases[0]) {
          board.phases[0].pillars = onboardingPillars.slice(0, 6).map((entry, i) => {
            // Onboarding writes { category, name, emoji } objects now; guard the
            // old plain-string shape too in case a stale draft is still in localStorage.
            const item = typeof entry === 'string' ? { name: entry, category: null, emoji: null } : entry
            return normalizePillarShape({
              id: `pillar-${i + 1}`,
              name: item.name,
              category: item.category,
              emoji: item.emoji || item.category || 'NP',
              visionStyle: boardType,
            })
          })
        }
        if (letter && board.phases[0]) {
          board.phases[0].futureMessage = letter.message || ''
          board.phases[0].futureMessageDate = letter.date || ''
        }
        localStorage.removeItem('phasr_onboarding_pillars')
        localStorage.removeItem('phasr_future_letter_p1')
        localStorage.removeItem('phasr_onboarding_board_type')
      } catch {}
    }
    return board
  })
  const [phaseId,    setPhaseId]    = useState(() => normalizeBoardData(load(user) || { phases: [freshPhase(1)] }).phases[0]?.id)
  const [editingState, setEditingState] = useState(false)
  const [checked,    setChecked]    = useState({})
  const [presetOpen, setPresetOpen] = useState(null)
  const [timelineEditorPhaseId, setTimelineEditorPhaseId] = useState(null)
  const [timelineDrafts, setTimelineDrafts] = useState({})
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [calendarPromptState, setCalendarPromptState] = useState('hidden')
  const [calendarPromptArmed, setCalendarPromptArmed] = useState(false)
  const [calendarBannerMounted, setCalendarBannerMounted] = useState(false)
  const [showSavePopup, setShowSavePopup] = useState(false)
  const [scheduleRefresh, setScheduleRefresh] = useState(0)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [revealedDeleteTarget, setRevealedDeleteTarget] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')
  const [generatingPillarId, setGeneratingPillarId] = useState(null)
  const [selectedExportPillarId, setSelectedExportPillarId] = useState(null)
  const [exportNotice, setExportNotice] = useState('')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStage, setExportStage] = useState('picker')
  const [exportBusy, setExportBusy] = useState(false)
  const [exportScriptsReady, setExportScriptsReady] = useState(false)
  const exportCardRef = useRef(null)
  const qrCodeRef = useRef(null)
  const editing = editingProp ?? editingState
  const setEditing = onEditingChange ?? setEditingState
  const scheduleSnapshotRef = useRef(null)

  useEffect(() => {
    setPresetOpen(null)
  }, [editing])

  useEffect(() => {
    // Supabase hydration runs in the background (see AppShell) and can land
    // after this component already mounted from local cache. This quietly
    // folds in whatever it pulled down — a plain setState on the already-
    // mounted board, not a remount, so nothing here re-animates or flashes.
    //
    // Guarded by a recent-local-save check: the push half of the sync (see
    // save() below) is fire-and-forget, so a hydrate pull can land — even on
    // a fresh page load right after a refresh — before a very recent local
    // edit (e.g. a photo upload) has actually reached Supabase. Without this
    // guard, that pull fetches the still-old server copy and overwrites the
    // correct just-edited local data with it, which is exactly what made a
    // freshly-uploaded photo vanish on refresh. If this device saved locally
    // in roughly the last half-minute, its copy is trusted over the pull —
    // the async push already keeps Supabase converging toward it regardless.
    function refreshFromHydrate() {
      if (wasSavedLocallyRecently(user)) return
      const saved = load(user)
      if (saved) setData(normalizeBoardData(saved))
    }
    window.addEventListener('phasr-hydrated', refreshFromHydrate)
    return () => window.removeEventListener('phasr-hydrated', refreshFromHydrate)
  }, [user])


  useEffect(() => {
    if (!uploadMessage) return undefined
    const timer = window.setTimeout(() => setUploadMessage(''), 3600)
    return () => window.clearTimeout(timer)
  }, [uploadMessage])

  useEffect(() => {
    if (!exportNotice) return undefined
    const timer = window.setTimeout(() => setExportNotice(''), 3600)
    return () => window.clearTimeout(timer)
  }, [exportNotice])

  useEffect(() => {
    if (!showExportModal) return undefined
    let cancelled = false
    Promise.all([
      loadRemoteScript('https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js', () => Boolean(window.QRCode)),
      loadRemoteScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', () => Boolean(window.html2canvas)),
    ]).then(() => {
      if (!cancelled) setExportScriptsReady(true)
    }).catch(() => {
      if (!cancelled) setExportScriptsReady(false)
    })
    return () => {
      cancelled = true
    }
  }, [showExportModal])

  useEffect(() => {
    if (!editing) setTimelineEditorPhaseId(null)
  }, [editing])

  useEffect(() => {
    if (!showExportModal) {
      setExportStage('picker')
      setSelectedExportPillarId(null)
      return
    }
    setExportNotice('')
  }, [showExportModal])

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const refreshScheduleState = () => setScheduleRefresh(value => value + 1)
    window.addEventListener('phasr-nonnegotiable-schedule-updated', refreshScheduleState)
    return () => window.removeEventListener('phasr-nonnegotiable-schedule-updated', refreshScheduleState)
  }, [])

  useEffect(() => {
    // Quarterly Review now lives in the Review nav feature, not under the pillar.
    // This trigger (from Daily Checkin's "review this phase" action) just switches
    // to the target phase here; it no longer opens an in-page review panel.
    if (!autoOpenQuarterlyReviewPhaseId) return

    const targetPhase = data.phases?.find(item => item.id === autoOpenQuarterlyReviewPhaseId)
    if (targetPhase) {
      setPhaseId(autoOpenQuarterlyReviewPhaseId)
      upd(next => {
        next.activePhaseId = autoOpenQuarterlyReviewPhaseId
        return next
      })
    }

    onQuarterlyReviewOpened?.()
  }, [autoOpenQuarterlyReviewPhaseId, data.phases, onQuarterlyReviewOpened])

  function upd(fn) {
    setData(prev => {
      const next = normalizeBoardData(fn(JSON.parse(JSON.stringify(prev))))
        const savedWithImages = save(next, user)
        if (!savedWithImages) {
          setUploadMessage('Your board is too full to keep all photos saved on this device — the newest one may not survive a refresh. Try removing an older photo.')
        }
        return next
      })
  }

  useEffect(() => {
    setData(prev => {
      const next = normalizeBoardData(prev)
      if (JSON.stringify(next) === JSON.stringify(prev)) return prev
        save(next, user)
        return next
      })
  }, [])

  const phase    = data.phases.find(p => p.id === phaseId) || data.phases[0]
  const timelineEditorPhase = data.phases.find(p => p.id === timelineEditorPhaseId) || null
  const presetPillar = phase?.pillars?.find(pl => pl.id === presetOpen) || null
  // Free tier limits how many NEW pillars you can add (see addPillar's own
  // limit check below) — it does not hide pillars you've already added and
  // kept. A saved-but-not-yet-filled-in pillar stays visible until she
  // deletes it herself.
  const visiblePillars = phase?.pillars || []
  const currentPhaseNumber = Math.max(1, data.phases.findIndex(p => p.id === phase?.id) + 1)
  const phaseDisplayName = `Phase ${currentPhaseNumber}`
  const exportPillars = phase?.pillars || []
  const selectedExportPillar = exportPillars.find(item => item.id === selectedExportPillarId) || null
  const exportPhaseLabel = `${phaseDisplayName} · W1`
  const openCount = phase?.pillars?.filter(p => !p.collapsed).length || 0

  useEffect(() => {
    if (!exportPillars.length) {
      setSelectedExportPillarId(null)
      return
    }
    if (selectedExportPillarId && exportPillars.some(item => item.id === selectedExportPillarId)) return
    setSelectedExportPillarId(null)
  }, [exportPillars, selectedExportPillarId])

  useEffect(() => {
    if (!showExportModal || exportStage !== 'card' || !selectedExportPillar || !exportScriptsReady || !qrCodeRef.current || !window.QRCode) return
    qrCodeRef.current.innerHTML = ''
    new window.QRCode(qrCodeRef.current, {
      text: typeof window !== 'undefined' ? `${window.location.origin}` : 'https://phasr.app',
      width: 80,
      height: 80,
      colorDark: '#1a0a10',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    })
  }, [showExportModal, exportStage, selectedExportPillar, exportScriptsReady])

  /* â"€â"€ Mutations â"€â"€ */
  const updatePhase = (key, val) => upd(d => {
    const ph = d.phases.find(p => p.id === phaseId)
    if (ph) {
      ph[key] = val
      if (key === 'period') {
        const quarterMeta = getQuarterDates(val)
        ph.period = quarterMeta.period
      }
      if (key === 'startDate' || key === 'endDate') {
        const startDate = key === 'startDate' ? val : ph.startDate
        const endDate = key === 'endDate' ? val : ph.endDate
        ph.timeframeLabel = formatMonthRange(startDate, endDate)
      }
    }
    return d
  })
  const updatePillar = (plId, key, val) => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (pl) {
      pl[key] = val
      if (PLAN_EDIT_KEYS.has(key)) pl.planWasEdited = true
    }
    return d
  })
  const updateArr    = (plId, key, idx, val) => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (pl) {
      pl[key][idx] = val
      if (PLAN_EDIT_KEYS.has(key)) pl.planWasEdited = true
    }
    return d
  })
  const addArr       = (plId, key) => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (pl) {
      pl[key].push('')
      if (PLAN_EDIT_KEYS.has(key)) pl.planWasEdited = true
    }
    return d
  })
  const delArr       = (plId, key, idx) => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (pl && pl[key].length > 1) {
      pl[key].splice(idx, 1)
      if (PLAN_EDIT_KEYS.has(key)) pl.planWasEdited = true
    }
    return d
  })

  function toggleCollapse(plId) {
    upd(d => {
      const ph = d.phases.find(p => p.id === phaseId)
      const pl = ph?.pillars.find(p => p.id === plId)
      if (!pl) return d
      if (pl.collapsed && openCount >= 3) {
        const first = ph.pillars.find(p => !p.collapsed && p.id !== plId)
        if (first) first.collapsed = true
      }
      pl.collapsed = !pl.collapsed
      return d
    })
  }

  const addPillar  = () => {
    // No free/pro split — monetization was cut, and the old isPro/access-tier
    // system (lib/access.js, deleted) had no working paid plan behind it
    // anyway. MAX_PILLAR_LIMIT stays as a sane UI cap for everyone, not a paywall.
    if ((phase?.pillars?.length || 0) >= MAX_PILLAR_LIMIT) return
    upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph) ph.pillars.push(freshPillar()); return d })
  }
  const delPillar  = (plId) => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph && ph.pillars.length > 1) ph.pillars = ph.pillars.filter(p => p.id !== plId); return d })
  const forceGeneratePlan = async (plId, options = {}) => {
    console.log('[Sage Plan] forceGeneratePlan called. plId:', plId, 'phaseId:', phaseId)
    const targetPhase = data.phases.find(p => p.id === phaseId)
    const targetPillar = targetPhase?.pillars.find(p => p.id === plId)
    console.log('[Sage Plan] targetPillar found:', Boolean(targetPillar), targetPillar?.name)
    if (!targetPillar) {
      console.error('[Sage Plan] No targetPillar found for plId:', plId, 'in phaseId:', phaseId)
      return
    }
    const isDestination = targetPillar.visionStyle === 'destination'
    const afterOk = cleanText(targetPillar.afterState) || cleanText(targetPillar.afterDesc)
    const beforeOk = isDestination ? true : (cleanText(targetPillar.beforeState) || cleanText(targetPillar.beforeDesc))
    console.log('[Sage Plan] beforeOk:', Boolean(beforeOk), 'afterOk:', Boolean(afterOk))
    if (!beforeOk || !afterOk) {
      setUploadMessage(isDestination ? 'Add a description first, then generate your plan.' : 'Add your Before and After details first, then generate your plan.')
      return
    }

    setGeneratingPillarId(plId)
    setUploadMessage('Sage is generating your plan...')
    if (isMobile) {
      const el = document.getElementById('vb-status-message')
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
    try {
      // The territory/knowledge lock has to key off the system category, not her
      // free-text name — otherwise a pillar called "Escape the 9-5" would silently
      // lose Sage's Career & Business guardrails. Her own name still gets threaded
      // into the prompt below so the plan reads as personal, not generic.
      const focusAreaLabel = getFocusAreaLabel(targetPillar.category) || String(targetPillar.name || '').trim()
      const territory = getFocusAreaTerritory(focusAreaLabel)
      const covers = territory?.covers || ''
      const knowledge = getFocusAreaKnowledge(focusAreaLabel)
      const knowledgeBlock = knowledge
        ? [
            knowledge.resources?.length ? `Knowledge resources examples:\n- ${knowledge.resources.join('\n- ')}` : '',
            knowledge.activities?.length ? `Knowledge daily activity examples:\n- ${knowledge.activities.join('\n- ')}` : '',
            knowledge.nonNegotiables?.length ? `Knowledge weekly non-negotiable examples:\n- ${knowledge.nonNegotiables.join('\n- ')}` : '',
            knowledge.outcome ? `Knowledge outcome example:\n${knowledge.outcome}` : '',
          ].filter(Boolean).join('\n\n')
        : ''
      const userId = getActiveUserId(user)
      const systemPrompt = `You are Sage, an AI life coach inside PHASR. Your job is to generate a specific, personalized plan for a user based on their chosen focus area and their personal description of where they are and where they want to go.
CRITICAL RULE: You must stay strictly within the focus area provided. Never suggest activities, resources, or habits from a different focus area. If the focus area is Personal Growth, do not suggest gym workouts, meal plans, or physical fitness activities. If the focus area is Health and Fitness, do not suggest career advice or financial tips. Each focus area has defined territory and you must stay inside it.
Focus area territories:
	•	Health and Fitness: body, food, sleep, gym, energy, physical habits, nutrition, movement, recovery
	•	Career and Business: job search, entrepreneurship, income streams, professional skills, career strategy, building a business
	•	Wealth: savings, investing, debt reduction, budgeting, financial habits, money systems
	•	Relationships: love, family, friendships, community, communication, connection, boundaries
	•	Inner Life: spirituality, religion, mindfulness, mental health, reflection, emotional regulation, peace
	•	Personal Growth: learning, reading, creativity, self-development, skill building, knowledge, creative output
	•	Travel: trip planning, travel savings, destination research, booking, travel habits
The pillar tells you which territory you are in. The user’s description tells you specifically what they are working on within that territory. Use both together. The description is the most important input — read it carefully and make the plan specific to what they actually wrote, not a generic version of the focus area.
Generate:
	•	3 specific resources they need to achieve this goal — each must be a named app, tool, book, platform, or course. Examples: MyFitnessPal, Notion, Atomic Habits by James Clear, YNAB, Strava, Duolingo, Coursera, Insight Timer, YouTube channel name. Never list generic types like "a journal" or "a gym" without naming the specific product or title.
	•	3 to 4 daily activities that directly serve their goal and can be tracked as daily streaks
	•	3 to 4 weekly non-negotiables that build momentum toward the goal each week
	•	1 outcome statement describing what they will have achieved by the end of this phase
The daily activities must be concrete and actionable. Not vague like ‘work on your goal.’ Specific like ‘Read 20 pages of a skill-building book’ or ‘Write 300 words toward your creative project.’ They should be things a person can check off as done each day.
The weekly non-negotiables must be bigger than the daily activities but still achievable. They represent momentum markers — things that show the week moved the goal forward.
Return only valid JSON with these exact keys: resources as array of strings, activities as array of strings, weeklyNonNegotiables as array of strings, outcome as string. No explanation. No preamble. Just the JSON.`

      const originalGenerationPrompt = `Focus area: ${focusAreaLabel}
Territory for this focus area: ${covers}
User’s own name for this pillar: ${targetPillar.name}
User’s current state: ${targetPillar.beforeState} — ${targetPillar.beforeDesc}
User’s goal state: ${targetPillar.afterState} — ${targetPillar.afterDesc}
${knowledgeBlock ? `Reference knowledge for this focus area:
${knowledgeBlock}
Use this knowledge as supporting guidance, but only when it matches this user’s actual description. Do not fall back to generic examples if the user’s words point somewhere more specific.
` : ''}Generate a plan that is specific to this focus area territory and this user’s personal description.`
      const isRegenerate = options?.forceNewApproach
      const previousPlan = options?.previousPlan
      const userPrompt = isRegenerate
        ? `
You previously generated this plan for the user and they were not satisfied with it.

PREVIOUS PLAN THEY REJECTED:
Resources: ${Array.isArray(previousPlan?.resources) ? previousPlan.resources.join(', ') : ''}
Activities: ${Array.isArray(previousPlan?.activities) ? previousPlan.activities.join(', ') : ''}
Non-negotiables: ${Array.isArray(previousPlan?.weeklyNonNegotiables) ? previousPlan.weeklyNonNegotiables.join(', ') : ''}

DO NOT use any of the above. Do not reword them. Do not reorder them.
Find a completely different approach to the same goal.

User's pillar: ${targetPillar.name}
Their current state: ${targetPillar.beforeDesc}
Their goal: ${targetPillar.afterDesc}
Attempt number: ${options.attempt} — each attempt must be more different than the last.

Think about a completely different angle:
- If the last plan was routine-based, make this one milestone-based
- If the last plan was physical, make this one mental or environmental
- If the last plan was intensive, make this one minimal and sustainable
- If the last plan was solo, make this one community or accountability based

Return JSON only:
{
  "resources": ["...", "...", "..."],
  "activities": ["...", "...", "...", "..."],
  "weeklyNonNegotiables": ["...", "...", "...", "..."],
  "outcome": "..."
}
`
        : originalGenerationPrompt

      const validatePlan = (planValue) => {
        const resources = Array.isArray(planValue?.resources) ? planValue.resources.filter(Boolean) : []
        const activities = Array.isArray(planValue?.activities) ? planValue.activities.filter(Boolean) : []
        const nonNeg = Array.isArray(planValue?.weeklyNonNegotiables) ? planValue.weeklyNonNegotiables.filter(Boolean) : []
        const outcome = String(planValue?.outcome || '').trim()
        if (!resources.length || !activities.length || !nonNeg.length || !outcome) return { ok: false, reason: 'missing_fields' }

        const combined = [...resources, ...activities, ...nonNeg].map(item => String(item || '').trim()).filter(Boolean)

        const genericHits = combined.filter(item => /\b(stay consistent|keep it simple|be consistent|try your best|take it one day at a time)\b/i.test(item)).length
        if (genericHits >= 2) return { ok: false, reason: 'too_generic' }

        const normalizedFocus = normalizeFocusAreaName(focusAreaLabel)
        if (normalizedFocus === 'personal growth') {
          const hasFitnessLeak = combined.some(item => /\b(gym|workout|cardio|protein|calorie|lift|lifting|run|running|strength training)\b/i.test(item))
          if (hasFitnessLeak) return { ok: false, reason: 'cross_focus_fitness' }
        }

        return { ok: true, reason: '' }
      }

      console.log('[Sage Plan] Calling fetchPillarPlanWithGroq...')
      let plan = await fetchPillarPlanWithGroq({ systemPrompt, userPrompt })
      console.log('[Sage Plan] Raw plan from Groq:', plan)
      const firstCheck = validatePlan(plan)
      console.log('[Sage Plan] First validation:', firstCheck)
      if (!firstCheck.ok) {
        console.log('[Sage Plan] Validation failed:', firstCheck.reason, '— attempting repair...')
        const repairSystem = `${systemPrompt}\n\nValidation failed: ${firstCheck.reason}. Fix it. Return JSON only.`
        plan = await fetchPillarPlanWithGroq({ systemPrompt: repairSystem, userPrompt })
        console.log('[Sage Plan] Repair plan from Groq:', plan)
        const secondCheck = validatePlan(plan)
        console.log('[Sage Plan] Second validation:', secondCheck)
        if (!secondCheck.ok) {
          console.error('[Sage Plan] Both validation attempts failed. Reason:', secondCheck.reason)
          setUploadMessage('Sage plan error. Please try again.')
          return
        }
      }

      const result = {
        resources: plan.resources?.length ? plan.resources : [''],
        activities: plan.activities?.length ? plan.activities : [''],
        weeklyNonNegotiables: plan.weeklyNonNegotiables?.length ? plan.weeklyNonNegotiables : [''],
        outcome: plan.outcome || '',
      }

      try {
        const currentKey = `phasr_last_plan_${targetPillar.id}`
        // Clear stale plan keys for other pillars to free quota before saving
        Object.keys(localStorage)
          .filter(k => k.startsWith('phasr_last_plan_') && k !== currentKey)
          .forEach(k => localStorage.removeItem(k))
        localStorage.setItem(currentKey, JSON.stringify(result))
      } catch (e) {
        console.warn('[Sage Plan] localStorage quota exceeded — plan is in React state, skipping cache write.', e)
      }

      console.log('[Sage Plan] Writing plan to state. result:', result)
      upd(d => {
        const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
        if (!pl) {
          console.error('[Sage Plan] upd: pillar not found in state. phaseId:', phaseId, 'plId:', plId)
          return d
        }
        pl.planGenerationCount = Number(pl.planGenerationCount || 0) + 1
        pl.resources = result.resources
        pl.activities = result.activities
        pl.weeklyActions = result.weeklyNonNegotiables
        pl.outputs = ['']
        pl.shortOutcome = result.outcome
        pl.longOutcome = result.outcome
        pl.planGeneratedFrom = getPlanSignature(pl)
        pl.planGenerationTier = 'groq'
        pl.planWasEdited = false
        console.log('[Sage Plan] upd: pillar updated. resources:', pl.resources)
        return d
      })
      try {
        const history = loadPillarHistory(userId, targetPillar.name)
        const nextHistory = [
          {
            weekNumber: history.length + 1,
            generatedAt: new Date().toISOString(),
            regenerated: Boolean(options?.forceNewApproach),
            activities: plan.activities || [],
            nonNegotiables: plan.weeklyNonNegotiables || [],
            reflections: [],
            previousPlan: options?.previousPlan || null,
          },
          ...history,
        ].slice(0, 12)
        savePillarHistory(userId, targetPillar.name, nextHistory)
      } catch {
        // ignore history failures
      }

      setUploadMessage('Plan updated. Your progress stays.')
    } catch (error) {
      console.error('[Sage Plan] CAUGHT ERROR:', error?.message, error)
      const message = String(error?.message || '')
      setUploadMessage(
        message.includes('groq_network_error')
          ? 'Could not reach the server. Check your connection and try again.'
          : 'Sage could not generate a plan right now. Please try again in a moment.',
      )
    } finally {
      setGeneratingPillarId(null)
    }
  }
  function loadTodoState() {
    try {
      return JSON.parse(localStorage.getItem(TODO_STATE_KEY) || '{}')
    } catch {
      return {}
    }
  }

  function getTimelineDraft(phaseValue) {
    return timelineDrafts[phaseValue.id] || {
      startDate: phaseValue.startDate || '',
      endDate: phaseValue.endDate || '',
    }
  }

  function openTimelineEditor(targetPhase) {
    setTimelineDrafts(prev => ({
      ...prev,
      [targetPhase.id]: {
        startDate: targetPhase.startDate || '',
        endDate: targetPhase.endDate || '',
      },
    }))
    setTimelineEditorPhaseId(targetPhase.id)
  }

  function updateTimelineDraft(phaseKey, key, value) {
    setTimelineDrafts(prev => ({
      ...prev,
      [phaseKey]: {
        ...(prev[phaseKey] || {}),
        [key]: value,
      },
    }))
  }

  function saveTimelineDraft(phaseKey) {
    const draft = timelineDrafts[phaseKey]
    if (!draft?.startDate || !draft?.endDate) return
    upd(d => {
      const ph = d.phases.find(item => item.id === phaseKey)
      if (ph) {
        ph.startDate = draft.startDate
        ph.endDate = draft.endDate
        ph.timeframeLabel = formatMonthRange(draft.startDate, draft.endDate)
      }
      return d
    })
    setTimelineEditorPhaseId(null)
  }

  async function handleEditingToggle() {
    if (editing) {
      const pillarsToGenerate = (phase?.pillars || []).filter(pillar => {
        const isDestination = pillar?.visionStyle === 'destination'
        const hasRequiredDescription = isDestination
          ? Boolean(cleanText(pillar?.afterDesc))
          : Boolean(cleanText(pillar?.beforeDesc) && cleanText(pillar?.afterDesc))
        const hasPlan = Array.isArray(pillar?.activities) && pillar.activities.filter(Boolean).length > 0
        return hasRequiredDescription && !hasPlan
      })
      for (const pillar of pillarsToGenerate) {
        // Trigger the initial plan immediately once personalize data is saved.
        // eslint-disable-next-line no-await-in-loop
        await forceGeneratePlan(pillar.id, { forceNewApproach: false, attempt: 0 })
      }
      // "Schedule your week" only makes sense if there's actually something
      // dated to schedule — re-read after generation (forceGeneratePlan saves
      // through its own upd() calls, so the `phase` captured above is stale)
      // and only show the popup when a pillar really has weekly non-negotiables.
      const latestPhase = normalizeBoardData(load(user))?.phases?.find(item => item.id === phaseId)
      const hasSchedulableActions = (latestPhase?.pillars || []).some(pl =>
        Array.isArray(pl.weeklyActions) && pl.weeklyActions.some(action => cleanText(action))
      )
      // Once she's already scheduled this week, re-showing the popup on every
      // save (even when nothing schedulable changed) is noise — only surface
      // it again if the week/non-negotiables actually moved since she opened
      // the editor.
      const scheduleChanged = getScheduleFingerprint(latestPhase) !== scheduleSnapshotRef.current
      if (hasSchedulableActions && (!scheduledThisWeek || scheduleChanged)) {
        setCalendarPromptArmed(true)
        setShowSavePopup(true)
      }
      setEditing(false)
      return
    }
    setEditing(true)
  }

  const addPhase   = () => {
    upd(d => { const p = freshPhase(d.phases.length + 1); d.phases.push(p); setPhaseId(p.id); return d })
  }
  const delPhase   = (pid) => {
    if (data.phases.length <= 1) return
    upd(d => { d.phases = d.phases.filter(p => p.id !== pid); setPhaseId(d.phases[0].id); return d })
  }

  // Category picks the system-only category + default icon. Her display name is
  // edited separately in the same sheet, so this only overwrites `name` when it's
  // still whatever the previous category suggested (i.e. she hasn't customized it
  // yet) — a real custom name like "Escape the 9-5" survives switching categories.
  // `category` is null for "Add your own" — a focus area outside the six, where
  // Sage has no curated territory/knowledge and plans from her description alone.
  const applyFocusAreaCategory = (plId, category) => {
    upd(d => {
      const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
      if (!pl) return d
      const previousLabel = getFocusAreaLabel(pl.category)
      const nameIsDefault = !cleanText(pl.name) || pl.name === 'New Pillar' || pl.name === previousLabel
      pl.category = category?.id ?? null
      pl.emoji = category?.id ?? 'CU'
      if (nameIsDefault) pl.name = category?.name ?? ''
      return d
    })
  }

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  function logCalendarIntegration(status) {
    try {
      const key = 'phasr_calendar_integration_log'
      const raw = localStorage.getItem(key)
      const parsed = raw ? JSON.parse(raw) : {}
      const phase = data.phases.find(item => item.id === phaseId) || data.phases[0]
      parsed[phase?.id || 'phase-1'] = {
        phaseId: phase?.id || 'phase-1',
        phaseName: phase?.name || 'Phase 1',
        status,
        date: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(parsed))
    } catch {
      // ignore
    }
  }

  function formatGoogleDate(date) {
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}${mm}${dd}`
  }

  function buildWeeklyTaskLines(tasks) {
    return (tasks || [])
      .map(item => ({
        pillar: String(item?.pillar || '').trim(),
        task: String(item?.task || '').trim(),
      }))
      .filter(item => item.task)
      .map(item => item.pillar ? `${item.pillar}: ${item.task}` : item.task)
  }

  function downloadWeeklyTasksIcs(scheduledEntries) {
    const items = (scheduledEntries || []).map(item => ({
      pillar: String(item?.pillar || '').trim(),
      task: String(item?.task || '').trim(),
      assignedDateKey: String(item?.assignedDateKey || '').trim(),
    })).filter(item => item.task).slice(0, 4)

    const dtstamp = `${formatGoogleDate(new Date())}T000000Z`
    const uidBase = `phasr-weekly-${Date.now()}`

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//PHASR//Weekly Non-Negotiables//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
    ]

    items.forEach((entry, index) => {
      const startDate = entry.assignedDateKey
        ? new Date(`${entry.assignedDateKey}T09:00:00`)
        : new Date()
      const startOffsetMinutes = index * 20
      startDate.setMinutes(startDate.getMinutes() + startOffsetMinutes)
      const endDate = new Date(startDate)
      endDate.setMinutes(endDate.getMinutes() + 15)
      const startStamp = `${formatGoogleDate(startDate)}T${String(startDate.getHours()).padStart(2, '0')}${String(startDate.getMinutes()).padStart(2, '0')}00`
      const endStamp = `${formatGoogleDate(endDate)}T${String(endDate.getHours()).padStart(2, '0')}${String(endDate.getMinutes()).padStart(2, '0')}00`
      const title = `PHASR: ${entry.task}`
      const details = entry.pillar
        ? `Weekly non-negotiable (PHASR)\\n\\nPillar: ${entry.pillar}\\nTask: ${entry.task}`
        : `Weekly non-negotiable (PHASR)\\n\\nTask: ${entry.task}`

      lines.push(
        'BEGIN:VEVENT',
        `UID:${uidBase}-${index}@phasr`,
        `DTSTAMP:${dtstamp}`,
        `SUMMARY:${title.replace(/\n/g, ' ')}`,
        `DESCRIPTION:${details.replace(/\n/g, '\\n')}`,
         `DTSTART:${startStamp}`,
         `DTEND:${endStamp}`,
         'BEGIN:VALARM',
         'TRIGGER:-PT10M',
         'ACTION:DISPLAY',
         'DESCRIPTION:PHASR reminder',
         'END:VALARM',
         'END:VEVENT',
       )
    })

    lines.push('END:VCALENDAR')
    const ics = lines.join('\r\n')

    try {
      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'phasr-weekly-tasks.ics'
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      // ignore download failures
    }
  }

  async function addToCalendarPlan() {
    if (calendarBusy) return
    const tasks = weeklyPlan
    if (!tasks.length) {
      window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
        detail: {
          title: 'No tasks to sync',
          message: 'Add weekly non-negotiables first, then sync your calendar.',
        },
      }))
      return
    }

    setCalendarBusy(true)
    try {
      // NON_NEGOTIABLE_DAY_OFFSETS assumes offset 0 = Monday, so this window
      // must start on the actual Monday of the current week (rolling to next
      // week once today is already past Thursday, so nothing is scheduled
      // into a day that's already gone) — anchoring to "today" directly
      // mislabeled every scheduled day whenever today wasn't Monday.
      const windowStart = getNonNegotiableWindowStart()

      const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/i.test(navigator.userAgent || '')
      const userId = getActiveUserId(user)

      const scheduleTargets = []
      for (const pillar of (phase?.pillars || [])) {
        const list = Array.isArray(pillar?.weeklyActions) ? pillar.weeklyActions : []
        for (let actionIndex = 0; actionIndex < list.length; actionIndex += 1) {
          const text = String(list[actionIndex] || '').trim()
          if (!text) continue
          scheduleTargets.push({
            phaseId,
            pillarId: pillar.id,
            pillar: pillar.name,
            task: text,
            actionIndex,
          })
          if (scheduleTargets.length >= 4) break
        }
        if (scheduleTargets.length >= 4) break
      }

      const scheduledEntries = scheduleTargets.map((entry, index) => {
        const dayOffset = NON_NEGOTIABLE_DAY_OFFSETS[index] ?? 0
        const assignedDate = addDays(windowStart, dayOffset)
        const assignedDateKey = getTodayKey(assignedDate)
        return { ...entry, assignedDateKey, dayOffset, calendarUrl: getCalendarUrl(entry.task, entry.pillar, windowStart, index) }
      })

      const schedulePreview = scheduledEntries
        .map(entry => `${entry.assignedDateKey} - ${entry.task}`)
        .join('\n')
      const confirmed = window.confirm(`Schedule these weekly actions?\n\n${schedulePreview}`)
      if (!confirmed) return

      // Persist scheduled state into each pillar card so the UI updates immediately (no waiting for Calendar confirmation).
      scheduledEntries.forEach(entry => {
        if (!entry.pillarId || entry.actionIndex == null) return
        const scheduleStateKey = { userId, phaseId: entry.phaseId, pillarId: entry.pillarId, weekStartKey }
        const current = loadNonNegotiableSchedule(scheduleStateKey)
        current[String(entry.actionIndex)] = {
          scheduled: true,
          assignedDate: entry.assignedDateKey,
          calendarUrl: entry.calendarUrl,
          scheduledAt: new Date().toISOString(),
        }
        saveNonNegotiableSchedule(scheduleStateKey, current)
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('phasr-nonnegotiable-schedule-updated', { detail: { phaseId, weekStartKey } }))
      }

      // Mobile-first: generate a single .ics containing all 4 events so iOS shows "Add All".
      if (isMobile) {
        downloadWeeklyTasksIcs(scheduledEntries)
      } else {
        // Desktop: open each Google Calendar prefilled event (no downloads).
        scheduledEntries.forEach((entry, index) => {
          const url = entry.calendarUrl
          if (!url) return
          window.setTimeout(() => window.open(url, '_blank'), index * 250)
        })
      }

      window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
        detail: {
          title: 'Calendar events ready',
          message: isMobile
            ? 'Add the 4 scheduled non-negotiables to your calendar.'
            : 'Opened 4 pre-filled calendar events. Tap Save on each tab.',
        },
      }))
      logCalendarIntegration('integrated')
      setCalendarPromptState('hidden')
    } finally {
      setCalendarBusy(false)
    }

    window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
      detail: {
        title: 'Weekly check in',
        message: 'Every week Sage will check in with you. Your weekly reflection is part of your phase.',
      },
    }))
  }

  function closeCalendarPrompt() {
    logCalendarIntegration('skipped')
    window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
      detail: {
        title: 'Weekly check in',
        message: 'Every week Sage will check in with you. Your weekly reflection is part of your phase.',
      },
    }))
    setCalendarPromptState('hidden')
  }

  const uploadImg = (plId, slot) => {
    const i = document.createElement('input')
    i.type = 'file'
    i.accept = 'image/*'
    // Phone browsers (iOS Safari in particular) can fail to open the native
    // picker for a file input that was never attached to the document, so
    // this stays in the DOM (off-screen) for the duration of the pick.
    i.style.position = 'fixed'
    i.style.top = '-1000px'
    i.style.left = '-1000px'
    document.body.appendChild(i)
    const cleanup = () => { i.remove() }
    i.onchange = e => {
      const f = e.target.files[0]
      if (!f) { cleanup(); return }
      // A camera photo straight off a phone is routinely 3000-4000px and
      // several MB — this used to hard-reject that exact case. Instead of
      // rejecting, downscale to fit MAX_UPLOAD_WIDTH/HEIGHT and re-encode.
      if (f.size > MAX_UPLOAD_SOURCE_FILE_BYTES) {
        const sourceMb = (f.size / (1024 * 1024)).toFixed(1)
        setUploadMessage(`That photo is ${sourceMb}MB — try a standard photo instead of a Live Photo, video, or panorama.`)
        cleanup()
        return
      }
      const objectUrl = URL.createObjectURL(f)
      const probe = new Image()
      probe.onload = async () => {
        const toJpegDataUrl = (maxDim, quality) => {
          const scale = Math.min(1, maxDim / probe.naturalWidth, maxDim / probe.naturalHeight)
          const outWidth = Math.round(probe.naturalWidth * scale)
          const outHeight = Math.round(probe.naturalHeight * scale)
          const canvas = document.createElement('canvas')
          canvas.width = outWidth
          canvas.height = outHeight
          canvas.getContext('2d').drawImage(probe, 0, 0, outWidth, outHeight)
          return canvas.toDataURL('image/jpeg', quality)
        }
        const dataUrl = toJpegDataUrl(MAX_UPLOAD_WIDTH, 0.85)
        URL.revokeObjectURL(objectUrl)
        let finalUrl = null
        if (supabase) {
          setUploadMessage('Uploading…')
          try {
            const path = `visionboard/${activeUserId || 'local'}/${plId}-${slot}-${Date.now()}.jpg`
            const byteStr = atob(dataUrl.split(',')[1])
            const bytes = new Uint8Array(byteStr.length)
            for (let j = 0; j < byteStr.length; j++) bytes[j] = byteStr.charCodeAt(j)
            const { error: uploadError } = await supabase.storage
              .from('room-feed')
              .upload(path, new Blob([bytes], { type: 'image/jpeg' }), { contentType: 'image/jpeg', upsert: true })
            if (uploadError) throw uploadError
            const { data: urlData } = supabase.storage.from('room-feed').getPublicUrl(path)
            if (urlData?.publicUrl) finalUrl = urlData.publicUrl
          } catch (error) {
            console.warn('[Phasr] Vision board image storage upload failed, keeping photo local-only:', error?.message || error)
          }
        }
        if (!finalUrl) {
          // No Supabase storage URL — the photo still shows up for this user,
          // but it must stay small: this value rides inside the whole-board
          // JSON that syncs to Supabase, and a full-size embedded photo there
          // is what causes sync to hang on a slow connection.
          finalUrl = toJpegDataUrl(960, 0.6)
        }
        setUploadMessage('')
        updatePillar(plId, slot, finalUrl)
        cleanup()
      }
      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        setUploadMessage('This image could not be loaded. Please try a different image.')
        cleanup()
      }
      probe.src = objectUrl
    }
    i.click()
  }

  function openExportModal() {
    setShowExportModal(true)
    setExportStage('picker')
  }

  function closeExportModal() {
    setShowExportModal(false)
    setExportBusy(false)
  }

  function generateExportCard() {
    if (!selectedExportPillar) return
    setExportStage('card')
  }

  async function downloadExportCard() {
    if (!selectedExportPillar || !exportCardRef.current) {
      setExportNotice('Please pick a pillar first.')
      return
    }
    if (!window.html2canvas) {
      setExportNotice('Download engine is still loading. Please try again in a moment.')
      return
    }
    setExportBusy(true)
    try {
      const source = exportCardRef.current
      const clone = source.cloneNode(true)
      const wrapper = document.createElement('div')
      const rect = source.getBoundingClientRect()
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-9999px'
      wrapper.style.top = '0'
      wrapper.style.width = `${Math.max(640, Math.round(rect.width))}px`
      wrapper.style.background = '#ffffff'
      wrapper.style.padding = '0'
      wrapper.style.margin = '0'
      wrapper.appendChild(clone)
      document.body.appendChild(wrapper)

      await new Promise(resolve => setTimeout(resolve, 140))
      const canvas = await window.html2canvas(clone, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      wrapper.remove()
      const slug = cleanText(selectedExportPillar.name || 'vision').toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const filename = `phasr-${slug || 'vision'}-vision.png`
      const anchor = document.createElement('a')
      anchor.download = filename
      anchor.style.display = 'none'
      if (canvas.toBlob) {
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
        if (blob) {
          const url = URL.createObjectURL(blob)
          anchor.href = url
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
          URL.revokeObjectURL(url)
        } else {
          anchor.href = canvas.toDataURL('image/png')
          document.body.appendChild(anchor)
          anchor.click()
          anchor.remove()
        }
      } else {
        anchor.href = canvas.toDataURL('image/png')
        document.body.appendChild(anchor)
        anchor.click()
        anchor.remove()
      }
      setExportNotice('Want both? Upgrade to full weekly view inside PHASR')
    } catch (error) {
      console.error(error)
      setExportNotice('Sorry, the image could not be generated. Please try again.')
    } finally {
      setExportBusy(false)
    }
  }

  function isDirectImageUrl(url) {
    return /^data:image\//i.test(url) || /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(url)
  }

  function extractImageFromHtml(html) {
    if (!html) return ''
    const ogSecureMatch = html.match(/<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/i)
    if (ogSecureMatch?.[1]) return ogSecureMatch[1].replace(/&amp;/g, '&').trim()
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    if (ogMatch?.[1]) return ogMatch[1].replace(/&amp;/g, '&').trim()
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i)
    if (twMatch?.[1]) return twMatch[1].replace(/&amp;/g, '&').trim()
    const twSrcMatch = html.match(/<meta[^>]+name=["']twitter:image:src["'][^>]+content=["']([^"']+)["']/i)
    if (twSrcMatch?.[1]) return twSrcMatch[1].replace(/&amp;/g, '&').trim()
    const imgMatch = html.match(/https?:\/\/i\.pinimg\.com\/[^"'\\s>]+/i)
    if (imgMatch?.[0]) return imgMatch[0].trim()
    return ''
  }

  function extractCanonicalUrl(html) {
    if (!html) return ''
    const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
    if (canonical?.[1]) return canonical[1].replace(/&amp;/g, '&').trim()
    const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)
    if (ogUrl?.[1]) return ogUrl[1].replace(/&amp;/g, '&').trim()
    return ''
  }

  function proxyImageUrl(url) {
    if (!url || /^data:image\//i.test(url)) return url
    const cleaned = url.replace(/^https?:\/\//i, '')
    return `https://images.weserv.nl/?url=${encodeURIComponent(cleaned)}`
  }

  async function fetchOgImage(url) {
    try {
      const cleaned = url.replace(/^https?:\/\//i, '')
      const res = await fetch(`https://r.jina.ai/http://${cleaned}`)
      if (!res.ok) return ''
      const html = await res.text()
      const firstImage = extractImageFromHtml(html)
      if (firstImage) return firstImage

      const canonical = extractCanonicalUrl(html)
      if (canonical) {
        const canonicalRes = await fetch(`https://r.jina.ai/http://${canonical.replace(/^https?:\/\//i, '')}`)
        if (canonicalRes.ok) {
          const canonicalHtml = await canonicalRes.text()
          const canonicalImage = extractImageFromHtml(canonicalHtml)
          if (canonicalImage) return canonicalImage
        }
      }

      const pinMatch = html.match(/https?:\/\/www\.pinterest\.com\/pin\/[^"'\s>]+/i)
      if (pinMatch?.[0]) {
        const pinRes = await fetch(`https://r.jina.ai/http://${pinMatch[0].replace(/^https?:\/\//i, '')}`)
        if (!pinRes.ok) return ''
        const pinHtml = await pinRes.text()
        const pinImage = extractImageFromHtml(pinHtml)
        if (pinImage) return pinImage
        const pinCanonical = extractCanonicalUrl(pinHtml)
        if (pinCanonical) {
          const pinCanonicalRes = await fetch(`https://r.jina.ai/http://${pinCanonical.replace(/^https?:\/\//i, '')}`)
          if (pinCanonicalRes.ok) {
            const pinCanonicalHtml = await pinCanonicalRes.text()
            return extractImageFromHtml(pinCanonicalHtml)
          }
        }
      }
      return ''
    } catch {
      return ''
    }
  }

  const updateImageLink = async (plId, slot, value) => {
    const raw = String(value || '').trim()
    if (!raw) {
      updatePillar(plId, slot, null)
      return
    }
    setUploadMessage('Checking image link...')
    let finalUrl = raw
    if (!isDirectImageUrl(raw)) {
      const ogImage = await fetchOgImage(raw)
      if (!ogImage) {
        setUploadMessage('Please paste a direct image link or a page with a valid preview image.')
        return
      }
      finalUrl = ogImage
    }

    const loadUrl = /pinterest\.com|pinimg\.com/i.test(finalUrl) ? proxyImageUrl(finalUrl) : finalUrl
    const probe = new Image()
    probe.referrerPolicy = 'no-referrer'
    probe.crossOrigin = 'anonymous'
    probe.onload = () => {
      setUploadMessage('')
      updatePillar(plId, slot, loadUrl)
    }
    probe.onerror = () => {
      setUploadMessage('This image link could not be loaded. Try a different image.')
    }
    probe.src = loadUrl
  }

  const todayTodoState = loadTodoState()
  const todayTodoMap = todayTodoState[getTodayKey()] || {}
  const dailyPlan = getDailyTaskPlan({ ...data, activePhaseId: phaseId })
  const currentTodo = dailyPlan.tasks.find(task => !todayTodoMap[task.id]) || dailyPlan.primaryTask

  // This fallback only shows when this phase genuinely has no activities yet
  // to pull a task from (dailyPlan.tasks empty and no primaryTask) — real
  // pillars with real activities always produce a real currentTodo.task.
  const todayTask = currentTodo?.task || 'Add an activity to a pillar to see today\'s task here.'
  const weeklyPlan = phase?.pillars?.flatMap(p => {
    const tasks = (p.weeklyActions || []).filter(Boolean)
    const fallbackTasks = tasks.length ? tasks : (p.activities || []).filter(Boolean).slice(0, 3)
    return fallbackTasks.map(task => ({ task, pillar: p.name }))
  }) || []
  const scheduledThisWeek = useMemo(() => hasScheduledNonNegotiable({
    userId: activeUserId,
    phaseId,
    pillars: phase?.pillars || [],
    weekStartKey,
  }), [activeUserId, phaseId, phase?.pillars, scheduleRefresh, weekStartKey])
  // Derived from real pillar/schedule data, not a local flag: has she written anything
  // into any pillar yet? That's the only signal for "a pillar is set up."
  const hasPillarSetUp = useMemo(
    () => Boolean(phase?.pillars?.some(p => cleanText(p?.beforeDesc) || cleanText(p?.afterDesc))),
    [phase?.pillars]
  )
  const bannerState = !hasPillarSetUp ? 'setup' : !scheduledThisWeek ? 'schedule' : 'start'

  useEffect(() => {
    // Deliberately only keyed on `editing` flipping true, not on `phase` (which
    // is a new object every render) — this must capture a snapshot once, at the
    // moment editing starts, not keep re-capturing the (possibly already-edited)
    // current state on every re-render while still editing.
    if (editing) scheduleSnapshotRef.current = getScheduleFingerprint(phase)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing])

  const showCalendarPrompt = !!weeklyPlan.length && !editing && calendarPromptState === 'open'
  const showCalendarPromptChip = !!weeklyPlan.length && !editing && calendarPromptState === 'collapsed'

  useEffect(() => {
    if (!weeklyPlan.length || editing) return
    if (calendarPromptState !== 'open') return
    const timer = window.setTimeout(() => {
      setCalendarPromptState(current => current === 'open' ? 'collapsed' : current)
    }, isMobile ? 12000 : 420000)
    return () => window.clearTimeout(timer)
  }, [calendarPromptState, editing, weeklyPlan.length, phaseId])

  useEffect(() => {
    if (!calendarPromptArmed || editing) return
    if (weeklyPlan.length) setCalendarPromptState('open')
    setCalendarPromptArmed(false)
  }, [calendarPromptArmed, editing, weeklyPlan.length])

  useEffect(() => {
    if (!showCalendarPrompt) return
    setCalendarBannerMounted(false)
    requestAnimationFrame(() => setCalendarBannerMounted(true))
  }, [showCalendarPrompt])

  // State 2: right after saving a pillar, the "Schedule your week" popup shows briefly
  // then dismisses on its own — the banner CTA underneath has already switched to
  // "Schedule your week" by then, so nothing is lost when it disappears.
  useEffect(() => {
    if (!showSavePopup) return undefined
    const timer = window.setTimeout(() => setShowSavePopup(false), 60000)
    return () => window.clearTimeout(timer)
  }, [showSavePopup])

  return (
    <div style={{ minHeight: isMobile ? 'auto' : 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: isMobile ? '1rem 0.85rem 40px' : '1.5rem 1rem 4rem', fontFamily: "'General Sans',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
        {uploadMessage && (
          <div id="vb-status-message" style={{ marginBottom: '1rem', borderRadius: 16, padding: '0.9rem 1rem', background: '#fff3f6', border: '1px solid #f2c7d4', color: '#a54f71', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 12px 30px rgba(185,87,122,0.1)' }}>
            {uploadMessage}
          </div>
        )}

        {/* Today's Task — static, no mount animation. The board should just be
            there; only the numbers inside it (today's task/streak) ever change. */}
        <div
          style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
          borderRadius: 'var(--app-radius-md)', padding: isMobile ? '0.75rem 0.85rem' : '0.9rem 1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: isMobile ? '1.3rem' : '1.5rem', gap: '0.6rem',
          boxShadow: 'var(--app-shadow-md)',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: isMobile ? '0.54rem' : '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)', marginBottom: '0.45rem' }}>
              {bannerState === 'setup' ? 'Your Vision Board' : `Today · ${phaseDisplayName}`}
            </p>
            <p style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight: 600, color: '#fff', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }}>
              {bannerState === 'setup' ? 'Turn your goal into a plan you can follow, one day at a time.' : todayTask}
            </p>
          </div>
          <div style={{ flexShrink: 0 }}>
            {editing ? (
              // The CTA never disappears mid-flow: once she's in the pillar editor, this
              // same button becomes the way back out — tap it, it saves, and the next
              // state (the Add-to-Calendar popup, then "Schedule your week") picks up
              // right where this one left off.
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="button"
                onClick={handleEditingToggle}
                style={{ minHeight: isMobile ? 28 : 34, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.36rem 0.65rem' : '0.45rem 0.8rem', borderRadius: 999, border: 'none', background: '#fff', color: 'var(--app-accent)', fontWeight: 800, cursor: 'pointer', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.68rem' : '0.78rem', boxShadow: '0 8px 18px rgba(105,33,63,0.14)' }}
              >
                Done
              </motion.button>
            ) : bannerState === 'setup' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="button"
                onClick={() => {
                  setEditing(true)
                  requestAnimationFrame(() => {
                    document.getElementById('pillar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }}
                style={{ minHeight: isMobile ? 28 : 34, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.36rem 0.65rem' : '0.45rem 0.8rem', borderRadius: 999, border: 'none', background: '#fff', color: 'var(--app-accent)', fontWeight: 800, cursor: 'pointer', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.68rem' : '0.78rem', boxShadow: '0 8px 18px rgba(105,33,63,0.14)' }}
              >
                Build your vision board
              </motion.button>
            ) : bannerState === 'start' ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="button"
                onClick={() => onOpenDailyStreak?.()}
                style={{ minHeight: isMobile ? 28 : 34, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.36rem 0.65rem' : '0.45rem 0.8rem', borderRadius: 999, border: 'none', background: '#fff', color: 'var(--app-accent)', fontWeight: 800, cursor: 'pointer', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.68rem' : '0.78rem', boxShadow: '0 8px 18px rgba(105,33,63,0.14)' }}
              >
                Start your goal
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                type="button"
                onClick={addToCalendarPlan}
                disabled={calendarBusy}
                style={{ minHeight: isMobile ? 28 : 34, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: isMobile ? '0.36rem 0.65rem' : '0.45rem 0.8rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.38)', background: 'rgba(255,255,255,0.14)', color: '#fff', fontWeight: 800, cursor: calendarBusy ? 'wait' : 'pointer', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.68rem' : '0.78rem' }}
              >
                {calendarBusy ? 'Scheduling...' : 'Schedule your week'}
              </motion.button>
            )}
          </div>
        </div>

        {/* Floats beside the button that triggered it, anchored to the banner —
            it used to sit inline in the page flow, pushing everything below it
            down every time it opened. A side popover doesn't disturb the layout. */}
        {showSavePopup && !editing && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 10px)',
              right: 0,
              left: isMobile ? 0 : 'auto',
              zIndex: 40,
              width: isMobile ? 'auto' : 320,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.68)',
              backdropFilter: 'blur(18px) saturate(160%)',
              WebkitBackdropFilter: 'blur(18px) saturate(160%)',
              border: '1px solid rgba(255,255,255,0.6)',
              boxShadow: 'var(--app-shadow-lg)',
              padding: '1rem 1.05rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
              <p style={{ margin: 0, fontFamily: "'Fraunces',serif", fontSize: '1rem', fontWeight: 600, color: 'var(--app-text)', lineHeight: 1.3 }}>
                Put your week where you'll actually see it.
              </p>
              <button
                type="button"
                onClick={() => { setShowSavePopup(false); closeCalendarPrompt() }}
                aria-label="Dismiss"
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.5)',
                  color: 'var(--app-muted)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  display: 'grid',
                  placeItems: 'center',
                  padding: 0,
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={async () => { await addToCalendarPlan(); setShowSavePopup(false) }}
                disabled={calendarBusy}
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  cursor: calendarBusy ? 'wait' : 'pointer',
                  fontFamily: "'General Sans',sans-serif",
                  letterSpacing: '0.02em',
                  boxShadow: 'var(--app-shadow-sm)',
                }}
              >
                {calendarBusy ? 'Scheduling…' : 'Add to calendar'}
              </motion.button>
              <button
                type="button"
                onClick={() => { setShowSavePopup(false); closeCalendarPrompt() }}
                style={{ border: 'none', background: 'transparent', color: 'var(--app-muted)', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer', fontFamily: "'General Sans',sans-serif", padding: '0.2rem' }}
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        )}

        {/* â"€â"€ Header â"€â"€ */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? '1.7rem' : '2.1rem' }}>
          {editing
            ? <input value={data.boardTitle} onChange={e => upd(d => { d.boardTitle = e.target.value; return d })} style={inp({ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--app-border)', textAlign: 'center', width: '100%', maxWidth: 560, marginBottom: 0 })} onFocus={focus} onBlur={blur} />
            : (!isMobile && <h1 className="font-display" style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg,var(--app-accent),var(--app-accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{data.boardTitle}</h1>)
          }
          <p style={{ color: 'var(--app-muted)', fontSize: isMobile ? '0.74rem' : '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: isMobile ? '0' : '0.3rem' }}>
            {(isMobile ? visiblePillars : phase?.pillars || []).map(p => p.name).join(' · ')}
          </p>
          {(
            <button onClick={handleEditingToggle} style={{
              marginTop: isMobile ? '0.55rem' : '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.33rem 1rem', borderRadius: 99,
              border: `1.5px solid ${editing ? 'transparent' : 'var(--app-border)'}`,
              background: editing ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'var(--app-bg2)',
              color: editing ? '#fff' : 'var(--app-accent)',
              fontSize: isMobile ? '0.68rem' : '0.72rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: "'General Sans',sans-serif", transition: 'all 0.2s',
            }}>{editing ? 'Save' : 'Personalize'}</button>
          )}
        </div>

        {/* â"€â"€ Phase Tabs â"€â"€ */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: isMobile ? 'nowrap' : 'wrap', marginBottom: '1.9rem', alignItems: 'flex-start', overflowX: isMobile ? 'auto' : 'visible', whiteSpace: isMobile ? 'nowrap' : 'normal', paddingBottom: isMobile ? 2 : 0 }}>
          {data.phases.map((p, index) => {
            const activePhase = phaseId === p.id
            const draft = getTimelineDraft(p)
            const alignRight = index === data.phases.length - 1
            return (
            <div
              key={p.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setRevealedDeleteTarget(`phase:${p.id}`)}
              onMouseLeave={() => setRevealedDeleteTarget(current => current === `phase:${p.id}` ? null : current)}
              onTouchStart={() => setRevealedDeleteTarget(`phase:${p.id}`)}
            >
              <div
                onClick={() => {
                  setPhaseId(p.id)
                  if (timelineEditorPhaseId && timelineEditorPhaseId !== p.id) setTimelineEditorPhaseId(null)
                }}
                style={{
                  padding: isMobile ? '0.58rem 0.82rem' : '0.72rem 1.1rem',
                  borderRadius: 'var(--app-radius-lg)',
                  border: `1.5px solid ${activePhase ? 'transparent' : 'var(--app-border)'}`,
                  background: activePhase ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff',
                  color: activePhase ? '#fff' : 'var(--app-muted)',
                  boxShadow: activePhase ? 'var(--app-shadow-md)' : 'var(--app-shadow-sm)',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isMobile ? '0.28rem' : '0.38rem',
                  minWidth: isMobile ? 'auto' : 152,
                  minHeight: isMobile ? 64 : 82,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <button
                  type="button"
                  onClick={() => setPhaseId(p.id)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    fontFamily: "'General Sans',sans-serif",
                    fontSize: isMobile ? '0.8rem' : '0.88rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: activePhase ? '#fff' : 'var(--app-text)',
                  }}
                >
                  {`Phase ${index + 1}`}
                </button>
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    if (!editing) return
                    setPhaseId(p.id)
                    openTimelineEditor(p)
                  }}
                  style={{
                    background: activePhase ? 'rgba(255,255,255,0.16)' : '#fff1f6',
                    border: `1px solid ${activePhase ? 'rgba(255,255,255,0.22)' : '#f2c8d6'}`,
                    borderRadius: 999,
                    color: activePhase ? '#fff' : '#b85a82',
                    fontSize: isMobile ? '0.58rem' : '0.62rem',
                    fontWeight: 800,
                    minWidth: isMobile ? 78 : 96,
                    textAlign: 'center',
                    padding: isMobile ? '0.2rem 0.5rem' : '0.26rem 0.62rem',
                    cursor: editing ? 'pointer' : 'default',
                    fontFamily: "'General Sans',sans-serif",
                    outline: 'none',
                  }}
                >
                  {getPhaseTimelineLabel(p)}
                </button>
              </div>

              {editing && timelineEditorPhaseId === p.id && (() => {
                const panel = (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    onClick={event => event.stopPropagation()}
                    style={
                      isMobile
                        ? {
                            // No position/transform here on purpose — framer-motion's own
                            // `animate={{ y: 0 }}` compiles its own `transform` onto this
                            // node and silently overwrites any `translate(...)` set via
                            // `style`, which is what made this centering hack never
                            // actually apply. Centering now happens on the flex backdrop
                            // below instead, which doesn't touch `transform` at all.
                            width: 'min(300px, calc(100vw - 2.2rem))',
                            maxHeight: 'calc(100dvh - 3rem)', overflowY: 'auto',
                            background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)',
                            padding: '0.9rem', boxShadow: 'var(--app-shadow-lg)', zIndex: 60,
                          }
                        : {
                            position: 'absolute', top: 'calc(100% + 8px)',
                            left: alignRight ? 'auto' : 0, right: alignRight ? 0 : 'auto',
                            width: 'min(260px, calc(100vw - 2rem))', maxWidth: 'calc(100vw - 2rem)',
                            background: '#fff', border: '1px solid var(--app-border)', borderRadius: 'var(--app-radius-md)',
                            padding: '0.85rem', boxShadow: 'var(--app-shadow-lg)', zIndex: 30,
                          }
                    }
                  >
                    <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Set timeframe</p>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)', gap: '0.45rem', marginTop: '0.65rem' }}>
                      <label style={{ display: 'grid', gap: '0.22rem' }}>
                        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--app-muted)' }}>Start date</span>
                        <input
                          type="date"
                          value={draft.startDate || ''}
                          onChange={e => updateTimelineDraft(p.id, 'startDate', e.target.value)}
                          onClick={e => e.currentTarget.showPicker?.()}
                          onFocus={e => e.currentTarget.showPicker?.()}
                          style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: isMobile ? '0.56rem 0.42rem' : '0.5rem 0.45rem', borderRadius: 10, border: '1px solid var(--app-border)', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.74rem' : '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.22rem' }}>
                        <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--app-muted)' }}>End date</span>
                        <input
                          type="date"
                          value={draft.endDate || ''}
                          onChange={e => updateTimelineDraft(p.id, 'endDate', e.target.value)}
                          onClick={e => e.currentTarget.showPicker?.()}
                          onFocus={e => e.currentTarget.showPicker?.()}
                          style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: isMobile ? '0.56rem 0.42rem' : '0.5rem 0.45rem', borderRadius: 10, border: '1px solid var(--app-border)', fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '0.74rem' : '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }}
                        />
                      </label>
                    </div>
                    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: '0.5rem', marginTop: '0.7rem' }}>
                      <span style={{ fontSize: isMobile ? '0.66rem' : '0.7rem', color: 'var(--app-muted)', fontWeight: 700, textAlign: isMobile ? 'center' : 'left' }}>
                        {formatMonthRange(draft.startDate, draft.endDate)}
                      </span>
                      <button
                        type="button"
                        onClick={() => saveTimelineDraft(p.id)}
                        style={{ border: '1px solid var(--app-border)', background: '#fff1f6', color: '#b85a82', borderRadius: 999, padding: isMobile ? '0.45rem 0.7rem' : '0.35rem 0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'General Sans',sans-serif", width: isMobile ? '100%' : 'auto' }}
                      >
                        Save
                      </button>
                    </div>
                  </motion.div>
                )

                if (!isMobile) return panel

                // Mobile phase tabs scroll horizontally (overflowX: auto), and a
                // scrolling ancestor clips any position:absolute child that
                // extends past its box — which is exactly what made this pop
                // up look "broken" (it was rendering, just invisible, clipped
                // by the tab strip). A portal to the document body plus a
                // fixed-position centered panel sidesteps that entirely.
                return createPortal(
                  <div
                    onClick={() => setTimelineEditorPhaseId(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 59, background: 'rgba(20,10,15,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
                  >
                    {panel}
                  </div>,
                  document.body,
                )
              })()}

              {editing && data.phases.length > 1 && (
                <button
                  onClick={() => delPhase(p.id)}
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    width: 15,
                    height: 15,
                    borderRadius: '50%',
                    background: '#fff',
                    border: '1.5px solid var(--app-border)',
                    color: 'var(--app-accent)',
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    lineHeight: 1,
                    opacity: revealedDeleteTarget === `phase:${p.id}` ? 1 : 0,
                    pointerEvents: revealedDeleteTarget === `phase:${p.id}` ? 'auto' : 'none',
                    transform: revealedDeleteTarget === `phase:${p.id}` ? 'scale(1)' : 'scale(0.9)',
                    transition: 'opacity 0.18s ease, transform 0.18s ease',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )})}

          {editing && (
            <button onClick={addPhase} style={{ padding: '0.48rem 1.1rem', borderRadius: 99, border: '1.5px dashed var(--app-border)', background: 'transparent', color: 'var(--app-accent2)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'General Sans',sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              + add it
            </button>
          )}
        </div>


        {/* â"€â"€ Affirmation â"€â"€ */}
        <div style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff)', border: '1.5px solid var(--app-border)', borderRadius: 'var(--app-radius-sm)', padding: isMobile ? '0.72rem 1rem' : '0.85rem 1.4rem', marginBottom: '1.9rem', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: 'var(--app-shadow-sm)' }}>
          <span style={{ position: 'absolute', top: isMobile ? -6 : -10, left: isMobile ? 8 : 10, fontFamily: "'Fraunces',serif", fontSize: isMobile ? '3.8rem' : '5rem', color: 'var(--app-border)', lineHeight: 1, pointerEvents: 'none' }}>"</span>
          {editing
            ? <input value={phase?.affirmation || ''} onChange={e => updatePhase('affirmation', e.target.value)} placeholder="Your phase mantra..." style={inp({ fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: '1rem', color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--app-border)', textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 1 })} onFocus={focus} onBlur={blur} />
            : <p className="font-display" style={{ fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: isMobile ? '0.84rem' : 'clamp(0.9rem,2.2vw,1.05rem)', color: 'var(--app-accent)', position: 'relative', zIndex: 1, lineHeight: isMobile ? 1.45 : 1.6, margin: 0 }}>{phase?.affirmation}</p>
          }
        </div>

        {/* ── Pillars ── */}
        {editing && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.85rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.58rem 0.9rem', borderRadius: 999, border: '1px solid var(--app-border)', background: 'var(--app-bg2)', color: 'var(--app-muted)', fontSize: '0.78rem', fontWeight: 700 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.78rem' }}>
                <Hand size={13} strokeWidth={2.2} />
              </span>
              Tap the icon to switch focus areas. Tap delete to remove a pillar.
            </div>
          </div>
        )}
        {editing && (
          <AnimatePresence>
            {presetPillar && (
              <FocusAreaSheet
                key={presetPillar.id}
                pillar={presetPillar}
                isMobile={isMobile}
                onClose={() => setPresetOpen(null)}
                onSelectCategory={category => applyFocusAreaCategory(presetPillar.id, category)}
                onNameChange={value => updatePillar(presetPillar.id, 'name', value)}
                onVisionStyleChange={value => updatePillar(presetPillar.id, 'visionStyle', value)}
                onIconChange={value => updatePillar(presetPillar.id, 'emoji', value)}
              />
            )}
          </AnimatePresence>
        )}
        {(() => {
          const pillarColumnsPerRow = visiblePillars.length === 1 ? 1 : (isMobile ? 1 : 2)
          const pillarRowGroupCount = Math.max(1, Math.ceil(visiblePillars.length / pillarColumnsPerRow))
          return (
        <div
          id="pillar-section"
          className="phase-container pillar-subgrid"
          style={
            isMobile
              // Single column on mobile — the shared row-subgrid below exists only to
              // align sibling sections across a 2-column desktop layout. On one column
              // there's nothing to align, and a collapsed card's unused subgrid rows
              // still consumed `gap`-multiplied empty space between cards. A plain
              // stack has no such dead tracks — each card is exactly as tall as its content.
              ? { display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '0.9rem' }
              : { display: 'grid', gridTemplateColumns: visiblePillars.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))', gridTemplateRows: `repeat(${pillarRowGroupCount * PILLAR_ROW_COUNT}, auto)`, gap: '1rem', marginBottom: '0.9rem', alignItems: 'stretch' }
          }
        >
          {visiblePillars.map((pl, pillarIndex) => (
            <PillarCard
              key={pl.id} pl={pl} editing={editing} checked={checked} phaseId={phaseId}
              index={pillarIndex}
              rowGroup={Math.floor(pillarIndex / pillarColumnsPerRow)}
              userId={activeUserId}
              weekStartKey={weekStartKey}
              presetOpen={presetOpen === pl.id}
              onCollapse={() => toggleCollapse(pl.id)}
              onUpdate={(k, v) => updatePillar(pl.id, k, v)}
              onUpdateArr={(k, i, v) => updateArr(pl.id, k, i, v)}
              onAddArr={k => addArr(pl.id, k)}
              onDelArr={(k, i) => delArr(pl.id, k, i)}
              onCheck={toggleCheck}
              onUpload={slot => uploadImg(pl.id, slot)}
              onImageLinkUpdate={(slot, value) => updateImageLink(pl.id, slot, value)}
              onDel={() => delPillar(pl.id)}
              onPreset={() => setPresetOpen(presetOpen === pl.id ? null : pl.id)}
                onGeneratePlan={(options) => forceGeneratePlan(pl.id, options)}
              isGenerating={generatingPillarId === pl.id}
            />
          ))}
          {editing && (
            (phase?.pillars?.length || 0) < MAX_PILLAR_LIMIT ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addPillar} style={{ border: '2px dashed var(--app-border)', borderRadius: 'var(--app-radius-md)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.8rem 1rem', cursor: 'pointer', minHeight: 120 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--app-bg2)'; e.currentTarget.style.borderColor = 'var(--app-accent2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--app-border)' }}>
                <span style={{ fontSize: '1.4rem', color: 'var(--app-accent2)' }}>+</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--app-accent2)', fontFamily: "'General Sans',sans-serif" }}>add pillar</span>
              </motion.button>
            ) : null
          )}
        </div>
          )
        })()}
        {/* â"€â"€ Footer â"€â"€ */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: '0 10px 28px rgba(240,96,144,0.28)' }}
            whileTap={{ scale: 0.97 }}
            onClick={openExportModal}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.62rem 1.4rem', borderRadius: 99,
              border: 'none',
              background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
              color: '#fff', fontSize: '0.8rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: "'General Sans',sans-serif", marginBottom: '0.6rem',
              boxShadow: '0 6px 18px rgba(240,96,144,0.22)',
              transition: 'box-shadow 0.2s',
            }}
          >
            <ImageDown size={15} strokeWidth={2.2} />
            Save vision board
          </motion.button>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.78rem', margin: 0 }}>Track weekly · Review quarterly · Transform your life</p>
        </div>

        {showExportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(10,10,15,0.94)', padding: isMobile ? '18px 14px 28px' : '28px 16px 48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <button
              type="button"
              onClick={closeExportModal}
              style={{ position: 'fixed', top: 18, right: 18, width: 40, height: 40, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.14)', background: '#13131a', color: '#fff', cursor: 'pointer', fontSize: '1.1rem', zIndex: 1201 }}
            >
              ×
            </button>

            {exportStage === 'picker' && (
              <>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginTop: 10 }}>Step 1 of 1</p>
                <div style={{ width: '100%', maxWidth: 480 }}>
                  <h2 className="font-display" style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 6 }}>Pick one pillar to save</h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 18 }}>This goes on your wall. Choose what matters most right now.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(phase?.pillars || []).map((item, exportIndex) => {
                      const active = selectedExportPillarId === item.id
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30, delay: exportIndex * 0.04 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => setSelectedExportPillarId(item.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 'var(--app-radius-md)', border: active ? '1.5px solid var(--app-accent)' : '1.5px solid rgba(255,255,255,0.07)', background: active ? 'rgba(240,96,144,0.1)' : '#13131a', boxShadow: active ? 'var(--app-shadow-sm)' : 'none', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Fraunces', serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{cleanText(item.beforeState) || 'Before'} → {cleanText(item.afterState) || 'After'}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: active ? '2px solid var(--app-accent)' : '2px solid rgba(255,255,255,0.2)', background: active ? 'var(--app-accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, flexShrink: 0 }}>
                            {active ? '✓' : ''}
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: selectedExportPillarId ? 1.02 : 1 }}
                  whileTap={{ scale: selectedExportPillarId ? 0.98 : 1 }}
                  type="button"
                  onClick={generateExportCard}
                  disabled={!selectedExportPillarId}
                  style={{ width: '100%', maxWidth: 480, padding: 14, borderRadius: 'var(--app-radius-md)', border: 'none', background: `linear-gradient(135deg, var(--app-cta), var(--app-cta-hover))`, color: '#fff', fontFamily: "'General Sans', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', cursor: selectedExportPillarId ? 'pointer' : 'not-allowed', boxShadow: 'var(--app-shadow-md)', opacity: selectedExportPillarId ? 1 : 0.4 }}
                >
                  Create My Vision Card →
                </motion.button>
              </>
            )}

            {exportStage === 'card' && selectedExportPillar && (
              <>
                <div style={{ width: '100%', maxWidth: 640, display: 'flex', justifyContent: 'center', transform: isMobile ? 'none' : 'scale(0.82)', transformOrigin: 'top center', marginBottom: isMobile ? 0 : '-108px' }}>
                <div ref={exportCardRef} style={{ width: '100%', maxWidth: 640, background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 48px rgba(0,0,0,0.4)' }}>
                  <div style={{ background: 'linear-gradient(135deg,#1a0a10,#2e101c)', padding: '24px 26px 20px', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 20% 50%,rgba(249,95,133,0.22),transparent)', pointerEvents: 'none' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1, marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img src={phasrMark} alt="PHASR mark" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Fraunces', serif", fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#f472a8,#ffd6e7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>PHASR</span>
                      </div>
                      <span style={{ padding: '4px 11px', borderRadius: 99, border: '1px solid rgba(249,95,133,0.3)', background: 'rgba(249,95,133,0.12)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--app-accent2)' }}>{exportPhaseLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--app-cta), var(--app-cta-hover))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{selectedExportPillar.emoji}</div>
                      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>{selectedExportPillar.name}</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      {[
                        { type: 'before', label: '📸 Before', image: selectedExportPillar.beforeImage, state: selectedExportPillar.beforeState, desc: selectedExportPillar.beforeDesc, bg: '#fff8f8', border: '#f9cdd3', accent: '#c0445a', ph: 'Before Photo' },
                        { type: 'after', label: '🎯 After', image: selectedExportPillar.afterImage, state: selectedExportPillar.afterState, desc: selectedExportPillar.afterDesc, bg: '#fff0f4', border: '#f5c0cc', accent: '#f06090', ph: 'Goal Photo' },
                      ].map(frame => (
                        <div key={frame.type} style={{ borderRadius: 14, overflow: 'hidden', background: frame.bg, border: `1.5px solid ${frame.border}` }}>
                          {frame.image ? (
                            <img src={frame.image} alt={frame.label} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: frame.type === 'before' ? '#fff0f0' : '#fff0f4' }}>
                              <span style={{ fontSize: 22, opacity: 0.5 }}>{frame.type === 'before' ? '📸' : '🎯'}</span>
                              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.4, color: frame.accent }}>{frame.ph}</span>
                            </div>
                          )}
                          <div style={{ padding: '10px 12px' }}>
                            <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4, color: frame.accent }}>{frame.label}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1a0a10', lineHeight: 1.35 }}>{shortenText(frame.state || (frame.type === 'before' ? 'Current state' : 'Goal state'), 46)}</div>
                            <div style={{ fontSize: 10, color: '#7a5a66', marginTop: 2, lineHeight: 1.4 }}>{shortenText(frame.desc || (frame.type === 'before' ? 'Where I am now' : 'Where I am going'), 52)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: 'linear-gradient(135deg,#fff5f7,#fff)', border: '1px solid #f2c4d0', borderRadius: 12, padding: '12px 14px', position: 'relative', overflow: 'hidden' }}>
                      <span style={{ position: 'absolute', top: -6, left: 8, fontFamily: "'Fraunces', serif", fontSize: 48, color: 'rgba(249,95,133,0.12)', lineHeight: 1, pointerEvents: 'none' }}>"</span>
                      <p style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: 13, color: '#3d1f2b', lineHeight: 1.55, position: 'relative', zIndex: 1 }}>
                        {shortenText(selectedExportPillar.description || selectedExportPillar.afterDesc || selectedExportPillar.beforeDesc || selectedExportPillar.shortOutcome || selectedExportPillar.afterState || selectedExportPillar.name, 220)}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '0 22px 18px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: 8 }}>What you need to source</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {compactList(selectedExportPillar.resources, 3).map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#fff5f7', border: '1px solid #f9d8e0' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--app-accent)', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#3d1f2b', fontWeight: 500 }}>{shortenText(item, 48)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'linear-gradient(to right,transparent,#f2c4d0,transparent)', margin: '0 22px' }} />

                  <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: '#1a0a10', lineHeight: 1.3, marginBottom: 6 }}>Check in daily.<br /><em style={{ fontStyle: 'italic', color: 'var(--app-accent)' }}>Sage remembers everything.</em></div>
                      <div style={{ fontSize: 11, color: '#7a5a66', lineHeight: 1.55 }}>This plan is valid for this week. Open your dashboard daily and let Sage guide the next move.</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <div ref={qrCodeRef} style={{ width: 88, minHeight: 88, padding: 4, background: '#fff', borderRadius: 10 }} />
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a7088', textAlign: 'center' }}>Dashboard</div>
                      <div style={{ fontSize: 9, color: '#b09098', textAlign: 'center', lineHeight: 1.4, maxWidth: 88 }}>Scan to open your page</div>
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg,#1a0a10,#2e101c)', padding: '10px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>This plan is valid for this week. Create your next phase inside PHASR.</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>PHASR · {phaseDisplayName}</span>
                  </div>
                </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 480 }}>
                  <motion.button
                    whileHover={{ scale: exportBusy || !exportScriptsReady ? 1 : 1.02 }}
                    whileTap={{ scale: exportBusy || !exportScriptsReady ? 1 : 0.98 }}
                    type="button"
                    onClick={downloadExportCard}
                    disabled={exportBusy || !exportScriptsReady}
                    style={{ width: '100%', padding: 14, borderRadius: 'var(--app-radius-md)', border: 'none', background: 'linear-gradient(135deg, var(--app-cta), var(--app-cta-hover))', color: '#fff', fontFamily: "'General Sans', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', cursor: exportBusy || !exportScriptsReady ? 'not-allowed' : 'pointer', boxShadow: 'var(--app-shadow-md)', opacity: exportBusy || !exportScriptsReady ? 0.5 : 1 }}
                  >
                    {exportBusy ? 'Saving...' : '⬇ Save as Image'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setExportStage('picker')}
                    style={{ width: '100%', padding: 12, borderRadius: 'var(--app-radius-md)', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: "'General Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    ← Pick a different pillar
                  </motion.button>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>Print it. Put it on your wall. Never forget why you started.</p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </div>

      <style>{`
        @media(max-width:768px){ .phase-container{ grid-template-columns:1fr!important } }
        @media(max-width:640px){ [style*="repeat(3,1fr)"],[style*="repeat(4,1fr)"]{ grid-template-columns:1fr!important } }
      `}</style>
    </div>
  )
}

/* â"€â"€ Pillar Card â"€â"€ */
  function PillarCard({ pl, editing, checked, phaseId, userId, weekStartKey, index, rowGroup, onCollapse, onUpdate, onUpdateArr, onAddArr, onDelArr, onCheck, onUpload, onImageLinkUpdate, onDel, onPreset, onGeneratePlan, isGenerating }) {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 768 : false
    const calendarWindowStart = useMemo(() => (
      // NON_NEGOTIABLE_DAY_OFFSETS assumes offset 0 = Monday — this must anchor
      // to the actual Monday of the current week, rolling forward to next week
      // once today is already past Thursday (offset 3), so nothing gets
      // scheduled into a day that's already passed. Anchoring to "today"
      // directly used to mislabel every assigned day whenever today wasn't
      // Monday (e.g. a Sunday login showed Sunday's date under the "Monday" slot).
      getNonNegotiableWindowStart()
    ), [])
    const scheduleStateKey = useMemo(() => ({ userId, phaseId, pillarId: pl.id, weekStartKey }), [userId, phaseId, pl.id, weekStartKey])
    const [scheduleState, setScheduleState] = useState(() => userId && weekStartKey ? loadNonNegotiableSchedule(scheduleStateKey) : {})
    const isDestination = pl.visionStyle === 'destination'
    const hasRequiredDescription = isDestination
      ? Boolean(cleanText(pl.afterState) || cleanText(pl.afterDesc))
      : Boolean(
          (cleanText(pl.beforeState) || cleanText(pl.beforeDesc)) &&
          (cleanText(pl.afterState) || cleanText(pl.afterDesc))
        )
    // Sage can't act on a board edit yet (no split-view) — so a lock with no
    // escape is a dead end. "Edit anyway" clears it for this pillar/session;
    // she isn't ever stuck.
    const [descriptionUnlocked, setDescriptionUnlocked] = useState(false)
    const hasPlan = Array.isArray(pl.activities) && pl.activities.filter(Boolean).length > 0
    // Gated on an actual generated plan, not on "has she typed any description text" —
    // that used to lock the field the instant she typed her first character, before
    // she'd even finished writing, let alone generated anything for the lock to protect.
    const isLocked = hasPlan && !descriptionUnlocked
    // Always visible from the start — she shouldn't have to write anything before she
    // can even see the button exists. It's just disabled until there's a description.
    const buttonLabel = hasPlan ? 'Regenerate plan' : 'Generate plan'
    const [regenerateCount, setRegenerateCount] = useState(0)
    const [linkDrafts, setLinkDrafts] = useState({ beforeImage: pl.beforeImage || '', afterImage: pl.afterImage || '' })
    const [linkOpen, setLinkOpen] = useState({ beforeImage: false, afterImage: false })

    useEffect(() => {
      setLinkDrafts({
        beforeImage: pl.beforeImage || '',
        afterImage: pl.afterImage || '',
      })
    }, [pl.beforeImage, pl.afterImage])

    useEffect(() => {
      if (!userId || !weekStartKey) return undefined
      const handleScheduleUpdate = event => {
        const detail = event?.detail || {}
        if (detail.phaseId && detail.phaseId !== phaseId) return
        if (detail.weekStartKey && detail.weekStartKey !== weekStartKey) return
        setScheduleState(loadNonNegotiableSchedule(scheduleStateKey))
      }
      window.addEventListener('phasr-nonnegotiable-schedule-updated', handleScheduleUpdate)
      return () => window.removeEventListener('phasr-nonnegotiable-schedule-updated', handleScheduleUpdate)
    }, [phaseId, scheduleStateKey, userId, weekStartKey])

  function handleImageTap(slot) {
    // The photo is inspiration, not data — it doesn't generate anything, the
    // description does. So the image stays swappable even after the pillar
    // has content; only the description (below) locks.
    if (!editing) return
    onUpload(slot)
  }

  const regeneratePlan = () => {
    const lastPlan = JSON.parse(
      localStorage.getItem(`phasr_last_plan_${pl.id}`) || 'null'
    )
    setRegenerateCount(prev => prev + 1)
    onGeneratePlan({
      forceNewApproach: true,
      attempt: regenerateCount + 1,
      previousPlan: lastPlan,
    })
  }

  const handleGenerateButton = () => {
    if (isGenerating) return
    if (hasPlan) {
      regeneratePlan()
      return
    }
    onGeneratePlan()
  }

  const cardRowStart = (rowGroup || 0) * PILLAR_ROW_COUNT + 1

  // Shared between the locked (read-only) and unlocked (editable) branches of the
  // last photo column below — Generate/Regenerate must stay reachable either way.
  const generateButtonBlock = (() => {
    const blocked = isGenerating || !hasRequiredDescription
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
        <motion.button
          whileHover={{ scale: blocked ? 1 : 1.02 }}
          whileTap={{ scale: blocked ? 1 : 0.98 }}
          type="button"
          disabled={blocked}
          onClick={handleGenerateButton}
          style={{ width: isMobile ? '100%' : 'auto', minHeight: isMobile ? 46 : 38, padding: isMobile ? '0.72rem 1rem' : '0.58rem 0.9rem', borderRadius: 999, border: '1px solid var(--app-border)', background: isGenerating ? 'var(--app-border)' : !hasRequiredDescription ? 'var(--app-bg2)' : 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: !hasRequiredDescription && !isGenerating ? 'var(--app-muted)' : '#fff', fontWeight: 800, cursor: blocked ? (isGenerating ? 'wait' : 'not-allowed') : 'pointer', fontFamily: "'General Sans', sans-serif", opacity: blocked ? 0.7 : 1, transition: 'opacity 0.2s', touchAction: 'manipulation' }}
        >
          {isGenerating ? 'Generating...' : buttonLabel}
        </motion.button>
        {!hasRequiredDescription && !isGenerating && (
          <span style={{ fontSize: '0.66rem', color: 'var(--app-muted)' }}>
            {isDestination ? 'Add a description above to unlock this' : 'Add before & after details above to unlock this'}
          </span>
        )}
      </div>
    )
  })()

  const talkToSageBlock = isLocked && (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event('phasr-open-sage-float'))}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', border: 'none', background: 'var(--app-bg2)', color: 'var(--app-accent2)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: '0.4rem 0.7rem', borderRadius: 999, fontFamily: "'General Sans',sans-serif" }}
      >
        <Lock size={11} strokeWidth={2.2} />
        Talk to Sage to change your goal
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Editing this directly will change the plan Sage built around it, and Sage won\'t know until your next check-in. Edit anyway?')) {
            setDescriptionUnlocked(true)
          }
        }}
        style={{ border: 'none', background: 'transparent', color: 'var(--app-border)', fontSize: '0.64rem', fontWeight: 600, cursor: 'pointer', padding: '0 0.2rem', fontFamily: "'General Sans',sans-serif" }}
      >
        Edit anyway
      </button>
    </div>
  )

  return (
    <div
      style={
        isMobile
          // Plain stack, not a grid item — the numbered gridRow values below are
          // desktop-only (they align sections across the 2-column subgrid); on a
          // single mobile column, source order already is the right visual order,
          // and skipping the grid avoids the collapsed-card dead-row gap entirely.
          ? { background: '#fff', borderRadius: 'var(--app-radius-md)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }
          : {
              background: '#fff', borderRadius: 'var(--app-radius-md)', border: '1px solid var(--app-border)', boxShadow: 'var(--app-shadow-md)', overflow: 'hidden',
              display: 'grid',
              // Stay in the shared subgrid for rows 1-2 (header + photo/write-up) so
              // those always align with the sibling in this row-group. But a collapsed
              // card has nothing in rows 3+ — spanning the full row count anyway used to
              // stretch it to match an expanded sibling's height, leaving a dead gap
              // below the write-up. Spanning only 2 rows when collapsed lets the card's
              // own box end right after the write-up instead.
              gridTemplateRows: 'subgrid',
              gridRow: pl.collapsed ? `${cardRowStart} / span 2` : `${cardRowStart} / span ${PILLAR_ROW_COUNT}`,
            }
      }>
      {/* Header */}
      <div style={{ gridRow: 1, background: 'linear-gradient(135deg,var(--app-bg2),#fff)', borderBottom: '1px solid var(--app-border)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div onClick={e => { e.stopPropagation(); editing && !isLocked && onPreset() }} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: editing && !isLocked ? 'pointer' : 'default' }}><PillarGlyph code={pl.emoji} size={16} /></div>
        {editing && !isLocked
          ? <input value={pl.name} onChange={e => onUpdate('name', e.target.value)} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '0.3rem 0.5rem', border: 'none', borderBottom: '1.5px solid var(--app-border)', fontFamily: "'Fraunces',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', outline: 'none', background: 'transparent' }} />
          : <span className="font-display" style={{ fontFamily: "'Fraunces',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', flex: 1 }}>{pl.name}</span>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.35rem', flexShrink: 0 }}>
          {editing && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={e => {
                e.stopPropagation()
                if (window.confirm('Are you sure you want to delete this pillar?')) onDel()
              }}
              aria-label={`Delete ${pl.name}`}
              style={{ width: isMobile ? 44 : 30, height: isMobile ? 44 : 30, borderRadius: 999, background: '#fff3f6', border: '1px solid #f2c7d4', cursor: 'pointer', color: '#d05d86', display: 'grid', placeItems: 'center', padding: 0, boxShadow: 'var(--app-shadow-sm)' }}
            >
              <Trash2 size={14} strokeWidth={2.1} />
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={e => {
              e.stopPropagation()
              onCollapse()
            }}
            aria-label={pl.collapsed ? `Show ${pl.name} plan details` : `Hide ${pl.name} plan details`}
            title={pl.collapsed ? 'Show resources, non-negotiables, activities & outcome' : 'Hide resources, non-negotiables, activities & outcome'}
            style={{ width: isMobile ? 44 : 30, height: isMobile ? 44 : 30, borderRadius: 999, border: '1px solid var(--app-border)', background: '#fff', color: 'var(--app-accent2)', fontSize: '0.8rem', cursor: 'pointer', display: 'grid', placeItems: 'center', padding: 0 }}
          >
            {pl.collapsed ? '▼' : '▲'}
          </motion.button>
        </div>
      </div>

      {/* Vision style photo slots — always visible. The vision board is the point;
          collapsing a pillar only tucks away the plan details below, never this. */}
      <div className="vb-before-after-grid" style={{ gridRow: 2, padding: '0 1.1rem', display: 'grid', gridTemplateColumns: isDestination ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)', gap: isMobile ? '0.75rem' : '0.6rem', alignItems: 'stretch' }}>
        {(isDestination
          ? [
              { slot: 'afterImage', src: pl.afterImage, lbl: 'Destination', sk: 'afterState', dk: 'afterDesc', sv: pl.afterState, dv: pl.afterDesc, bg: '#fff0f4', bc: '#f5c0cc', lc: '#f06090', statePh: 'Who you want to become', descPh: "What getting there looks like, and why it matters — Sage builds your plan from this." },
            ]
          : [
              { slot: 'beforeImage', src: pl.beforeImage, lbl: 'Before', sk: 'beforeState', dk: 'beforeDesc', sv: pl.beforeState, dv: pl.beforeDesc, bg: '#fff8f8', bc: '#f9cdd3', lc: '#8a5060', statePh: 'Where you are right now', descPh: "Describe where you're starting from." },
              { slot: 'afterImage',  src: pl.afterImage,  lbl: 'After',  sk: 'afterState',  dk: 'afterDesc',  sv: pl.afterState,  dv: pl.afterDesc,  bg: '#fff0f4', bc: '#f5c0cc', lc: '#f06090', statePh: 'Who you want to become', descPh: "What getting there looks like — Sage builds your plan from this." },
            ]
        ).map(({ slot, src, lbl, sk, dk, sv, dv, bg, bc, lc, statePh, descPh }) => {
          const isLastSlot = slot === 'afterImage'
          const pasteLinkControl = linkOpen[slot] ? (
                  <input
                    autoFocus
                    value={linkDrafts[slot] || ''}
                    onChange={e => setLinkDrafts(prev => ({ ...prev, [slot]: e.target.value }))}
                    onBlur={e => { onImageLinkUpdate(slot, e.target.value); if (!e.target.value) setLinkOpen(prev => ({ ...prev, [slot]: false })) }}
                    placeholder="Paste image link"
                    style={{ width: '100%', flex: 1, minWidth: 0, padding: isMobile ? '0.5rem 0.55rem' : '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '16px' : '0.72rem', color: 'var(--app-muted)', background: '#fff', outline: 'none' }}
                    onFocus={focus}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setLinkOpen(prev => ({ ...prev, [slot]: true }))}
                    style={{ alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', minHeight: isMobile ? 36 : 'auto', border: 'none', background: 'transparent', color: 'var(--app-accent2)', fontSize: isMobile ? '0.78rem' : '0.7rem', fontWeight: 700, cursor: 'pointer', padding: isMobile ? '0.5rem 0.2rem' : '0.1rem 0', margin: isMobile ? '-0.5rem -0.2rem 0' : 0, fontFamily: "'General Sans',sans-serif", textDecoration: 'underline', textUnderlineOffset: 2 }}
                  >
                    or paste a link
                  </button>
                )
          return (
          <div key={slot} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', height: '100%' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: lc, margin: 0 }}>{lbl}</p>
            {/* Destination is a single 1fr column, so its full width IS the card's
                full width — on a wide single-pillar desktop layout that made the
                16:9 box balloon well past 700px tall, dwarfing everything below
                it. Capping the box's own width (not the column) keeps the photo
                a sane, still-generous size no matter how wide the card gets;
                two-up Before/After columns are already narrow enough to not need this. */}
            <div onClick={() => handleImageTap(slot)} style={{ width: '100%', maxWidth: isDestination ? 640 : 'none', margin: isDestination ? '0 auto' : 0, aspectRatio: isDestination ? '16/9' : '3/4', borderRadius: 'var(--app-radius-md)', background: src ? bg : 'var(--app-bg2)', border: src ? `1px solid ${bc}` : '2px dashed var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: editing ? 'pointer' : 'default', position: 'relative', flexShrink: 0, boxShadow: src ? 'var(--app-shadow-sm)' : 'none' }}>
              {src ? <img src={src} alt={lbl} referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <p style={{ fontSize: '0.7rem', color: 'var(--app-border)', textAlign: 'center', padding: '0.4rem' }}>{editing ? 'tap to upload (optional)' : 'add photo'}</p>}
              {editing && src && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={event => {
                    event.stopPropagation()
                    if (window.confirm('Remove this image?')) onUpdate(slot, null)
                  }}
                  aria-label={`Remove ${lbl} image`}
                  style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', border: '1px solid #f2c7d4', background: 'rgba(255,255,255,0.96)', color: '#d05d86', display: 'grid', placeItems: 'center', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                >
                  ×
                </motion.button>
              )}
            </div>
            {editing && !isLocked ? (
              <>
                <input value={sv} onChange={e => onUpdate(sk, e.target.value)} placeholder={statePh} style={{ width: '100%', padding: isMobile ? '0.5rem 0.55rem' : '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '16px' : '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                <textarea value={dv} onChange={e => onUpdate(dk, e.target.value)} placeholder={descPh} rows={3} style={{ width: '100%', padding: isMobile ? '0.5rem 0.55rem' : '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: isMobile ? '16px' : '0.72rem', color: 'var(--app-muted)', background: '#fff', outline: 'none', resize: 'vertical', lineHeight: 1.4, boxSizing: 'border-box' }} onFocus={focus} onBlur={blur} />
                {isLastSlot ? (
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {pasteLinkControl}
                    {editing && generateButtonBlock}
                  </div>
                ) : pasteLinkControl}
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.78rem', color: 'var(--app-text)', lineHeight: 1.5, margin: 0 }}>{sv}</p>
                {/* Collapsed, this write-up is the only thing left in the card besides
                    the photo — give it a quieter, quote-like presence instead of the
                    small utility-copy treatment it gets alongside a full plan. */}
                <p title={dv || undefined} style={pl.collapsed
                  ? { fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontWeight: 500, fontSize: '0.92rem', color: 'var(--app-accent2)', lineHeight: 1.55, margin: 0, display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
                  : { fontSize: '0.72rem', color: 'var(--app-muted)', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', margin: 0 }
                }>{dv}</p>
                {isLastSlot && editing && (
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: isLocked ? 'space-between' : 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.3rem' }}>
                    {talkToSageBlock}
                    {generateButtonBlock}
                  </div>
                )}
              </>
            )}
          </div>
          )
        })}
      </div>

      {/* Collapsing a pillar hides only these plan-detail sections — resources,
          weekly non-negotiables, activities, outcome. The vision (photos +
          descriptions) and the generate-plan button above always stay visible. */}
      {!pl.collapsed && (
        <>
          <div style={{ gridRow: 3, margin: '0 1.1rem', height: 1, background: 'linear-gradient(to right,transparent,var(--app-border),transparent)' }} />

          {/* List sections */}
          {[
            { lbl: 'Resources',  key: 'resources',  c: 'var(--app-accent2)', m: '•' },
          ].map(({ lbl, key, c, m }) => (
            <div key={key} style={{ gridRow: 4, padding: '0 1.1rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c, marginBottom: '0.38rem' }}>{lbl}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', maxHeight: 200, overflowY: 'auto' }}>
                {pl[key].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                    {editing && !isLocked
                      ? <><input value={item} onChange={e => onUpdateArr(key, i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onDelArr(key, i)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #f5c0cc', background: '#fff0f4', color: 'var(--app-accent)', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', padding: 0, boxShadow: 'var(--app-shadow-sm)' }}>×</motion.button></>
                      : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>{m} {item}</span>
                    }
                  </div>
                ))}
                {editing && !isLocked && <button onClick={() => onAddArr(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'General Sans',sans-serif" }}>+ add item</button>}
              </div>
            </div>
          ))}

          {/* Weekly non-negotiables */}
          <div style={{ gridRow: 5, margin: '0 1.1rem', background: 'linear-gradient(135deg,var(--app-bg2),#fff5f0)', border: '1.5px solid var(--app-border)', borderRadius: 'var(--app-radius-md)', padding: '0.75rem', boxShadow: 'var(--app-shadow-sm)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.5rem' }}>Weekly Non-Negotiables</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', maxHeight: 220, overflowY: 'auto' }}>
              {(Array.isArray(pl.weeklyActions) && pl.weeklyActions.length ? pl.weeklyActions : ['']).map((item, i) => {
                const ck = `${phaseId}-${pl.id}-wk-${i}`
                const safeTask = String(item || '').trim()
                const dayOffset = NON_NEGOTIABLE_DAY_OFFSETS[i % NON_NEGOTIABLE_DAY_OFFSETS.length] ?? 0
                const assignedDate = addDays(calendarWindowStart, dayOffset)
                const assignedDateKey = getTodayKey(assignedDate)
                const calendarUrl = safeTask ? getCalendarUrl(safeTask, pl.name, calendarWindowStart, i) : ''
                const scheduled = Boolean(scheduleState?.[String(i)]?.scheduled)
                const calendarViewUrl = getGoogleCalendarDayViewUrl(assignedDateKey)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.48rem', padding: '0.26rem 0.33rem', borderRadius: 7, cursor: 'pointer' }} onClick={() => !editing && onCheck(ck)}>
                    <input type="checkbox" checked={!!checked[ck]} onChange={() => onCheck(ck)} onClick={e => e.stopPropagation()} style={{ width: 14, height: 14, marginTop: 3, accentColor: 'var(--app-accent)', flexShrink: 0, cursor: 'pointer' }} />
                    {editing && !isLocked
                      ? <><input value={item} onChange={e => onUpdateArr('weeklyActions', i, e.target.value)} style={{ flex: 1, minWidth: 0, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onDelArr('weeklyActions', i)} style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', background: '#fff0f4', border: '1px solid #f5c0cc', cursor: 'pointer', color: 'var(--app-accent)', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1, padding: 0, boxShadow: 'var(--app-shadow-sm)' }}>×</motion.button></>
                      : <>
                          <span style={{ fontSize: '0.8rem', color: checked[ck] ? '#c4a0ac' : '#5a3d47', lineHeight: 1.5, flex: 1, textDecoration: checked[ck] ? 'line-through' : 'none' }}>{item}</span>
                          {calendarUrl ? (
                            scheduled ? (
                              <a
                                href={calendarViewUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={event => event.stopPropagation()}
                                style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, border: '1px solid #f5c0cc', background: '#fff0f4', color: '#c0445a', fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', fontFamily: "'General Sans',sans-serif", textDecoration: 'none' }}
                                title={`Open calendar • ${formatAssignedDateTooltip(assignedDateKey)}`}
                              >
                                <span style={{ fontSize: '0.82rem', lineHeight: 1 }}>📅</span>
                                {formatAssignedDateLabel(assignedDateKey)}
                              </a>
                            ) : (
                              <a
                                href={calendarUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={event => {
                                  event.stopPropagation()
                                   const next = {
                                     ...(scheduleState || {}),
                                     [String(i)]: { scheduled: true, assignedDate: assignedDateKey, calendarUrl, scheduledAt: new Date().toISOString() },
                                   }
                                   setScheduleState(next)
                                   if (userId && weekStartKey) saveNonNegotiableSchedule(scheduleStateKey, next)
                                   window.dispatchEvent(new CustomEvent('phasr-nonnegotiable-schedule-updated', { detail: { phaseId, weekStartKey } }))
                                 }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  padding: '4px 10px', borderRadius: 8,
                                  border: '1px solid #f2c4d0', background: '#fff',
                                  color: '#7a5a66', fontSize: '0.72rem', fontWeight: 700,
                                  textDecoration: 'none', whiteSpace: 'nowrap',
                                  flexShrink: 0,
                                  fontFamily: "'General Sans',sans-serif",
                                }}
                                title={`Schedule for ${formatAssignedDateTooltip(assignedDateKey)}`}
                              >
                                📅 Add
                              </a>
                            )
                          ) : null}
                        </>
                    }
                  </div>
                )
              })}
              {editing && !isLocked && <button onClick={() => onAddArr('weeklyActions')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'General Sans',sans-serif" }}>+ add action</button>}
            </div>
          </div>

          <div style={{ gridRow: 6, padding: '0 1.1rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4773a', marginBottom: '0.38rem' }}>Activities</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem', maxHeight: 200, overflowY: 'auto' }}>
              {pl.activities.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                  {editing && !isLocked
                    ? <><input value={item} onChange={e => onUpdateArr('activities', i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                       <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => onDelArr('activities', i)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #f5c0cc', background: '#fff0f4', color: 'var(--app-accent)', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', padding: 0, boxShadow: 'var(--app-shadow-sm)' }}>×</motion.button></>
                    : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>→ {item}</span>
                  }
                </div>
              ))}
              {editing && !isLocked && <button onClick={() => onAddArr('activities')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'General Sans',sans-serif" }}>+ add item</button>}
            </div>
          </div>

          {/* Outcome */}
          <div style={{ gridRow: 7, padding: '0 1.1rem 1.1rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.38rem' }}>Outcome</p>
            <div style={{ background: 'linear-gradient(135deg,#fff8fb,#fff1f6)', border: '1px solid #f0d6e2', borderRadius: 'var(--app-radius-sm)', padding: '0.5rem 0.7rem', boxShadow: 'var(--app-shadow-sm)' }}>
              {editing && !isLocked
                ? (
                  <textarea
                    rows={3}
                    value={pl.longOutcome || pl.shortOutcome}
                    onChange={e => {
                      onUpdate('shortOutcome', e.target.value)
                      onUpdate('longOutcome', e.target.value)
                    }}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1.5px solid #e8d0f0', borderRadius: 7, fontFamily: "'General Sans',sans-serif", fontSize: '0.78rem', color: '#5a3d60', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 56, lineHeight: 1.5 }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                )
                : <p style={{ fontSize: '0.8rem', color: '#5a3d60', lineHeight: 1.5 }}>{pl.longOutcome || pl.shortOutcome}</p>
              }
            </div>
          </div>
        </>
      )}
    </div>
  )
}
