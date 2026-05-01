import { useEffect, useMemo, useRef, useState } from 'react'
import { BriefcaseBusiness, Check, ChevronRight, Dumbbell, HandCoins, HeartHandshake, Plus, Sparkles, Sprout } from 'lucide-react'
import { calculateUserPoints, getStoredUserLevel } from '../lib/userLevel'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const SHOW_UP_STYLES = `
.showup-root{
  min-height:calc(100vh - 56px);
  background:linear-gradient(180deg,#2a2328 0%,#1f1a1d 100%);
  color:#4d3142;
  font-family:'DM Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;
}
.showup-shell{
  width:100%;
  max-width:430px;
  margin:0 auto;
  padding:16px 14px 110px;
  box-sizing:border-box;
}
.showup-list-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:10px 2px 18px;
}
.showup-list-kicker{
  margin:0;
  font-size:12px;
  letter-spacing:.22em;
  text-transform:uppercase;
  color:rgba(255,255,255,0.72);
  font-weight:600;
}
.showup-create-link{
  border:none;
  background:transparent;
  display:inline-flex;
  align-items:center;
  gap:6px;
  color:#f95f85;
  font-size:16px;
  font-weight:800;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  padding:0;
}
.showup-list-panel{
  border:1px solid rgba(232,64,122,0.14);
  border-radius:30px;
  overflow:hidden;
  background:#fff;
  box-shadow:0 18px 42px rgba(232,64,122,0.08);
}
.showup-list-row{
  display:grid;
  grid-template-columns:72px minmax(0,1fr) auto;
  align-items:center;
  gap:14px;
  padding:22px 18px;
  min-height:116px;
}
.showup-list-row + .showup-list-row{
  border-top:1px solid rgba(77,49,66,0.08);
}
.showup-list-icon{
  width:68px;
  height:68px;
  border-radius:20px;
  display:grid;
  place-items:center;
  color:#f95f85;
  border:1px solid rgba(249,95,133,0.08);
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.6);
}
.showup-list-content{
  min-width:0;
  display:grid;
  gap:6px;
}
.showup-list-card,
.showup-create-form,
.showup-gate-card,
.showup-member-card,
.showup-compose-card,
.showup-feed-card,
.showup-rank-row,
.showup-empty,
.showup-comment-bubble{
  background:transparent;
  border:1px solid rgba(249,95,133,0.25);
  border-radius:16px;
}
.showup-list-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:700;
  color:#4d3142;
  line-height:1.15;
}
.showup-list-meta{
  margin:0;
  font-size:14px;
  color:#b29cab;
}
.showup-list-action{
  display:flex;
  align-items:center;
  gap:12px;
  white-space:nowrap;
}
.showup-join-pill{
  min-height:42px;
  border-radius:999px;
  min-width:104px;
  padding:0 18px;
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:13px;
  font-weight:800;
  border:1px solid rgba(249,95,133,0.14);
  background:rgba(249,95,133,0.16);
  color:#f95f85;
  font-family:'DM Sans',sans-serif;
  cursor:pointer;
  box-shadow:none;
}
.showup-join-pill.is-joined{
  background:transparent;
  border-color:transparent;
  color:#9a7088;
  min-width:auto;
  padding:0;
}
.showup-join-pill.is-joined svg{
  color:#b5adb2;
}
.showup-list-arrow{
  color:#b88da0;
  flex-shrink:0;
}
.showup-list-state{
  display:inline-flex;
  align-items:center;
  gap:6px;
}
.showup-create-btn,
.showup-join-btn,
.showup-gate-btn,
.showup-header-btn,
.showup-live-pill,
.showup-tab,
.showup-done-btn,
.showup-bell-btn,
.showup-photo-btn,
.showup-post-btn,
.showup-comment-send,
.showup-comment-toggle,
.showup-reaction-chip,
.showup-template-btn,
.showup-sheet-send,
.showup-sheet-cancel{
  border:1px solid rgba(249,95,133,0.25);
  background:transparent;
  transition:all .24s ease;
  font-family:'DM Sans',sans-serif;
  -webkit-tap-highlight-color:transparent;
}
.showup-create-btn,
.showup-join-btn,
.showup-gate-btn,
.showup-post-btn,
.showup-sheet-send,
.showup-tab.is-active,
.showup-checkin-btn{
  border:none;
  background:linear-gradient(135deg,#f95f85,#ff8ca8);
  color:#fff;
}
.showup-create-btn{
  width:100%;
  min-height:46px;
  border-radius:14px;
  font-size:13px;
  font-weight:800;
  cursor:pointer;
  margin-bottom:12px;
}
.showup-create-form,
.showup-gate-card{
  padding:14px;
  display:grid;
  gap:10px;
  margin-bottom:12px;
}
.showup-field{
  display:grid;
  gap:6px;
}
.showup-field-label{
  font-size:12px;
  color:#9a7088;
  font-weight:700;
}
.showup-input,
.showup-select,
.showup-compose-input,
.showup-comment-input,
.showup-sheet-textarea{
  width:100%;
  box-sizing:border-box;
  border:1px solid rgba(249,95,133,0.25);
  background:transparent;
  border-radius:12px;
  padding:12px 13px;
  outline:none;
  color:#4d3142;
  font-family:'DM Sans',sans-serif;
  font-size:13px;
}
.showup-join-footer{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:8px;
}
.showup-join-btn{
  min-height:34px;
  border-radius:999px;
  padding:0 12px;
  font-size:12px;
  font-weight:800;
  cursor:pointer;
}
.showup-gate-title{
  margin:0;
  font-size:16px;
  font-weight:700;
  color:#4d3142;
}
.showup-gate-copy{
  margin:0;
  font-size:12px;
  line-height:1.6;
  color:#9a7088;
}
.showup-gate-actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
}
.showup-gate-btn{
  min-height:42px;
  border-radius:12px;
  cursor:pointer;
  font-size:12px;
  font-weight:700;
}
.showup-sticky-header{
  position:sticky;
  top:0;
  z-index:14;
  background:#fff8f9;
  padding-bottom:10px;
}
.showup-topbar{
  display:grid;
  grid-template-columns:44px 1fr auto;
  align-items:center;
  gap:10px;
  padding-bottom:12px;
}
.showup-header-btn{
  width:44px;
  height:44px;
  border-radius:10px;
  color:#f95f85;
  display:grid;
  place-items:center;
  font-size:1.15rem;
  cursor:pointer;
}
.showup-room-title{
  margin:0;
  text-align:center;
  font-family:'Syne',sans-serif;
  font-size:15px;
  font-weight:700;
  color:#4d3142;
}
.showup-live-pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  border-radius:999px;
  padding:10px 12px;
  color:#f95f85;
  font-size:12px;
  font-weight:700;
  white-space:nowrap;
}
.showup-live-dot{
  width:8px;
  height:8px;
  border-radius:50%;
  background:#f95f85;
  animation:showup-blink 1.1s infinite;
}
@keyframes showup-blink{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.35;transform:scale(.88)}
}
.showup-cta{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
  margin-bottom:12px;
}
.showup-cta.is-hidden{display:none}
.showup-checkin-btn,
.showup-done-btn{
  min-height:48px;
  border-radius:14px;
  font-size:14px;
  font-weight:700;
  cursor:pointer;
}
.showup-done-btn{
  color:#f95f85;
}
.showup-status-line{
  min-height:20px;
  margin:2px 0 12px;
  font-size:12px;
  color:#9a7088;
}
.showup-status-line.is-done{
  color:#f95f85;
  font-weight:700;
}
.showup-banner{
  min-height:48px;
  border-radius:14px;
  background:#f95f85;
  color:#fff;
  display:flex;
  align-items:center;
  justify-content:center;
  text-align:center;
  padding:12px 14px;
  margin-bottom:14px;
  font-size:13px;
  font-weight:700;
  line-height:1.4;
  transition:opacity .24s ease,transform .24s ease;
}
.showup-banner.is-fading{opacity:.15;transform:translateY(4px)}
.showup-banner.is-hidden{display:none}
.showup-member-grid{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:12px;
}
.showup-member-card{
  position:relative;
  min-height:158px;
  padding:14px 12px 12px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:8px;
}
.showup-member-dot{
  position:absolute;
  top:12px;
  right:12px;
  width:10px;
  height:10px;
  border-radius:50%;
}
.showup-member-dot.is-active{background:#2fb66d}
.showup-member-dot.is-done{background:#f95f85}
.showup-member-dot.is-idle{background:#c9b2be}
.showup-avatar{
  width:52px;
  height:52px;
  border-radius:50%;
  border:1px solid rgba(249,95,133,0.25);
  display:grid;
  place-items:center;
  font-family:'Syne',sans-serif;
  font-size:15px;
  font-weight:700;
  color:#f95f85;
}
.showup-member-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:12px;
  font-weight:700;
  text-align:center;
  color:#4d3142;
}
.showup-member-status{
  margin:0;
  font-size:12px;
  text-align:center;
}
.showup-member-status.is-active{color:#2fb66d}
.showup-member-status.is-done{color:#f95f85}
.showup-member-status.is-idle{color:#9a7088}
.showup-bell-btn{
  width:30px;
  height:30px;
  border-radius:50%;
  color:#f95f85;
  display:grid;
  place-items:center;
  cursor:pointer;
}
.showup-feed-view,
.showup-ranks-view{
  min-height:calc(100vh - 260px);
  display:grid;
  gap:12px;
  align-content:start;
}
.showup-compose-card,
.showup-feed-card,
.showup-rank-row,
.showup-empty{
  padding:14px;
}
.showup-compose-top,
.showup-feed-header,
.showup-comment-row{
  display:flex;
  align-items:flex-start;
  gap:10px;
}
.showup-compose-input,
.showup-comment-input{min-height:44px}
.showup-sheet-textarea{
  min-height:96px;
  resize:vertical;
}
.showup-compose-actions,
.showup-feed-actions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:10px;
}
.showup-photo-btn,
.showup-post-btn,
.showup-comment-send,
.showup-sheet-send,
.showup-sheet-cancel{
  border-radius:12px;
  min-height:40px;
  padding:0 14px;
  font-size:13px;
  font-weight:700;
  cursor:pointer;
}
.showup-feed-card.is-anonymous{border-style:dashed}
.showup-feed-author{
  display:flex;
  gap:10px;
  align-items:center;
}
.showup-feed-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#4d3142;
}
.showup-feed-time{
  margin:2px 0 0;
  font-size:11px;
  color:#9a7088;
}
.showup-feed-text{
  margin:12px 0 0;
  font-size:13px;
  line-height:1.65;
  color:#4d3142;
  white-space:pre-wrap;
}
.showup-feed-image{
  width:100%;
  aspect-ratio:4 / 3;
  object-fit:cover;
  border-radius:14px;
  border:1px solid rgba(249,95,133,0.25);
  margin-top:12px;
}
.showup-feed-reactions{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:10px;
  margin-top:12px;
}
.showup-feed-chip-row{
  display:flex;
  flex-wrap:wrap;
  gap:8px;
}
.showup-reaction-chip,
.showup-comment-toggle{
  min-height:34px;
  border-radius:999px;
  padding:0 10px;
  color:#9a7088;
  font-size:12px;
  font-weight:700;
  cursor:pointer;
}
.showup-reaction-chip.is-active{
  background:rgba(249,95,133,0.14);
  color:#f95f85;
}
.showup-comments{
  display:grid;
  gap:10px;
  margin-top:12px;
}
.showup-comment-bubble{
  padding:10px 12px;
  flex:1;
}
.showup-comment-author{
  margin:0 0 4px;
  font-family:'Syne',sans-serif;
  font-size:11px;
  font-weight:700;
  color:#4d3142;
}
.showup-comment-text{
  margin:0;
  font-size:12px;
  line-height:1.55;
  color:#4d3142;
  white-space:pre-wrap;
}
.showup-comment-compose{
  display:flex;
  gap:8px;
}
.showup-rank-row{
  display:grid;
  grid-template-columns:34px 42px 1fr auto auto;
  align-items:center;
  gap:10px;
}
.showup-rank-number{
  font-family:'Syne',sans-serif;
  font-size:14px;
  font-weight:700;
  color:#f95f85;
  text-align:center;
}
.showup-rank-name{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:13px;
  font-weight:700;
  color:#4d3142;
}
.showup-rank-streak{
  margin:2px 0 0;
  font-size:11px;
  color:#9a7088;
}
.showup-rank-badge{
  border:1px solid rgba(249,95,133,0.25);
  border-radius:999px;
  padding:6px 10px;
  font-size:11px;
  font-weight:700;
  color:#9a7088;
  white-space:nowrap;
}
.showup-rank-row.is-leader{border-color:rgba(231,186,73,.55)}
.showup-rank-row.is-rising{border-color:rgba(189,189,195,.65)}
.showup-rank-row.is-building{border-color:rgba(249,95,133,.4)}
.showup-rank-row.is-leader .showup-rank-badge{border-color:rgba(231,186,73,.55);color:#b68500}
.showup-rank-row.is-rising .showup-rank-badge{border-color:rgba(189,189,195,.65);color:#7d7d89}
.showup-rank-row.is-building .showup-rank-badge{color:#f95f85}
.showup-tabs{
  position:fixed;
  left:50%;
  bottom:0;
  transform:translateX(-50%);
  width:100%;
  max-width:390px;
  padding:0 12px calc(20px + env(safe-area-inset-bottom, 0px));
  box-sizing:border-box;
  display:grid;
  grid-template-columns:repeat(3, 1fr);
  gap:8px;
  z-index:15;
  background:linear-gradient(to top,#fff8f9 72%,rgba(255,248,249,0));
}
.showup-tab{
  min-height:48px;
  border-radius:14px;
  color:#f95f85;
  font-size:13px;
  font-weight:700;
  cursor:pointer;
}
.showup-sheet-backdrop{
  position:fixed;
  inset:0;
  background:rgba(41,18,31,.25);
  display:flex;
  align-items:flex-end;
  justify-content:center;
  z-index:20;
}
.showup-sheet{
  width:100%;
  max-width:390px;
  background:#fff;
  border-radius:20px 20px 0 0;
  padding:18px 16px calc(26px + env(safe-area-inset-bottom, 0px));
  box-sizing:border-box;
  display:grid;
  gap:12px;
}
.showup-sheet-title{
  margin:0;
  font-family:'Syne',sans-serif;
  font-size:20px;
  font-weight:700;
  color:#4d3142;
}
.showup-sheet-list{
  display:grid;
  gap:8px;
}
.showup-template-btn{
  width:100%;
  min-height:42px;
  border-radius:12px;
  padding:10px 12px;
  text-align:left;
  color:#4d3142;
  font-size:13px;
  cursor:pointer;
}
.showup-template-btn.is-selected{
  background:rgba(249,95,133,0.12);
  color:#f95f85;
}
.showup-sheet-divider{
  display:flex;
  align-items:center;
  gap:10px;
  color:#9a7088;
  font-size:12px;
}
.showup-sheet-divider::before,
.showup-sheet-divider::after{
  content:'';
  flex:1;
  height:1px;
  background:rgba(249,95,133,0.18);
}
.showup-anon{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:12px;
  color:#9a7088;
}
.showup-anon input{accent-color:#f95f85}
.showup-sheet-actions{
  display:grid;
  gap:8px;
}
.showup-sheet-cancel{color:#9a7088}
.showup-hidden-input{display:none}
.showup-empty{
  text-align:center;
  color:#9a7088;
  font-size:13px;
  line-height:1.6;
}
`

