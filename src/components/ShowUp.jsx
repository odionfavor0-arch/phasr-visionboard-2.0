import { useEffect, useMemo, useState } from 'react'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'

const ROOM_DEFINITIONS = [
  { id: 'health-fitness', name: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', color: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', description: 'Job, entrepreneurship, income streams', color: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', description: 'Savings, investing, debt, financial freedom', color: '#d4773a' },
  { id: 'relationships', name: 'Relationships', description: 'Love, family, friendships, community', color: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', description: 'Spirituality, religion, mindfulness, mental health', color: '#4a7fc1' },
  { id: 'personal-growth', name: 'Personal Growth', description: 'Learning, creativity, self-development', color: '#5e8f64' },
]

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

function formatCheckInTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
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
  const today = new Date().toISOString().slice(0, 10)
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
  const today = new Date().toISOString().slice(0, 10)
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
  const feed = members
    .filter(member => member.checked_in)
    .sort((a, b) => new Date(b.check_in_time || 0).getTime() - new Date(a.check_in_time || 0).getTime())

  if (!feed.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: '14px' }}>
        <p style={{ margin: 0, fontSize: '0.76rem', color: '#7a5a66', lineHeight: 1.6 }}>
          No one has checked in yet today.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {feed.map(member => (
        <div key={member.user_id} style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: '12px' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#3d1f2b' }}>
            {member.isYou ? 'You checked in' : `${member.displayName} checked in`}
          </p>
          <p style={{ margin: '4px 0 0', fontSize: '0.68rem', color: '#b08090' }}>
            {formatCheckInTime(member.check_in_time)}
          </p>
        </div>
      ))}
    </div>
  )
}

function PresenceGrid({ members }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      padding: '4px 0',
    }}>
      {members.map(member => (
        <div key={member.user_id} style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '4px',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'linear-gradient(135deg, #e8407a, #f472a8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            position: 'relative',
          }}>
            {member.initials}
            {member.isOnline && (
              <div style={{
                position: 'absolute', bottom: 1, right: 1,
                width: 10, height: 10, borderRadius: '50%',
                background: '#34d399', border: '2px solid #fff',
              }} />
            )}
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.55rem', color: '#7a5a66',
            textAlign: 'center', maxWidth: '100%',
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {member.isYou ? 'You' : member.displayName}
          </p>
        </div>
      ))}
    </div>
  )
}

function LeaderboardContent({ members }) {
  const ranked = [...members].sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0))

  return (
    <div style={{ display: 'grid', gap: '10px' }}>
      {ranked.map((member, index) => (
        <div key={member.user_id} style={{ background: '#fff', border: '1px solid #f2c4d0', borderRadius: 14, padding: '12px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#3d1f2b' }}>
            {index + 1}. {member.isYou ? 'You' : member.displayName}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: '#e8407a', fontWeight: 700 }}>
            {member.streak_count || 0} streak
          </p>
        </div>
      ))}
    </div>
  )
}

