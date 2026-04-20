import { useEffect, useMemo, useState } from 'react'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { calculateUserPoints, getLevelForPoints, getStoredUserLevel } from '../lib/userLevel'

const ROOM_DEFINITIONS = [
  { id: 'health-fitness', name: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', color: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', description: 'Job, entrepreneurship, income streams', color: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', description: 'Savings, investing, debt, financial freedom', color: '#d4773a' },
  { id: 'relationships', name: 'Relationships', description: 'Love, family, friendships, community', color: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', description: 'Spirituality, religion, mindfulness, mental health', color: '#4a7fc1' },
  { id: 'personal-growth', name: 'Personal Growth', description: 'Learning, creativity, self-development', color: '#5e8f64' },
]

const CUSTOM_ROOMS_KEY = 'phasr_show_up_custom_rooms'
const ROOM_STATE_KEY = 'phasr_show_up_room_state'
const MAX_CARRIES_PER_PHASE = 2
const MAX_ROOM_SPOTS = 12

function getInitials(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() || '')
    .join('') || 'YU'
}

function getDisplayName(user) {
  return String(
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'You'
  ).trim()
}

function getScopedKey(base) {
  const id = localStorage.getItem('phasr_active_user') || ''
  return id ? `${base}:${id}` : base
}

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function getLocalDateKey(date = new Date()) {
  const local = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
  return local.toISOString().slice(0, 10)
}

function addDays(dateKey, days) {
  const next = new Date(`${dateKey}T12:00:00`)
  next.setDate(next.getDate() + days)
  return getLocalDateKey(next)
}

function getYesterdayKey() {
  return addDays(getLocalDateKey(), -1)
}

function formatCheckInTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function readCustomRooms() {
  const scoped = safeParse(localStorage.getItem(getScopedKey(CUSTOM_ROOMS_KEY)), null)
  if (Array.isArray(scoped)) return scoped
  return safeParse(localStorage.getItem(CUSTOM_ROOMS_KEY), [])
}

function writeCustomRooms(rooms) {
  const serialized = JSON.stringify(rooms)
  localStorage.setItem(CUSTOM_ROOMS_KEY, serialized)
  localStorage.setItem(getScopedKey(CUSTOM_ROOMS_KEY), serialized)
}

function readRoomState() {
  const scoped = safeParse(localStorage.getItem(getScopedKey(ROOM_STATE_KEY)), null)
  if (scoped?.rooms) return scoped
  const legacy = safeParse(localStorage.getItem(ROOM_STATE_KEY), null)
  if (legacy?.rooms) return legacy
  return { rooms: {} }
}

function writeRoomState(state) {
  const serialized = JSON.stringify(state)
  localStorage.setItem(ROOM_STATE_KEY, serialized)
  localStorage.setItem(getScopedKey(ROOM_STATE_KEY), serialized)
}

function makeCustomRoomId(name) {
  const normalized = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `custom-${normalized || 'room'}`
}

function getEmptyRoomState() {
  return {
    members: {},
    activity: {},
  }
}

function ensureRoom(state, roomName) {
  state.rooms[roomName] = state.rooms[roomName] || getEmptyRoomState()
  state.rooms[roomName].members = state.rooms[roomName].members || {}
  state.rooms[roomName].activity = state.rooms[roomName].activity || {}
  return state.rooms[roomName]
}

function ensureMember(roomState, roomName, member) {
  const room = ensureRoom(roomState, roomName)
  const profile = room.members[member.userId] || {
    userId: member.userId,
    displayName: member.displayName || `@${String(member.initials || 'PH').toUpperCase()}`,
    initials: String(member.initials || 'PH').toUpperCase(),
    carriesUsed: 0,
    streakCount: 0,
    joinedAt: getLocalDateKey(),
    lastStatus: null,
    lastStatusDate: null,
    lastCheckInDate: null,
  }

  room.members[member.userId] = {
    ...profile,
    displayName: member.displayName || profile.displayName,
    initials: String(member.initials || profile.initials || 'PH').toUpperCase(),
    joinedAt: profile.joinedAt || getLocalDateKey(),
    carriesUsed: Number.isFinite(profile.carriesUsed) ? profile.carriesUsed : 0,
    streakCount: Number.isFinite(profile.streakCount) ? profile.streakCount : 0,
  }

  return room.members[member.userId]
}

function setMemberActivity(roomState, roomName, userId, dateKey, activity) {
  const room = ensureRoom(roomState, roomName)
  room.activity[dateKey] = room.activity[dateKey] || {}
  room.activity[dateKey][userId] = activity
}

function settleCarries(roomState, roomName, todayKey = getLocalDateKey()) {
  const room = ensureRoom(roomState, roomName)
  const yesterdayKey = addDays(todayKey, -1)
  const memberProfiles = Object.values(room.members || {})

  memberProfiles.forEach(profile => {
    const joinedAt = profile.joinedAt || todayKey
    let cursor = profile.lastStatusDate ? addDays(profile.lastStatusDate, 1) : joinedAt
    while (cursor <= yesterdayKey) {
      const existingActivity = room.activity?.[cursor]?.[profile.userId]
      if (existingActivity) {
        profile.lastStatus = existingActivity.status
        profile.lastStatusDate = cursor
        profile.lastCheckInDate = existingActivity.status === 'completed' ? cursor : profile.lastCheckInDate
        profile.carriesUsed = Number.isFinite(existingActivity.carriesUsedAfter) ? existingActivity.carriesUsedAfter : Number(profile.carriesUsed || 0)
        profile.streakCount = Number.isFinite(existingActivity.streakCount)
          ? existingActivity.streakCount
          : existingActivity.status === 'missed'
            ? 0
            : Number(profile.streakCount || 0)
        cursor = addDays(cursor, 1)
        continue
      }

      const previousDate = addDays(cursor, -1)
      const previousStatus = room.activity?.[previousDate]?.[profile.userId]?.status || profile.lastStatus || null
      const carriesUsed = Number(profile.carriesUsed || 0)
      const canCarry = carriesUsed < MAX_CARRIES_PER_PHASE && previousStatus !== 'missed' && previousStatus !== 'carried'
      const status = canCarry ? 'carried' : 'missed'
      const nextCarriesUsed = canCarry ? carriesUsed + 1 : carriesUsed
      const nextStreakCount = canCarry ? Number(profile.streakCount || 0) : 0

      setMemberActivity(roomState, roomName, profile.userId, cursor, {
        status,
        createdAt: new Date().toISOString(),
        carriesUsedAfter: nextCarriesUsed,
        streakCount: nextStreakCount,
      })

      profile.carriesUsed = nextCarriesUsed
      profile.streakCount = nextStreakCount
      profile.lastStatus = status
      profile.lastStatusDate = cursor
      cursor = addDays(cursor, 1)
    }
  })

  return roomState
}

function mergeRemoteMembers(roomState, roomName, rows, currentUser) {
  const room = ensureRoom(roomState, roomName)
  const todayKey = getLocalDateKey()

  rows.forEach(row => {
    if (!row?.user_id) return
    const profile = ensureMember(roomState, roomName, {
      userId: row.user_id,
      displayName: row.user_id === currentUser?.id ? 'You' : `@${String(row.user_initials || 'PH').toUpperCase()}`,
      initials: String(row.user_initials || 'PH').toUpperCase(),
    })

    if (Number.isFinite(row.streak_count)) profile.streakCount = row.streak_count

    if (row.checked_in) {
      setMemberActivity(roomState, roomName, row.user_id, todayKey, {
        status: 'completed',
        checkInTime: row.check_in_time || new Date().toISOString(),
        createdAt: row.created_at || new Date().toISOString(),
        carriesUsedAfter: Number(profile.carriesUsed || 0),
        streakCount: Number.isFinite(row.streak_count) ? row.streak_count : Math.max(1, Number(profile.streakCount || 1)),
      })
      profile.lastStatus = 'completed'
      profile.lastStatusDate = todayKey
      profile.lastCheckInDate = todayKey
    }
  })

  return room
}

function buildRenderableMembers(roomState, roomName, currentUser, remoteMembers = []) {
  const room = ensureRoom(roomState, roomName)
  const todayKey = getLocalDateKey()
  const remoteById = new Map(remoteMembers.map(member => [member.user_id, member]))

  return Object.values(room.members || {})
    .map(profile => {
      const todayActivity = room.activity?.[todayKey]?.[profile.userId] || null
      const remoteRow = remoteById.get(profile.userId)
      const carriesUsed = Number(profile.carriesUsed || 0)
      const carriesLeft = Math.max(0, MAX_CARRIES_PER_PHASE - carriesUsed)
      const fallbackCheckedIn = Boolean(remoteRow?.checked_in)
      return {
        user_id: profile.userId,
        user_initials: profile.initials,
        displayName: profile.userId === currentUser?.id ? 'You' : profile.displayName,
        initials: profile.initials,
        isYou: profile.userId === currentUser?.id,
        isOnline: Boolean(todayActivity?.status === 'completed' || fallbackCheckedIn),
        checked_in: Boolean(todayActivity?.status === 'completed' || fallbackCheckedIn),
        check_in_time: todayActivity?.checkInTime || remoteRow?.check_in_time || null,
        streak_count: Number(profile.streakCount || remoteRow?.streak_count || 0),
        carriesUsed,
        carriesLeft,
        dailyStatus: todayActivity?.status || (fallbackCheckedIn ? 'completed' : null),
        joinedAt: profile.joinedAt,
      }
    })
    .sort((a, b) => {
      if (b.checked_in !== a.checked_in) return Number(b.checked_in) - Number(a.checked_in)
      return (b.streak_count || 0) - (a.streak_count || 0)
    })
}

async function logActivity(userId, eventType, eventData = {}) {
  if (!supabase || !userId) return
  await supabase.from('user_activity_log').insert({
    user_id: userId,
    event_type: eventType,
    event_data: eventData,
    created_at: new Date().toISOString(),
  })
}

async function loadRoomMembers(roomName) {
  if (!supabase) return []
  const today = getLocalDateKey()
  const { data, error } = await supabase
    .from('show_up_rooms')
    .select('*')
    .eq('room_name', roomName)
    .gte('created_at', today)
    .order('streak_count', { ascending: false })
    .order('check_in_time', { ascending: false })

  if (error) throw error
  return data || []
}

async function loadRoomSummary() {
  if (!supabase) return {}
  const today = getLocalDateKey()
  const { data, error } = await supabase
    .from('show_up_rooms')
    .select('room_name,user_id,checked_in')
    .gte('created_at', today)

  if (error) throw error

  return (data || []).reduce((acc, row) => {
    acc[row.room_name] = acc[row.room_name] || { memberCount: 0, joinedUserIds: new Set() }
    acc[row.room_name].memberCount += 1
    if (row.user_id) acc[row.room_name].joinedUserIds.add(row.user_id)
    return acc
  }, {})
}

async function checkIn(roomName, user, streakCount) {
  if (!supabase || !user?.id) return
  await supabase.from('show_up_rooms').upsert({
    room_name: roomName,
    user_id: user.id,
    user_initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
    checked_in: true,
    check_in_time: new Date().toISOString(),
    task_completed: true,
    streak_count: streakCount || 1,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,room_name' })
}

async function undoCheckIn(roomName, user, streakCount) {
  if (!supabase || !user?.id) return
  await supabase.from('show_up_rooms').upsert({
    room_name: roomName,
    user_id: user.id,
    user_initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
    checked_in: false,
    check_in_time: null,
    task_completed: false,
    streak_count: streakCount || 1,
    created_at: new Date().toISOString(),
  }, { onConflict: 'user_id,room_name' })
}

function FeedContent({ members }) {
  const statusOrder = { completed: 0, carried: 1, missed: 2, pending: 3 }
  const feed = [...members].sort((a, b) => {
    const aOrder = statusOrder[a.dailyStatus || 'pending'] ?? 99
    const bOrder = statusOrder[b.dailyStatus || 'pending'] ?? 99
    if (aOrder !== bOrder) return aOrder - bOrder
    return String(a.displayName || '').localeCompare(String(b.displayName || ''))
  })

  if (!feed.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: 14 }}>
        <p style={{ margin: 0, fontSize: '0.76rem', color: '#7a5a66', lineHeight: 1.6 }}>
          No room activity yet.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {feed.map(member => {
        const isCompleted = member.dailyStatus === 'completed'
        const isCarried = member.dailyStatus === 'carried'
        const isMissed = member.dailyStatus === 'missed'
        const accent = isCompleted ? '#e8407a' : isCarried ? '#7a58b0' : isMissed ? '#9ca3af' : '#b08090'
        const title = isCompleted
          ? (member.isYou ? 'You showed up.' : `${member.displayName} showed up.`)
          : isCarried
            ? `${member.displayName} was protected today. Show up tomorrow.`
            : isMissed
              ? `${member.displayName} did not show up.`
              : `${member.displayName} has not checked in yet today.`
        const detail = isCompleted
          ? 'Showed up.'
          : isCarried
            ? 'Protection used today - needs tomorrow\'s check-in.'
            : isMissed
              ? '\u25CB Did not show up.'
              : 'Waiting on today\'s check-in.'

        return (
          <div key={member.user_id} style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: 12 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#3d1f2b' }}>
              {title}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.69rem', color: accent }}>
              {detail}
            </p>
            {isCompleted && member.check_in_time ? (
              <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: '#b08090' }}>
                {formatCheckInTime(member.check_in_time)}
              </p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function PresenceGrid({ members }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8,
      padding: '4px 0',
    }}>
      {members.map(member => (
        <div key={member.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #e8407a, #f472a8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#fff',
            position: 'relative',
          }}>
            {member.initials}
            {member.isOnline && (
              <div style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#34d399',
                border: '2px solid #fff',
              }} />
            )}
          </div>
          <p style={{ margin: 0, fontSize: '0.55rem', color: '#7a5a66', textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.displayName}
          </p>
          <p style={{ margin: 0, fontSize: '0.53rem', color: '#b08090', textAlign: 'center' }}>
            Carries left: {member.carriesLeft}
          </p>
        </div>
      ))}
    </div>
  )
}

function LeaderboardContent({ members }) {
  const ranked = [...members].sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0))

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {ranked.map((member, index) => (
        <div key={member.user_id} style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#3d1f2b' }}>
              {index + 1}. {member.displayName}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '0.62rem', color: '#b08090' }}>
              Carries left: {member.carriesLeft}
            </p>
          </div>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#e8407a', fontWeight: 700 }}>
            {member.streak_count || 0} streak
          </p>
        </div>
      ))}
    </div>
  )
}

