// src/components/VisionBoard.jsx
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Full vision board â€” phase lock, pillar presets,
// independent collapse (max 3 open), Today's Target,
// before/after upload, quarterly review, export
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

import { useEffect, useRef, useState } from 'react'
import { BookOpen, Briefcase, Dumbbell, Hand, HandHeart, HeartPulse, Home, Sparkles, Trash2, Wallet } from 'lucide-react'
import { buildWeeklyCalendarEvents, downloadCalendarICS, loadCalendarEvents, openCalendarApp, saveCalendarEvents } from '../lib/calendarNotifications'
import { getDailyTaskPlan } from '../lib/lockIn'
import { fetchRealWorldPlan, getSagePlan, saveSagePlan } from '../lib/sageIntelligence'
import { getUserAccess } from '../lib/access'
import phasrMark from '../assets/phasr-mark.png'

const PILLAR_PRESETS = [
  { emoji: 'HF', name: 'Health & Fitness', details: 'Body, food, sleep, gym, energy' },
  { emoji: 'CB', name: 'Career & Business', details: 'Job, entrepreneurship, income streams' },
  { emoji: 'WE', name: 'Wealth', details: 'Savings, investing, debt, financial freedom' },
  { emoji: 'RE', name: 'Relationships', details: 'Love, family, friendships, community' },
  { emoji: 'IL', name: 'Inner Life', details: 'Spirituality, religion, mindfulness, mental health' },
  { emoji: 'PG', name: 'Personal Growth', details: 'Learning, creativity, self-development' },
]

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
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
      }
    }

    cursor = segmentEnd + 1
  }

  const fallbackStart = new Date(year, startMonth, 1)
  const fallbackEnd = new Date(year, 11, 31)
  return {
    startDate: fallbackStart.toISOString().slice(0, 10),
    endDate: fallbackEnd.toISOString().slice(0, 10),
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
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
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

function normalizePillarShape(pillar) {
  return {
    ...freshPillar(pillar?.emoji || 'NP', pillar?.name || 'New Pillar'),
    ...pillar,
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
}

function PillarGlyph({ code, size = 16 }) {
  const Icon = PILLAR_ICONS[code] || Briefcase
  return <Icon size={size} strokeWidth={2} />
}

function freshPillar(emoji = 'NP', name = 'New Pillar') {
  return {
    id: uid(), emoji, name,
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
  const distributedWindow = buildDefaultPhaseWindow(n - 1, FREE_PHASE_LIMIT)
  return {
    id: uid(), name: `Phase ${n}`, period: quarterMeta.period,
    startDate: distributedWindow.startDate, endDate: distributedWindow.endDate,
    timeframeLabel: formatMonthRange(distributedWindow.startDate, distributedWindow.endDate),
    affirmation: 'I am becoming who I was always meant to be.',
    pillars: [
      freshPillar('HF', 'Health & Fitness'),
      freshPillar('CB', 'Career & Business'),
    ],
    impact: 'Write your ultimate transformation for this phase.',
    reviewWorked: '', reviewDrained: '', reviewPaid: '', reviewStrategy: '',
    reviewCollapsed: false,
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
function save(d, user) {
  const key = getBoardStorageKey(user)
  localStorage.setItem(key, JSON.stringify(d))
}

const FREE_PILLAR_LIMIT = 2
const FREE_PHASE_LIMIT = 2
const TODO_STATE_KEY = 'phasr_daily_todo_state'
const MAX_UPLOAD_FILE_BYTES = 5 * 1024 * 1024
const MAX_UPLOAD_WIDTH = 2400
const MAX_UPLOAD_HEIGHT = 2400

const PLAN_EDIT_KEYS = new Set(['resources', 'activities', 'weeklyActions', 'outputs', 'shortOutcome', 'longOutcome'])

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
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
      <title>${escapeHtml(snapshot.name)} - Phasr</title>
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
          <img src="${brandUrl}" alt="Phasr" />
          <div>
            <div class="section-label">Weekly export</div>
            <h1>Phasr</h1>
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
            <div class="cta">Update your progress inside Phasr</div>
          </div>
          <div class="qr-wrap">
            <img src="${qrUrl}" alt="QR code" />
            <div>Check in daily with Sage to build momentum</div>
          </div>
        </div>
        <div class="foot">This plan is valid for one week. Create your next phase inside Phasr.</div>
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
    <text x="140" y="96" font-size="32" font-family="Arial, sans-serif" font-weight="700" fill="#7a2a4a">Phasr</text>
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
    <text x="660" y="1191" text-anchor="middle" font-size="24" font-family="Arial, sans-serif" font-weight="700" fill="#fff">Update your progress inside Phasr</text>
    <text x="540" y="1278" text-anchor="middle" font-size="18" font-family="Arial, sans-serif" fill="#8f6777">This plan is valid for one week. Create your next phase inside Phasr.</text>
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
  return Boolean(cleanText(pillar?.beforeState) && cleanText(pillar?.afterState))
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

function detectPlanType(pillar) {
  const text = [
    pillar.name,
    pillar.beforeState,
    pillar.afterState,
    pillar.beforeDesc,
    pillar.afterDesc,
  ].map(cleanText).join(' ').toLowerCase()

  if (/relocat|visa|passport|dubai|move abroad|working in|living in|job/.test(text)) return 'relocation'
  if (/fit|weight|gym|health|body|meal|exercise/.test(text)) return 'fitness'
  if (/save|debt|income|money|finance|wealth|budget|invest/.test(text)) return 'finance'
  if (/relationship|marriage|partner|dating|love/.test(text)) return 'relationship'
  if (/travel|trip|country|vacation/.test(text)) return 'travel'
  if (/spiritual|faith|prayer|god|mindful|meditat/.test(text)) return 'mindset'
  if (/creative|design|content|write|art|brand/.test(text)) return 'creative'
  if (/career|promotion|work|business|client|role/.test(text)) return 'career'
  return 'general'
}

function buildGeneratedPlan(pillar, isPro) {
  const before = cleanText(pillar.beforeState)
  const after = cleanText(pillar.afterState)
  const description = getPlanDescription(pillar)
  const cap = isPro ? 8 : 4
  const type = detectPlanType(pillar)
  const targetLabel = after || pillar.name || 'this goal'
  const generationOffset = Number(pillar.planGenerationCount || 0)

  const templates = {
    relocation: {
      resources: ['Passport', 'Target-market CV', 'Visa and permit information', 'Job platforms and recruiter list', 'Relocation budget', 'Proof of experience'],
      activities: ['Update your CV for the target market', 'Apply for roles in the target location every weekday', 'Research visa and permit steps', 'Reach out to recruiters or contacts in the target city', 'Track every application in one sheet', 'Practice interview answers for the move'],
      weeklyActions: ['Apply to 20 jobs per week', 'Reach out to 5 contacts or recruiters', 'Complete 1 visa or document step', 'Review your relocation budget once a week', 'Practice 1 interview session', 'Update your application tracker'],
      outputs: ['Applications sent', 'Recruiter replies', 'Documents completed', 'Interviews booked', 'Contacts made', 'Budget progress tracked'],
      shortOutcome: 'You complete your documents and start getting real responses.',
      longOutcome: `You secure a role and move toward ${targetLabel}.`,
    },
    fitness: {
      resources: ['Walking shoes', 'Simple strength plan', 'Protein-first meal structure', 'Workout tracker or notes app', 'Body progress tracker', 'Gym access or resistance bands'],
      activities: ['Do a 5 to 10 minute warm-up before every workout, like brisk walking, light jogging, skipping, or cycling.', 'Complete 3 sets of 8 to 12 push-ups, using incline push-ups if needed so the reps stay clean.', 'Do 3 sets of 10 to 12 lower-body reps, like squats, glute bridges, reverse lunges, or step-ups.', 'Finish with 20 to 30 minutes of brisk walking, treadmill incline, cycling, or steady cardio.', 'Build each main meal around protein, vegetables, and enough water so training recovery is actually supported.', 'Log each workout, body weight, or measurements once the session is done so the plan stays tied to real progress.'],
      weeklyActions: ['Measure your weight, waist, or progress photos once this week.', 'Complete your planned workout blocks for the week and move missed sessions before Sunday.', 'Prep your food for your busiest days so workouts are supported by what you eat.', 'Review your workouts and next week’s schedule before Sunday night.', 'Protect your sleep and recovery on work nights so training does not keep restarting.', 'Keep workout clothes, shoes, and water ready before the next session.'],
      outputs: ['Workouts completed', 'Meals prepared', 'Steps logged', 'Weight or measurements tracked', 'Progress photos taken', 'Weekly adherence score'],
      shortOutcome: 'You build consistency and start seeing visible physical progress.',
      longOutcome: `You reach a healthier and stronger version of ${targetLabel}.`,
    },
    finance: {
      resources: ['Budget tracker', 'Income plan', 'Debt or savings target', 'Banking tools', 'Expense review system', 'Weekly money check-in'],
      activities: ['Track every key expense', 'Cut low-value spending', 'Increase income through one focused channel', 'Automate savings where possible', 'Review financial decisions weekly', 'Use one clear target number'],
      weeklyActions: ['Review spending once a week', 'Transfer money into savings every week', 'Complete 1 income-building action', 'Log every major expense', 'Check progress against your target', 'Remove one unnecessary cost'],
      outputs: ['Savings balance', 'Debt paid down', 'Expenses tracked', 'Income actions completed', 'Weekly budget reviews', 'Target gap reduced'],
      shortOutcome: 'You get control of your cash flow and make visible financial progress.',
      longOutcome: `You build a stable path toward ${targetLabel}.`,
    },
    relationship: {
      resources: ['Clear standards', 'Communication plan', 'Time blocks', 'Reflection journal', 'Boundaries list', 'Support system'],
      activities: ['Define what a healthy relationship looks like', 'Communicate directly and consistently', 'Create quality time on purpose', 'Review patterns after key conversations', 'Set or reinforce boundaries', 'Ask for support when needed'],
      weeklyActions: ['Have 1 honest check-in each week', 'Protect 1 quality-time block', 'Reflect on 1 pattern you want to improve', 'Practice one clear communication habit', 'Follow one boundary consistently', 'Notice and log progress'],
      outputs: ['Check-ins completed', 'Quality-time blocks protected', 'Conflict reduced', 'Patterns recorded', 'Boundaries kept', 'Trust-building actions completed'],
      shortOutcome: 'You create more clarity and consistency in the relationship.',
      longOutcome: `You build the kind of relationship that matches ${targetLabel}.`,
    },
    travel: {
      resources: ['Destination research', 'Travel budget', 'Documents', 'Booking tracker', 'Timeline', 'Priority list'],
      activities: ['Research the destination properly', 'Price flights and accommodation', 'Set a savings target', 'Complete required documents', 'Track bookings and deadlines', 'Build a clear travel timeline'],
      weeklyActions: ['Save toward the trip every week', 'Complete 1 booking or document step', 'Review prices once a week', 'Track your budget weekly', 'Confirm one key detail', 'Update your travel checklist'],
      outputs: ['Amount saved', 'Documents completed', 'Bookings confirmed', 'Budget tracked', 'Checklist progress', 'Trip dates locked'],
      shortOutcome: 'You move from idea to an organised travel plan.',
      longOutcome: `You make ${targetLabel} real and executable.`,
    },
    mindset: {
      resources: ['Quiet time', 'Journal', 'Guided practice', 'Habit tracker', 'Reflection prompts', 'Supportive environment'],
      activities: ['Create a daily reflection rhythm', 'Practice one calming or grounding habit', 'Reduce distractions that break focus', 'Write what you are learning', 'Review emotional patterns', 'Protect time for stillness'],
      weeklyActions: ['Complete 5 reflection sessions per week', 'Journal 3 times per week', 'Review 1 repeating pattern', 'Protect 1 long reset block', 'Track your consistency', 'Remove 1 trigger that drains focus'],
      outputs: ['Sessions completed', 'Journal entries saved', 'Patterns identified', 'Calmer responses logged', 'Consistency streak', 'Weekly reflection notes'],
      shortOutcome: 'You feel more grounded and intentional week by week.',
      longOutcome: `You become the version of yourself that can sustain ${targetLabel}.`,
    },
    creative: {
      resources: ['Creative tools', 'Project space', 'Reference material', 'Publishing platform', 'Feedback loop', 'Content tracker'],
      activities: ['Create on a fixed schedule', 'Ship work publicly or to a reviewer', 'Collect references with intention', 'Refine your process weekly', 'Review what performs best', 'Finish small pieces consistently'],
      weeklyActions: ['Complete 3 creation sessions per week', 'Ship 1 piece of work weekly', 'Review feedback once a week', 'Track progress in one place', 'Refine 1 weak part of the process', 'Protect your creative block'],
      outputs: ['Pieces completed', 'Hours created', 'Feedback received', 'Posts or projects shipped', 'Portfolio growth', 'Weekly progress log'],
      shortOutcome: 'You create visible finished work instead of staying in ideas.',
      longOutcome: `You build a strong body of work around ${targetLabel}.`,
    },
    career: {
      resources: ['Updated CV or portfolio', 'Role criteria', 'Target-company list', 'Networking list', 'Interview examples', 'Progress tracker'],
      activities: ['Clarify the role you want', 'Improve your CV or portfolio', 'Apply with consistency', 'Reach out to relevant people', 'Prepare interview stories', 'Track progress weekly'],
      weeklyActions: ['Apply to 10 quality roles per week', 'Reach out to 3 people each week', 'Improve 1 part of your portfolio', 'Review feedback weekly', 'Prepare 1 interview story', 'Track your pipeline'],
      outputs: ['Applications sent', 'Conversations started', 'Portfolio updates completed', 'Interviews booked', 'Pipeline tracked', 'Feedback collected'],
      shortOutcome: 'You get clearer direction and stronger opportunities.',
      longOutcome: `You move toward ${targetLabel} with a stronger career path.`,
    },
    general: {
      resources: ['Clear goal definition', 'Time blocks', 'Tracking system', 'Support or accountability', 'Useful tools', 'Simple review rhythm'],
      activities: ['Break the goal into small actions', 'Schedule the actions into your week', 'Track progress visibly', 'Remove friction around the goal', 'Review progress weekly', 'Adjust what is not working'],
      weeklyActions: ['Complete 3 focused actions per week', 'Review progress once a week', 'Track proof of work in one place', 'Protect one non-negotiable block', 'Remove one blocker each week', 'Reset the plan every Sunday'],
      outputs: ['Tasks completed', 'Weekly reviews done', 'Proof of work logged', 'Consistency streak', 'Blocked issues reduced', 'Visible progress recorded'],
      shortOutcome: 'You stop guessing and start moving with structure.',
      longOutcome: `You make real progress toward ${targetLabel}.`,
    },
  }

  const template = templates[type] || templates.general

  const detailedActivitiesByType = {
    relocation: [
      'Apply to quality roles in your target city every weekday and tailor your CV before sending.',
      'Spend 30 minutes daily researching visa or sponsorship steps for your exact route.',
      'Reach out to recruiters or contacts three times a week and ask for role or relocation guidance.',
      'Track every application, reply, and required document in one simple sheet.',
    ],
    fitness: [
      'Start each workout with a 5 to 10 minute warm-up like brisk walking, jogging in place, skipping, or light cycling.',
      'Do push-ups for 3 sets of 8 to 12 reps, using incline or knee support if you need cleaner form.',
      'Train lower body with 3 sets of 10 to 12 reps of squats, glute bridges, reverse lunges, or step-ups.',
      'Finish with 20 to 30 minutes of walking, treadmill incline, cycling, or another steady cardio block.',
      'Prep protein-first meals for your busiest days so the workout effort is supported by food, not guesswork.',
      'Log the workout, steps, and one body metric so the plan responds to real numbers instead of mood.',
    ],
    finance: [
      'Track spending daily so you know exactly where your money is leaking.',
      'Review your budget twice a week and move money toward savings before optional spending.',
      'Complete one income-building action three times a week, like pitching, applying, or following up.',
      'Check your debt or savings target every week and reduce one weak spending habit at a time.',
    ],
    relationship: [
      'Have one honest check-in every week instead of waiting for tension to build.',
      'Protect one intentional quality-time block every week and show up fully for it.',
      'Reflect after hard conversations so you can spot patterns and respond better next time.',
      'Practice one clear boundary consistently so trust and stability improve over time.',
    ],
    travel: [
      'Research one major travel requirement each week until the whole move or trip is clear.',
      'Save toward the trip every week and track the amount visibly.',
      'Complete one booking or document task each week so the plan keeps moving.',
      'Review your route, timeline, and budget weekly so nothing piles up last minute.',
    ],
    mindset: [
      'Journal or reflect for 10 minutes at least three times a week so your thinking gets clearer.',
      'Protect one longer reset block weekly for prayer, meditation, or stillness.',
      'Notice one repeated trigger each week and write how you want to respond differently.',
      'Practice one grounding habit daily so calm becomes easier to access.',
    ],
    creative: [
      'Block at least three creation sessions every week and finish something in each one.',
      'Ship one piece of work weekly even if it is not perfect.',
      'Review what worked after each session so your process improves faster.',
      'Keep your ideas, drafts, and feedback in one place so progress stays visible.',
    ],
    career: [
      'Apply to focused roles three to five times a week instead of applying randomly.',
      'Improve one part of your CV, portfolio, or interview story every week.',
      'Reach out to relevant people consistently and ask specific questions or make clear asks.',
      'Track your applications and follow up on promising leads instead of waiting passively.',
    ],
    general: [
      'Break the goal into small tasks and complete at least three focused actions each week.',
      'Protect time for the goal three times a week so it stops getting pushed aside.',
      'Track progress visibly and review what is working every Sunday.',
      'Remove one blocker each week instead of tolerating the same friction repeatedly.',
    ],
  }

  const scheduledWeeklyActionsByType = {
    relocation: ['Apply to five targeted roles', 'Follow up with two recruiters or contacts', 'Complete one visa or document step', 'Review your relocation tracker and next blockers'],
    fitness: ['Measure your body once this week and log the number', 'Complete your planned workout blocks before the week closes', 'Prep your meals for the busiest three days', 'Review your workouts and lock next week into the calendar'],
    finance: ['Log every major expense from the weekend', 'Do one income-building action', 'Transfer money toward the goal account', 'Review spending against the target number'],
    relationship: ['Plan one quality-time block', 'Have one direct check-in conversation', 'Note one pattern to stop repeating', 'Reset boundaries and expectations for the week'],
    travel: ['Research one required document or rule', 'Save or move money into the travel fund', 'Complete one booking or admin task', 'Review deadlines, prices, and missing steps'],
    mindset: ['Journal one page on the week ahead', 'Protect one no-phone reset block', 'Note one trigger and your replacement response', 'Review what made you calmer or more reactive'],
    creative: ['Start one focused creation session', 'Ship or publish one small piece', 'Review feedback or performance data', 'Plan next week’s creation blocks'],
    career: ['Send two strong applications', 'Reach out to one relevant person', 'Improve one portfolio, CV, or interview asset', 'Review your pipeline and next follow-ups'],
    general: ['Do the hardest 30-minute step first', 'Remove one blocker from the environment', 'Finish one measurable task', 'Review proof of progress and reset the week'],
  }

  const measurableOutputsByType = {
    relocation: ['Applications sent this week', 'Recruiter replies logged', 'Visa or document steps completed', 'Amount saved toward relocation', 'Interviews booked'],
    fitness: ['Workouts completed this week', 'Meals prepped this week', 'Daily step streak', 'Weight or measurements logged', 'Sleep target met'],
    finance: ['Expenses logged this week', 'Amount moved into the goal account', 'Income-building actions completed', 'Subscriptions or leaks removed', 'Weekly budget review completed'],
    relationship: ['Check-in conversations completed', 'Quality-time blocks kept', 'Conflicts de-escalated faster', 'Boundaries followed this week', 'Reflection notes logged'],
    travel: ['Amount saved toward the trip', 'Required documents completed', 'Bookings confirmed', 'Checklist items cleared', 'Deadlines reviewed on time'],
    mindset: ['Journal entries completed', 'Reset blocks protected', 'Trigger notes logged', 'Reactive moments reduced', 'Weekly review completed'],
    creative: ['Creation sessions finished', 'Pieces shipped', 'Feedback rounds completed', 'Hours spent making', 'Ideas moved to finished work'],
    career: ['Applications sent', 'Follow-ups completed', 'Portfolio updates shipped', 'Networking messages sent', 'Interviews or calls booked'],
    general: ['Focused sessions completed', 'Tasks finished this week', 'Weekly review completed', 'Blockers removed', 'Proof of progress logged'],
  }

  const outcomesByType = {
    relocation: {
      short: `In 4 to 6 weeks, you have a live tracker, an active visa path, and documented proof that the move from ${before || 'your current setup'} toward ${targetLabel} is already underway.`,
      long: `By the end of this phase, ${targetLabel} feels real in your body, not just in your head. You are no longer hoping life changes somehow. You have built the proof, the movement, and the courage to step into it.`,
    },
    fitness: {
      short: `In 4 to 6 weeks, your meals, training times, and recovery are no longer random. The gap between ${before || 'your current body'} and ${targetLabel} is being closed by a repeatable weekly routine.`,
      long: `By the end of this phase, ${targetLabel} stops feeling far away. You feel stronger in your body, steadier in your choices, and proud of the way you keep showing up for yourself.`,
    },
    finance: {
      short: `In 4 to 6 weeks, money has a job before it is spent. You can point to a target account, a cleaner expense pattern, and weekly actions that move you from ${before || 'financial noise'} toward ${targetLabel}.`,
      long: `By the end of this phase, money feels less like fear and more like power. ${targetLabel} is no longer a fragile wish. It is something you are steadily building with discipline and self-trust.`,
    },
    relationship: {
      short: `In 4 to 6 weeks, communication is more direct, time together is protected, and the shift from ${before || 'distance or confusion'} toward ${targetLabel} is visible in actual conversations and habits.`,
      long: `By the end of this phase, ${targetLabel} feels safer, clearer, and more honest. You can feel the difference in the way love is handled, protected, and chosen with intention.`,
    },
    travel: {
      short: `In 4 to 6 weeks, the travel plan has dates, costs, and required documents attached to it. You are no longer just thinking about ${targetLabel}; you are building the route there.`,
      long: `By the end of this phase, ${targetLabel} feels close enough to touch. The details are no longer overwhelming because you turned the dream into a plan that can carry you there.`,
    },
    mindset: {
      short: `In 4 to 6 weeks, your reactions are easier to predict because you have cues, reflection time, and a record of what throws you off. The shift away from ${before || 'mental noise'} toward ${targetLabel} shows up in how you respond each day.`,
      long: `By the end of this phase, ${targetLabel} feels deeper than a mood. You feel more rooted, more present, and more able to hold your own peace without losing yourself in the noise.`,
    },
    creative: {
      short: `In 4 to 6 weeks, you have shipped real work, not just ideas. The move from ${before || 'unfinished drafts'} toward ${targetLabel} is visible in finished pieces, not intention.`,
      long: `By the end of this phase, ${targetLabel} feels alive because your ideas are no longer trapped inside you. You can see your voice, your work, and your courage taking up real space in the world.`,
    },
    career: {
      short: `In 4 to 6 weeks, your role target is sharper, your materials are stronger, and the move from ${before || 'career drift'} toward ${targetLabel} is visible in applications, conversations, and follow-ups.`,
      long: `By the end of this phase, ${targetLabel} feels earned. You are no longer standing still or waiting to be noticed. You are building the kind of presence and momentum that opens real doors.`,
    },
    general: {
      short: `In 4 to 6 weeks, the goal is no longer floating in your head. It has recurring actions, visible progress, and fewer loose ends between ${before || 'where things are now'} and ${targetLabel}.`,
      long: `By the end of this phase, ${targetLabel} feels possible in a new way. Not because you got lucky, but because you kept choosing it until the life you wanted started taking shape around you.`,
    },
  }

  const alternateOutcomesByType = {
    relocation: {
      short: `In 4 to 6 weeks, your move is being handled like a project. The route from ${before || 'your current location'} to ${targetLabel} now has tracked applications, document progress, and fewer unknowns.`,
      long: `By the end of this phase, ${targetLabel} no longer feels like something you only talk about. It feels like a future you are brave enough and prepared enough to claim.`,
    },
    fitness: {
      short: `In 4 to 6 weeks, the plan is visible in your week. Training, meals, and recovery are showing up often enough that ${targetLabel} no longer depends on motivation.`,
      long: `By the end of this phase, ${targetLabel} feels less like pressure and more like proof of what happens when you stop abandoning yourself and start backing your own growth.`,
    },
    finance: {
      short: `In 4 to 6 weeks, your money decisions are easier to read. The move from ${before || 'financial pressure'} toward ${targetLabel} is now backed by a pattern of tracking, saving, and follow-through.`,
      long: `By the end of this phase, ${targetLabel} carries a different feeling. You feel more secure, more in control, and more certain that your future is no longer being left to chance.`,
    },
    relationship: {
      short: `In 4 to 6 weeks, the relationship has more structure. The movement from ${before || 'mixed signals'} toward ${targetLabel} shows up in clearer conversations, boundaries, and time that is actually protected.`,
      long: `By the end of this phase, ${targetLabel} feels more emotionally real. There is more honesty, more steadiness, and more of the kind of connection that lets your heart exhale.`,
    },
    travel: {
      short: `In 4 to 6 weeks, the plan has moved beyond dreaming. ${targetLabel} now has savings attached to it, tasks scheduled, and fewer missing details.`,
      long: `By the end of this phase, ${targetLabel} feels exciting for the right reason. You are not scrambling. You are ready, clear, and already living like the move matters.`,
    },
    mindset: {
      short: `In 4 to 6 weeks, your inner life feels more trackable. The move from ${before || 'reactivity'} toward ${targetLabel} is visible in the way you pause, reflect, and recover.`,
      long: `By the end of this phase, ${targetLabel} feels like a version of peace you can actually keep. You trust yourself more, and that changes the tone of your whole life.`,
    },
    creative: {
      short: `In 4 to 6 weeks, your ideas are turning into visible output. The gap between ${before || 'thinking about it'} and ${targetLabel} is closing because work is being finished and shipped.`,
      long: `By the end of this phase, ${targetLabel} feels bigger than a dream. It feels like your work is finally meeting the world, and you can feel your confidence growing with every piece you finish.`,
    },
    career: {
      short: `In 4 to 6 weeks, your career push has proof behind it. The shift from ${before || 'standing still'} toward ${targetLabel} is visible in a stronger pipeline, sharper materials, and better follow-up.`,
      long: `By the end of this phase, ${targetLabel} feels like a direction with weight behind it. You can feel your confidence returning because your effort is finally matching the future you want.`,
    },
    general: {
      short: `In 4 to 6 weeks, the goal is more concrete because it now lives inside your real schedule. The move from ${before || 'wanting change'} toward ${targetLabel} is visible in repeated actions and clearer proof.`,
      long: `By the end of this phase, ${targetLabel} feels less distant and more yours. You have built enough proof to believe yourself again, and that changes how you move through every week.`,
    },
  }

  const resources = compactList([
    ...rotateList(template.resources, generationOffset),
    (pillar.beforeImage || pillar.afterImage) && 'Use the photo as a weekly reality check so the plan stays tied to what is actually changing.',
    description && `Goal context: ${description}`,
  ], cap)

  const activities = compactList(rotateList(detailedActivitiesByType[type] || detailedActivitiesByType.general, generationOffset), cap)
  const weeklyActions = compactList(rotateList(scheduledWeeklyActionsByType[type] || scheduledWeeklyActionsByType.general, generationOffset), cap)
  const outputs = compactList(rotateList(measurableOutputsByType[type] || measurableOutputsByType.general, generationOffset), Math.max(3, cap))
  const outcomeVariants = [outcomesByType[type] || outcomesByType.general, alternateOutcomesByType[type] || alternateOutcomesByType.general]
  const outcomes = outcomeVariants[generationOffset % outcomeVariants.length]

  return {
    resources,
    activities,
    weeklyActions,
    outputs,
    shortOutcome: outcomes.short,
    longOutcome: outcomes.long,
  }
}

/* â”€â”€ Shared input styles â”€â”€ */
const inp = (extra = {}) => ({
  width: '100%', padding: '0.38rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  marginBottom: '0.28rem', transition: 'border-color 0.2s',
  ...extra,
})
const ta = (extra = {}) => ({
  width: '100%', padding: '0.4rem 0.6rem',
  border: '1.5px solid var(--app-border)', borderRadius: 8,
  fontFamily: "'DM Sans',sans-serif", fontSize: '0.8rem',
  color: 'var(--app-text)', background: '#fff', outline: 'none',
  resize: 'vertical', minHeight: 56, lineHeight: 1.5,
  transition: 'border-color 0.2s', ...extra,
})
const focus = e => { e.target.style.borderColor = 'var(--app-accent)' }
const blur  = e => { e.target.style.borderColor = 'var(--app-border)' }

function formatCalendarSpot(dateKey) {
  if (!dateKey) return ''
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export default function VisionBoard({ user, lockInSummary, editing: editingProp, onEditingChange, onOpenDailyStreak }) {
  const isPro = getUserAccess(user).isPro

  const [data, setData] = useState(() =>
    normalizeBoardData(load(user) || { boardTitle: 'My Vision Board', phases: [freshPhase(1)] })
  )
  const [phaseId,    setPhaseId]    = useState(() => normalizeBoardData(load(user) || { phases: [freshPhase(1)] }).phases[0]?.id)
  const [editingState, setEditingState] = useState(false)
  const [checked,    setChecked]    = useState({})
  const [presetOpen, setPresetOpen] = useState(null)
  const [timelineEditorPhaseId, setTimelineEditorPhaseId] = useState(null)
  const [timelineDrafts, setTimelineDrafts] = useState({})
  const [calendarEvents, setCalendarEvents] = useState(() => loadCalendarEvents())
  const [calendarBusy, setCalendarBusy] = useState(false)
  const [calendarPromptState, setCalendarPromptState] = useState('hidden')
  const [calendarPromptArmed, setCalendarPromptArmed] = useState(false)
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false)
  const [showReview, setShowReview] = useState(false)
  const [sagePlanRefresh, setSagePlanRefresh] = useState(0)
  const [revealedDeleteTarget, setRevealedDeleteTarget] = useState(null)
  const [uploadMessage, setUploadMessage] = useState('')
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

  useEffect(() => {
    setPresetOpen(null)
  }, [editing])

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
    if (!isMobile) setShowReview(false)
  }, [isMobile])

  useEffect(() => {
    let cancelled = false

    async function syncSagePlans() {
      for (const ph of data.phases || []) {
        for (const pillar of ph.pillars || []) {
          const goalText = [pillar.name, pillar.afterState, pillar.afterDesc].map(cleanText).filter(Boolean).join(' - ')
          if (!goalText || getSagePlan(pillar.id)) continue

          try {
            const plan = isPro
              ? await fetchRealWorldPlan(goalText)
              : {
                  resources: buildGeneratedPlan(pillar, false).resources,
                  activities: buildGeneratedPlan(pillar, false).activities.map((description, index) => ({ week: index + 1, description })),
                  weeklyNonNegotiables: buildGeneratedPlan(pillar, false).weeklyActions.slice(0, 4),
                  outputs: buildGeneratedPlan(pillar, false).outputs,
                  shortTermOutcome: buildGeneratedPlan(pillar, false).shortOutcome,
                  longTermOutcome: buildGeneratedPlan(pillar, false).longOutcome,
                  locked: true,
                }

            saveSagePlan(pillar.id, {
              ...plan,
              generatedAt: new Date().toISOString(),
              generatedBySage: true,
              locked: !isPro,
            })

            if (!cancelled && isPro) {
              upd(d => {
                const target = d.phases.flatMap(item => item.pillars || []).find(item => item.id === pillar.id)
                if (!target) return d
                target.resources = plan.resources?.length ? plan.resources : ['']
                target.activities = plan.activities?.length ? plan.activities.map(item => item.description || item) : ['']
                target.weeklyActions = plan.weeklyNonNegotiables?.length ? plan.weeklyNonNegotiables.map(item => item.description || item) : ['']
                target.outputs = plan.outputs?.length ? plan.outputs : ['']
                target.shortOutcome = plan.shortTermOutcome || target.shortOutcome
                target.longOutcome = plan.longTermOutcome || target.longOutcome
                target.planGeneratedFrom = getPlanSignature(target)
                target.planGenerationTier = 'pro'
                target.planWasEdited = false
                return d
              })
            }
          } catch {
            // Keep local fallback behavior if API generation fails.
          }
        }
      }

      if (!cancelled) setSagePlanRefresh(value => value + 1)
    }

    syncSagePlans()
    return () => {
      cancelled = true
    }
  }, [data, isPro])

  function upd(fn) {
    setData(prev => {
      const next = normalizeBoardData(fn(JSON.parse(JSON.stringify(prev))))
        save(next, user)
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
  const visiblePillars = !isPro && !editing
    ? (phase?.pillars || []).slice(0, FREE_PILLAR_LIMIT)
    : (phase?.pillars || [])
  const exportPillars = phase?.pillars || []
  const selectedExportPillar = exportPillars.find(item => item.id === selectedExportPillarId) || null
  const exportPhaseLabel = `${phase?.name || 'Phase 1'} · W1`
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

  /* â”€â”€ Mutations â”€â”€ */
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
      if (['beforeState', 'afterState', 'beforeDesc', 'afterDesc', 'beforeImage', 'afterImage'].includes(key)) {
        const signature = getPlanSignature(pl)
        if (hasVisualPlanInputs(pl) && pl.planGeneratedFrom !== signature && (!pl.planWasEdited || isPlanBlank(pl))) {
          const generated = buildGeneratedPlan(pl, isPro)
          pl.resources = generated.resources.length ? generated.resources : ['']
          pl.activities = generated.activities.length ? generated.activities : ['']
          pl.weeklyActions = generated.weeklyActions.length ? generated.weeklyActions : ['']
          pl.outputs = generated.outputs.length ? generated.outputs : ['']
          pl.shortOutcome = generated.shortOutcome
          pl.longOutcome = generated.longOutcome
          pl.planGeneratedFrom = signature
          pl.planGenerationTier = isPro ? 'pro' : 'free'
          pl.planWasEdited = false
        }
      }
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
    if (!isPro && (phase?.pillars?.length || 0) >= FREE_PILLAR_LIMIT) return
    upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph) ph.pillars.push(freshPillar()); return d })
  }
  const delPillar  = (plId) => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph && ph.pillars.length > 1) ph.pillars = ph.pillars.filter(p => p.id !== plId); return d })
  const maybeGeneratePlan = plId => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (!pl) return d

    const signature = getPlanSignature(pl)
    const hasRequiredInputs = hasVisualPlanInputs(pl)
    if (!hasRequiredInputs) return d

    if (pl.planGeneratedFrom === signature && !isPlanBlank(pl)) return d
    if (pl.planWasEdited && !isPlanBlank(pl)) return d

    const generated = buildGeneratedPlan(pl, isPro)
    pl.resources = generated.resources.length ? generated.resources : ['']
    pl.activities = generated.activities.length ? generated.activities : ['']
    pl.weeklyActions = generated.weeklyActions.length ? generated.weeklyActions : ['']
    pl.outputs = generated.outputs.length ? generated.outputs : ['']
    pl.shortOutcome = generated.shortOutcome
    pl.longOutcome = generated.longOutcome
    pl.planGeneratedFrom = signature
    pl.planGenerationTier = isPro ? 'pro' : 'free'
    pl.planWasEdited = false
    return d
  })
  const forceGeneratePlan = plId => upd(d => {
    const pl = d.phases.find(p => p.id === phaseId)?.pillars.find(p => p.id === plId)
    if (!pl) return d
    const hasRequiredInputs = hasVisualPlanInputs(pl)
    if (!hasRequiredInputs) return d
    pl.planGenerationCount = Number(pl.planGenerationCount || 0) + 1
    const generated = buildGeneratedPlan(pl, isPro)
    pl.resources = generated.resources.length ? generated.resources : ['']
    pl.activities = generated.activities.length ? generated.activities : ['']
    pl.weeklyActions = generated.weeklyActions.length ? generated.weeklyActions : ['']
    pl.outputs = generated.outputs.length ? generated.outputs : ['']
    pl.shortOutcome = generated.shortOutcome
    pl.longOutcome = generated.longOutcome
    pl.planGeneratedFrom = getPlanSignature(pl)
    pl.planGenerationTier = isPro ? 'pro' : 'free'
    pl.planWasEdited = false
    return d
  })
  const toggleReviewCollapse = () => upd(d => { const ph = d.phases.find(p => p.id === phaseId); if (ph) ph.reviewCollapsed = !ph.reviewCollapsed; return d })
  const finalizeGeneratedPlans = () => upd(d => {
    const ph = d.phases.find(p => p.id === phaseId)
    if (!ph) return d
    ph.pillars.forEach(pl => {
      const hasRequiredInputs = hasVisualPlanInputs(pl)
      if (!hasRequiredInputs) return
      const generated = buildGeneratedPlan(pl, isPro)
      pl.resources = generated.resources.length ? generated.resources : ['']
      pl.activities = generated.activities.length ? generated.activities : ['']
      pl.weeklyActions = generated.weeklyActions.length ? generated.weeklyActions : ['']
      pl.outputs = generated.outputs.length ? generated.outputs : ['']
      pl.shortOutcome = generated.shortOutcome
      pl.longOutcome = generated.longOutcome
      pl.planGeneratedFrom = getPlanSignature(pl)
      pl.planGenerationTier = isPro ? 'pro' : 'free'
      pl.planWasEdited = false
    })
    return d
  })
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

  function handleEditingToggle() {
    if (editing) {
      finalizeGeneratedPlans()
      setCalendarPromptArmed(true)
      setEditing(false)
      return
    }
    setEditing(true)
  }

  const addPhase   = () => {
    if (!isPro && data.phases.length >= FREE_PHASE_LIMIT) return
    upd(d => { const p = freshPhase(d.phases.length + 1); d.phases.push(p); setPhaseId(p.id); return d })
  }
  const delPhase   = (pid) => {
    if (data.phases.length <= 1) return
    upd(d => { d.phases = d.phases.filter(p => p.id !== pid); setPhaseId(d.phases[0].id); return d })
  }

  const applyPreset = (plId, preset) => {
    updatePillar(plId, 'emoji', preset.emoji)
    updatePillar(plId, 'name',  preset.name)
    setPresetOpen(null)
  }

  const toggleCheck = (key) => setChecked(prev => ({ ...prev, [key]: !prev[key] }))

  async function addToCalendarPlan() {
    if (calendarBusy) return
    const next = buildWeeklyCalendarEvents({ ...data, activePhaseId: phaseId })
    if (!next.length) {
      window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
        detail: {
          title: 'No tasks to sync',
          message: 'Add weekly non-negotiables first, then sync your calendar.',
        },
      }))
      return
    }
    let result = { method: 'unsupported' }
    setCalendarBusy(true)
    try {
      saveCalendarEvents(next)
      setCalendarEvents(next)
      result = await openCalendarApp(next)
    } finally {
      setCalendarBusy(false)
    }
    window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
      detail: {
        title: result.method === 'share' ? 'Calendar ready' : result.method === 'cancelled' ? 'Calendar not added yet' : 'Calendar handoff unavailable',
        message: result.method === 'share'
          ? 'Your phone can now hand this plan to Calendar with reminders.'
          : result.method === 'cancelled'
            ? 'The add flow was cancelled. You can try again or download the calendar file instead.'
            : 'This browser cannot hand the plan directly to your calendar app. Use Download if you want the calendar file.',
      },
    }))
  }

  function downloadCalendarPlan() {
    const next = buildWeeklyCalendarEvents({ ...data, activePhaseId: phaseId })
    if (!next.length) return
    saveCalendarEvents(next)
    downloadCalendarICS(next)
    setCalendarEvents(next)
    window.dispatchEvent(new CustomEvent('phasr-calendar-feedback', {
      detail: {
        title: 'Calendar downloaded',
        message: 'Your current plan was downloaded as a calendar file.',
      },
    }))
  }

  function closeCalendarPrompt() {
    setCalendarPromptState('hidden')
  }

  const uploadImg = (plId, slot) => {
    const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'
    i.onchange = e => {
      const f = e.target.files[0]; if (!f) return
      if (f.size > MAX_UPLOAD_FILE_BYTES) {
        setUploadMessage('This file is too big. Please choose an image under 5MB.')
        return
      }
      const objectUrl = URL.createObjectURL(f)
      const probe = new Image()
      probe.onload = () => {
        const tooWide = probe.naturalWidth > MAX_UPLOAD_WIDTH
        const tooTall = probe.naturalHeight > MAX_UPLOAD_HEIGHT
        URL.revokeObjectURL(objectUrl)
        if (tooWide || tooTall) {
          setUploadMessage(`This file is too big. Please use an image no larger than ${MAX_UPLOAD_WIDTH} x ${MAX_UPLOAD_HEIGHT}.`)
          return
        }
        const r = new FileReader()
        r.onload = ev => {
          setUploadMessage('')
          updatePillar(plId, slot, ev.target.result)
        }
        r.readAsDataURL(f)
      }
      probe.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        setUploadMessage('This image could not be loaded. Please try a different image.')
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
      setExportNotice('Want both? Upgrade to full weekly view inside Phasr')
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

  function startReviewVoice(key) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.onresult = event => {
      const heard = Array.from(event.results).map(result => result[0]?.transcript || '').join(' ').trim()
      if (!heard) return
      updatePhase(key, `${phase?.[key] ? `${phase[key]} ` : ''}${heard}`.trim())
    }
    recognition.start()
  }

  const todayTodoState = loadTodoState()
  const todayTodoMap = todayTodoState[new Date().toISOString().slice(0, 10)] || {}
  const dailyPlan = getDailyTaskPlan({ ...data, activePhaseId: phaseId })
  const currentTodo = dailyPlan.tasks.find(task => !todayTodoMap[task.id]) || dailyPlan.primaryTask

  const todayTask = currentTodo?.task || 'Complete 1 action from your current phase'
  const weeklyPlan = phase?.pillars?.flatMap(p => {
    const tasks = (p.weeklyActions || []).filter(Boolean)
    const fallbackTasks = tasks.length ? tasks : (p.activities || []).filter(Boolean).slice(0, 3)
    return fallbackTasks.map(task => ({ task, pillar: p.name }))
  }) || []
  const showCalendarPrompt = !!weeklyPlan.length && !editing && calendarPromptState === 'open'
  const showCalendarPromptChip = !!weeklyPlan.length && !editing && calendarPromptState === 'collapsed'

  useEffect(() => {
    if (!weeklyPlan.length || editing) return
    if (calendarPromptState !== 'open') return
    const timer = window.setTimeout(() => {
      setCalendarPromptState(current => current === 'open' ? 'collapsed' : current)
    }, 420000)
    return () => window.clearTimeout(timer)
  }, [calendarPromptState, editing, weeklyPlan.length, phaseId])

  useEffect(() => {
    if (!calendarPromptArmed || editing) return
    if (weeklyPlan.length) setCalendarPromptState('open')
    setCalendarPromptArmed(false)
  }, [calendarPromptArmed, editing, weeklyPlan.length])

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 'none', margin: '0 auto' }}>
        {uploadMessage && (
          <div style={{ marginBottom: '1rem', borderRadius: 16, padding: '0.9rem 1rem', background: '#fff3f6', border: '1px solid #f2c7d4', color: '#a54f71', fontSize: '0.88rem', fontWeight: 700, boxShadow: '0 12px 30px rgba(185,87,122,0.1)' }}>
            {uploadMessage}
          </div>
        )}

        {/* Today's Task */}
        <div style={{
          background: 'linear-gradient(135deg, var(--app-accent2), var(--app-accent))',
          borderRadius: 12, padding: '0.85rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem',
          boxShadow: '0 4px 16px rgba(233,100,136,0.25)',
          position: 'relative',
        }}>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)', marginBottom: '0.18rem' }}>
              Today's Task - {phase?.name}
            </p>
            <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{todayTask}</p>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => onOpenDailyStreak?.()} style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.55rem 0.85rem', borderRadius: 999, border: '1px solid rgba(255,255,255,0.32)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', opacity: lockInSummary?.mode === 'broken' ? 0.45 : 0.95, boxShadow: lockInSummary?.mode === 'broken' ? 'none' : '0 0 0 4px rgba(255,255,255,0.16)' }} />
              Daily Streak {lockInSummary?.mode === 'broken' ? 'Paused' : 'Active'}
            </button>
          </div>

          {showCalendarPrompt && (
            <div style={{ position: 'absolute', right: 14, top: 'calc(100% - 10px)', width: 'min(88vw, 280px)', background: 'linear-gradient(180deg,#fff5f8,#ffe8f0)', border: '1px solid #f4c9d6', borderRadius: 18, boxShadow: '0 20px 44px rgba(185,87,122,0.18)', padding: '0.85rem 0.85rem 0.8rem', zIndex: 20 }}>
              <button onClick={closeCalendarPrompt} aria-label="Close calendar prompt" style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', border: '1px solid #efc3d1', background: 'rgba(255,255,255,0.92)', color: '#b85a82', cursor: 'pointer', padding: 0, fontSize: '1rem', lineHeight: 1 }}>
                ×
              </button>
              <p style={{ fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#e07b9f', marginBottom: '0.45rem' }}>Calendar</p>
              <p style={{ color: '#5c3342', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 1.5rem 0.8rem 0' }}>
                Do you want to add your tasks to your calendar with reminders?
              </p>
              <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
                <button onClick={addToCalendarPlan} disabled={calendarBusy} style={{ minHeight: 40, padding: '0.68rem 0.95rem', borderRadius: 999, border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontWeight: 700, cursor: calendarBusy ? 'wait' : 'pointer', fontFamily: "'DM Sans', sans-serif", opacity: calendarBusy ? 0.75 : 1 }}>
                  {calendarBusy ? 'Opening...' : 'Add to calendar'}
                </button>
                <button onClick={downloadCalendarPlan} style={{ minHeight: 40, padding: '0.68rem 0.95rem', borderRadius: 999, border: '1px solid #efc3d1', background: '#fff', color: '#8a5568', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  Download
                </button>
              </div>
            </div>
          )}

          {showCalendarPromptChip && (
            <div style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', zIndex: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff1f6', border: '1px solid #f2c8d6', borderRadius: 999, padding: '0.35rem 0.4rem 0.35rem 0.7rem', boxShadow: '0 14px 30px rgba(185,87,122,0.16)' }}>
                <button type="button" onClick={() => setCalendarPromptState('open')} style={{ border: 'none', background: 'transparent', color: '#9a6277', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", padding: 0 }}>
                  Calendar reminders
                </button>
                <button type="button" onClick={closeCalendarPrompt} aria-label="Close calendar reminder chip" style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #efc3d1', background: '#fff', color: '#b85a82', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                  ×
                </button>
              </div>
            </div>
          )}
        </div>

        {/* â”€â”€ Header â”€â”€ */}
        <div style={{ textAlign: 'center', marginBottom: '1.4rem' }}>
          {editing
            ? <input value={data.boardTitle} onChange={e => upd(d => { d.boardTitle = e.target.value; return d })} style={inp({ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,4vw,2.2rem)', fontWeight: 700, color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '2px solid var(--app-border)', textAlign: 'center', width: '100%', maxWidth: 560, marginBottom: 0 })} onFocus={focus} onBlur={blur} />
            : <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.8rem,5vw,3rem)', fontWeight: 700, lineHeight: 1.15, background: 'linear-gradient(135deg,var(--app-accent),var(--app-accent2))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{data.boardTitle}</h1>
          }
          <p style={{ color: 'var(--app-muted)', fontSize: '0.78rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '0.3rem' }}>
            {phase?.pillars?.map(p => p.name).join(' · ')}
          </p>
          <button onClick={handleEditingToggle} style={{
            marginTop: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.33rem 1rem', borderRadius: 99,
            border: `1.5px solid ${editing ? 'transparent' : 'var(--app-border)'}`,
            background: editing ? 'linear-gradient(135deg,#65c47c,#3da85a)' : 'var(--app-bg2)',
            color: editing ? '#fff' : 'var(--app-accent)',
            fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
          }}>{editing ? 'Save' : 'Personalize'}</button>
        </div>

        {/* â”€â”€ Phase Tabs â”€â”€ */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.2rem', alignItems: 'flex-start' }}>
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
                  padding: '0.72rem 1.1rem',
                  borderRadius: 24,
                  border: `1.5px solid ${activePhase ? 'transparent' : 'var(--app-border)'}`,
                  background: activePhase ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff',
                  color: activePhase ? '#fff' : 'var(--app-muted)',
                  boxShadow: activePhase ? '0 4px 14px rgba(233,100,136,0.28)' : 'none',
                  transition: 'all 0.2s',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.38rem',
                  minWidth: 152,
                  minHeight: 82,
                  cursor: 'pointer',
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
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: activePhase ? '#fff' : 'var(--app-text)',
                  }}
                >
                  {p.name}
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
                    fontSize: '0.62rem',
                    fontWeight: 800,
                    minWidth: 96,
                    textAlign: 'center',
                    padding: '0.26rem 0.62rem',
                    cursor: editing ? 'pointer' : 'default',
                    fontFamily: "'DM Sans',sans-serif",
                    outline: 'none',
                  }}
                >
                  {getPhaseTimelineLabel(p)}
                </button>
              </div>

              {editing && timelineEditorPhaseId === p.id && (
                <div
                  onClick={event => event.stopPropagation()}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: alignRight ? 'auto' : 0,
                    right: alignRight ? 0 : 'auto',
                    transform: 'none',
                    width: 'min(260px, calc(100vw - 2rem))',
                    maxWidth: 'calc(100vw - 2rem)',
                    background: '#fff',
                    border: '1px solid var(--app-border)',
                    borderRadius: 18,
                    padding: '0.85rem',
                    boxShadow: '0 16px 32px rgba(240,96,144,0.18)',
                    zIndex: 30,
                  }}
                >
                  <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Set timeframe</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0.45rem', marginTop: '0.65rem' }}>
                    <label style={{ display: 'grid', gap: '0.22rem' }}>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--app-muted)' }}>Start date</span>
                      <input
                        type="date"
                        value={draft.startDate || ''}
                        onChange={e => updateTimelineDraft(p.id, 'startDate', e.target.value)}
                        onClick={e => e.currentTarget.showPicker?.()}
                        onFocus={e => e.currentTarget.showPicker?.()}
                        style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0.5rem 0.45rem', borderRadius: 10, border: '1px solid var(--app-border)', fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }}
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
                        style={{ width: '100%', minWidth: 0, boxSizing: 'border-box', padding: '0.5rem 0.45rem', borderRadius: 10, border: '1px solid var(--app-border)', fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', marginTop: '0.7rem' }}>
                    <span style={{ fontSize: '0.7rem', color: 'var(--app-muted)', fontWeight: 700 }}>
                      {formatMonthRange(draft.startDate, draft.endDate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => saveTimelineDraft(p.id)}
                      style={{ border: '1px solid var(--app-border)', background: '#fff1f6', color: '#b85a82', borderRadius: 999, padding: '0.35rem 0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

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

          {!isPro && data.phases.length >= FREE_PHASE_LIMIT ? (
            <button
              type="button"
              style={{
                padding: '0.48rem 1.1rem',
                borderRadius: 99,
                border: '1.5px solid #f6cddd',
                background: '#fff',
                color: '#ef5f97',
                boxShadow: '0 4px 14px rgba(233,100,136,0.28)',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif",
                textAlign: 'center',
              }}
            >
              Upgrade to Pro
            </button>
          ) : (
            <button onClick={addPhase} style={{ padding: '0.48rem 1.1rem', borderRadius: 99, border: '1.5px dashed var(--app-border)', background: 'transparent', color: 'var(--app-accent2)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              + add it
            </button>
          )}
        </div>


        {/* â”€â”€ Affirmation â”€â”€ */}
        <div style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff)', border: '1.5px solid var(--app-border)', borderRadius: 12, padding: '0.85rem 1.4rem', marginBottom: '1.2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: -10, left: 10, fontFamily: "'Playfair Display',serif", fontSize: '5rem', color: 'var(--app-border)', lineHeight: 1, pointerEvents: 'none' }}>"</span>
          {editing
            ? <input value={phase?.affirmation || ''} onChange={e => updatePhase('affirmation', e.target.value)} placeholder="Your phase mantra..." style={inp({ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: '1rem', color: 'var(--app-accent)', background: 'transparent', border: 'none', borderBottom: '1.5px solid var(--app-border)', textAlign: 'center', marginBottom: 0, position: 'relative', zIndex: 1 })} onFocus={focus} onBlur={blur} />
            : <p style={{ fontFamily: "'Playfair Display',serif", fontStyle: 'italic', fontSize: 'clamp(0.9rem,2.2vw,1.05rem)', color: 'var(--app-accent)', position: 'relative', zIndex: 1, lineHeight: 1.6 }}>{phase?.affirmation}</p>
          }
        </div>

        {/* â”€â”€ Pillars â”€â”€ */}
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
        {editing && presetPillar && (
          <div style={{ marginBottom: '0.95rem', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100%', maxWidth: 980, borderRadius: 20, border: '1px solid var(--app-border)', background: '#fff', boxShadow: '0 12px 28px rgba(0,0,0,0.08)', padding: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <span style={{ width: 32, height: 32, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff' }}>
                    <PillarGlyph code={presetPillar.emoji} size={15} />
                  </span>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Focus area</p>
                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.9rem', fontWeight: 700, color: 'var(--app-text)' }}>{presetPillar.name}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPresetOpen(null)} style={{ border: '1px solid var(--app-border)', borderRadius: 999, background: '#fff', color: 'var(--app-muted)', padding: '0.45rem 0.8rem', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: 700 }}>
                  Close
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                {PILLAR_PRESETS.map(p => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPreset(presetPillar.id, p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      padding: '0.7rem 0.8rem',
                      borderRadius: 18,
                      border: p.name === presetPillar.name ? '1px solid var(--app-accent)' : '1px solid var(--app-border)',
                      background: p.name === presetPillar.name ? 'var(--app-bg2)' : '#fff',
                      cursor: 'pointer',
                      fontSize: '0.76rem',
                      color: 'var(--app-text)',
                      fontFamily: "'DM Sans',sans-serif",
                      textAlign: 'left',
                      maxWidth: 260,
                    }}
                  >
                    <span style={{ width: 30, height: 30, borderRadius: 9, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff' }}>
                      <PillarGlyph code={p.emoji} size={15} />
                    </span>
                    <span style={{ display: 'grid', gap: '0.15rem' }}>
                      <span style={{ fontWeight: 700 }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', lineHeight: 1.45, color: 'var(--app-muted)' }}>{p.details}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div id="pillar-section" className="phase-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '1rem', marginBottom: '1.5rem', alignItems: 'start' }}>
          {visiblePillars.map(pl => (
            <PillarCard
              key={pl.id} pl={pl} editing={editing} checked={checked} phaseId={phaseId}
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
              onGeneratePlan={() => forceGeneratePlan(pl.id)}
              onCalendarOpen={addToCalendarPlan}
              calendarEvents={calendarEvents}
              isPro={isPro}
            />
          ))}
          {editing && (
            !isPro && (phase?.pillars?.length || 0) >= FREE_PILLAR_LIMIT ? (
              <div style={{ border: '1px solid #f6cddd', borderRadius: 22, background: 'linear-gradient(180deg,#fffafb,#fff)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.42rem', padding: '1.2rem 1rem', minHeight: 120, textAlign: 'center', boxShadow: '0 12px 28px rgba(240,96,144,0.18)' }}>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#ef5f97' }}>Upgrade to Pro</p>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: 'var(--app-text)' }}>Unlock more focus areas</p>
              </div>
            ) : (
              <button onClick={addPillar} style={{ border: '2px dashed var(--app-border)', borderRadius: 16, background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '1.8rem 1rem', cursor: 'pointer', minHeight: 120 }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--app-bg2)'; e.currentTarget.style.borderColor = 'var(--app-accent2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--app-border)' }}>
                <span style={{ fontSize: '1.4rem', color: 'var(--app-accent2)' }}>+</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--app-accent2)', fontFamily: "'DM Sans',sans-serif" }}>add pillar</span>
              </button>
            )
          )}
        </div>
        {/* â”€â”€ Ultimate Impact â”€â”€ */}
        <div style={{ margin: '2rem 0 1.5rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fffbfc', borderRadius: 6, padding: '2rem 3rem', textAlign: 'center', width: '100%', maxWidth: 820, boxShadow: '0 0 0 1.5px var(--app-border),0 0 0 5px var(--app-bg2),0 0 0 6.5px var(--app-border),0 12px 40px rgba(233,100,136,0.1)' }}>
            <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.1rem,3vw,1.6rem)', fontWeight: 700, background: 'linear-gradient(90deg,#ff6b9d,#ffb3c6,#ffa0bc,#ff6b9d)', backgroundSize: '300% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'vbFoil 4s linear infinite', marginBottom: '0.7rem' }}>Ultimate Impact</p>
            {editing
              ? <textarea rows={3} value={phase?.impact || ''} onChange={e => updatePhase('impact', e.target.value)} style={ta({ textAlign: 'center', fontStyle: 'italic' })} onFocus={focus} onBlur={blur} />
              : <p style={{ fontSize: '0.95rem', color: '#7a3a55', lineHeight: 1.7, fontWeight: 500 }}>{phase?.impact}</p>
            }
          </div>
        </div>

        {/* â”€â”€ Quarterly Review â”€â”€ */}
        {!isMobile && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--app-border)', boxShadow: 'var(--sh)', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div onClick={toggleReviewCollapse} style={{ background: 'linear-gradient(135deg,#fff8e6,#fff0d6)', borderBottom: phase?.reviewCollapsed ? 'none' : '1px solid #f5d9a0', padding: '0.9rem 1.3rem', display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#f5b942,#e8930a)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1rem', flexShrink: 0 }}>Q</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1rem', fontWeight: 600, color: '#7a4a00' }}>Quarterly Review - {phase?.name}</h3>
              </div>
              <span style={{ color: '#7a4a00', fontSize: '0.9rem' }}>{phase?.reviewCollapsed ? '▼' : '▲'}</span>
            </div>
            {!phase?.reviewCollapsed && <div style={{ padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.85rem' }}>
              {[
                { k: 'reviewWorked',  bg: '#f4fbf5', bc: '#b9dfc0', c: '#3a7d4d', l: 'What Worked?',     h: 'What brought results?' },
                { k: 'reviewDrained', bg: '#fff8f8', bc: '#f9cdd3', c: '#c0445a', l: 'What Drained Me?', h: 'What to drop?' },
                { k: 'reviewPaid',    bg: '#f2f6ff', bc: '#c5d5f7', c: '#3355a0', l: 'What Paid Off?',   h: 'What to double down on?' },
              ].map(({ k, bg, bc, c, l, h }) => (
                <div key={k} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 12, padding: '0.8rem' }}>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c, marginBottom: '0.28rem' }}>{l}</p>
                  <p style={{ fontSize: '0.7rem', color: '#8a7080', marginBottom: '0.4rem' }}>{h}</p>
                  <textarea rows={4} value={phase?.[k] || ''} onChange={e => updatePhase(k, e.target.value)} placeholder="" style={ta({ minHeight: 70 })} onFocus={focus} onBlur={blur} />
                  <button onClick={() => startReviewVoice(k)} style={{ marginTop: '0.5rem', width: 34, height: 34, borderRadius: '50%', border: '1px solid #ffffff', background: '#fff', color: c, fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>Rec</button>
                </div>
              ))}
            </div>}
            {!phase?.reviewCollapsed && <div style={{ margin: '0 1rem 1rem', borderRadius: 12, padding: '0.8rem', background: 'linear-gradient(135deg,#faf0f5,#f5ebff)', border: '1px solid #e8d0f0' }}>
              <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.4rem' }}>Next Phase Strategy</p>
              <textarea rows={3} value={phase?.reviewStrategy || ''} onChange={e => updatePhase('reviewStrategy', e.target.value)} placeholder="" style={ta()} onFocus={focus} onBlur={blur} />
              <button onClick={() => startReviewVoice('reviewStrategy')} style={{ marginTop: '0.5rem', width: 34, height: 34, borderRadius: '50%', border: '1px solid #ffffff', background: '#fff', color: '#7a58b0', fontSize: '0.66rem', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", boxShadow: '0 8px 20px rgba(0,0,0,0.06)' }}>Rec</button>
            </div>}
          </div>
        )}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <button
              className="quarterly-review-btn"
              type="button"
              onClick={() => setShowReview(true)}
              style={{
                width: '100%',
                padding: '0.95rem 1rem',
                borderRadius: '14px',
                border: '1.5px solid #f2c4d0',
                background: '#fff',
                color: '#e8407a',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 8px 24px rgba(232,64,122,0.08)',
              }}
            >
              Review this phase →
            </button>
          </div>
        )}

        {/* â”€â”€ Footer â”€â”€ */}
        <div style={{ textAlign: 'center' }}>
          <button onClick={openExportModal} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.3rem', borderRadius: 99, border: '1.5px solid var(--app-border)', background: '#fff', color: 'var(--app-accent)', fontSize: '0.76rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '0.7rem' }}>Save as image</button>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.78rem' }}>Track weekly · Review quarterly · Transform your life</p>
        </div>

        {showExportModal && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(10,10,15,0.94)', padding: isMobile ? '18px 14px 28px' : '28px 16px 48px', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
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
                  <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 6 }}>Pick one pillar to save</h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 18 }}>This goes on your wall. Choose what matters most right now.</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(phase?.pillars || []).map(item => {
                      const active = selectedExportPillarId === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedExportPillarId(item.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, border: active ? '1.5px solid #f95f85' : '1.5px solid rgba(255,255,255,0.07)', background: active ? 'rgba(249,95,133,0.1)' : '#13131a', cursor: 'pointer', textAlign: 'left' }}
                        >
                          <span style={{ fontSize: 18, flexShrink: 0 }}>{item.emoji}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: '#fff' }}>{item.name}</div>
                            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{cleanText(item.beforeState) || 'Before'} → {cleanText(item.afterState) || 'After'}</div>
                          </div>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: active ? '2px solid #f95f85' : '2px solid rgba(255,255,255,0.2)', background: active ? '#f95f85' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, flexShrink: 0 }}>
                            {active ? '✓' : ''}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={generateExportCard}
                  disabled={!selectedExportPillarId}
                  style={{ width: '100%', maxWidth: 480, padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f95f85,#e83d66)', color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', cursor: selectedExportPillarId ? 'pointer' : 'not-allowed', boxShadow: '0 4px 20px rgba(249,95,133,0.3)', opacity: selectedExportPillarId ? 1 : 0.4 }}
                >
                  Create My Vision Card →
                </button>
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
                        <img src={phasrMark} alt="Phasr mark" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
                        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, background: 'linear-gradient(135deg,#f472a8,#ffd6e7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Phasr</span>
                      </div>
                      <span style={{ padding: '4px 11px', borderRadius: 99, border: '1px solid rgba(249,95,133,0.3)', background: 'rgba(249,95,133,0.12)', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#ff8fab' }}>{exportPhaseLabel}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, position: 'relative', zIndex: 1 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#f95f85,#e83d66)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{selectedExportPillar.emoji}</div>
                      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, color: '#fff' }}>{selectedExportPillar.name}</span>
                    </div>
                  </div>

                  <div style={{ padding: '20px 22px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                      {[
                        { type: 'before', label: '📸 Before', image: selectedExportPillar.beforeImage, state: selectedExportPillar.beforeState, desc: selectedExportPillar.beforeDesc, bg: '#fff8f8', border: '#f9cdd3', accent: '#c0445a', ph: 'Before Photo' },
                        { type: 'after', label: '🎯 After', image: selectedExportPillar.afterImage, state: selectedExportPillar.afterState, desc: selectedExportPillar.afterDesc, bg: '#f4fbf5', border: '#b9dfc0', accent: '#3a7d4d', ph: 'Goal Photo' },
                      ].map(frame => (
                        <div key={frame.type} style={{ borderRadius: 14, overflow: 'hidden', background: frame.bg, border: `1.5px solid ${frame.border}` }}>
                          {frame.image ? (
                            <img src={frame.image} alt={frame.label} style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block' }} />
                          ) : (
                            <div style={{ width: '100%', aspectRatio: '4/3', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, background: frame.type === 'before' ? '#fff0f0' : '#f0fff4' }}>
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
                      <span style={{ position: 'absolute', top: -6, left: 8, fontFamily: "'Playfair Display', serif", fontSize: 48, color: 'rgba(249,95,133,0.12)', lineHeight: 1, pointerEvents: 'none' }}>"</span>
                      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, color: '#3d1f2b', lineHeight: 1.55, position: 'relative', zIndex: 1 }}>
                        {shortenText(selectedExportPillar.description || selectedExportPillar.afterDesc || selectedExportPillar.beforeDesc || selectedExportPillar.shortOutcome || selectedExportPillar.afterState || selectedExportPillar.name, 220)}
                      </p>
                    </div>
                  </div>

                  <div style={{ padding: '0 22px 18px' }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f95f85', marginBottom: 8 }}>What you need to source</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {compactList(selectedExportPillar.resources, 3).map(item => (
                        <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#fff5f7', border: '1px solid #f9d8e0' }}>
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#f95f85', flexShrink: 0 }} />
                          <span style={{ fontSize: 11, color: '#3d1f2b', fontWeight: 500 }}>{shortenText(item, 48)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'linear-gradient(to right,transparent,#f2c4d0,transparent)', margin: '0 22px' }} />

                  <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700, color: '#1a0a10', lineHeight: 1.3, marginBottom: 6 }}>Check in daily.<br /><em style={{ fontStyle: 'italic', color: '#f95f85' }}>Sage remembers everything.</em></div>
                      <div style={{ fontSize: 11, color: '#7a5a66', lineHeight: 1.55 }}>This plan is valid for this week. Open your dashboard daily and let Sage guide the next move.</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                      <div ref={qrCodeRef} style={{ width: 88, minHeight: 88, padding: 4, background: '#fff', borderRadius: 10 }} />
                      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a7088', textAlign: 'center' }}>Dashboard</div>
                      <div style={{ fontSize: 9, color: '#b09098', textAlign: 'center', lineHeight: 1.4, maxWidth: 88 }}>Scan to open your page</div>
                    </div>
                  </div>

                  <div style={{ background: 'linear-gradient(135deg,#1a0a10,#2e101c)', padding: '10px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>This plan is valid for this week. Create your next phase inside Phasr.</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phasr · {phase?.name || 'Phase 1'}</span>
                  </div>
                </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 480 }}>
                  <button
                    type="button"
                    onClick={downloadExportCard}
                    disabled={exportBusy || !exportScriptsReady}
                    style={{ width: '100%', padding: 14, borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#f95f85,#e83d66)', color: '#fff', fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, letterSpacing: '0.04em', cursor: exportBusy || !exportScriptsReady ? 'not-allowed' : 'pointer', boxShadow: '0 4px 20px rgba(249,95,133,0.3)', opacity: exportBusy || !exportScriptsReady ? 0.5 : 1 }}
                  >
                    {exportBusy ? 'Saving...' : '⬇ Save as Image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportStage('picker')}
                    style={{ width: '100%', padding: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                  >
                    ← Pick a different pillar
                  </button>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textAlign: 'center' }}>Print it. Put it on your wall. Never forget why you started.</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showReview && isMobile && (
        <div style={{
          position: 'fixed', inset: 0, background: '#fff',
          zIndex: 500, overflowY: 'auto', padding: '0',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '1rem',
            padding: '1rem 1.25rem',
            borderBottom: '1px solid #f2c4d0',
            position: 'sticky', top: 0, background: '#fff', zIndex: 10,
          }}>
            <button onClick={() => setShowReview(false)} style={{
              background: 'none', border: 'none', fontSize: '1.2rem',
              cursor: 'pointer', color: '#e8407a', padding: '0.25rem',
            }}>←</button>
            <h2 style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.1rem', fontWeight: 700, color: '#3d1f2b',
              margin: 0,
            }}>
              Quarterly Review — {phase?.name}
            </h2>
          </div>

          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              { key: 'reviewWorked', label: 'What worked this phase?', hint: 'Habits, routines, and behaviours that felt right', color: '#3a7d4d' },
              { key: 'reviewDrained', label: 'What drained you?', hint: 'What to drop or do less of next phase', color: '#c0445a' },
              { key: 'reviewPaid', label: 'What actually paid off?', hint: 'What produced real results and moved the needle', color: '#3355a0' },
              { key: 'reviewStrategy', label: 'Next phase strategy', hint: 'What will you start, stop, and do more of', color: '#7a58b0' },
            ].map(({ key, label, hint, color }) => (
              <div key={key}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: '0.3rem' }}>
                  {label}
                </p>
                <p style={{ fontSize: '0.8rem', color: '#7a5a66', marginBottom: '0.6rem' }}>{hint}</p>
                <textarea
                  value={phase?.[key] || ''}
                  onChange={e => updatePhase(key, e.target.value)}
                  placeholder="Write here..."
                  style={{
                    width: '100%', minHeight: '100px', padding: '0.85rem',
                    border: '1.5px solid #f2c4d0', borderRadius: '12px',
                    fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem',
                    color: '#3d1f2b', background: '#fff', outline: 'none',
                    resize: 'vertical', lineHeight: 1.6,
                  }}
                  onFocus={e => { e.target.style.borderColor = '#e8407a' }}
                  onBlur={e => { e.target.style.borderColor = '#f2c4d0' }}
                />
              </div>
            ))}

            <button
              onClick={() => setShowReview(false)}
              style={{
                width: '100%', padding: '0.95rem', borderRadius: '12px',
                border: 'none', background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                color: '#fff', fontSize: '0.95rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
                boxShadow: '0 4px 16px rgba(232,64,122,0.3)',
                marginBottom: '2rem',
              }}
            >
              Save Review
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes vbFoil{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @media(max-width:768px){ .phase-container{ grid-template-columns:1fr!important } }
        @media(max-width:640px){ [style*="repeat(3,1fr)"],[style*="repeat(4,1fr)"]{ grid-template-columns:1fr!important } }
      `}</style>
    </div>
  )
}

/* â”€â”€ Pillar Card â”€â”€ */
  function PillarCard({ pl, editing, checked, phaseId, onCollapse, onUpdate, onUpdateArr, onAddArr, onDelArr, onCheck, onUpload, onImageLinkUpdate, onDel, onPreset, onGeneratePlan, onCalendarOpen, calendarEvents = [], isPro }) {
    const beforeReady = cleanText(pl.beforeState)
    const afterReady = cleanText(pl.afterState)
    const descriptionReady = cleanText(getPlanDescription(pl))
    const hasImageContext = Boolean(pl.beforeImage || pl.afterImage)
    const canGeneratePlan = Boolean(beforeReady && afterReady && descriptionReady && hasImageContext)
    const hasGeneratedPlan = Boolean(pl.planGeneratedFrom && !isPlanBlank(pl))
    const [linkDrafts, setLinkDrafts] = useState({ beforeImage: pl.beforeImage || '', afterImage: pl.afterImage || '' })

    useEffect(() => {
      setLinkDrafts({
        beforeImage: pl.beforeImage || '',
        afterImage: pl.afterImage || '',
      })
    }, [pl.beforeImage, pl.afterImage])

  function handleImageTap(slot) {
    if (!editing) return
    onUpload(slot)
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid var(--app-border)', boxShadow: '0 4px 24px rgba(233,100,136,0.08)', overflow: 'hidden', alignSelf: 'start' }}>
      {/* Header */}
      <div onClick={onCollapse} style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff)', borderBottom: pl.collapsed ? 'none' : '1px solid var(--app-border)', padding: '0.85rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
        <div onClick={e => { e.stopPropagation(); editing && onPreset() }} style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: editing ? 'pointer' : 'default' }}><PillarGlyph code={pl.emoji} size={16} /></div>
        {editing
          ? <input value={pl.name} onChange={e => onUpdate('name', e.target.value)} onClick={e => e.stopPropagation()} style={{ flex: 1, padding: '0.3rem 0.5rem', border: 'none', borderBottom: '1.5px solid var(--app-border)', fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', outline: 'none', background: 'transparent' }} />
          : <span style={{ fontFamily: "'Playfair Display',serif", fontSize: '0.95rem', fontWeight: 600, color: 'var(--app-text)', flex: 1 }}>{pl.name}</span>
        }
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          {editing && (
            <button
              onClick={e => {
                e.stopPropagation()
                if (window.confirm('Are you sure you want to delete this pillar?')) onDel()
              }}
              aria-label={`Delete ${pl.name}`}
              style={{ width: 30, height: 30, borderRadius: 999, background: '#fff3f6', border: '1px solid #f2c7d4', cursor: 'pointer', color: '#d05d86', display: 'grid', placeItems: 'center', padding: 0, boxShadow: '0 6px 14px rgba(240,96,144,0.12)' }}
            >
              <Trash2 size={14} strokeWidth={2.1} />
            </button>
          )}
          <span style={{ color: 'var(--app-accent2)', fontSize: '0.8rem' }}>{pl.collapsed ? '▼' : '▲'}</span>
        </div>
      </div>

      {!pl.collapsed && (
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Before / After */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {[
              { slot: 'beforeImage', src: pl.beforeImage, lbl: 'Before', sk: 'beforeState', dk: 'beforeDesc', sv: pl.beforeState, dv: pl.beforeDesc, bg: '#fff8f8', bc: '#f9cdd3', lc: '#c0445a' },
              { slot: 'afterImage',  src: pl.afterImage,  lbl: 'After',  sk: 'afterState',  dk: 'afterDesc',  sv: pl.afterState,  dv: pl.afterDesc,  bg: '#f4fbf5', bc: '#b9dfc0', lc: '#3a7d4d' },
            ].map(({ slot, src, lbl, sk, dk, sv, dv, bg, bc, lc }) => (
              <div key={slot} style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 12, padding: '0.7rem' }}>
                <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: lc, marginBottom: '0.4rem' }}>{lbl}</p>
                <div onClick={() => handleImageTap(slot)} style={{ width: '100%', aspectRatio: '4/3', borderRadius: 8, background: 'var(--app-bg2)', border: '2px dashed var(--app-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.4rem', overflow: 'hidden', cursor: editing ? 'pointer' : 'default', position: 'relative' }}>
                  {src ? <img src={src} alt={lbl} referrerPolicy="no-referrer" crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <p style={{ fontSize: '0.66rem', color: 'var(--app-border)', textAlign: 'center', padding: '0.4rem' }}>{editing ? 'tap to upload' : 'add photo'}</p>}
                  {editing && src && (
                    <button
                      type="button"
                      onClick={event => {
                        event.stopPropagation()
                        if (window.confirm('Remove this image?')) onUpdate(slot, null)
                      }}
                      aria-label={`Remove ${lbl} image`}
                      style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', border: '1px solid #f2c7d4', background: 'rgba(255,255,255,0.96)', color: '#d05d86', display: 'grid', placeItems: 'center', fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  )}
                </div>
                {editing
                  ? <><input value={sv} onChange={e => onUpdate(sk, e.target.value)} placeholder={`${lbl} state`} style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none', marginBottom: '0.25rem' }} onFocus={focus} onBlur={blur} />
                     <input value={dv} onChange={e => onUpdate(dk, e.target.value)} placeholder="Description" style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: 'var(--app-muted)', background: '#fff', outline: 'none', marginBottom: '0.25rem' }} onFocus={focus} onBlur={blur} />
                    <input value={linkDrafts[slot] || ''} onChange={e => setLinkDrafts(prev => ({ ...prev, [slot]: e.target.value }))} onBlur={e => onImageLinkUpdate(slot, e.target.value)} placeholder="Paste image link" style={{ width: '100%', padding: '0.35rem 0.55rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.72rem', color: 'var(--app-muted)', background: '#fff', outline: 'none' }} onFocus={focus} /></>
                  : <><p style={{ fontSize: '0.78rem', color: 'var(--app-text)', lineHeight: 1.5 }}>{sv}</p><p style={{ fontSize: '0.72rem', color: 'var(--app-muted)', marginTop: 2 }}>{dv}</p></>
                }
              </div>
            ))}
          </div>

          {editing && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', borderRadius: 12, padding: '0.7rem 0.8rem', background: '#fff8fb', border: '1px dashed var(--app-border)' }}>
              <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>
                {canGeneratePlan ? 'Generate a Sage plan from this image, before and after states, and description.' : 'Add a photo plus your before state, after state, and description to generate your plan.'}
              </p>
              <button
                type="button"
                onClick={onGeneratePlan}
                disabled={!canGeneratePlan}
                style={{ minHeight: 38, padding: '0.58rem 0.9rem', borderRadius: 999, border: '1px solid var(--app-border)', background: canGeneratePlan ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff', color: canGeneratePlan ? '#fff' : 'var(--app-muted)', fontWeight: 800, cursor: canGeneratePlan ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans',sans-serif" }}
              >
                {hasGeneratedPlan ? 'Regenerate plan' : 'Generate plan'}
              </button>
            </div>
          )}

          <div style={{ height: 1, background: 'linear-gradient(to right,transparent,var(--app-border),transparent)' }} />

          {/* List sections */}
          {[ 
            { lbl: 'Resources',  key: 'resources',  c: '#4a7fc1', m: '•' },
          ].map(({ lbl, key, c, m }) => (
            <div key={key}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: c, marginBottom: '0.38rem' }}>{lbl}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
                {pl[key].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                    {editing
                      ? <><input value={item} onChange={e => onUpdateArr(key, i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <button onClick={() => onDelArr(key, i)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #f5c0cc', background: '#fff0f4', color: '#f06090', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', padding: 0, boxShadow: '0 6px 14px rgba(240,96,144,0.12)' }}>×</button></>
                      : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>{m} {item}</span>
                    }
                  </div>
                ))}
                {editing && <button onClick={() => onAddArr(key)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add item</button>}
              </div>
            </div>
          ))}

          {/* Weekly non-negotiables */}
          <div style={{ background: 'linear-gradient(135deg,var(--app-bg2),#fff5f0)', border: '1.5px solid var(--app-border)', borderRadius: 12, padding: '0.75rem' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.5rem' }}>Weekly Non-Negotiables</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
              {pl.weeklyActions.map((item, i) => {
                const ck = `${phaseId}-${pl.id}-wk-${i}`
                const calendarEvent = calendarEvents.find(event => event.title === item && event.pillar === pl.name)
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.48rem', padding: '0.26rem 0.33rem', borderRadius: 7, cursor: 'pointer' }} onClick={() => !editing && onCheck(ck)}>
                    <input type="checkbox" checked={!!checked[ck]} onChange={() => onCheck(ck)} onClick={e => e.stopPropagation()} style={{ width: 14, height: 14, marginTop: 3, accentColor: 'var(--app-accent)', flexShrink: 0, cursor: 'pointer' }} />
                    {editing
                      ? <><input value={item} onChange={e => onUpdateArr('weeklyActions', i, e.target.value)} style={{ flex: 1, minWidth: 0, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                         <button onClick={() => onDelArr('weeklyActions', i)} style={{ width: 24, height: 24, flexShrink: 0, borderRadius: '50%', background: '#fff0f4', border: '1px solid #f5c0cc', cursor: 'pointer', color: '#f06090', fontSize: '0.82rem', fontWeight: 800, lineHeight: 1, padding: 0, boxShadow: '0 6px 14px rgba(240,96,144,0.12)' }}>×</button></>
                      : <>
                          <span style={{ fontSize: '0.8rem', color: checked[ck] ? '#c4a0ac' : '#5a3d47', lineHeight: 1.5, flex: 1, textDecoration: checked[ck] ? 'line-through' : 'none' }}>{item}</span>
                          <button type="button" onClick={event => { event.stopPropagation(); onCalendarOpen?.() }} title={calendarEvent ? `Open synced calendar plan for ${calendarEvent.date}` : 'Add this plan to your calendar'} style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '0.28rem', padding: '0.28rem 0.5rem', borderRadius: 10, border: '1px solid #f1cfdb', background: '#fff1f6', color: '#9a6277', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                            <span>📅</span>
                            {calendarEvent ? formatCalendarSpot(calendarEvent.date) : 'Add'}
                          </button>
                        </>
                    }
                  </div>
                )
              })}
              {editing && <button onClick={() => onAddArr('weeklyActions')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add action</button>}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#d4773a', marginBottom: '0.38rem' }}>Activities</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.22rem' }}>
              {pl.activities.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.22rem 0.38rem', borderRadius: 7 }}>
                  {editing
                    ? <><input value={item} onChange={e => onUpdateArr('activities', i, e.target.value)} style={{ flex: 1, padding: '0.32rem 0.5rem', border: '1.5px solid var(--app-border)', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: 'var(--app-text)', background: '#fff', outline: 'none' }} onFocus={focus} onBlur={blur} />
                       <button onClick={() => onDelArr('activities', i)} style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid #f5c0cc', background: '#fff0f4', color: '#f06090', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', padding: 0, boxShadow: '0 6px 14px rgba(240,96,144,0.12)' }}>×</button></>
                    : <span style={{ fontSize: '0.8rem', color: '#5a3d47', lineHeight: 1.5, flex: 1 }}>→ {item}</span>
                  }
                </div>
              ))}
              {editing && <button onClick={() => onAddArr('activities')} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.28rem', fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent2)', background: 'var(--app-bg2)', border: '1.5px dashed var(--app-border)', borderRadius: 6, padding: '0.22rem 0.58rem', cursor: 'pointer', marginTop: '0.18rem', fontFamily: "'DM Sans',sans-serif" }}>+ add item</button>}
            </div>
          </div>

          {/* Outcome */}
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.38rem' }}>Outcome</p>
            <div style={{ background: 'linear-gradient(135deg,#fff8fb,#fff1f6)', border: '1px solid #f0d6e2', borderRadius: 10, padding: '0.5rem 0.7rem' }}>
              {editing
                ? (
                  <textarea
                    rows={3}
                    value={pl.longOutcome || pl.shortOutcome}
                    onChange={e => {
                      onUpdate('shortOutcome', e.target.value)
                      onUpdate('longOutcome', e.target.value)
                    }}
                    style={{ width: '100%', padding: '0.35rem 0.5rem', border: '1.5px solid #e8d0f0', borderRadius: 7, fontFamily: "'DM Sans',sans-serif", fontSize: '0.78rem', color: '#5a3d60', background: '#fff', outline: 'none', resize: 'vertical', minHeight: 56, lineHeight: 1.5 }}
                    onFocus={focus}
                    onBlur={blur}
                  />
                )
                : <p style={{ fontSize: '0.8rem', color: '#5a3d60', lineHeight: 1.5 }}>{pl.longOutcome || pl.shortOutcome}</p>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
