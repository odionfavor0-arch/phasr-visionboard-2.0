import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Image as ImageIcon,
  MessageCircle,
  Send,
  ThumbsUp,
  Users,
} from 'lucide-react'

const ROOM_DEFINITIONS = [
  { id: 'personal-growth', name: 'Personal Growth', pillar: 'Personal Growth', maxSpots: 12 },
  { id: 'health-fitness', name: 'Health & Fitness', pillar: 'Health & Fitness', maxSpots: 12 },
  { id: 'career-business', name: 'Career & Business', pillar: 'Career & Business', maxSpots: 12 },
  { id: 'wealth', name: 'Wealth', pillar: 'Wealth', maxSpots: 12 },
  { id: 'relationships', name: 'Relationships', pillar: 'Relationships', maxSpots: 12 },
  { id: 'inner-life', name: 'Inner Life', pillar: 'Inner Life', maxSpots: 12 },
]

const INITIAL_MEMBERS = [
  { id: 'u1', name: 'Favour Addy', initials: 'FA', role: 'Room Leader', streak: 8, taskDone: true },
  { id: 'u2', name: 'Big Baby Andy', initials: 'BB', role: 'Comeback', streak: 3, taskDone: false },
  { id: 'u3', name: 'You', initials: 'YO', role: '', streak: 1, taskDone: false },
]

const INITIAL_POSTS = [
  {
    id: 'sage-1',
    author: 'Sage',
    time: 'May 21 at 01:26 AM',
    text: 'The reason most people do not finish things is unclear next steps. What is your next step today?',
    image: '',
    likes: 0,
    comments: [
      {
        id: 'c1',
        author: 'Favour Addy',
        text: 'My next step is to finish the landing page.',
        replies: [{ id: 'r1', author: 'Sage', text: 'Keep it small and ship it today.' }],
      },
    ],
    system: true,
  },
]