function MemberTiles({ members, onSelectMember }) {
  if (!members.length) {
    return (
      <div style={{ background: '#fff8fb', border: '1px solid #f2c4d0', borderRadius: 18, padding: '20px 16px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#3d1f2b' }}>No one is in this room yet</p>
        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: '#7a5a66' }}>
          Check in to become the first visible person here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {members.map(member => (
        <button
          key={member.user_id}
          type="button"
          onClick={() => onSelectMember(member)}
          style={{
            minWidth: 92,
            border: '1px solid #f2c4d0',
            borderRadius: 18,
            background: '#fff',
            padding: '12px 10px',
            cursor: member.isYou ? 'default' : 'pointer',
            display: 'grid',
            gap: 6,
            justifyItems: 'center',
          }}
        >
          <div style={{ position: 'relative' }}>
            <div style={{
              minWidth: 44,
              height: 34,
              borderRadius: 999,
              background: '#fff1f6',
              display: 'grid',
              placeItems: 'center',
              padding: '0 12px',
              fontWeight: 800,
              color: '#4a2032',
            }}>
              {member.initials}
            </div>
            {member.checked_in ? (
              <span style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: '#ff5f9d',
                border: '2px solid #fff',
              }} />
            ) : null}
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3d1f2b' }}>
            {member.displayName}
          </span>
          <span style={{ fontSize: '0.58rem', color: '#b08090' }}>
            {member.isYou ? 'You' : member.checked_in ? 'Tap to nudge' : 'Tap to nudge'}
          </span>
        </button>
      ))}
    </div>
  )
}

