import { useEffect, useMemo, useRef, useState } from 'react'
import { broadcastLockInUpdate, getLockInSummary, getTodayKey, loadLockInState, saveLockInState, upsertTodayLog } from '../lib/lockIn'

const SHOW_UP_KEY = 'phasr_show_up_room_v3'
const REACTION_OPTIONS = [
  { id: 'fire', icon: '🔥' },
  { id: 'clap', icon: '👏' },
  { id: 'celebrate', icon: '🎉' },
  { id: 'laugh', icon: '😂' },
  { id: 'smile', icon: '😊' },
]
const PUSH_OPTIONS = ["We're waiting on you", "You haven't checked in yet", "We're all active, join us", "You're the only one missing"]
const ROOM_SIZE = 6
const REFRESH_MS = 18000
const FEED_TABS = ['feed', 'pressure', 'top3']

const ROOM_DEFINITIONS = [
  { id: 'health', name: 'Health & Fitness', subtitle: 'Body, food, sleep, gym, energy', accent: '#f25e92' },
  { id: 'career', name: 'Career & Business', subtitle: 'Job, entrepreneurship, income streams', accent: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', subtitle: 'Savings, investing, debt, financial freedom', accent: '#d4773a' },
  { id: 'relationships', name: 'Relationships', subtitle: 'Love, family, friendships, community', accent: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', subtitle: 'Spirituality, religion, mindfulness, mental health', accent: '#4a7fc1' },
  { id: 'growth', name: 'Personal Growth', subtitle: 'Learning, creativity, self-development', accent: '#5e8f64' },
]

const ROOM_MEMBERS = {
  health: [],
  career: [],
  wealth: [],
  relationships: [],
  'inner-life': [],
  growth: [],
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
  const raw =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'You'

  return String(raw)
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitials(name) {
  return String(name || '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('') || 'P'
}

function getFirstName(name) {
  return String(name || '').trim().split(/\s+/)[0] || 'You'
}

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildDefaultRoomState(roomId) {
  return {
    joined: false,
    checkedInAt: null,
    completedAt: null,
    viewed: false,
    reactions: {},
    comments: {},
    nudges: {},
    feed: [],
    lastPulseAt: new Date().toISOString(),
  }
}

function loadShowUpState() {
  const todayKey = getTodayKey()
  const saved = safeRead(SHOW_UP_KEY, null)
  if (!saved || saved.date !== todayKey) {
    return {
      date: todayKey,
      activeRoomId: null,
      notice: '',
      rooms: Object.fromEntries(ROOM_DEFINITIONS.map(room => [room.id, buildDefaultRoomState(room.id)])),
    }
  }

  return {
    date: todayKey,
    activeRoomId: null,
    notice: '',
    rooms: Object.fromEntries(
      ROOM_DEFINITIONS.map(room => [
        room.id,
        (() => {
          const nextRoom = {
            ...buildDefaultRoomState(room.id),
            ...(saved.rooms?.[room.id] || {}),
          }
          const cleanedFeed = Array.isArray(nextRoom.feed)
            ? nextRoom.feed.filter(item => item?.memberId === 'you')
            : []
          return {
            ...nextRoom,
            feed: nextRoom.joined ? cleanedFeed : [],
          }
        })(),
      ]),
    ),
  }
}

function statusMeta(status) {
  if (status === 'completed') return { dot: '#f25e92', label: 'Completed Today' }
  if (status === 'active') return { dot: '#47b86c', label: 'Active' }
  return { dot: '#c9b7c0', label: 'Inactive' }
}

function buildRoomMembers(roomId, user, summary, joined) {
  const roomMembers = ROOM_MEMBERS[roomId] || []
  if (!joined) return roomMembers.slice(0, ROOM_SIZE)
  return [
    ...roomMembers.slice(0, ROOM_SIZE - 1),
    {
      id: 'you',
      name: getDisplayName(user),
      streak: summary.currentStreak || 0,
      baseStatus: summary.hasLoggedToday ? 'completed' : 'inactive',
      isYou: true,
    },
  ]
}

function buildLiveMembers(members, feed, joined, summary, tick) {
  return members.map((member, index) => {
    if (member.isYou) {
      return {
        ...member,
        status: summary.hasLoggedToday ? 'completed' : joined ? 'active' : 'inactive',
      }
    }

    const recentFeed = feed.find(item => item.memberId === member.id)
    const recentAt = recentFeed ? new Date(recentFeed.createdAt).getTime() : 0
    const activityPulse = (tick + index) % 5

    let status = member.baseStatus
    if (recentAt && Date.now() - recentAt < 1000 * 60 * 45) status = 'completed'
    else if (activityPulse <= 1) status = 'active'
    else if (activityPulse === 2) status = member.baseStatus === 'completed' ? 'completed' : 'active'
    else status = 'inactive'

    return { ...member, status }
  })
}

function buildMemberActivity(feed) {
  return feed.reduce((acc, item) => {
    acc[item.memberId] = item.createdAt
    return acc
  }, {})
}

function getDynamicMessage({ joined, summary, activeCount, completedCount }) {
  if (!joined && activeCount === 0) return 'Join the room and let people see you.'
  if (activeCount >= 3) return `${activeCount} people are active now. Come online.`
  if (activeCount >= 1) return `${activeCount} person is active now. Join in.`
  return 'Join the room and let people see you.'
}

function getIncomingNudgeSummary({ joined, summary, activeCount, completedCount }) {
  if (summary.hasLoggedToday) return ''
  if (!joined && activeCount >= 2) return `${Math.min(activeCount, 3)} people are active now. Come online.`
  if (completedCount >= 3) return `${Math.min(completedCount, 3)} people nudged you to come online.`
  if (activeCount >= 1) return `${activeCount} person is active now. Join in.`
  return ''
}

function getRoomSpotLabel(count) {
  if (count >= ROOM_SIZE) return `${ROOM_SIZE}/${ROOM_SIZE} Full`
  const spotsLeft = ROOM_SIZE - count
  return `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`
}

function formatWaitingNames(names) {
  if (!names.length) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]} and ${names[2]}`
}

function dedupeFeed(feed, membersById) {
  const ordered = [...(feed || [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)

  const groups = []

  ordered.forEach(item => {
    const createdAt = new Date(item.createdAt).getTime()
    const current = groups[groups.length - 1]
    if (current && current.memberId === item.memberId && current.latestAt - createdAt <= 1000 * 60 * 5) {
      current.count += 1
      current.items.push(item)
      return
    }

    groups.push({
      id: item.id,
      memberId: item.memberId,
      latestAt: createdAt,
      count: 1,
      items: [item],
    })
  })

  return groups.slice(0, 10).map(group => {
    const first = group.items[0]
    const name = membersById[group.memberId]?.name || getFirstName(first.text)
    const checkedInLike = group.items.every(item => /checked in|showed up/i.test(item.text))
    return {
      id: group.id,
      memberId: group.memberId,
      createdAt: first.createdAt,
      text:
        group.count > 1
          ? checkedInLike
            ? `${name} checked in ${group.count} times.`
            : `${name} posted ${group.count} updates.`
          : first.text,
    }
  })
}

function AvatarTile({ member, isSelected, onOpen, onPush, pushCount }) {
  const badge = statusMeta(member.status)
  return (
    <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: '0.34rem', minHeight: 0 }}>
      <button
        type="button"
        onClick={onOpen}
        style={{
          border: `1px solid ${isSelected ? 'var(--app-accent)' : 'var(--app-border)'}`,
          background: isSelected ? 'color-mix(in srgb, var(--app-accent) 7%, white)' : '#fff',
          padding: '0.52rem 0.45rem',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'grid',
          alignContent: 'center',
          justifyItems: 'center',
          gap: '0.28rem',
          opacity: member.status === 'inactive' ? 0.62 : 1,
          minHeight: 0,
        }}
      >
        <div style={{ position: 'relative', width: '100%', display: 'grid', justifyItems: 'center' }}>
          <div
            style={{
              minWidth: 34,
              height: 28,
              padding: '0 0.45rem',
              borderRadius: 999,
              background: isSelected ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'color-mix(in srgb, var(--app-accent) 12%, white)',
              color: isSelected ? '#fff' : 'var(--app-text)',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: '0.74rem',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {getInitials(member.name)}
          </div>
          <span
            style={{
              position: 'absolute',
              right: 'calc(50% - 24px)',
              top: 20,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: badge.dot,
              border: '2px solid #fff',
            }}
          />
        </div>
        <span style={{ fontSize: '0.68rem', color: 'var(--app-text)', fontWeight: 700, lineHeight: 1.2, textAlign: 'center' }}>
          {member.isYou ? 'You' : getFirstName(member.name)}
        </span>
        {!member.isYou && (
          <span style={{ fontSize: '0.62rem', color: pushCount > 0 ? 'var(--app-accent)' : 'var(--app-muted)', fontWeight: 700, textAlign: 'center' }}>
            {pushCount > 0 ? `Waiting on you (${pushCount})` : 'No pushes'}
          </span>
        )}
      </button>
      {!member.isYou && (
        <button
          type="button"
          onClick={onPush}
          disabled={pushCount >= 3}
          style={{
            minHeight: 28,
            padding: '0.24rem 0.5rem',
            borderRadius: 999,
            border: '1px solid var(--app-border)',
            background: pushCount >= 3 ? 'var(--app-bg2)' : '#fff',
            color: pushCount >= 3 ? 'var(--app-muted)' : 'var(--app-text)',
            fontSize: '0.62rem',
            fontWeight: 800,
            fontFamily: "'DM Sans', sans-serif",
            cursor: pushCount >= 3 ? 'default' : 'pointer',
          }}
        >
          {pushCount >= 3 ? '3 pushes' : 'Push'}
        </button>
      )}
    </div>
  )
}

function TabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minHeight: 44,
        border: 'none',
        borderTop: active ? '2px solid var(--app-accent)' : '2px solid transparent',
        background: active ? 'color-mix(in srgb, var(--app-accent) 8%, transparent)' : 'transparent',
        color: active ? 'var(--app-text)' : 'var(--app-muted)',
        fontWeight: 800,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function PressureMetric({ label, value }) {
  return (
    <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
      <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--app-text)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: '0.28rem', fontSize: '0.74rem', color: 'var(--app-muted)', fontWeight: 700 }}>
        {label}
      </div>
    </div>
  )
}

function IconActionButton({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        border: '1px solid var(--app-border)',
        background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        padding: 0,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </button>
  )
}

export default function ShowUp({ user, onLockInChange }) {
  const [lockInState, setLockInState] = useState(() => loadLockInState())
  const [showUpState, setShowUpState] = useState(() => loadShowUpState())
  const [pickerFor, setPickerFor] = useState(null)
  const [commentFor, setCommentFor] = useState(null)
  const [replyFor, setReplyFor] = useState(null)
  const [commentDrafts, setCommentDrafts] = useState({})
  const [nudgeSheetFor, setNudgeSheetFor] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [roomExitOpen, setRoomExitOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('feed')
  const [tick, setTick] = useState(0)
  const pickerRef = useRef(null)
  const touchStartX = useRef(null)
  const railOffset = 'var(--phasr-sidebar-width, 110px)'

  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const activeRoom = ROOM_DEFINITIONS.find(room => room.id === showUpState.activeRoomId) || null
  const activeRoomState = activeRoom ? showUpState.rooms[activeRoom.id] : null
  const members = useMemo(() => activeRoom ? buildRoomMembers(activeRoom.id, user, summary, activeRoomState?.joined) : [], [activeRoom, user, summary, activeRoomState?.joined])
  const liveMembers = useMemo(() => activeRoom ? buildLiveMembers(members, activeRoomState?.feed || [], activeRoomState?.joined, summary, tick) : [], [activeRoom, members, activeRoomState, summary, tick])
  const memberActivity = useMemo(() => buildMemberActivity(activeRoomState?.feed || []), [activeRoomState])
  const membersById = useMemo(() => Object.fromEntries(liveMembers.map(member => [member.id, member])), [liveMembers])
  const dedupedFeed = useMemo(() => dedupeFeed(activeRoomState?.feed || [], membersById), [activeRoomState, membersById])
  const activeCount = liveMembers.filter(member => member.status === 'active').length
  const completedCount = liveMembers.filter(member => member.status === 'completed').length
  const inactiveMembers = liveMembers.filter(member => member.status === 'inactive')
  const activeMembersByStatus = liveMembers.filter(member => member.status === 'active')
  const completedMembersByStatus = liveMembers.filter(member => member.status === 'completed')
  const dynamicMessage = getDynamicMessage({ joined: activeRoomState?.joined, summary, activeCount, completedCount })
  const incomingNudgeSummary = getIncomingNudgeSummary({ joined: activeRoomState?.joined, summary, activeCount, completedCount })
  const topThree = [...liveMembers].sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 3)
  const selectedMember = selectedMemberId ? liveMembers.find(member => member.id === selectedMemberId) : null
  const waitingNames = useMemo(() => {
    const sentByYou = activeRoomState?.nudges?.sentByYou || {}
    return Object.entries(sentByYou)
      .filter(([, count]) => count > 0)
      .map(([memberId]) => membersById[memberId])
      .filter(Boolean)
      .map(member => member.isYou ? 'You' : getFirstName(member.name))
      .slice(0, 3)
  }, [activeRoomState, membersById])
  const roomCount = (ROOM_MEMBERS[activeRoom?.id] || []).length + (activeRoomState?.joined ? 1 : 0)
  const checkedInLabel = activeRoomState?.checkedInAt ? `Checked in at ${formatTime(activeRoomState.checkedInAt)}` : null
  const completedLabel = activeRoomState?.completedAt ? 'Task completed' : null

  function updateReactionMap(current = {}, actorId, emoji) {
    const next = { ...current }
    if (next[actorId] === emoji) {
      delete next[actorId]
      return next
    }

    next[actorId] = emoji
    return next
  }

  function summarizeReactions(current = {}) {
    const iconsById = Object.fromEntries(REACTION_OPTIONS.map(option => [option.id, option.icon]))
    return Object.entries(
      Object.values(current).reduce((acc, reactionId) => {
        acc[reactionId] = (acc[reactionId] || 0) + 1
        return acc
      }, {}),
    ).map(([reactionId, count]) => [iconsById[reactionId] || reactionId, count])
  }

  useEffect(() => {
    safeWrite(SHOW_UP_KEY, showUpState)
  }, [showUpState])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(current => current + 1)
      setShowUpState(current => {
        if (!current.activeRoomId) return current
        const roomPool = ROOM_MEMBERS[current.activeRoomId] || []
        if (!roomPool.length) return current
        const room = current.rooms[current.activeRoomId] || buildDefaultRoomState(current.activeRoomId)
        const currentFeed = Array.isArray(room.feed) ? room.feed : []
        const source = roomPool[currentFeed.length % roomPool.length]
        if (!source) return current

        const actions = [
          `${source.name} completed today`,
          `${source.name} hit a ${source.streak}-day streak`,
          `${source.name} checked in`,
        ]

        const nextItem = {
          id: `${source.id}-${Date.now()}`,
          memberId: source.id,
          text: actions[(currentFeed.length + source.name.length) % actions.length],
          createdAt: new Date().toISOString(),
        }

        return {
          ...current,
          rooms: {
            ...current.rooms,
            [current.activeRoomId]: {
              ...room,
              lastPulseAt: new Date().toISOString(),
              feed: [nextItem, ...currentFeed].slice(0, 12),
            },
          },
        }
      })
    }, REFRESH_MS)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    function handleOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setPickerFor(null)
      }
    }

    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function updateActiveRoom(updater) {
    if (!activeRoom) return
    setShowUpState(current => ({
      ...current,
      rooms: {
        ...current.rooms,
        [activeRoom.id]: updater(current.rooms[activeRoom.id]),
      },
    }))
  }

  function openRoom(roomId) {
    setShowUpState(current => {
      const room = current.rooms?.[roomId] || buildDefaultRoomState(roomId)
      const currentJoinedCount = Object.values(current.rooms || {}).filter(item => item?.joined).length
      if (!room.joined && currentJoinedCount >= 2) {
        return {
          ...current,
          notice: 'You can only join 2 rooms at a time.',
        }
      }

      return {
        ...current,
        activeRoomId: roomId,
        notice: '',
        rooms: {
          ...current.rooms,
          [roomId]: {
            ...room,
            viewed: true,
          },
        },
      }
    })
    setPickerFor(null)
    setCommentFor(null)
    setSelectedMemberId(null)
    setActiveTab('feed')
  }

  function stepOutToRooms() {
    setRoomExitOpen(false)
    setShowUpState(current => ({
      ...current,
      activeRoomId: null,
      notice: '',
    }))
  }

  function exitRoomCompletely() {
    if (!activeRoom) return

    setShowUpState(current => ({
      ...current,
      activeRoomId: null,
      notice: 'You exited this room.',
      rooms: {
        ...current.rooms,
        [activeRoom.id]: {
          ...buildDefaultRoomState(activeRoom.id),
        },
      },
    }))
    setRoomExitOpen(false)
    setPickerFor(null)
    setCommentFor(null)
    setSelectedMemberId(null)
  }

  function checkInToday() {
    updateActiveRoom(room => ({
      ...room,
      joined: true,
      checkedInAt: room.checkedInAt || new Date().toISOString(),
      feed: [
        {
          id: `checkin-${Date.now()}`,
          memberId: 'you',
          text: `${getDisplayName(user)} checked in`,
          createdAt: new Date().toISOString(),
        },
        ...(room.feed || []),
      ].slice(0, 12),
    }))
  }

  function markDoneToday() {
    if (activeRoomState?.completedAt) {
      const nextLockState = {
        ...lockInState,
        logs: (lockInState.logs || []).filter(log => log.date !== getTodayKey()),
      }
      setLockInState(nextLockState)
      saveLockInState(nextLockState)
      broadcastLockInUpdate()
      onLockInChange?.()

      updateActiveRoom(room => ({
        ...room,
        completedAt: null,
      }))
      return
    }

    const nextLockState = upsertTodayLog(lockInState, { task: 'Completed today' })
    setLockInState(nextLockState)
    saveLockInState(nextLockState)
    broadcastLockInUpdate()
    onLockInChange?.()

    updateActiveRoom(room => ({
      ...room,
      joined: true,
      checkedInAt: room.checkedInAt || new Date().toISOString(),
      completedAt: new Date().toISOString(),
      feed: [
        {
          id: `done-${Date.now()}`,
          memberId: 'you',
          text: `${getDisplayName(user)} completed today`,
          createdAt: new Date().toISOString(),
        },
        ...(room.feed || []),
      ].slice(0, 12),
    }))
  }

  function sendNudge(member, message) {
    if (!activeRoom || member.isYou) return
    const sentForMember = (activeRoomState?.nudges?.sentByYou || {})[member.id] || 0
    if (sentForMember >= 3) {
      setNudgeSheetFor(null)
      return
    }

    updateActiveRoom(room => ({
      ...room,
      nudges: {
        ...(room.nudges || {}),
        [member.id]: ((room.nudges || {})[member.id] || 0) + 1,
        sentByYou: {
          ...((room.nudges || {}).sentByYou || {}),
          [member.id]: ((((room.nudges || {}).sentByYou || {})[member.id]) || 0) + 1,
        },
      },
      feed: [
        {
          id: `nudge-${member.id}-${Date.now()}`,
          memberId: member.id,
          text: `${getDisplayName(user)} pushed ${member.name}`,
          createdAt: new Date().toISOString(),
        },
        ...(room.feed || []),
      ].slice(0, 12),
    }))
    setNudgeSheetFor(null)
  }

  function addReaction(itemId, emoji) {
    updateActiveRoom(room => {
      const current = room.reactions?.[itemId] || {}
      return {
        ...room,
        reactions: {
          ...(room.reactions || {}),
          [itemId]: updateReactionMap(current, 'you', emoji),
        },
      }
    })
    setPickerFor(null)
  }

  function submitComment(activityId) {
    const draft = String(commentDrafts[activityId] || '').trim()
    if (!draft) return

    updateActiveRoom(room => ({
      ...room,
      comments: {
        ...(room.comments || {}),
        [activityId]: [
          {
            id: `${activityId}-${Date.now()}`,
            authorId: 'you',
            author: getFirstName(getDisplayName(user)),
            text: draft,
            createdAt: new Date().toISOString(),
            reply: null,
          },
          ...((room.comments || {})[activityId] || []),
        ],
      },
    }))

    setCommentDrafts(current => ({ ...current, [activityId]: '' }))
    setCommentFor(null)
  }

  function submitReply(activityId, commentId) {
    const draft = String(commentDrafts[`reply-${commentId}`] || '').trim()
    if (!draft || !activeRoomState) return
    const activity = dedupedFeed.find(item => item.id === activityId)
    if (!activity || activity.memberId !== 'you') return

    updateActiveRoom(room => ({
      ...room,
      comments: {
        ...(room.comments || {}),
        [activityId]: ((room.comments || {})[activityId] || []).map(comment => (
          comment.id === commentId
            ? {
                ...comment,
                reply: {
                  authorId: 'you',
                  author: getFirstName(getDisplayName(user)),
                  text: draft,
                  createdAt: new Date().toISOString(),
                },
              }
            : comment
        )),
      },
    }))

    setCommentDrafts(current => ({ ...current, [`reply-${commentId}`]: '' }))
    setReplyFor(null)
  }

  function switchTab(direction) {
    const currentIndex = FEED_TABS.indexOf(activeTab)
    const nextIndex = Math.min(FEED_TABS.length - 1, Math.max(0, currentIndex + direction))
    if (nextIndex !== currentIndex) setActiveTab(FEED_TABS[nextIndex])
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches?.[0]?.clientX ?? null
  }

  function handleTouchEnd(event) {
    if (touchStartX.current == null) return
    const endX = event.changedTouches?.[0]?.clientX ?? touchStartX.current
    const delta = endX - touchStartX.current
    if (Math.abs(delta) > 45) {
      switchTab(delta < 0 ? 1 : -1)
    }
    touchStartX.current = null
  }

  if (!activeRoom) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1rem 0.9rem 1.25rem', fontFamily: "'DM Sans', sans-serif" }}>
        <div style={{ width: '100%', display: 'grid', gap: '0.9rem' }}>
          <div style={{ background: '#fff', border: '1px solid var(--app-border)', borderRadius: 22, padding: '1rem', boxShadow: '0 12px 28px rgba(86,53,66,0.06)' }}>
            <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Join Challenge</p>
            <p style={{ margin: '0.22rem 0 0', fontSize: '0.98rem', fontWeight: 800, color: 'var(--app-text)' }}>Pick your room. Show up daily.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.8rem' }}>
            {ROOM_DEFINITIONS.map(room => {
              const roomState = showUpState.rooms?.[room.id] || buildDefaultRoomState(room.id)
              const roomMembers = ROOM_MEMBERS[room.id] || []
              const count = roomMembers.length + (roomState.joined ? 1 : 0)
              const isFull = count >= ROOM_SIZE
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => openRoom(room.id)}
                  style={{
                    textAlign: 'left',
                    border: '1px solid var(--app-border)',
                    borderRadius: 20,
                    background: '#fff',
                    padding: '0.95rem',
                    boxShadow: '0 12px 28px rgba(86,53,66,0.06)',
                    opacity: isFull ? 0.72 : 1,
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
                    <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: room.accent }}>{room.name}</p>
                  </div>
                  <p style={{ margin: '0.24rem 0 0', fontSize: '0.82rem', color: 'var(--app-muted)', lineHeight: 1.55 }}>{room.subtitle}</p>
                    <div style={{ marginTop: '0.6rem', display: 'flex', justifyContent: 'space-between', gap: '0.8rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--app-muted)' }}>{getRoomSpotLabel(count)}</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: room.accent }}>{roomState.joined ? 'Joined' : 'Join'}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '0.85rem 0.75rem 0.95rem', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', background: '#fff', border: '1px solid var(--app-border)', borderRadius: 24, boxShadow: '0 14px 30px rgba(86,53,66,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '0.8rem 0.85rem 0.65rem', borderBottom: '1px solid var(--app-border)', background: 'linear-gradient(180deg, var(--app-bg2) 0%, #fff 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--app-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeRoom.name}</p>
              <p style={{ margin: '0.14rem 0 0', fontSize: '0.72rem', color: 'var(--app-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{roomCount} people. Daily check-in challenge</p>
            </div>
            <div style={{ flexShrink: 0, display: 'grid', gap: '0.18rem', justifyItems: 'end' }}>
              <button
                type="button"
                onClick={() => setRoomExitOpen(true)}
                style={{
                  minHeight: 34,
                  padding: '0.42rem 0.7rem',
                  borderRadius: 999,
                  border: '1px solid var(--app-border)',
                  background: '#fff',
                  color: 'var(--app-text)',
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
              >
                Rooms →
              </button>
              <div style={{ display: 'grid', justifyItems: 'end', gap: '0.12rem' }}>
                <span style={{ fontSize: '0.68rem', color: 'var(--app-muted)', fontWeight: 700, textAlign: 'right' }}>{dynamicMessage}</span>
                {!!(waitingNames.length || incomingNudgeSummary || (!summary.hasLoggedToday && activeRoomState?.checkedInAt && !activeRoomState?.completedAt)) && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--app-accent)', fontWeight: 800, textAlign: 'right' }}>
                    {waitingNames.length
                      ? `${formatWaitingNames(waitingNames)} are waiting on you`
                      : !summary.hasLoggedToday && activeRoomState?.checkedInAt && !activeRoomState?.completedAt
                        ? 'Streak at risk'
                        : incomingNudgeSummary}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0.65rem 0.85rem', borderBottom: '1px solid var(--app-border)' }}>
          <div style={{ display: 'flex', gap: '0.55rem' }}>
            <button
              type="button"
              onClick={checkInToday}
              style={{
                flex: 1,
                minHeight: 42,
                borderRadius: 999,
                border: 'none',
                background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                color: '#fff',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Check in
            </button>
            <button
              type="button"
              onClick={markDoneToday}
              style={{
                flex: 1,
                minHeight: 42,
                borderRadius: 999,
                border: '1px solid var(--app-border)',
                background: '#fff',
                color: 'var(--app-text)',
                fontWeight: 800,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {activeRoomState?.completedAt ? 'Undo' : 'Mark done'}
            </button>
          </div>
          <div style={{ marginTop: '0.45rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.55rem' }}>
            <div style={{ minHeight: 26 }}>
              {checkedInLabel && (
                <span style={{ display: 'inline-flex', padding: '0.3rem 0.55rem', borderRadius: 999, background: 'var(--app-bg2)', color: 'var(--app-text)', fontSize: '0.68rem', fontWeight: 700 }}>
                  {checkedInLabel}
                </span>
              )}
            </div>
            <div style={{ minHeight: 26 }}>
              {completedLabel && (
                <span style={{ display: 'inline-flex', padding: '0.3rem 0.55rem', borderRadius: 999, background: 'color-mix(in srgb, var(--app-accent) 10%, white)', color: 'var(--app-accent)', fontSize: '0.68rem', fontWeight: 800 }}>
                  {completedLabel}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="showup-room-shell" style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(300px, 40%) minmax(0, 60%)' }}>
          <div style={{ padding: '0.85rem 0.9rem 0.75rem', borderRight: '1px solid var(--app-border)', overflowY: 'auto', display: 'grid', alignContent: 'start', gap: '0.9rem' }}>
            {liveMembers.length ? (
              <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(2, minmax(0, 1fr))', gap: '0.7rem 0.55rem' }}>
                {liveMembers.map(member => (
                  <AvatarTile
                    key={member.id}
                    member={member}
                    isSelected={member.id === selectedMemberId}
                    onOpen={() => setSelectedMemberId(member.id)}
                    onPush={() => setNudgeSheetFor(member)}
                    pushCount={(activeRoomState?.nudges?.sentByYou || {})[member.id] || 0}
                  />
                ))}
              </div>
            ) : (
              <div style={{ minHeight: 220, borderRadius: 18, background: 'var(--app-bg2)', border: '1px solid var(--app-border)', display: 'grid', placeItems: 'center', padding: '1rem', textAlign: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--app-text)' }}>No one is in this room yet</p>
                  <p style={{ margin: '0.28rem 0 0', fontSize: '0.72rem', color: 'var(--app-muted)', lineHeight: 1.55 }}>Check in to become the first visible person here.</p>
                </div>
              </div>
            )}
            {selectedMember && (
              <div style={{ borderRadius: 16, background: 'var(--app-bg2)', padding: '0.8rem' }}>
                <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: 'var(--app-text)' }}>
                  {selectedMember.isYou ? 'You' : selectedMember.name}
                </p>
                <p style={{ margin: '0.18rem 0 0', fontSize: '0.7rem', color: 'var(--app-muted)' }}>
                  {statusMeta(selectedMember.status).label}
                </p>
                <p style={{ margin: '0.45rem 0 0', fontSize: '0.74rem', color: 'var(--app-text)' }}>
                  <strong>{selectedMember.streak} day streak</strong>
                </p>
                <p style={{ margin: '0.18rem 0 0', fontSize: '0.72rem', color: 'var(--app-muted)' }}>
                  Last active {memberActivity[selectedMember.id] ? formatTime(memberActivity[selectedMember.id]) : 'not yet'}
                </p>
                {!selectedMember.isYou && (
                  <p style={{ margin: '0.5rem 0 0', fontSize: '0.68rem', color: 'var(--app-accent)', fontWeight: 800 }}>
                    {(activeRoomState?.nudges?.sentByYou || {})[selectedMember.id] || 0}/3 pushes used
                  </p>
                )}
              </div>
            )}
          </div>

          <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0.9rem 1rem 0.5rem', scrollbarWidth: 'thin' }}>
            {activeTab === 'feed' && (
              <div style={{ minHeight: '100%', display: 'grid', alignContent: 'start', gap: '0.52rem' }}>
                {!dedupedFeed.length && (
                  <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.9rem 1rem' }}>
                    <p style={{ margin: 0, fontSize: '0.76rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>No activity yet. Once someone checks in or completes something, the feed will show it here.</p>
                  </div>
                )}
                {dedupedFeed.map(activity => (
                  <div key={activity.id} style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.68rem 0.72rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.55rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: 'var(--app-text)', lineHeight: 1.45 }}>{activity.text}</p>
                        <p style={{ margin: '0.12rem 0 0', fontSize: '0.66rem', color: 'var(--app-muted)' }}>{formatTime(activity.createdAt)}</p>
                      </div>
                      <div ref={pickerFor === activity.id ? pickerRef : null} style={{ position: 'relative', display: 'grid', justifyItems: 'end', gap: '0.24rem', flexShrink: 0 }}>
                        <div className="showup-feed-actions" style={{ display: 'flex', gap: '0.55rem' }}>
                          <IconActionButton label="React" onClick={() => setPickerFor(current => current === activity.id ? null : activity.id)}>
                            <span style={{ fontSize: '0.8rem', lineHeight: 1 }}>✦</span>
                          </IconActionButton>
                          <IconActionButton label="Comment" onClick={() => setCommentFor(current => current === activity.id ? null : activity.id)}>
                            <span style={{ fontSize: '0.88rem', lineHeight: 1 }}>💬</span>
                          </IconActionButton>
                        </div>
                        {pickerFor === activity.id && (
                          <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, zIndex: 3, display: 'flex', gap: '0.22rem', borderRadius: 999, background: '#fff', border: '1px solid var(--app-border)', boxShadow: '0 10px 22px rgba(86,53,66,0.12)', padding: '0.24rem' }}>
                            {REACTION_OPTIONS.map(option => (
                              <button key={option.id} type="button" onClick={() => addReaction(activity.id, option.id)} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', cursor: 'pointer', fontSize: '0.78rem', padding: 0 }}>
                                {option.icon}
                              </button>
                            ))}
                          </div>
                        )}
                        {!!summarizeReactions(activeRoomState?.reactions?.[activity.id] || {}).length && (
                          <span style={{ fontSize: '0.62rem', color: 'var(--app-muted)' }}>
                            {summarizeReactions(activeRoomState?.reactions?.[activity.id] || {}).map(([emoji, count]) => `${emoji} ${count}`).join(' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.45rem', display: 'grid', gap: '0.42rem' }}>
                      {(activeRoomState?.comments?.[activity.id] || []).slice(0, 3).map(comment => (
                        <div key={comment.id} style={{ borderRadius: 10, background: '#fff', border: '1px solid var(--app-border)', padding: '0.45rem 0.55rem', fontSize: '0.68rem', color: 'var(--app-text)', lineHeight: 1.45 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.55rem' }}>
                              <div style={{ minWidth: 0 }}>
                                <strong>{comment.author}:</strong> {comment.text}
                              </div>
                              <div style={{ display: 'flex', gap: '0.45rem', flexShrink: 0 }}>
                                {activity.memberId === 'you' && (
                                  <IconActionButton label="Reply" onClick={() => setReplyFor(current => current === comment.id ? null : comment.id)}>
                                    <span style={{ fontSize: '0.86rem', lineHeight: 1 }}>↩</span>
                                  </IconActionButton>
                                )}
                              </div>
                            </div>
                          {!!summarizeReactions(activeRoomState?.reactions?.[`comment-${comment.id}`] || {}).length && (
                            <div style={{ marginTop: '0.28rem', fontSize: '0.62rem', color: 'var(--app-muted)' }}>
                              {summarizeReactions(activeRoomState?.reactions?.[`comment-${comment.id}`] || {}).map(([emoji, count]) => `${emoji} ${count}`).join(' ')}
                            </div>
                          )}
                          {comment.reply && (
                            <div style={{ marginTop: '0.45rem', marginLeft: '0.55rem', paddingLeft: '0.55rem', borderLeft: '2px solid var(--app-border)', color: 'var(--app-text)' }}>
                              <strong>{comment.reply.author}:</strong> {comment.reply.text}
                            </div>
                          )}
                          {replyFor === comment.id && activity.memberId === 'you' && (
                            <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.35rem' }}>
                              <input
                                value={commentDrafts[`reply-${comment.id}`] || ''}
                                onChange={event => setCommentDrafts(current => ({ ...current, [`reply-${comment.id}`]: event.target.value }))}
                                style={{ flex: 1, minWidth: 0, borderRadius: 10, border: '1px solid var(--app-border)', background: '#fff', padding: '0.5rem 0.6rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', fontSize: '0.72rem', color: 'var(--app-text)' }}
                              />
                              <button type="button" onClick={() => submitReply(activity.id, comment.id)} style={{ minHeight: 32, padding: '0.46rem 0.62rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.7rem' }}>Reply</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {commentFor === activity.id && (
                      <div style={{ marginTop: '0.45rem', display: 'grid', gap: '0.42rem' }}>
                        <div className="showup-comment-row" style={{ display: 'flex', gap: '0.35rem' }}>
                          <input
                            value={commentDrafts[activity.id] || ''}
                            onChange={event => setCommentDrafts(current => ({ ...current, [activity.id]: event.target.value }))}
                            placeholder=""
                            style={{ flex: 1, minWidth: 0, borderRadius: 10, border: '1px solid var(--app-border)', background: '#fff', padding: '0.55rem 0.65rem', fontFamily: "'DM Sans', sans-serif", outline: 'none', fontSize: '0.74rem', color: 'var(--app-text)' }}
                          />
                          <button type="button" onClick={() => submitComment(activity.id)} style={{ minHeight: 34, padding: '0.52rem 0.68rem', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))', color: '#fff', fontWeight: 800, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: '0.72rem' }}>Send</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pressure' && (
              <div style={{ minHeight: '100%', display: 'grid', alignContent: 'start', gap: '1rem', paddingTop: '0.4rem' }}>
                <div className="showup-pressure-metrics" style={{ width: '100%', display: 'flex', gap: '0.7rem' }}>
                  <PressureMetric label="Completed today" value={completedCount} />
                  <PressureMetric label="Active today" value={activeCount} />
                </div>
                <div className="showup-pressure-groups" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.85rem' }}>
                  {[
                    { label: 'Completed', members: completedMembersByStatus },
                    { label: 'Active', members: activeMembersByStatus },
                    { label: 'Inactive', members: inactiveMembers },
                  ].map(group => (
                    <div
                      key={group.label}
                      style={{
                        gridColumn: group.label === 'Inactive' ? '1 / -1' : 'auto',
                        borderRadius: 16,
                        background: 'var(--app-bg2)',
                        padding: '0.75rem 0.8rem',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.68rem', fontWeight: 800, color: 'var(--app-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{group.label}</p>
                      <div style={{ marginTop: '0.32rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.42rem' }}>
                        {group.members.length
                          ? group.members.map(member => (
                              <span key={`${group.label}-${member.id}`} style={{ padding: '0.4rem 0.55rem', borderRadius: 12, background: '#fff', color: 'var(--app-text)', fontSize: '0.72rem', fontWeight: 700, textAlign: 'center', width: '100%' }}>
                                {member.isYou ? 'You' : getFirstName(member.name)}
                              </span>
                            ))
                          : <span style={{ color: 'var(--app-muted)', fontSize: '0.72rem' }}>None</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'top3' && (
              <div style={{ minHeight: '100%', display: 'grid', alignContent: 'start', gap: '0.7rem', paddingTop: '0.35rem' }}>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--app-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Leaders today</p>
                {topThree.map((member, index) => (
                  <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', padding: '0.35rem 0' }}>
                    <span style={{ fontSize: '0.84rem', color: 'var(--app-text)', fontWeight: 700 }}>{index + 1}. {member.isYou ? 'You' : member.name}</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--app-text)' }}><strong style={{ color: 'var(--app-accent)' }}>{member.streak}</strong> day streak</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', borderTop: '1px solid var(--app-border)', flexShrink: 0 }}>
            <TabButton label="Feed" active={activeTab === 'feed'} onClick={() => setActiveTab('feed')} />
            <TabButton label="Live Status" active={activeTab === 'pressure'} onClick={() => setActiveTab('pressure')} />
            <TabButton label="Leaders Today" active={activeTab === 'top3'} onClick={() => setActiveTab('top3')} />
          </div>
        </div>
        </div>
      </div>

      {selectedMember && (
        <div onClick={() => setSelectedMemberId(null)} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: railOffset, background: 'rgba(16,12,18,0.18)', zIndex: 40, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0.75rem' }}>
          <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 1100, maxHeight: 'min(78vh, 520px)', overflowY: 'auto', borderRadius: 22, background: '#fff', border: '1px solid var(--app-border)', padding: '1rem', boxShadow: '0 18px 36px rgba(16,12,18,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--app-text)' }}>{selectedMember.isYou ? 'You' : selectedMember.name}</p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.74rem', color: 'var(--app-muted)' }}>{statusMeta(selectedMember.status).label}</p>
              </div>
              <button type="button" onClick={() => setSelectedMemberId(null)} style={{ border: 'none', background: 'transparent', fontSize: '1.1rem', color: 'var(--app-muted)', cursor: 'pointer', padding: 0 }}>×</button>
            </div>
            <div style={{ marginTop: '0.8rem', display: 'grid', gap: '0.45rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--app-text)' }}>Streak: <strong>{selectedMember.streak} days</strong></p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--app-text)' }}>Last activity: <strong>{memberActivity[selectedMember.id] ? formatTime(memberActivity[selectedMember.id]) : 'No recent activity'}</strong></p>
              {!selectedMember.isYou && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMemberId(null)
                    setNudgeSheetFor(selectedMember)
                  }}
                  style={{
                    marginTop: '0.35rem',
                    minHeight: 40,
                    borderRadius: 12,
                    border: '1px solid var(--app-border)',
                    background: '#fff',
                    color: 'var(--app-text)',
                    fontWeight: 800,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                  }}
                >
                  Push
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {roomExitOpen && (
        <div onClick={() => setRoomExitOpen(false)} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: railOffset, background: 'rgba(16,12,18,0.18)', zIndex: 39, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.75rem' }}>
          <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 460, borderRadius: 24, background: '#fff', border: '1px solid var(--app-border)', padding: '1rem', boxShadow: '0 18px 36px rgba(16,12,18,0.2)' }}>
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--app-text)' }}>Leave room?</p>
            <div style={{ marginTop: '0.85rem', display: 'grid', gap: '0.7rem' }}>
              <button
                type="button"
                onClick={stepOutToRooms}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 16,
                  border: '1px solid var(--app-border)',
                  background: '#fff',
                  padding: '0.85rem 0.95rem',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ display: 'block', color: 'var(--app-text)', fontWeight: 800, fontSize: '0.86rem' }}>Leave for now</span>
                <span style={{ display: 'block', marginTop: '0.2rem', color: 'var(--app-muted)', fontSize: '0.76rem', lineHeight: 1.45 }}>Stay in this room and come back anytime</span>
              </button>

              <button
                type="button"
                onClick={exitRoomCompletely}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  borderRadius: 16,
                  border: '1px solid color-mix(in srgb, var(--app-accent) 30%, transparent)',
                  background: 'color-mix(in srgb, var(--app-accent) 5%, white)',
                  padding: '0.85rem 0.95rem',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <span style={{ display: 'block', color: 'var(--app-text)', fontWeight: 800, fontSize: '0.86rem' }}>Exit room</span>
                <span style={{ display: 'block', marginTop: '0.2rem', color: 'var(--app-muted)', fontSize: '0.76rem', lineHeight: 1.45 }}>You will lose your spot in this room</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {nudgeSheetFor && (
        <div onClick={() => setNudgeSheetFor(null)} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: railOffset, background: 'rgba(16,12,18,0.18)', zIndex: 41, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0.75rem', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 1100, maxHeight: 'min(72vh, 460px)', overflow: 'hidden', borderRadius: 22, background: '#fff', border: '1px solid var(--app-border)', padding: '0.95rem', boxShadow: '0 18px 36px rgba(16,12,18,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.8rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--app-text)' }}>Send {getFirstName(nudgeSheetFor.name)} a push</p>
              <button type="button" onClick={() => setNudgeSheetFor(null)} style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--app-border)', background: '#fff', color: '#b85a82', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}>
                ×
              </button>
            </div>
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.45rem', maxHeight: 'calc(min(72vh, 460px) - 72px)', overflowY: 'auto', paddingRight: '0.2rem' }}>
              {PUSH_OPTIONS.map(option => (
                <button key={option} type="button" onClick={() => sendNudge(nudgeSheetFor, option)} style={{ minHeight: 42, borderRadius: 14, border: '1px solid var(--app-border)', background: '#fff', color: 'var(--app-text)', textAlign: 'left', padding: '0.7rem 0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1120px) {
          .showup-pressure-groups {
            grid-template-columns: 1fr !important;
          }
          .showup-pressure-groups > div {
            grid-column: auto !important;
          }
          .showup-feed-actions {
            flex-wrap: wrap;
            justify-content: flex-end;
          }
          .showup-comment-row {
            flex-wrap: wrap;
          }
          .showup-comment-row > button {
            width: 100%;
          }
        }

        @media (max-width: 760px) {
          [style*="grid-template-columns: repeat(2, minmax(0, 1fr))"] {
            grid-template-columns: 1fr !important;
          }
          .showup-room-shell {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
