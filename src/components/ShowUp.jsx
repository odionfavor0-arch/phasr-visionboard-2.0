import { useEffect, useMemo, useState } from 'react'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { supabase, supabaseConfigError } from '../lib/supabaseClient'
import { calculateUserPoints, getStoredUserLevel } from '../lib/userLevel'

const ROOM_DEFINITIONS = [
  { id: 'health-fitness', name: 'Health & Fitness', description: 'Body, food, sleep, gym, energy', color: '#f25e92' },
  { id: 'career-business', name: 'Career & Business', description: 'Job, entrepreneurship, income streams', color: '#7a58b0' },
  { id: 'wealth', name: 'Wealth', description: 'Savings, investing, debt, financial freedom', color: '#d4773a' },
  { id: 'relationships', name: 'Relationships', description: 'Love, family, friendships, community', color: '#e07b9f' },
  { id: 'inner-life', name: 'Inner Life', description: 'Spirituality, religion, mindfulness, mental health', color: '#4a7fc1' },
  { id: 'personal-growth', name: 'Personal Growth', description: 'Learning, creativity, self-development', color: '#5e8f64' },
]

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function PresenceGrid({ members, currentUserName }) {
  return (
    <div style={{ padding: '12px 14px' }}>
      <p style={{
        fontSize: '0.6rem',
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#b08090',
        margin: '0 0 10px',
      }}>
        In this room today
      </p>
      {members.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: '#b08090', textAlign: 'center', padding: '1rem 0', margin: 0 }}>
          No one has checked in yet. Be the first.
        </p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '10px',
        }}>
          {members.map(member => (
            <div key={member.user_id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: member.task_done
                  ? 'linear-gradient(135deg, #34d399, #059669)'
                  : 'linear-gradient(135deg, #e8407a, #f472a8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#fff',
                position: 'relative',
                border: member.task_done ? '2px solid #059669' : '2px solid transparent',
              }}>
                {member.initials}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: member.task_done ? '#059669' : '#e8407a',
                  border: '1.5px solid #fff',
                }} />
              </div>
              <p style={{
                fontSize: '0.52rem',
                color: '#7a5a66',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                width: '100%',
                textAlign: 'center',
                margin: 0,
              }}>
                {member.display_name === currentUserName ? 'You' : member.display_name}
              </p>
              {member.task_done && (
                <p style={{ fontSize: '0.45rem', color: '#059669', fontWeight: 700, margin: 0 }}>Done</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FeedContent({ members }) {
  const items = [...members]
    .filter(member => member.checked_in || member.task_done)
    .sort((a, b) => new Date(b.check_in_time || 0).getTime() - new Date(a.check_in_time || 0).getTime())

  if (!items.length) {
    return (
      <div style={{ padding: '12px 14px' }}>
        <div style={{ padding: '10px 12px', background: '#fff8fb', borderRadius: 10, border: '1px solid #f2c4d0' }}>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#7a5a66' }}>
            No activity yet. Once someone checks in or completes something, the feed will show it here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '12px 14px' }}>
      {items.map(member => {
        const formattedTime = formatTime(member.check_in_time)
        return (
          <div key={member.user_id} style={{ marginBottom: 8 }}>
            {member.checked_in ? (
              <div style={{
                padding: '10px 12px',
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #f2c4d0',
                marginBottom: member.task_done ? 8 : 0,
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#3d1f2b', margin: '0 0 2px' }}>
                  {member.display_name} checked in
                </p>
                <p style={{ fontSize: '0.7rem', color: '#b08090', margin: 0 }}>{formattedTime}</p>
              </div>
            ) : null}
            {member.task_done ? (
              <div style={{
                padding: '10px 12px',
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #d1fae5',
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#059669', margin: '0 0 2px' }}>
                  {member.display_name} completed their task
                </p>
                <p style={{ fontSize: '0.7rem', color: '#b08090', margin: 0 }}>{formattedTime}</p>
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function LiveStatusContent({ members }) {
  const completedMembers = members.filter(member => member.task_done)
  const activeMembers = members.filter(member => member.checked_in && !member.task_done)
  const inactiveMembers = members.filter(member => !member.checked_in)

  const formatNames = list => list.length ? list.map(member => member.display_name).join(', ') : 'None'

  return (
    <div style={{ padding: '12px 14px 16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3d1f2b', lineHeight: 1 }}>{completedMembers.length}</div>
          <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>Completed today</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3d1f2b', lineHeight: 1 }}>{activeMembers.length}</div>
          <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>Active today</div>
        </div>
      </div>
      {[
        { title: 'Completed', body: formatNames(completedMembers) },
        { title: 'Active', body: formatNames(activeMembers) },
        { title: 'Inactive', body: formatNames(inactiveMembers) },
      ].map(section => (
        <div key={section.title} style={{ background: '#fff8fb', border: '1px solid #f2c4d0', borderRadius: 18, padding: 16, marginBottom: 12 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c6170', marginBottom: 10 }}>
            {section.title}
          </div>
          <div style={{ background: '#fff', borderRadius: 999, padding: '10px 14px', fontSize: '0.88rem', fontWeight: 700, color: '#3d1f2b' }}>
            {section.body}
          </div>
        </div>
      ))}
    </div>
  )
}

function LeadersToday({ members, currentUserName }) {
  const ranked = [...members]
    .filter(member => member.checked_in)
    .sort((a, b) => (b.streak_count || 0) - (a.streak_count || 0))

  return (
    <div style={{ padding: '12px 14px 20px' }}>
      <p style={{ margin: '0 0 16px', fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8c6170' }}>
        Leaders Today
      </p>
      {ranked.length === 0 ? (
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#b08090' }}>No check-ins yet today.</p>
      ) : (
        ranked.map((member, index) => (
          <div key={member.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#3d1f2b' }}>
              {index + 1}. {member.display_name === currentUserName ? 'You' : member.display_name}
            </p>
            <p style={{ margin: 0, fontSize: '0.92rem', color: '#e8407a' }}>
              {member.streak_count || 1} day streak
            </p>
          </div>
        ))
      )}
    </div>
  )
}

export default function ShowUp({ user, onGoToDailyStreaks }) {
  const [lockInState] = useState(() => loadLockInState())
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('Feed')
  const [members, setMembers] = useState([])
  const [roomCounts, setRoomCounts] = useState({})
  const [checkedIn, setCheckedIn] = useState(false)
  const [taskDone, setTaskDone] = useState(false)
  const [checkInTime, setCheckInTime] = useState('')
  const [currentUserId, setCurrentUserId] = useState('')
  const [currentUserName, setCurrentUserName] = useState('')
  const [showGateModal, setShowGateModal] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createRoomName, setCreateRoomName] = useState('')
  const [createFocusAreaId, setCreateFocusAreaId] = useState(ROOM_DEFINITIONS[0].id)
  const [creatingRoom, setCreatingRoom] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])
  const daysStreak = Math.max(0, Number(summary.currentStreak || 0))

  async function loadCurrentUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    const displayName =
      authUser?.user_metadata?.full_name ||
      authUser?.email?.split('@')[0] ||
      user?.user_metadata?.full_name ||
      user?.email?.split('@')[0] ||
      'User'
    setCurrentUserId(authUser?.id || '')
    setCurrentUserName(displayName)
    return authUser
  }

  async function loadRoomCounts() {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: countsError } = await supabase
      .from('show_up_checkins')
      .select('room_name')
      .gte('created_at', `${today}T00:00:00`)

    if (countsError) throw countsError

    const counts = {}
    data?.forEach(row => {
      counts[row.room_name] = (counts[row.room_name] || 0) + 1
    })
    setRoomCounts(counts)
  }

  async function loadMembers(roomName) {
    if (!roomName) return
    const today = new Date().toISOString().slice(0, 10)
    const { data, error: membersError } = await supabase
      .from('show_up_checkins')
      .select('*')
      .eq('room_name', roomName)
      .gte('created_at', `${today}T00:00:00`)
      .order('check_in_time', { ascending: true })

    if (membersError) throw membersError

    const nextMembers = data || []
    setMembers(nextMembers)

    const myRow = nextMembers.find(member => member.user_id === currentUserId)
    setCheckedIn(Boolean(myRow?.checked_in))
    setTaskDone(Boolean(myRow?.task_done))
    setCheckInTime(myRow?.check_in_time ? formatTime(myRow.check_in_time) : '')
  }

  useEffect(() => {
    let alive = true
    async function bootstrap() {
      setLoading(true)
      try {
        if (!supabase) throw new Error(supabaseConfigError || 'Supabase is not configured.')
        await loadCurrentUser()
        await loadRoomCounts()
        if (alive && selectedRoom) await loadMembers(selectedRoom)
        if (alive) setError('')
      } catch (nextError) {
        console.error('Show Up bootstrap failed', nextError)
        if (alive) setError('Show Up is syncing in the background.')
      } finally {
        if (alive) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      alive = false
    }
  }, [selectedRoom])

  useEffect(() => {
    if (!supabase) return undefined

    loadRoomCounts()

    const channel = supabase
      .channel('show-up-room-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_up_checkins',
      }, () => {
        loadRoomCounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (!selectedRoom || !supabase) return undefined

    loadMembers(selectedRoom)

    const channel = supabase
      .channel(`room-${selectedRoom}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'show_up_checkins',
        filter: `room_name=eq.${selectedRoom}`,
      }, () => {
        loadMembers(selectedRoom)
        loadRoomCounts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [selectedRoom, currentUserId])

  async function handleCheckIn() {
    if (!selectedRoom) return

    const { data: { user: authUser } } = await supabase.auth.getUser()
    const displayName =
      authUser?.user_metadata?.full_name ||
      authUser?.email?.split('@')[0] ||
      'User'
    const initials = displayName.slice(0, 2).toUpperCase()

    await supabase.from('show_up_checkins').upsert({
      room_name: selectedRoom,
      user_id: authUser.id,
      display_name: displayName,
      initials,
      checked_in: true,
      task_done: false,
      check_in_time: new Date().toISOString(),
      streak_count: 1,
    }, { onConflict: 'room_name,user_id' })

    setCheckedIn(true)
    setTaskDone(false)
    setCheckInTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }))
  }

  async function handleMarkDone() {
    if (!selectedRoom) return
    const { data: { user: authUser } } = await supabase.auth.getUser()
    await supabase
      .from('show_up_checkins')
      .update({ task_done: true })
      .eq('room_name', selectedRoom)
      .eq('user_id', authUser.id)
    setTaskDone(true)
  }

  function handleCreateRoomPress() {
    const latestLevel = getStoredUserLevel() || calculateUserPoints()
    if ((latestLevel?.level || 1) < 4) {
      setShowGateModal(true)
      setShowCreateForm(false)
      return
    }
    setShowGateModal(false)
    setShowCreateForm(current => !current)
  }

  async function handleCreateRoomSubmit(event) {
    event.preventDefault()
    const trimmedName = createRoomName.trim()
    if (!trimmedName) {
      setError('Add a room name first.')
      return
    }
    setCreatingRoom(true)
    setTimeout(() => {
      setCreatingRoom(false)
      setShowCreateForm(false)
      setSelectedRoom(trimmedName)
    }, 250)
  }

  if (!selectedRoom) {
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
          {ROOM_DEFINITIONS.map(room => {
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
                  <p style={{ fontSize: '0.62rem', color: '#b08090', margin: 0 }}>
                    {roomCounts[room.name] || 0} checked in today
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoom(room.name)
                      setActiveTab('Feed')
                    }}
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
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#3d1f2b', margin: '0 0 6px' }}>
                Keep going. Creating rooms unlocks at 90 days.
              </p>
              <p style={{ fontSize: '0.8rem', color: '#7a5a66', lineHeight: 1.6, margin: '0 0 16px' }}>
                You are {daysStreak} days in. The rooms you can join right now are where your people already are.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowGateModal(false)
                    onGoToDailyStreaks?.()
                  }}
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

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {error ? (
        <div style={{ padding: '10px 12px 0', color: '#7a5a66', fontSize: '0.76rem' }}>{error}</div>
      ) : null}

      <div style={{ padding: '12px 14px', borderBottom: '1px solid #f2c4d0', background: '#fffbfc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#3d1f2b' }}>
              {selectedRoom}
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '0.7rem', color: '#b08090' }}>
              {(roomCounts[selectedRoom] || 0)} people. Daily check-ins.
            </p>
          </div>
          <button onClick={() => setSelectedRoom(null)} style={{
            padding: '5px 12px',
            borderRadius: 99,
            border: '1.5px solid #f2c4d0',
            background: '#fff',
            color: '#7a5a66',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}>Rooms -&gt;</button>
        </div>

        <div style={{ marginTop: 6, fontSize: '0.82rem', fontWeight: 700, color: '#7a5a66' }}>
          Join the room and let people see you.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
          <button
            onClick={handleCheckIn}
            disabled={checkedIn}
            style={{
              flex: 1, padding: '12px',
              borderRadius: 12, border: 'none',
              background: checkedIn
                ? 'linear-gradient(135deg, #34d399, #059669)'
                : 'linear-gradient(135deg, #e8407a, #f472a8)',
              color: '#fff', fontSize: '0.88rem', fontWeight: 700,
              cursor: checkedIn ? 'default' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {checkedIn ? `Checked in at ${checkInTime}` : 'Check in'}
          </button>

          {checkedIn && !taskDone && (
            <button onClick={handleMarkDone} style={{
              flex: 1, padding: '12px',
              borderRadius: 12,
              border: '1.5px solid #f2c4d0',
              background: '#fff',
              color: '#3d1f2b', fontSize: '0.88rem', fontWeight: 600,
              cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
            }}>
              Mark done
            </button>
          )}

          {taskDone && (
            <div style={{
              flex: 1, padding: '12px',
              borderRadius: 12, background: '#f0fff4',
              border: '1.5px solid #b9f5d0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 6,
            }}>
              <span style={{ color: '#059669', fontSize: '0.85rem', fontWeight: 700 }}>
                {'\u2713'} Task complete
              </span>
            </div>
          )}
        </div>
      </div>

      <PresenceGrid members={members} currentUserName={currentUserName} />

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
            }}
          >{tab}</button>
        ))}
      </div>

      <div style={{ background: '#fffbfc', flex: 1, overflowY: 'auto' }}>
        {loading ? <p style={{ margin: 0, padding: '12px 14px', fontSize: '0.76rem', color: '#7a5a66' }}>Loading room...</p> : null}
        {!loading && activeTab === 'Feed' && <FeedContent members={members} />}
        {!loading && activeTab === 'Live Status' && <LiveStatusContent members={members} />}
        {!loading && activeTab === 'Leaders Today' && <LeadersToday members={members} currentUserName={currentUserName} />}
      </div>
    </div>
  )
}