const HANDOFF_STYLES = `
.showup-handoff{
  min-height:100vh;
  background:linear-gradient(180deg,#fff8fb 0%,#fff2f7 100%);
  color:#4d3142;
  font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
  padding:18px;
  box-sizing:border-box;
}
.showup-handoff-shell{
  max-width:1180px;
  margin:0 auto;
  display:grid;
  gap:16px;
}
.showup-handoff-card,
.showup-handoff-panel,
.showup-handoff-sheet{
  background:#fff;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:16px;
  box-shadow:0 10px 24px rgba(77,49,66,0.06);
}
.showup-handoff-topbar,
.showup-handoff-list-header,
.showup-handoff-feed-head,
.showup-handoff-post-meta,
.showup-handoff-comment-row,
.showup-handoff-reply-row,
.showup-handoff-reaction-row{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.showup-handoff-list-header{
  margin-bottom:6px;
}
.showup-handoff-title{
  margin:0;
  font-size:24px;
  font-weight:800;
  letter-spacing:-0.02em;
}
.showup-handoff-create{
  border:none;
  background:transparent;
  color:#f95f85;
  font-weight:800;
  font-size:15px;
  cursor:pointer;
}
.showup-handoff-rooms{
  display:grid;
  gap:10px;
}
.showup-handoff-room{
  display:grid;
  grid-template-columns:44px minmax(0,1fr) auto;
  gap:12px;
  align-items:center;
  padding:14px 16px;
}
.showup-handoff-room + .showup-handoff-room{
  border-top:1px solid rgba(77,49,66,0.06);
}
.showup-handoff-pill,
.showup-handoff-btn,
.showup-handoff-tab,
.showup-handoff-mini{
  border:none;
  border-radius:12px;
  cursor:pointer;
  font:inherit;
}
.showup-handoff-pill{
  min-height:38px;
  padding:0 14px;
  background:rgba(249,95,133,0.12);
  color:#f95f85;
  font-weight:800;
}
.showup-handoff-pill[disabled]{
  opacity:.65;
  cursor:not-allowed;
}
.showup-handoff-room-meta{
  display:grid;
  gap:4px;
  min-width:0;
}
.showup-handoff-room-name{
  margin:0;
  font-weight:800;
  font-size:15px;
}
.showup-handoff-room-note{
  margin:0;
  font-size:12px;
  color:#9a7088;
}
.showup-handoff-shell{
  display:grid;
  gap:16px;
}
.showup-handoff-topbar{
  padding:4px 0;
}
.showup-handoff-back{
  width:44px;
  height:44px;
  border-radius:12px;
  background:#fff;
  color:#f95f85;
  border:1px solid rgba(249,95,133,0.18);
  display:grid;
  place-items:center;
}
.showup-handoff-room-title{
  margin:0;
  font-size:20px;
  font-weight:900;
}
.showup-handoff-actions{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:10px;
}
.showup-handoff-btn{
  min-height:48px;
  background:#f95f85;
  color:#fff;
  font-weight:800;
}
.showup-handoff-btn.secondary{
  background:#fff;
  color:#4d3142;
  border:1px solid rgba(249,95,133,0.18);
}
.showup-handoff-btn.is-complete{
  background:rgba(249,95,133,0.12);
  color:#f95f85;
}
.showup-handoff-btn.is-done{
  background:rgba(47,182,109,0.12);
  color:#2fb66d;
}
.showup-handoff-tabs{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:8px;
}
.showup-handoff-tab{
  min-height:42px;
  background:#fff;
  border:1px solid rgba(249,95,133,0.18);
  color:#b98097;
  font-weight:800;
}
.showup-handoff-tab.is-active{
  background:#f95f85;
  color:#fff;
}
.showup-handoff-grid{
  display:grid;
  gap:12px;
}
.showup-handoff-live-grid{
  display:grid;
  grid-template-columns:repeat(2,minmax(0,1fr));
  gap:12px;
}
.showup-handoff-member{
  padding:18px;
  border-radius:16px;
  border:1px solid rgba(249,95,133,0.16);
  background:#fff;
  text-align:center;
}
.showup-handoff-avatar{
  width:48px;
  height:48px;
  border-radius:50%;
  display:grid;
  place-items:center;
  margin:0 auto 10px;
  background:rgba(249,95,133,0.12);
  color:#f95f85;
  font-weight:900;
}
.showup-handoff-role{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  margin-top:6px;
  padding:4px 8px;
  border-radius:999px;
  background:rgba(249,95,133,0.10);
  color:#b98097;
  font-size:11px;
  font-weight:800;
}
.showup-handoff-done{
  margin-top:8px;
  color:#2fb66d;
  font-size:12px;
  font-weight:800;
}
.showup-handoff-compose,
.showup-handoff-post,
.showup-handoff-comment{
  display:grid;
  gap:10px;
}
.showup-handoff-input,
.showup-handoff-textarea{
  width:100%;
  box-sizing:border-box;
  border:1px solid rgba(249,95,133,0.18);
  border-radius:12px;
  padding:12px 14px;
  font:inherit;
  color:#4d3142;
}
.showup-handoff-feed-list{
  display:grid;
  gap:12px;
}
.showup-handoff-post-card{
  background:#fff;
  border:1px solid rgba(77,49,66,0.08);
  border-radius:12px;
  box-shadow:0 1px 4px rgba(0,0,0,0.07);
  padding:14px;
  display:grid;
  gap:10px;
}
.showup-handoff-post-card.system{
  background:rgba(249,95,133,0.06);
}
.showup-handoff-post-head{
  display:grid;
  grid-template-columns:36px minmax(0,1fr);
  gap:10px;
  align-items:start;
}
.showup-handoff-post-name{
  margin:0;
  font-weight:800;
  font-size:14px;
}
.showup-handoff-post-time{
  margin:2px 0 0;
  font-size:12px;
  color:#9a7088;
}
.showup-handoff-post-image{
  width:100%;
  max-height:420px;
  object-fit:contain;
  background:#f8f0f4;
  border-radius:12px;
}
.showup-handoff-reaction-row{
  justify-content:space-between;
  border-top:1px solid rgba(77,49,66,0.08);
  padding-top:10px;
}
.showup-handoff-link{
  border:none;
  background:transparent;
  color:#f95f85;
  padding:0;
  font-weight:800;
  cursor:pointer;
}
.showup-handoff-sheet{
  padding:16px;
}
.showup-handoff-comment{
  padding:12px 0;
  border-top:1px solid rgba(77,49,66,0.08);
}
.showup-handoff-reply-row{
  margin-left:16px;
  border-left:2px solid rgba(249,95,133,0.22);
  padding-left:10px;
}
.showup-handoff-toast{
  position:sticky;
  top:12px;
  z-index:20;
  margin-bottom:12px;
  padding:10px 16px;
  border-radius:10px;
  background:rgba(249,95,133,0.12);
  color:#f95f85;
  font-weight:800;
}
@media (max-width: 720px){
  .showup-handoff-live-grid{grid-template-columns:1fr}
  .showup-handoff-room{grid-template-columns:40px minmax(0,1fr) auto}
}
`