const ROOM_DEFINITIONS = [
  { id: 'health-fitness', name: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', roomColor: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', description: 'Job, entrepreneurship, income streams', roomColor: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', description: 'Savings, investing, debt, financial freedom', roomColor: '#d4773a' },
  { id: 'relationships', name: 'Relationships', description: 'Love, family, friendships, community', roomColor: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', description: 'Spirituality, religion, mindfulness, mental health', roomColor: '#4a7fc1' },
  { id: 'personal-growth', name: 'Personal Growth', description: 'Learning, creativity, self-development', roomColor: '#5e8f64' },
]

const ROOM_ICONS = {
  'health-fitness': Dumbbell,
  'career-business': BriefcaseBusiness,
  wealth: HandCoins,
  relationships: HeartHandshake,
  'inner-life': Sparkles,
  'personal-growth': Sprout,
}

const TEMPLATE_MESSAGES = [
  'We are waiting on you 👀',
  'Hey I haven’t seen you in a while. Hope you’re good 🤍',
  'Girl I thought you were doing your tasks 😂',
  'You coming? I’ll cover for you 💪',
  'How are you today? 🌸',
]

const REACTION_KEYS = [
  { key: 'fire', emoji: '🔥' },
  { key: 'power', emoji: '💪' },
  { key: 'love', emoji: '❤️' },
]

const MAX_ROOM_SIZE = 12

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

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function getTodayKey() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTimestamp(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function buildInitials(name) {
  const words = String(name || 'User').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return 'U'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase()
}

function getActiveBoard() {
  const direct = localStorage.getItem('phasr_vb')
  if (direct) {
    try { return JSON.parse(direct) } catch {}
  }
  const activeUser = localStorage.getItem('phasr_active_user') || ''
  if (activeUser) {
    try {
      const scoped = localStorage.getItem(`phasr_vb:${activeUser}`)
      if (scoped) return JSON.parse(scoped)
    } catch {}
  }
  return null
}

function detectSuggestedRoom() {
  const board = getActiveBoard()
  const phases = Array.isArray(board?.phases) ? board.phases : []
  const phase =
    phases.find(item => item?.id === board?.activePhaseId) ||
    phases[board?.activePhaseIndex || 0] ||
    phases[0] ||
    null
  const pillarText = normalize(phase?.pillars?.[0]?.name || '')
  const matched = ROOM_DEFINITIONS.find(room => pillarText.includes(normalize(room.name)))
  return matched?.name || ROOM_DEFINITIONS[0].name
}

function getCurrentStreakCount() {
  const raw = safeRead('phasr_streak', {})
  const next = Number(raw?.current || 0)
  return Number.isFinite(next) ? next : 0
}

function setLastCompletedToday() {
  const current = safeRead('phasr_streak', {})
  safeWrite('phasr_streak', {
    ...current,
    lastCompleted: getTodayKey(),
  })
}

function getFeedStorageKey(roomName) {
  return `phasr_showup_feed_${normalize(roomName)}`
}

function getMockMemberStorageKey(roomName) {
  return `phasr_showup_mock_members_${normalize(roomName)}`
}

function getCreatedRoomsKey() {
  return 'phasr_showup_created_rooms'
}

function getProfile(user, authUser) {
  const displayName =
    authUser?.user_metadata?.full_name ||
    authUser?.email?.split('@')[0] ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User'
  return {
    id: authUser?.id || user?.id || localStorage.getItem('phasr_active_user') || 'local-user',
    name: displayName,
    initials: buildInitials(displayName),
  }
}

function buildMockMember(profile, roomName) {
  return {
    room_name: roomName,
    user_id: profile.id,
    display_name: profile.name,
    initials: profile.initials,
    checked_in: false,
    task_done: false,
    check_in_time: '',
    streak_count: getCurrentStreakCount(),
  }
}

function getMemberStatus(member) {
  if (member?.task_done) return 'done'
  if (member?.checked_in) return 'active'
  return 'idle'
}

export default function ShowUp({ user, onGoToDailyStreaks }) {
  const [lockInState] = useState(() => loadLockInState())
  const [profile, setProfile] = useState({ id: 'local-user', name: 'User', initials: 'U' })
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [members, setMembers] = useState([])
  const [roomCounts, setRoomCounts] = useState({})
  const [checkedIn, setCheckedIn] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [statusLine, setStatusLine] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedPosts, setFeedPosts] = useState([])
  const [postDraft, setPostDraft] = useState('')
  const [postImage, setPostImage] = useState('')
  const [expandedComments, setExpandedComments] = useState({})
  const [commentDrafts, setCommentDrafts] = useState({})
  const [bannerIndex, setBannerIndex] = useState(0)
  const [bannerFading, setBannerFading] = useState(false)
  const [sheetState, setSheetState] = useState({ open: false, member: null })
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [notifyText, setNotifyText] = useState('')
  const [notifyAnonymous, setNotifyAnonymous] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showGate, setShowGate] = useState(false)
  const [createRoomName, setCreateRoomName] = useState('')
  const [createFocusAreaId, setCreateFocusAreaId] = useState(ROOM_DEFINITIONS[0].id)
  const fileInputRef = useRef(null)

  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const daysStreak = Math.max(0, Number(summary.currentStreak || 0))
  const customRooms = useMemo(() => safeRead(getCreatedRoomsKey(), []), [showCreateForm, selectedRoom])
  const rooms = useMemo(() => {
    const mappedCustom = Array.isArray(customRooms)
      ? customRooms.map(room => ({
        id: room.id,
        name: room.name,
        description: room.description || 'Custom accountability room',
        roomColor: room.roomColor || '#f95f85',
      }))
      : []
    return [...ROOM_DEFINITIONS, ...mappedCustom]
  }, [customRooms])
  const preferredRoomName = useMemo(() => detectRoomNameFromBoard(), [])
  const joinedRoomNames = useMemo(() => {
    const joined = new Set()
    if (preferredRoomName) joined.add(preferredRoomName)
    rooms.forEach(room => {
      const stored = safeRead(getMockMemberStorageKey(room.name), [])
      if (Array.isArray(stored) && stored.some(member => member?.user_id === profile.id)) {
        joined.add(room.name)
      }
    })
    return joined
  }, [preferredRoomName, profile.id, rooms])

  useEffect(() => {
    if (!selectedRoom) return
    setFeedPosts(safeRead(getFeedStorageKey(selectedRoom), []))
  }, [selectedRoom])

  useEffect(() => {
    if (!selectedRoom) return
    safeWrite(getFeedStorageKey(selectedRoom), feedPosts)
  }, [feedPosts, selectedRoom])

  useEffect(() => {
    let alive = true

    async function bootstrap() {
      setLoading(true)
      try {
        const authResult = supabase ? await supabase.auth.getUser() : { data: { user: null } }
        const nextProfile = getProfile(user, authResult?.data?.user)
        if (!alive) return
        setProfile(nextProfile)
        await loadRoomCounts(nextProfile)
        if (selectedRoom) await loadMembers(selectedRoom, nextProfile)
      } catch (nextError) {
        console.error('Show Up bootstrap failed', nextError)
        if (alive) {
          const fallbackProfile = getProfile(user, null)
          setProfile(fallbackProfile)
          loadRoomCountsFromLocal(fallbackProfile)
          if (selectedRoom) loadMembersFromLocal(selectedRoom, fallbackProfile)
        }
      } finally {
        if (alive) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      alive = false
    }
  }, [selectedRoom, user])

  useEffect(() => {
    if (!supabase) return undefined

    const channel = supabase
      .channel('show-up-room-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_up_checkins',
      }, () => {
        loadRoomCounts(profile)
        if (selectedRoom) loadMembers(selectedRoom, profile)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile, selectedRoom])

  useEffect(() => {
    if (!selectedRoom || activeTab !== 'live') return undefined

    const interval = window.setInterval(() => {
      setBannerFading(true)
      window.setTimeout(() => {
        setBannerIndex(current => (current + 1) % 4)
        setBannerFading(false)
      }, 180)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [activeTab, selectedRoom])

  async function loadRoomCounts(nextProfile = profile) {
    const today = getTodayKey()
    if (!supabase) {
      loadRoomCountsFromLocal(nextProfile)
      return
    }

    try {
      const { data, error: countsError } = await supabase
        .from('show_up_checkins')
        .select('room_name')
        .gte('created_at', `${today}T00:00:00`)

      if (countsError) throw countsError

      const counts = {}
      ;(data || []).forEach(row => {
        counts[row.room_name] = (counts[row.room_name] || 0) + 1
      })
      setRoomCounts(counts)
    } catch (nextError) {
      console.error('Show Up room counts failed', nextError)
      loadRoomCountsFromLocal(nextProfile)
    }
  }

  function loadRoomCountsFromLocal(nextProfile = profile) {
    const counts = {}
    rooms.forEach(room => {
      const stored = safeRead(getMockMemberStorageKey(room.name), [])
      const nextMembers = Array.isArray(stored) && stored.length ? stored : [buildMockMember(nextProfile, room.name)]
      counts[room.name] = nextMembers.length
    })
    setRoomCounts(counts)
  }

  async function loadMembers(roomName, nextProfile = profile) {
    const today = getTodayKey()
    if (!supabase) {
      loadMembersFromLocal(roomName, nextProfile)
      return
    }

    try {
      const { data, error: membersError } = await supabase
        .from('show_up_checkins')
        .select('*')
        .eq('room_name', roomName)
        .gte('created_at', `${today}T00:00:00`)
        .order('check_in_time', { ascending: true })

      if (membersError) throw membersError

      const nextMembers = (data || []).map(member => ({
        ...member,
        streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))

      if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
        nextMembers.unshift(buildMockMember(nextProfile, roomName))
      }

      setMembers(nextMembers)
      hydrateCurrentMember(nextMembers, nextProfile)
    } catch (nextError) {
      console.error('Show Up members failed', nextError)
      loadMembersFromLocal(roomName, nextProfile)
    }
  }

  function loadMembersFromLocal(roomName, nextProfile = profile) {
    const stored = safeRead(getMockMemberStorageKey(roomName), [])
    const nextMembers = Array.isArray(stored) && stored.length ? stored : [buildMockMember(nextProfile, roomName)]
    if (!nextMembers.some(member => member.user_id === nextProfile.id)) {
      nextMembers.unshift(buildMockMember(nextProfile, roomName))
    }
    const withStreaks = nextMembers.map(member => ({
      ...member,
      streak_count: member?.user_id === nextProfile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
    }))
    safeWrite(getMockMemberStorageKey(roomName), withStreaks)
    setMembers(withStreaks)
    hydrateCurrentMember(withStreaks, nextProfile)
  }

  function hydrateCurrentMember(nextMembers, nextProfile = profile) {
    const myMember = nextMembers.find(member => member.user_id === nextProfile.id)
    const nextCheckedIn = Boolean(myMember?.checked_in)
    const nextTaskDone = Boolean(myMember?.task_done)
    setCheckedIn(nextCheckedIn)
    setTaskDone(nextTaskDone)
    setStatusLine(
      nextTaskDone
        ? `Done ✓ — marked at ${formatTime(myMember?.check_in_time)}`
        : nextCheckedIn
          ? `Checked in at ${formatTime(myMember?.check_in_time)}`
          : ''
    )
  }

  function upsertLocalMember(roomName, patch) {
    const current = safeRead(getMockMemberStorageKey(roomName), [])
    const next = [...current]
    const index = next.findIndex(member => member.user_id === patch.user_id)
    if (index >= 0) next[index] = { ...next[index], ...patch }
    else next.unshift({ ...buildMockMember(profile, roomName), ...patch })
    safeWrite(getMockMemberStorageKey(roomName), next)
    loadMembersFromLocal(roomName, profile)
    loadRoomCountsFromLocal(profile)
  }

  async function ensureRoomMembership(roomName) {
    const payload = {
      room_name: roomName,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: false,
      task_done: false,
      streak_count: getCurrentStreakCount(),
    }

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase.from('show_up_checkins').upsert(payload, { onConflict: 'room_name,user_id' })
    } catch (nextError) {
      console.error('Show Up membership fallback', nextError)
      upsertLocalMember(roomName, payload)
    }
  }

  async function handleJoinRoom(roomName) {
    setLoading(true)
    await ensureRoomMembership(roomName)
    setSelectedRoom(roomName)
    setActiveTab('live')
    setLoading(false)
  }

  async function handleCheckIn() {
    if (!selectedRoom) return
    const nowIso = new Date().toISOString()
    const payload = {
      room_name: selectedRoom,
      user_id: profile.id,
      display_name: profile.name,
      initials: profile.initials,
      checked_in: true,
      task_done: false,
      check_in_time: nowIso,
      streak_count: getCurrentStreakCount(),
    }

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase.from('show_up_checkins').upsert(payload, { onConflict: 'room_name,user_id' })
    } catch (nextError) {
      console.error('Show Up check-in failed', nextError)
      upsertLocalMember(selectedRoom, payload)
    }

    setCheckedIn(true)
    setTaskDone(false)
    setStatusLine(`Checked in at ${formatTime(nowIso)}`)
    loadMembers(selectedRoom, profile)
  }

  async function handleMarkDone() {
    if (!selectedRoom) return
    const nowIso = new Date().toISOString()

    try {
      if (!supabase) throw new Error(supabaseConfigError || 'Supabase unavailable')
      await supabase
        .from('show_up_checkins')
        .update({ checked_in: true, task_done: true, check_in_time: nowIso })
        .eq('room_name', selectedRoom)
        .eq('user_id', profile.id)
    } catch (nextError) {
      console.error('Show Up mark done failed', nextError)
      upsertLocalMember(selectedRoom, {
        room_name: selectedRoom,
        user_id: profile.id,
        display_name: profile.name,
        initials: profile.initials,
        checked_in: true,
        task_done: true,
        check_in_time: nowIso,
        streak_count: getCurrentStreakCount(),
      })
    }

    setLastCompletedToday()
    setCheckedIn(true)
    setTaskDone(true)
    setStatusLine(`Done ✓ — marked at ${formatTime(nowIso)}`)
    loadMembers(selectedRoom, profile)
  }

  function handlePhotoPick(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPostImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function addFeedPost(post) {
    setFeedPosts(current => [post, ...current].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
  }

  function handleCreatePost() {
    const text = postDraft.trim()
    if (!text && !postImage) return
    addFeedPost({
      id: uid(),
      authorId: profile.id,
      authorName: profile.name,
      authorInitials: profile.initials,
      anonymous: false,
      text,
      image: postImage,
      createdAt: new Date().toISOString(),
      reactions: { fire: [], power: [], love: [] },
      comments: [],
    })
    setPostDraft('')
    setPostImage('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handleToggleReaction(postId, reactionKey) {
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      const nextSet = new Set(post.reactions?.[reactionKey] || [])
      if (nextSet.has(profile.id)) nextSet.delete(profile.id)
      else nextSet.add(profile.id)
      return {
        ...post,
        reactions: {
          ...post.reactions,
          [reactionKey]: [...nextSet],
        },
      }
    }))
  }

  function handleAddComment(postId) {
    const draft = String(commentDrafts[postId] || '').trim()
    if (!draft) return
    setFeedPosts(current => current.map(post => {
      if (post.id !== postId) return post
      return {
        ...post,
        comments: [
          ...(post.comments || []),
          {
            id: uid(),
            authorId: profile.id,
            authorName: profile.name,
            authorInitials: profile.initials,
            anonymous: false,
            text: draft,
            createdAt: new Date().toISOString(),
          },
        ],
      }
    }))
    setCommentDrafts(current => ({ ...current, [postId]: '' }))
  }

  function openNotifySheet(member) {
    setSheetState({ open: true, member })
    setSelectedTemplate('')
    setNotifyText('')
    setNotifyAnonymous(false)
  }

  function handleSelectTemplate(template) {
    setSelectedTemplate(template)
    setNotifyText(template)
  }

  function handleSendNotification() {
    const text = notifyText.trim()
    if (!text || !sheetState.member) return
    addFeedPost({
      id: uid(),
      authorId: notifyAnonymous ? `anon-${uid()}` : profile.id,
      authorName: notifyAnonymous ? 'Anonymous · Room' : profile.name,
      authorInitials: notifyAnonymous ? '👤' : profile.initials,
      anonymous: notifyAnonymous,
      text,
      image: '',
      createdAt: new Date().toISOString(),
      reactions: { fire: [], power: [], love: [] },
      comments: [],
    })
    setSheetState({ open: false, member: null })
    setSelectedTemplate('')
    setNotifyText('')
    setNotifyAnonymous(false)
  }

  function handleCreateRoomPress() {
    const latestLevel = getStoredUserLevel() || calculateUserPoints()
    if ((latestLevel?.level || 1) < 4) {
      setShowGate(true)
      setShowCreateForm(false)
      return
    }
    setShowGate(false)
    setShowCreateForm(current => !current)
  }

  function handleCreateRoomSubmit(event) {
    event.preventDefault()
    const room = createRoomName.trim()
    if (!room) return
    const focus = rooms.find(item => item.id === createFocusAreaId) || ROOM_DEFINITIONS[0]
    const nextRooms = [
      ...safeRead(getCreatedRoomsKey(), []),
      {
        id: uid(),
        name: room,
        description: focus.description,
        roomColor: focus.roomColor,
      },
    ]
    safeWrite(getCreatedRoomsKey(), nextRooms)
    setCreateRoomName('')
    setCreateFocusAreaId(ROOM_DEFINITIONS[0].id)
    setShowCreateForm(false)
  }

  const activeCount = useMemo(() => members.filter(member => getMemberStatus(member) === 'active').length, [members])
  const completedCount = useMemo(() => members.filter(member => getMemberStatus(member) === 'done').length, [members])
  const roomStreakDays = useMemo(
    () => members.reduce((max, member) => Math.max(max, member.user_id === profile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0)), 0),
    [members, profile.id],
  )
  const bannerMessages = useMemo(() => ([
    'Your streak is at risk — mark done before midnight 🔥',
    `${members.length} people in this room today`,
    `Room streak: ${roomStreakDays} days strong 💪`,
    `${completedCount} members completed today ✓`,
  ]), [completedCount, members.length, roomStreakDays])
  const visiblePosts = useMemo(() => [...feedPosts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [feedPosts])
  const rankedMembers = useMemo(() => {
    return [...members]
      .map(member => ({
        ...member,
        streakValue: member.user_id === profile.id ? getCurrentStreakCount() : Number(member?.streak_count || 0),
      }))
      .sort((a, b) => b.streakValue - a.streakValue || String(a.display_name || '').localeCompare(String(b.display_name || '')))
  }, [members, profile.id])

  if (!selectedRoom) {
    return (
      <div className="showup-root">
        <style>{SHOW_UP_STYLES}</style>
        <div className="showup-shell">
          <div className="showup-list-header">
            <p className="showup-list-kicker">All Rooms</p>
            <button type="button" className="showup-create-link" onClick={handleCreateRoomPress}>
              <Plus size={16} strokeWidth={2.4} />
              <span>Create room</span>
            </button>
          </div>

          {showCreateForm ? (
            <form className="showup-create-form" onSubmit={handleCreateRoomSubmit}>
              <label className="showup-field">
                <span className="showup-field-label">Room Name</span>
                <input className="showup-input" value={createRoomName} onChange={event => setCreateRoomName(event.target.value)} placeholder="Enter room name" />
              </label>
              <label className="showup-field">
                <span className="showup-field-label">Focus Area</span>
                <select className="showup-select" value={createFocusAreaId} onChange={event => setCreateFocusAreaId(event.target.value)}>
                  {ROOM_DEFINITIONS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </label>
              <button type="submit" className="showup-create-btn">Create</button>
            </form>
          ) : null}

          {showGate ? (
            <div className="showup-gate-card">
              <p className="showup-gate-title">Keep going. Creating rooms unlocks at 90 days.</p>
              <p className="showup-gate-copy">
                You are {daysStreak} days in. The rooms you can join right now are where your people already are.
              </p>
              <div className="showup-gate-actions">
                <button type="button" className="showup-gate-btn" onClick={() => onGoToDailyStreaks?.()}>Go to Daily Streaks</button>
                <button type="button" className="showup-gate-btn" onClick={() => setShowGate(false)}>Close</button>
              </div>
            </div>
          ) : null}

          <div className="showup-list-panel">
            {rooms.map(room => {
              const joined = roomCounts[room.name] || 0
              const spotsLeft = Math.max(0, MAX_ROOM_SIZE - joined)
              const isJoined = joinedRoomNames.has(room.name)
              const RoomIcon = ROOM_ICONS[room.id] || Sparkles
              return (
                <div key={room.id} className="showup-list-row">
                  <div className="showup-list-icon" style={{ background: `${room.roomColor}18`, color: room.roomColor }}>
                    <RoomIcon size={24} strokeWidth={2.1} />
                  </div>
                  <div className="showup-list-content">
                    <p className="showup-list-name">{room.name}</p>
                    <p className="showup-list-meta">
                      {isJoined ? `${joined} members` : `${spotsLeft} spots`} · {joined} checked in today
                    </p>
                  </div>
                  <div className="showup-list-action">
                    <button
                      type="button"
                      className={`showup-join-pill ${isJoined ? 'is-joined' : ''}`}
                      onClick={() => handleJoinRoom(room.name)}
                    >
                      {isJoined ? (
                        <span className="showup-list-state">
                          <Check size={14} strokeWidth={2.5} />
                          <span>Joined</span>
                        </span>
                      ) : (
                        <span>Join</span>
                      )}
                    </button>
                    <ChevronRight size={16} strokeWidth={2.3} className="showup-list-arrow" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="showup-root">
      <style>{SHOW_UP_STYLES}</style>

      <div className="showup-shell">
        <div className="showup-sticky-header">
          <div className="showup-topbar">
            <button type="button" className="showup-header-btn" onClick={() => setSelectedRoom(null)}>←</button>
            <h1 className="showup-room-title">{selectedRoom}</h1>
            <div className="showup-live-pill">
              <span className="showup-live-dot" />
              <span>{activeCount} active</span>
            </div>
          </div>

          <div className={`showup-cta ${activeTab !== 'live' ? 'is-hidden' : ''}`}>
            {!checkedIn ? (
              <>
                <button type="button" className="showup-checkin-btn" onClick={handleCheckIn}>Check In</button>
                <button type="button" className="showup-done-btn" onClick={handleMarkDone}>Mark Done</button>
              </>
            ) : !taskDone ? (
              <>
                <div />
                <button type="button" className="showup-done-btn" onClick={handleMarkDone}>Mark Done</button>
              </>
            ) : null}
          </div>

          <p className={`showup-status-line ${taskDone ? 'is-done' : ''}`}>{statusLine}</p>

          <div className={`showup-banner ${bannerFading ? 'is-fading' : ''} ${activeTab !== 'live' ? 'is-hidden' : ''}`}>
            {bannerMessages[bannerIndex]}
          </div>
        </div>

        {error ? <div className="showup-empty">{error}</div> : null}
        {loading && !members.length ? <div className="showup-empty">Loading your room...</div> : null}

        {activeTab === 'live' ? (
          <div className="showup-member-grid">
            {members.map(member => {
              const status = getMemberStatus(member)
              const isSelf = member.user_id === profile.id
              return (
                <div key={member.user_id} className="showup-member-card">
                  <span className={`showup-member-dot ${status === 'active' ? 'is-active' : status === 'done' ? 'is-done' : 'is-idle'}`} />
                  <div className="showup-avatar">{member.initials || buildInitials(member.display_name)}</div>
                  <p className="showup-member-name">{isSelf ? 'You' : member.display_name}</p>
                  <p className={`showup-member-status ${status === 'active' ? 'is-active' : status === 'done' ? 'is-done' : 'is-idle'}`}>
                    {status === 'active' ? 'Active now' : status === 'done' ? 'Done ✓' : 'Not yet'}
                  </p>
                  {!isSelf ? (
                    <button type="button" className="showup-bell-btn" onClick={() => openNotifySheet(member)}>🔔</button>
                  ) : (
                    <div className="showup-bell-btn" aria-hidden="true" />
                  )}
                </div>
              )
            })}
          </div>
        ) : null}

        {activeTab === 'feed' ? (
          <div className="showup-feed-view">
            <div className="showup-compose-card">
              <div className="showup-compose-top">
                <div className="showup-avatar">{profile.initials}</div>
                <input
                  className="showup-compose-input"
                  value={postDraft}
                  onChange={event => setPostDraft(event.target.value)}
                  placeholder="Share what you are working on..."
                />
              </div>
              {postImage ? <img className="showup-feed-image" src={postImage} alt="Upload preview" /> : null}
              <div className="showup-compose-actions">
                <button type="button" className="showup-photo-btn" onClick={() => fileInputRef.current?.click()}>Photo</button>
                <button type="button" className="showup-post-btn" onClick={handleCreatePost}>Post</button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="showup-hidden-input" onChange={handlePhotoPick} />
            </div>

            {visiblePosts.length === 0 ? (
              <div className="showup-empty">No posts yet. Share what you are working on…</div>
            ) : (
              visiblePosts.map(post => (
                <div key={post.id} className={`showup-feed-card ${post.anonymous ? 'is-anonymous' : ''}`}>
                  <div className="showup-feed-header">
                    <div className="showup-feed-author">
                      <div className="showup-avatar">{post.anonymous ? '👤' : post.authorInitials || buildInitials(post.authorName)}</div>
                      <div>
                        <p className="showup-feed-name">{post.anonymous ? 'Anonymous · Room' : post.authorName}</p>
                        <p className="showup-feed-time">{formatTimestamp(post.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                  <p className="showup-feed-text">{post.text}</p>
                  {post.image ? <img className="showup-feed-image" src={post.image} alt="Feed upload" /> : null}
                  <div className="showup-feed-reactions">
                    <div className="showup-feed-chip-row">
                      {REACTION_KEYS.map(reaction => {
                        const count = (post.reactions?.[reaction.key] || []).length
                        const active = (post.reactions?.[reaction.key] || []).includes(profile.id)
                        return (
                          <button
                            key={reaction.key}
                            type="button"
                            className={`showup-reaction-chip ${active ? 'is-active' : ''}`}
                            onClick={() => handleToggleReaction(post.id, reaction.key)}
                          >
                            {reaction.emoji} {count}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      className="showup-comment-toggle"
                      onClick={() => setExpandedComments(current => ({ ...current, [post.id]: !current[post.id] }))}
                    >
                      Comment
                    </button>
                  </div>
                  {expandedComments[post.id] ? (
                    <div className="showup-comments">
                      {(post.comments || []).map(comment => (
                        <div key={comment.id} className="showup-comment-row">
                          <div className="showup-avatar">{comment.anonymous ? '👤' : comment.authorInitials || buildInitials(comment.authorName)}</div>
                          <div className="showup-comment-bubble">
                            <p className="showup-comment-author">{comment.anonymous ? 'Anonymous · Room' : comment.authorName}</p>
                            <p className="showup-comment-text">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                      <div className="showup-comment-compose">
                        <input
                          className="showup-comment-input"
                          value={commentDrafts[post.id] || ''}
                          onChange={event => setCommentDrafts(current => ({ ...current, [post.id]: event.target.value }))}
                          placeholder="Add a comment..."
                        />
                        <button type="button" className="showup-comment-send" onClick={() => handleAddComment(post.id)}>Send</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        ) : null}

        {activeTab === 'ranks' ? (
          <div className="showup-ranks-view">
            {rankedMembers.map((member, index) => {
              const badge =
                index === 0 ? '👑 Leader'
                  : index === 1 ? '🥈 Rising'
                    : index === 2 ? '🥉 Building'
                      : member.streakValue > 0 ? 'Starting' : 'Not yet'
              const rowClass =
                index === 0 ? 'is-leader'
                  : index === 1 ? 'is-rising'
                    : index === 2 ? 'is-building'
                      : ''
              return (
                <div key={member.user_id} className={`showup-rank-row ${rowClass}`}>
                  <div className="showup-rank-number">{index + 1}</div>
                  <div className="showup-avatar">{member.initials || buildInitials(member.display_name)}</div>
                  <div>
                    <p className="showup-rank-name">{member.user_id === profile.id ? 'You' : member.display_name}</p>
                    <p className="showup-rank-streak">{member.streakValue} day streak</p>
                  </div>
                  <div className="showup-rank-number">{member.streakValue}</div>
                  <div className="showup-rank-badge">{badge}</div>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

      {selectedRoom ? (
        <div className="showup-tabs">
          {[
            { key: 'live', label: 'Live' },
            { key: 'feed', label: 'Feed' },
            { key: 'ranks', label: 'Ranks' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`showup-tab ${activeTab === tab.key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      {sheetState.open && sheetState.member ? (
        <div className="showup-sheet-backdrop" onClick={() => setSheetState({ open: false, member: null })}>
          <div className="showup-sheet" onClick={event => event.stopPropagation()}>
            <h2 className="showup-sheet-title">Notify {sheetState.member.display_name}</h2>
            <div className="showup-sheet-list">
              {TEMPLATE_MESSAGES.map(template => (
                <button
                  key={template}
                  type="button"
                  className={`showup-template-btn ${selectedTemplate === template ? 'is-selected' : ''}`}
                  onClick={() => handleSelectTemplate(template)}
                >
                  {template}
                </button>
              ))}
            </div>
            <div className="showup-sheet-divider">or write your own</div>
            <textarea
              className="showup-sheet-textarea"
              value={notifyText}
              onChange={event => setNotifyText(event.target.value)}
              placeholder="Write your message..."
            />
            <label className="showup-anon">
              <input type="checkbox" checked={notifyAnonymous} onChange={event => setNotifyAnonymous(event.target.checked)} />
              <span>Send anonymously — shows in feed without your name</span>
            </label>
            <div className="showup-sheet-actions">
              <button type="button" className="showup-sheet-send" onClick={handleSendNotification}>Send</button>
              <button type="button" className="showup-sheet-cancel" onClick={() => setSheetState({ open: false, member: null })}>Cancel</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