function LiveStatusContent({ members }) {
  const completed = members.filter(member => member.dailyStatus === 'completed')
  const active = members.filter(member => !member.dailyStatus || member.dailyStatus === 'pending')
  const inactive = members.filter(member => member.dailyStatus === 'missed' || member.dailyStatus === 'carried')

  function renderNames(items) {
    if (!items.length) return 'None'
    return items.map(member => member.displayName).join(', ')
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3d1f2b', lineHeight: 1 }}>{completed.length}</div>
          <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>Completed today</div>
        </div>
        <div style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3d1f2b', lineHeight: 1 }}>{active.length}</div>
          <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>Active today</div>
        </div>
      </div>

      {[
        { title: 'Completed', body: renderNames(completed) },
        { title: 'Active', body: renderNames(active) },
        { title: 'Inactive', body: renderNames(inactive) },
      ].map(section => (
        <div key={section.title} style={{ background: '#fff8fb', border: '1px solid #f2c4d0', borderRadius: 18, padding: 16 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c6170' }}>
            {section.title}
          </div>
          <div style={{ marginTop: 10, background: '#fff', borderRadius: 999, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 700, color: '#3d1f2b' }}>
            {section.body}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ShowUp({ user, onGoToDailyStreaks }) {
  const [lockInState] = useState(() => loadLockInState())
  const [roomState, setRoomState] = useState(() => readRoomState())
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [activeTab, setActiveTab] = useState('Feed')
  const [members, setMembers] = useState([])
  const [remoteMembers, setRemoteMembers] = useState([])
  const [roomSummary, setRoomSummary] = useState({})
  const [customRooms, setCustomRooms] = useState(() => readCustomRooms())
  const [userLevel, setUserLevel] = useState(() => getStoredUserLevel() || calculateUserPoints())
  const [showGateModal, setShowGateModal] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createRoomName, setCreateRoomName] = useState('')
  const [createFocusAreaId, setCreateFocusAreaId] = useState(ROOM_DEFINITIONS[0].id)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [debtClearedVisible, setDebtClearedVisible] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [nudgeNotice, setNudgeNotice] = useState('')
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])

  const rooms = useMemo(() => {
    const builtInNames = new Set(ROOM_DEFINITIONS.map(room => room.name))
    const knownNames = new Set(customRooms.map(room => room.name))
    const inferredRooms = Object.keys(roomSummary || {})
      .filter(name => !builtInNames.has(name) && !knownNames.has(name))
      .map(name => ({
        id: makeCustomRoomId(name),
        name,
        description: 'Custom room',
        color: '#e8407a',
      }))
    return [...ROOM_DEFINITIONS, ...customRooms, ...inferredRooms]
  }, [customRooms, roomSummary])

  const activeRoom = useMemo(() => rooms.find(room => room.id === activeRoomId) || null, [activeRoomId, rooms])
  const activeRoomState = useMemo(
    () => activeRoom?.name ? (roomState.rooms?.[activeRoom.name] || getEmptyRoomState()) : getEmptyRoomState(),
    [activeRoom?.name, roomState.rooms],
  )
  const checkedInMember = useMemo(
    () => members.find(member => member.user_id === user?.id) || null,
    [members, user?.id],
  )
  const checkedIn = Boolean(checkedInMember?.checked_in)
  const checkInTime = formatCheckInTime(checkedInMember?.check_in_time)
  const requiredPointsForLevelFour = 101
  const unlockTarget = getLevelForPoints(requiredPointsForLevelFour)
  const pointsToUnlock = Math.max(0, requiredPointsForLevelFour - Number(userLevel?.points || 0))
  const unlockProgress = Math.max(0, Math.min(100, Math.round((Math.min(Number(userLevel?.points || 0), requiredPointsForLevelFour) / requiredPointsForLevelFour) * 100)))
  const carriedYesterday = Boolean(activeRoom?.name && activeRoomState.activity?.[getYesterdayKey()]?.[user?.id]?.status === 'carried')

  function commitRoomState(nextState) {
    setRoomState(nextState)
    writeRoomState(nextState)
  }

  async function refreshRoomSummary() {
    try {
      const next = await loadRoomSummary()
      setRoomSummary(next)
      setError('')
    } catch (nextError) {
      console.error('Show Up summary sync failed', nextError)
      setError('Room updates will keep syncing in the background.')
    }
  }

  async function refreshActiveRoom(roomName) {
    if (!roomName) {
      setRemoteMembers([])
      setMembers([])
      return
    }

    try {
      const nextRemoteMembers = await loadRoomMembers(roomName)
      const nextRoomState = readRoomState()
      mergeRemoteMembers(nextRoomState, roomName, nextRemoteMembers, user)
      settleCarries(nextRoomState, roomName)
      setRemoteMembers(nextRemoteMembers)
      commitRoomState(nextRoomState)
      setMembers(buildRenderableMembers(nextRoomState, roomName, user, nextRemoteMembers))
      setError('')
    } catch (nextError) {
      console.error('Show Up member sync failed', nextError)
      const nextRoomState = readRoomState()
      settleCarries(nextRoomState, roomName)
      commitRoomState(nextRoomState)
      setRemoteMembers([])
      setMembers(buildRenderableMembers(nextRoomState, roomName, user, []))
      setError('Room updates will keep syncing in the background.')
    }
  }

  useEffect(() => {
    const nextRoomState = readRoomState()
    const roomNames = rooms.map(room => room.name)
    roomNames.forEach(roomName => settleCarries(nextRoomState, roomName))
    commitRoomState(nextRoomState)
  }, [rooms])

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      if (!supabase) {
        setError(supabaseConfigError || 'Supabase is not configured.')
        setLoading(false)
        return
      }
      await refreshRoomSummary()
      if (alive && activeRoom?.name) await refreshActiveRoom(activeRoom.name)
      if (alive) setLoading(false)
    }
    load()
    return () => {
      alive = false
    }
  }, [activeRoom?.name])

  useEffect(() => {
    if (!supabase) return undefined
    const channel = supabase
      .channel(activeRoom?.name ? `room_${activeRoom.name}` : 'show_up_rooms_all')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_up_rooms',
      }, payload => {
        refreshRoomSummary()
        const changedRoom = payload?.new?.room_name || payload?.old?.room_name
        if (activeRoom?.name && changedRoom === activeRoom.name) refreshActiveRoom(activeRoom.name)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRoom?.name])

  useEffect(() => {
    const sync = () => {
      setUserLevel(getStoredUserLevel() || calculateUserPoints())
      setCustomRooms(readCustomRooms())
      setRoomState(readRoomState())
    }
    window.addEventListener('focus', sync)
    window.addEventListener('storage', sync)
    window.addEventListener('phasr-user-level-updated', sync)
    return () => {
      window.removeEventListener('focus', sync)
      window.removeEventListener('storage', sync)
      window.removeEventListener('phasr-user-level-updated', sync)
    }
  }, [])

  useEffect(() => {
    if (!debtClearedVisible) return undefined
    const timer = window.setTimeout(() => setDebtClearedVisible(false), 2200)
    return () => window.clearTimeout(timer)
  }, [debtClearedVisible])

  useEffect(() => {
    if (!nudgeNotice) return undefined
    const timer = window.setTimeout(() => setNudgeNotice(''), 2200)
    return () => window.clearTimeout(timer)
  }, [nudgeNotice])

  function ensureJoinedLocally(roomName) {
    if (!roomName || !user?.id) return readRoomState()
    const nextRoomState = readRoomState()
    ensureMember(nextRoomState, roomName, {
      userId: user.id,
      displayName: 'You',
      initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
    })
    settleCarries(nextRoomState, roomName)
    commitRoomState(nextRoomState)
    return nextRoomState
  }

  async function joinRoom(roomId) {
    const nextRoom = rooms.find(room => room.id === roomId)
    setActiveRoomId(roomId)
    setActiveTab('Feed')
    if (!nextRoom?.name) return
    const nextRoomState = ensureJoinedLocally(nextRoom.name)
    setMembers(buildRenderableMembers(nextRoomState, nextRoom.name, user, remoteMembers))
  }

  function goBackToRooms() {
    setActiveRoomId(null)
    setMembers([])
    setRemoteMembers([])
  }

  function applyLocalCheckIn(roomName) {
    const nextRoomState = ensureJoinedLocally(roomName)
    const profile = ensureMember(nextRoomState, roomName, {
      userId: user.id,
      displayName: 'You',
      initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
    })
    const todayKey = getLocalDateKey()
    const nextStreak = Math.max(1, Number(profile.streakCount || summary.currentStreak || 0) + (profile.lastCheckInDate === todayKey ? 0 : 1))
    setMemberActivity(nextRoomState, roomName, user.id, todayKey, {
      status: 'completed',
      checkInTime: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      carriesUsedAfter: Number(profile.carriesUsed || 0),
      streakCount: nextStreak,
    })
    profile.streakCount = nextStreak
    profile.lastStatus = 'completed'
    profile.lastStatusDate = todayKey
    profile.lastCheckInDate = todayKey
    const wasCarriedYesterday = nextRoomState.rooms?.[roomName]?.activity?.[getYesterdayKey()]?.[user.id]?.status === 'carried'
    commitRoomState(nextRoomState)
    setMembers(buildRenderableMembers(nextRoomState, roomName, user, remoteMembers))
    if (wasCarriedYesterday) setDebtClearedVisible(true)
    return nextStreak
  }

  function applyLocalUndo(roomName) {
    const nextRoomState = ensureJoinedLocally(roomName)
    const room = ensureRoom(nextRoomState, roomName)
    const profile = ensureMember(nextRoomState, roomName, {
      userId: user.id,
      displayName: 'You',
      initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
    })
    const todayKey = getLocalDateKey()
    if (room.activity?.[todayKey]) delete room.activity[todayKey][user.id]
    profile.lastStatus = null
    profile.lastStatusDate = getYesterdayKey()
    profile.lastCheckInDate = null
    commitRoomState(nextRoomState)
    setMembers(buildRenderableMembers(nextRoomState, roomName, user, remoteMembers))
  }

  async function handleCheckIn() {
    if (!activeRoom || !user?.id) return
    const nextStreakCount = applyLocalCheckIn(activeRoom.name)

    try {
      await checkIn(activeRoom.name, user, nextStreakCount)
      await logActivity(user.id, 'check_in', { room: activeRoom.name })
      await refreshRoomSummary()
      await refreshActiveRoom(activeRoom.name)
    } catch (nextError) {
      console.error('Show Up check in sync failed', nextError)
    }
  }

  async function handleUndo() {
    if (!activeRoom || !user?.id) return
    applyLocalUndo(activeRoom.name)

    try {
      await undoCheckIn(activeRoom.name, user, Math.max(1, summary.currentStreak || 1))
      await logActivity(user.id, 'check_in_undo', { room: activeRoom.name })
      await refreshRoomSummary()
      await refreshActiveRoom(activeRoom.name)
    } catch (nextError) {
      console.error('Show Up undo sync failed', nextError)
    }
  }

  function handleCreateRoomPress() {
    const latestLevel = getStoredUserLevel() || calculateUserPoints()
    setUserLevel(latestLevel)
    if ((latestLevel?.level || 1) < 4) {
      setShowGateModal(true)
      setShowCreateForm(false)
      return
    }
    setShowGateModal(false)
    setShowCreateForm(current => !current)
  }

  function handleGoToDailyStreaks() {
    setShowGateModal(false)
    onGoToDailyStreaks?.()
    window.dispatchEvent(new CustomEvent('phasr-open-view', { detail: { view: 'checkin' } }))
  }

  async function handleCreateRoomSubmit(event) {
    event.preventDefault()
    const trimmedName = createRoomName.trim()
    const focusArea = ROOM_DEFINITIONS.find(room => room.id === createFocusAreaId) || ROOM_DEFINITIONS[0]
    const normalizedName = trimmedName.toLowerCase()

    if (!trimmedName) {
      setError('Add a room name first.')
      return
    }
    if (rooms.some(room => String(room.name || '').toLowerCase() === normalizedName)) {
      setError('A room with that name already exists.')
      return
    }
    if (!supabase || !user?.id) {
      setError(supabaseConfigError || 'Supabase is not configured.')
      return
    }

    setCreatingRoom(true)
    setError('')
    const customRoom = {
      id: makeCustomRoomId(trimmedName),
      name: trimmedName,
      description: focusArea.description,
      color: focusArea.color,
      focusAreaId: focusArea.id,
    }

    try {
      await supabase.from('show_up_rooms').upsert({
        room_name: trimmedName,
        user_id: user.id,
        user_initials: user.email?.slice(0, 2).toUpperCase() || getInitials(getDisplayName(user)),
        checked_in: false,
        check_in_time: null,
        task_completed: false,
        streak_count: Math.max(1, summary.currentStreak || 1),
        created_at: new Date().toISOString(),
      }, { onConflict: 'user_id,room_name' })
    } catch (nextError) {
      console.error('Show Up create room sync failed', nextError)
    } finally {
      const nextCustomRooms = [customRoom, ...customRooms.filter(room => room.name !== trimmedName)]
      writeCustomRooms(nextCustomRooms)
      setCustomRooms(nextCustomRooms)
      setCreateRoomName('')
      setCreateFocusAreaId(ROOM_DEFINITIONS[0].id)
      setShowCreateForm(false)
      const nextRoomState = ensureJoinedLocally(trimmedName)
      await refreshRoomSummary()
      setCreatingRoom(false)
      setActiveRoomId(customRoom.id)
      setActiveTab('Feed')
      setMembers(buildRenderableMembers(nextRoomState, trimmedName, user, remoteMembers))
    }
  }

  function handleSelectMember(member) {
    if (!member || member.isYou) return
    setSelectedMember(member)
  }

  async function handleSendNudge() {
    if (!selectedMember) return
    try {
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification('Show Up nudge', {
          body: `${getDisplayName(user)} is here and waiting for you in ${activeRoom?.name || 'your room'}.`,
        })
      }
      await logActivity(user?.id, 'room_nudge', {
        room: activeRoom?.name,
        nudgedUserId: selectedMember.user_id,
      })
    } catch (nextError) {
      console.error('Show Up nudge failed', nextError)
    } finally {
      setNudgeNotice(`Nudge sent to ${selectedMember.displayName}.`)
      setSelectedMember(null)
    }
  }

  if (!activeRoom) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', paddingBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {error ? (
          <div style={{ padding: '12px 20px 0', color: '#7a5a66', fontSize: '0.76rem' }}>{error}</div>
        ) : null}

        <div style={{ padding: 20, display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <p style={{ margin: 0, fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8407a' }}>
              Join Challenge
            </p>
            <h2 style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.4, color: '#8c8c93', fontWeight: 500 }}>
              Pick your room. Show up daily.
            </h2>
          </div>

          <button
            type="button"
            onClick={handleCreateRoomPress}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 14,
              border: '1.5px solid #f2c4d0',
              background: '#fff',
              color: '#e8407a',
              fontWeight: 800,
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Create Room
          </button>

          {showCreateForm ? (
            <form onSubmit={handleCreateRoomSubmit} style={{ background: '#fff', border: '1.5px solid #f2c4d0', borderRadius: 16, padding: 14, display: 'grid', gap: 10 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a5a66' }}>Room Name</span>
                <input
                  value={createRoomName}
                  onChange={event => setCreateRoomName(event.target.value)}
                  placeholder="Enter room name"
                  style={{ width: '100%', borderRadius: 12, border: '1px solid #f2c4d0', padding: '11px 12px', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" }}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#7a5a66' }}>Focus Area</span>
                <select
                  value={createFocusAreaId}
                  onChange={event => setCreateFocusAreaId(event.target.value)}
                  style={{ width: '100%', borderRadius: 12, border: '1px solid #f2c4d0', padding: '11px 12px', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif", background: '#fff' }}
                >
                  {ROOM_DEFINITIONS.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={creatingRoom}
                style={{
                  border: 'none',
                  borderRadius: 12,
                  padding: '11px 12px',
                  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: creatingRoom ? 'wait' : 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {creatingRoom ? 'Creating...' : 'Create'}
              </button>
            </form>
          ) : null}
        </div>

        <div style={{
          padding: '0 20px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {rooms.map(room => {
            const summaryForRoom = roomSummary[room.name]
            const localMemberCount = Object.keys(roomState.rooms?.[room.name]?.members || {}).length
            const memberCount = Math.max(summaryForRoom?.memberCount || 0, localMemberCount)
            return (
              <div key={room.id} style={{
                background: '#fff',
                border: '1.5px solid #f2c4d0',
                borderRadius: 14,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                minHeight: 156,
              }}>
                <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, lineHeight: 1.3, color: '#3d1f2b' }}>
                  {room.name}
                </p>
                <p style={{ margin: 0, fontSize: '0.72rem', color: '#7a5a66', lineHeight: 1.55, flex: 1 }}>
                  {room.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                  <div style={{ display: 'grid', gap: 4 }}>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: '#b08090' }}>
                      {memberCount} joined
                    </p>
                    <p style={{ margin: 0, fontSize: '0.62rem', color: '#b08090' }}>
                      {Math.max(0, MAX_ROOM_SPOTS - memberCount)} spots left
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => joinRoom(room.id)}
                    style={{
                      alignSelf: 'flex-start',
                      border: 'none',
                      borderRadius: 999,
                      padding: '8px 12px',
                      background: 'rgba(232,64,122,0.1)',
                      color: room.color,
                      fontWeight: 800,
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {showGateModal ? (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 18, 25, 0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 1200 }}>
            <div style={{ width: 'min(420px, 100%)', background: '#fff', borderRadius: 20, border: '1px solid #f2c4d0', padding: 18, boxShadow: '0 18px 40px rgba(61,31,43,0.16)' }}>
              <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#3d1f2b', lineHeight: 1.45 }}>
                You need to reach Level 4 - Locked In to create a room. Keep completing your daily tasks and you will get there.
              </p>
              <p style={{ margin: '10px 0 0', fontSize: '0.78rem', color: '#7a5a66', lineHeight: 1.6 }}>
                {`You are currently Level ${userLevel?.level || 1} with ${userLevel?.points || 0} points. You need ${pointsToUnlock} more points to unlock this.`}
              </p>

              <div style={{ marginTop: 14 }}>
                <div style={{ height: 8, borderRadius: 999, background: '#fde5ee', overflow: 'hidden' }}>
                  <div style={{ width: `${unlockProgress}%`, height: '100%', borderRadius: 999, background: 'linear-gradient(135deg, #e8407a, #f472a8)' }} />
                </div>
                <div style={{ marginTop: 8, fontSize: '0.68rem', color: '#b08090', fontWeight: 700 }}>
                  {`${unlockProgress}% to Level ${unlockTarget.level} ${unlockTarget.levelName}`}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={handleGoToDailyStreaks}
                  style={{ flex: 1, border: 'none', borderRadius: 12, padding: '11px 12px', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Go to Daily Streaks
                </button>
                <button
                  type="button"
                  onClick={() => setShowGateModal(false)}
                  style={{ flex: 1, borderRadius: 12, border: '1.5px solid #f2c4d0', padding: '11px 12px', background: '#fff', color: '#7a5a66', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    )
  }

  const roomMemberCount = Math.max(roomSummary[activeRoom.name]?.memberCount || 0, members.length)

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {error ? (
        <div style={{ padding: '10px 12px 0', color: '#7a5a66', fontSize: '0.76rem' }}>{error}</div>
      ) : null}

      {(carriedYesterday || debtClearedVisible) ? (
        <div style={{ padding: '10px 12px 0' }}>
          <div style={{
            background: debtClearedVisible ? '#fff5f7' : '#fff8fb',
            border: `1px solid ${debtClearedVisible ? '#f2c4d0' : '#ead7ff'}`,
            borderRadius: 14,
            padding: '10px 12px',
            color: debtClearedVisible ? '#e8407a' : '#7a58b0',
            fontSize: '0.76rem',
            fontWeight: 700,
          }}>
            {debtClearedVisible ? 'Protection cleared' : 'Clear your protection - complete today to protect your streak.'}
          </div>
        </div>
      ) : null}

      {nudgeNotice ? (
        <div style={{ padding: '10px 12px 0' }}>
          <div style={{ background: '#fff5f7', border: '1px solid #f2c4d0', borderRadius: 14, padding: '10px 12px', color: '#7a5a66', fontSize: '0.74rem', fontWeight: 700 }}>
            {nudgeNotice}
          </div>
        </div>
      ) : null}

      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f2c4d0', background: '#fffbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#3d1f2b' }}>
              {activeRoom.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#b08090' }}>
              {roomMemberCount} {roomMemberCount === 1 ? 'person' : 'people'}. Daily check-ins.
            </p>
          </div>
          <button onClick={goBackToRooms} style={{
            padding: '5px 12px',
            borderRadius: 99,
            border: '1.5px solid #f2c4d0',
            background: '#fff',
            color: '#7a5a66',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Rooms →</button>
        </div>

        <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>
          Join the room and let people see you.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button onClick={handleCheckIn} style={{
            flex: 1,
            padding: 10,
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #e8407a, #f472a8)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {checkedIn ? 'Checked in' : 'Check in'}
          </button>
          {checkedIn && (
            <button onClick={handleUndo} style={{
              flex: 1,
              padding: 10,
              borderRadius: 12,
              border: '1.5px solid #f2c4d0',
              background: '#fff',
              color: '#7a5a66',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}>Undo</button>
          )}
        </div>

        {checkedIn && (
          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.65rem', color: '#7a5a66', background: '#f5f5f5', padding: '3px 8px', borderRadius: 6 }}>
              Checked in at {checkInTime}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#e8407a', background: '#fff5f7', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
              Protected today
            </span>
          </div>
        )}
      </div>

      <div style={{ padding: '14px 12px 10px', background: '#fff' }}>
        <MemberTiles members={members} onSelectMember={handleSelectMember} />
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #f2c4d0', background: '#fff' }}>
        {['Feed', 'Live Status', 'Leaders Today'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === tab ? '2px solid #e8407a' : '2px solid transparent',
              color: activeTab === tab ? '#e8407a' : '#b08090',
              fontSize: '0.72rem',
              fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >{tab}</button>
        ))}
      </div>

      <div style={{ background: '#fffbfc', flex: 1, overflowY: 'auto', padding: 12 }}>
        {loading ? <p style={{ margin: 0, fontSize: '0.76rem', color: '#7a5a66' }}>Loading room...</p> : null}
        {!loading && activeTab === 'Feed' && <FeedContent members={members} />}
        {!loading && activeTab === 'Live Status' && <LiveStatusContent members={members} />}
        {!loading && activeTab === 'Leaders Today' && <LeaderboardContent members={members} />}
      </div>

      {selectedMember ? (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(30, 18, 25, 0.42)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18, zIndex: 1200 }}>
          <div style={{ width: 'min(360px, 100%)', background: '#fff', borderRadius: 20, border: '1px solid #f2c4d0', padding: 18, boxShadow: '0 18px 40px rgba(61,31,43,0.16)' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#3d1f2b' }}>
              Nudge {selectedMember.displayName}?
            </p>
            <p style={{ margin: '10px 0 0', fontSize: '0.8rem', color: '#7a5a66', lineHeight: 1.6 }}>
              Send a reminder that the room is active and waiting for them.
            </p>
            <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
              <button
                type="button"
                onClick={handleSendNudge}
                style={{ border: 'none', borderRadius: 14, padding: '12px 14px', background: 'linear-gradient(135deg, #e8407a, #f472a8)', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Send nudge
              </button>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                style={{ borderRadius: 14, border: '1.5px solid #f2c4d0', padding: '12px 14px', background: '#fff', color: '#7a5a66', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