export default function ShowUp({ user }) {
  const [lockInState] = useState(() => loadLockInState())
  const [activeRoomId, setActiveRoomId] = useState(null)
  const [activeTab, setActiveTab] = useState('Feed')
  const [members, setMembers] = useState([])
  const [roomSummary, setRoomSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const activeRoom = useMemo(() => ROOM_DEFINITIONS.find(room => room.id === activeRoomId) || null, [activeRoomId])

  const mappedMembers = useMemo(() => (
    members.map(member => ({
      ...member,
      displayName: member.user_id === user?.id ? 'You' : `@${String(member.user_initials || 'PH').toUpperCase()}`,
      initials: String(member.user_initials || 'PH').toUpperCase(),
      isYou: member.user_id === user?.id,
      isOnline: Boolean(member.checked_in),
    }))
  ), [members, user?.id])

  const checkedInMember = useMemo(() => mappedMembers.find(member => member.user_id === user?.id) || null, [mappedMembers, user?.id])
  const checkedIn = Boolean(checkedInMember?.checked_in)
  const checkInTime = formatCheckInTime(checkedInMember?.check_in_time)

  async function refreshRoomSummary() {
    try {
      const next = await loadRoomSummary()
      setRoomSummary(next)
    } catch (nextError) {
      setError(String(nextError?.message || 'Could not load room summary.'))
    }
  }

  async function refreshActiveRoom(roomName) {
    if (!roomName) {
      setMembers([])
      return
    }
    try {
      const nextMembers = await loadRoomMembers(roomName)
      setMembers(nextMembers)
    } catch (nextError) {
      setError(String(nextError?.message || 'Could not load room members.'))
    }
  }

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
        if (activeRoom?.name && changedRoom === activeRoom.name) {
          refreshActiveRoom(activeRoom.name)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeRoom?.name])

  async function joinRoom(roomId) {
    setActiveRoomId(roomId)
    setActiveTab('Feed')
  }

  function goBackToRooms() {
    setActiveRoomId(null)
    setMembers([])
  }

  async function handleCheckIn() {
    if (!activeRoom || !user?.id) return
    try {
      await checkIn(activeRoom.name, user, Math.max(1, summary.currentStreak || 1))
      await logActivity(user.id, 'check_in', { room: activeRoom.name })
      await refreshRoomSummary()
      await refreshActiveRoom(activeRoom.name)
    } catch (nextError) {
      setError(String(nextError?.message || 'Could not check in.'))
    }
  }

  async function handleUndo() {
    if (!activeRoom || !user?.id) return
    try {
      await undoCheckIn(activeRoom.name, user, Math.max(1, summary.currentStreak || 1))
      await logActivity(user.id, 'check_in_undo', { room: activeRoom.name })
      await refreshRoomSummary()
      await refreshActiveRoom(activeRoom.name)
    } catch (nextError) {
      setError(String(nextError?.message || 'Could not undo check in.'))
    }
  }

  if (!activeRoom) {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', paddingBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
        {error ? (
          <div style={{ padding: '12px 12px 0', color: '#b42318', fontSize: '0.76rem' }}>{error}</div>
        ) : null}
        <div style={{
          padding: '0 12px 12px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}>
          {ROOM_DEFINITIONS.map(room => {
            const summaryForRoom = roomSummary[room.name]
            const memberCount = summaryForRoom?.memberCount || 0
            return (
              <div key={room.id} style={{
                background: '#fff',
                border: '1.5px solid #f2c4d0',
                borderRadius: '14px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                minHeight: '140px',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: room.color,
                }}>{room.name}</p>
                <p style={{
                  margin: 0,
                  fontSize: '0.72rem',
                  color: '#7a5a66',
                  lineHeight: 1.5,
                  flex: 1,
                }}>{room.description}</p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <p style={{ margin: 0, fontSize: '0.62rem', color: '#b08090' }}>
                    {memberCount} joined
                  </p>
                  <button onClick={() => joinRoom(room.id)} style={{
                    background: 'none',
                    border: 'none',
                    color: room.color,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>Join →</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const roomMemberCount = roomSummary[activeRoom.name]?.memberCount || mappedMembers.length

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {error ? (
        <div style={{ padding: '10px 12px 0', color: '#b42318', fontSize: '0.76rem' }}>{error}</div>
      ) : null}

      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid #f2c4d0',
        background: '#fffbfc',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#3d1f2b' }}>
              {activeRoom.name}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#b08090' }}>
              {roomMemberCount} {roomMemberCount === 1 ? 'person' : 'people'} in this room
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
          }}>← Rooms</button>
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '10px',
        }}>
          <button onClick={handleCheckIn} style={{
            flex: 1, padding: '10px',
            borderRadius: 12, border: 'none',
            background: 'linear-gradient(135deg, #e8407a, #f472a8)',
            color: '#fff', fontSize: '0.82rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
          }}>
            {checkedIn ? 'Checked in ✓' : 'Check in'}
          </button>
          {checkedIn && (
            <button onClick={handleUndo} style={{
              flex: 1, padding: '10px',
              borderRadius: 12,
              border: '1.5px solid #f2c4d0',
              background: '#fff',
              color: '#7a5a66', fontSize: '0.82rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>Undo</button>
          )}
        </div>

        {checkedIn && (
          <div style={{
            display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '0.65rem', color: '#7a5a66',
              background: '#f5f5f5', padding: '3px 8px',
              borderRadius: 6,
            }}>
              Checked in at {checkInTime}
            </span>
            <span style={{
              fontSize: '0.65rem', color: '#e8407a',
              background: '#fff5f7', padding: '3px 8px',
              borderRadius: 6, fontWeight: 600,
            }}>
              Task completed
            </span>
          </div>
        )}
      </div>

      <div style={{
        display: 'flex',
        borderBottom: '1px solid #f2c4d0',
        background: '#fff',
      }}>
        {['Feed', 'Live Status', 'Leaders Today'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px 0',
              border: 'none', background: 'none',
              borderBottom: activeTab === tab
                ? '2px solid #e8407a'
                : '2px solid transparent',
              color: activeTab === tab ? '#e8407a' : '#b08090',
              fontSize: '0.72rem', fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >{tab}</button>
        ))}
      </div>

      <div style={{
        background: '#fffbfc',
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      }}>
        {loading ? <p style={{ margin: 0, fontSize: '0.76rem', color: '#7a5a66' }}>Loading room…</p> : null}
        {!loading && activeTab === 'Feed' && <FeedContent members={mappedMembers} />}
        {!loading && activeTab === 'Live Status' && <PresenceGrid members={mappedMembers} />}
        {!loading && activeTab === 'Leaders Today' && <LeaderboardContent members={mappedMembers} />}
      </div>
    </div>
  )
}