function Spark() {
  return <Users size={18} strokeWidth={2.2} />
}

function buildInitials(name) {
  const parts = String(name || 'User').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'U'
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('')
}

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getEnergyLabel(doneCount) {
  if (doneCount === 0) return 'Quiet'
  if (doneCount <= 2) return 'Warming Up'
  if (doneCount <= 5) return 'Focused'
  if (doneCount <= 8) return 'On Fire'
  if (doneCount <= 11) return 'Locked In'
  return 'Full Send'
}

export default function ShowUpHandoff() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [activeTab, setActiveTab] = useState('live')
  const [checkedIn, setCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState('')
  const [taskDone, setTaskDone] = useState(false)
  const [progressToast, setProgressToast] = useState('')
  const [joinToast, setJoinToast] = useState('')
  const [postDraft, setPostDraft] = useState('')
  const [postImage, setPostImage] = useState('')
  const [feedPosts, setFeedPosts] = useState(INITIAL_POSTS)
  const [members, setMembers] = useState(INITIAL_MEMBERS)
  const [commentPostId, setCommentPostId] = useState('')
  const [commentDraft, setCommentDraft] = useState('')
  const [replyDraft, setReplyDraft] = useState('')

  const doneCount = useMemo(() => members.filter(member => member.taskDone).length, [members])
  const energy = getEnergyLabel(doneCount)
  const room = useMemo(() => ROOM_DEFINITIONS.find(item => item.name === selectedRoom) || null, [selectedRoom])
  const roomMembers = members
  const roomRanks = [...members].sort((a, b) => b.streak - a.streak)

  function joinRoom(roomName) {
    if (selectedRoom && selectedRoom !== roomName) {
      setJoinToast("You're already in a room. Leave it first to join another.")
      window.setTimeout(() => setJoinToast(''), 2000)
      return
    }
    setSelectedRoom(roomName)
    setActiveTab('live')
    setCheckedIn(false)
    setCheckInTime('')
    setTaskDone(false)
  }

  function leaveRoom() {
    setSelectedRoom(null)
    setActiveTab('live')
    setCheckedIn(false)
    setCheckInTime('')
    setTaskDone(false)
  }

  function handleCheckIn() {
    const now = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setCheckedIn(true)
    setCheckInTime(now)
  }

  function handleMarkDone() {
    if (!checkedIn || taskDone) return
    setTaskDone(true)
    setProgressToast('Nice work. Post a progress photo.')
    window.setTimeout(() => setProgressToast(''), 3000)
    window.setTimeout(() => setActiveTab('feed'), 1500)
  }

  function handlePickImage(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPostImage(String(reader.result || ''))
    reader.readAsDataURL(file)
  }

  function addPost() {
    if (!postDraft.trim() && !postImage) return
    setFeedPosts(current => [
      {
        id: `post-${Date.now()}`,
        author: 'You',
        time: 'Just now',
        text: postDraft.trim(),
        image: postImage,
        likes: 0,
        comments: [],
        system: false,
      },
      ...current,
    ])
    setPostDraft('')
    setPostImage('')
  }

  function addComment() {
    if (!commentDraft.trim()) return
    setFeedPosts(current =>
      current.map(post => {
        if (post.id !== commentPostId) return post
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: `comment-${Date.now()}`,
              author: 'You',
              text: commentDraft.trim(),
              replies: replyDraft.trim()
                ? [{ id: `reply-${Date.now()}`, author: 'You', text: replyDraft.trim() }]
                : [],
            },
          ],
        }
      })
    )
    setCommentDraft('')
    setReplyDraft('')
  }

  return (
    <div className="showup-handoff">
      <style>{HANDOFF_STYLES}</style>
      <div className="showup-handoff-shell">
        {progressToast ? <div className="showup-handoff-toast">{progressToast}</div> : null}
        {joinToast ? <div className="showup-handoff-toast">{joinToast}</div> : null}

        {!selectedRoom ? (
          <div className="showup-handoff-card" style={{ padding: 16 }}>
            <div className="showup-handoff-list-header">
              <h1 className="showup-handoff-title">ALL ROOMS</h1>
              <button type="button" className="showup-handoff-create">+ Create room</button>
            </div>

            <div className="showup-handoff-rooms">
              {ROOM_DEFINITIONS.map(roomItem => {
                const spotsLeft = roomItem.maxSpots - 3
                return (
                  <button
                    key={roomItem.id}
                    type="button"
                    className="showup-handoff-card showup-handoff-room"
                    onClick={() => joinRoom(roomItem.name)}
                  >
                    <div className="showup-handoff-avatar">{roomItem.name.split(' ').map(word => word[0]).join('').slice(0, 2)}</div>
                    <div className="showup-handoff-room-meta">
                      <p className="showup-handoff-room-name">{roomItem.name}</p>
                      <p className="showup-handoff-room-note">Your focus area</p>
                    </div>
                    <span className="showup-handoff-pill">{spotsLeft}/{roomItem.maxSpots} spots</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="showup-handoff-shell">
            <div className="showup-handoff-topbar">
              <button type="button" className="showup-handoff-back" onClick={leaveRoom} aria-label="Back">
                <ArrowLeft size={18} strokeWidth={2.2} />
              </button>
              <h2 className="showup-handoff-room-title">{room?.name}</h2>
            </div>

            <div className="showup-handoff-actions">
              <button
                type="button"
                className={`showup-handoff-btn ${checkedIn ? 'is-complete' : ''}`}
                onClick={handleCheckIn}
                disabled={checkedIn}
              >
                {checkedIn ? `Checked in ${checkInTime}` : 'Check In'}
              </button>
              <button
                type="button"
                className={`showup-handoff-btn ${taskDone ? 'is-done' : 'secondary'}`}
                onClick={handleMarkDone}
                disabled={!checkedIn || taskDone}
              >
                {taskDone ? 'Done ✓' : 'Mark Done'}
              </button>
            </div>

            <div className="showup-handoff-card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                {['live', 'feed', 'ranks'].map(tab => (
                  <button
                    key={tab}
                    type="button"
                    className={`showup-handoff-tab ${activeTab === tab ? 'is-active' : ''}`}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {activeTab === 'live' ? (
                <div className="showup-handoff-live-grid">
                  {roomMembers.map(member => (
                    <div key={member.id} className="showup-handoff-member">
                      <div className="showup-handoff-avatar">{member.initials}</div>
                      <div style={{ fontWeight: 800 }}>{member.name}</div>
                      {member.role ? <div className="showup-handoff-role">{member.role}</div> : null}
                      {member.taskDone ? <div className="showup-handoff-done">Done today</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}

              {activeTab === 'feed' ? (
                <div className="showup-handoff-grid">
                  <div className="showup-handoff-compose">
                    <textarea
                      className="showup-handoff-textarea"
                      rows={3}
                      value={postDraft}
                      onChange={event => setPostDraft(event.target.value)}
                      placeholder="Share what you are working on..."
                    />
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <label className="showup-handoff-btn secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 14px' }}>
                        <ImageIcon size={15} strokeWidth={2.2} />
                        <span>Photo</span>
                        <input type="file" accept="image/*" hidden onChange={handlePickImage} />
                      </label>
                      <button type="button" className="showup-handoff-btn" onClick={addPost} style={{ flex: 1 }}>
                        Post
                      </button>
                    </div>
                    {postImage ? (
                      <img src={postImage} alt="Preview" className="showup-handoff-post-image" />
                    ) : null}
                  </div>

                  <div className="showup-handoff-feed-list">
                    {feedPosts.map(post => (
                      <div key={post.id} className={`showup-handoff-post-card ${post.system ? 'system' : ''}`}>
                        <div className="showup-handoff-post-head">
                          <div className="showup-handoff-avatar" style={{ width: 36, height: 36, margin: 0 }}>{buildInitials(post.author)}</div>
                          <div>
                            <div style={{ fontWeight: 800 }}>{post.author}</div>
                            <p className="showup-handoff-post-time">{post.time}</p>
                          </div>
                        </div>

                        {post.text ? <div>{post.text}</div> : null}
                        {post.image ? <img src={post.image} alt="" className="showup-handoff-post-image" /> : null}

                        <div className="showup-handoff-reaction-row">
                          <button type="button" className="showup-handoff-link">
                            <ThumbsUp size={14} strokeWidth={2.2} /> {post.likes}
                          </button>
                          <button type="button" className="showup-handoff-link" onClick={() => setCommentPostId(post.id)}>
                            <MessageCircle size={14} strokeWidth={2.2} /> {post.comments.length}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {commentPostId ? (
                    <div className="showup-handoff-sheet">
                      <div style={{ marginBottom: 12, fontWeight: 800 }}>Comments</div>
                      {(feedPosts.find(post => post.id === commentPostId)?.comments || []).map(comment => (
                        <div key={comment.id} className="showup-handoff-comment">
                          <strong>{comment.author}</strong>
                          <div>{comment.text}</div>
                          <button
                            type="button"
                            className="showup-handoff-link"
                            onClick={() => setReplyDraft(`@${comment.author.split(' ')[0]} `)}
                          >
                            Reply
                          </button>
                          {comment.replies.map(reply => (
                            <div key={reply.id} className="showup-handoff-reply-row">
                              <strong>{reply.author}</strong>
                              <div>{reply.text}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                      <div className="showup-handoff-compose">
                        <input
                          className="showup-handoff-input"
                          value={commentDraft}
                          onChange={event => setCommentDraft(event.target.value)}
                          placeholder="Add a comment..."
                        />
                        <input
                          className="showup-handoff-input"
                          value={replyDraft}
                          onChange={event => setReplyDraft(event.target.value)}
                          placeholder="Optional reply..."
                        />
                        <button type="button" className="showup-handoff-btn" onClick={addComment}>
                          <Send size={15} strokeWidth={2.2} /> Send
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {activeTab === 'ranks' ? (
                <div className="showup-handoff-grid">
                  {roomRanks.map((member, index) => (
                    <div key={member.id} className="showup-handoff-card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{index + 1}</div>
                      <div className="showup-handoff-avatar" style={{ width: 38, height: 38, margin: 0 }}>{member.initials}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800 }}>{member.name}</div>
                        <div style={{ fontSize: 12, color: '#9a7088' }}>{member.role || 'Not yet'}</div>
                      </div>
                      <div style={{ fontWeight: 800 }}>{member.streak} days</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
