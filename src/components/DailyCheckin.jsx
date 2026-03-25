import { useMemo, useState } from 'react'
import {
  broadcastLockInUpdate,
  getLockInSummary,
  getTodayTask,
  loadBoardData,
  loadLockInState,
  saveLockInState,
  UNLOCK_TIERS,
  upsertTodayLog,
} from '../lib/lockIn'

function MetricCard({ label, value, helper, accent }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--app-border)',
      borderRadius: 16,
      padding: '1rem',
      boxShadow: '0 4px 24px rgba(233,100,136,0.08)',
    }}>
      <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: accent, marginBottom: '0.35rem' }}>
        {label}
      </p>
      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--app-text)', marginBottom: '0.25rem' }}>{value}</p>
      <p style={{ fontSize: '0.76rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>{helper}</p>
    </div>
  )
}

export default function DailyCheckin({ onLockInChange }) {
  const [boardData] = useState(() => loadBoardData())
  const [lockInState, setLockInState] = useState(() => loadLockInState())
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  const todayTask = useMemo(() => getTodayTask(boardData), [boardData])
  const summary = useMemo(() => getLockInSummary(lockInState), [lockInState])


  function persist(next) {
    setLockInState(next)
    saveLockInState(next)
    broadcastLockInUpdate()
    onLockInChange?.()
  }

  function handleLockIn() {
    const next = upsertTodayLog(lockInState, {
      task: todayTask.task,
      note,
    })
    persist(next)
    setSaved(true)
    setTimeout(() => setSaved(false), 2400)
  }

  function toggleCommitmentMode() {
    if (!summary.unlockedCommitmentMode) return
    persist({
      ...lockInState,
      commitmentMode: !lockInState.commitmentMode,
    })
  }

  function updateCustomTarget(value) {
    persist({
      ...lockInState,
      customTarget: value,
    })
  }

  const hiddenVisibility = lockInState.commitmentMode && summary.mode === 'broken'

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem,4vw,2.5rem)', fontWeight: 700, color: 'var(--app-text)', marginBottom: '0.35rem' }}>
            Lock In
          </h1>
          <p style={{ color: 'var(--app-muted)', fontSize: '0.84rem', lineHeight: 1.7, maxWidth: 700, margin: '0 auto' }}>
            Daily check-ins were passive. Lock In is not. Protect the streak, unlock sharper tools, and feel the cost when you disappear.
          </p>
        </div>

        <div style={{
          background: summary.mode === 'broken'
            ? 'linear-gradient(135deg,#2a1013,#4a151a)'
            : 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
          borderRadius: 20,
          padding: '1.2rem 1.4rem',
          color: '#fff',
          boxShadow: summary.mode === 'broken'
            ? '0 18px 44px rgba(80,18,26,0.32)'
            : '0 18px 44px rgba(233,100,136,0.24)',
          marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 620 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.72, marginBottom: '0.35rem' }}>
                Today's Task · {todayTask.phaseName}
              </p>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '0.45rem' }}>
                {lockInState.customTarget || todayTask.task}
              </p>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.6 }}>
                Locked In Mode: {summary.mode === 'broken' ? 'Broken' : 'Active'}.
                {summary.warning ? ' You missed one day. Miss one more and the streak drops.' : ' Log today to keep pressure on.'}
              </p>
            </div>
            <div style={{ minWidth: 220 }}>
              <div style={{
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '0.9rem 1rem',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.75, marginBottom: '0.2rem' }}>
                  Streak Rule
                </p>
                <p style={{ fontSize: '0.86rem', lineHeight: 1.65 }}>
                  1 day missed = warning
                  <br />
                  2 days missed = streak drops hard
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="What exactly did you complete?"
              rows={2}
              style={{
                flex: 1,
                minWidth: 260,
                borderRadius: 14,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '0.8rem 0.95rem',
                outline: 'none',
                resize: 'vertical',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              onClick={handleLockIn}
              style={{
                minWidth: 180,
                border: 'none',
                borderRadius: 14,
                padding: '0.95rem 1.1rem',
                background: '#fff',
                color: summary.mode === 'broken' ? '#571d26' : 'var(--app-accent)',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 14px 28px rgba(0,0,0,0.12)',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {saved ? 'Locked In' : summary.hasLoggedToday ? 'Update today' : 'Lock In today'}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.9rem', marginBottom: '1.25rem' }}>
          <MetricCard label="Current streak" value={`${summary.currentStreak} day${summary.currentStreak !== 1 ? 's' : ''}`} helper="Consistency keeps rewards alive." accent="var(--app-accent)" />
          <MetricCard label="Rank" value={summary.rank} helper="Identity grows as your streak survives." accent="#7a58b0" />
          <MetricCard label="Points" value={summary.points} helper={lockInState.commitmentMode ? 'Commitment mode can take points back.' : 'Points stay safer before commitment mode unlocks.'} accent="#3d9158" />
          <MetricCard label="Sage level" value={summary.sageLevel} helper={summary.sageLevel === 'Sage' ? 'Short, direct, action-first.' : summary.sageLevel === 'Sage Boost' ? 'More specific, lower friction guidance.' : 'Pattern-aware, sharper pressure.'} accent="#d4773a" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--app-border)', padding: '1rem', boxShadow: '0 4px 24px rgba(233,100,136,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.9rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.2rem' }}>
                  Commitment Mode
                </p>
                <p style={{ fontSize: '0.84rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>
                  Set stricter rules once you earn control. Miss the streak and the system takes something back.
                </p>
              </div>
              <button
                onClick={toggleCommitmentMode}
                disabled={!summary.unlockedCommitmentMode}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '0.72rem 1rem',
                  background: summary.unlockedCommitmentMode
                    ? (lockInState.commitmentMode ? 'linear-gradient(135deg,#111827,#1f2937)' : 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))')
                    : '#ead8df',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: summary.unlockedCommitmentMode ? 'pointer' : 'not-allowed',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {summary.unlockedCommitmentMode ? (lockInState.commitmentMode ? 'Commitment mode on' : 'Enable commitment mode') : 'Unlock at 3-day streak'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
              <div style={{ borderRadius: 14, padding: '0.85rem', background: 'var(--app-bg2)', border: '1px solid var(--app-border)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--app-accent)', marginBottom: '0.35rem' }}>
                  Custom daily target
                </p>
                <input
                  value={lockInState.customTarget}
                  onChange={e => updateCustomTarget(e.target.value)}
                  placeholder="Set a stricter personal requirement"
                  disabled={!summary.unlockedCommitmentMode}
                  style={{
                    width: '100%',
                    borderRadius: 10,
                    border: '1px solid var(--app-border)',
                    padding: '0.7rem 0.8rem',
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                    background: summary.unlockedCommitmentMode ? '#fff' : '#f4ebef',
                    color: 'var(--app-text)',
                  }}
                />
              </div>

              <div style={{ borderRadius: 14, padding: '0.85rem', background: hiddenVisibility ? '#2a1519' : '#f4fbf5', border: `1px solid ${hiddenVisibility ? '#5a2b34' : '#b9dfc0'}` }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: hiddenVisibility ? '#ff9fae' : '#3a7d4d', marginBottom: '0.35rem' }}>
                  Consequence
                </p>
                <p style={{ fontSize: '0.82rem', lineHeight: 1.65, color: hiddenVisibility ? '#ffe1e6' : '#466253' }}>
                  {hiddenVisibility
                    ? 'Visibility penalty active. Your deeper analytics stay dim until you rebuild the streak.'
                    : 'Miss after two days and you lose 15 points, risk a rank drop, and hide deeper visibility until recovery.'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--app-border)', padding: '1rem', boxShadow: '0 4px 24px rgba(233,100,136,0.08)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7a58b0', marginBottom: '0.2rem' }}>
              Pressure & reward
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--app-muted)', lineHeight: 1.7, marginBottom: '0.9rem' }}>
              Consistency should unlock power, not random gifts. Each tier opens sharper control, insight, visibility, or identity.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ borderRadius: 12, padding: '0.8rem', background: 'var(--app-bg2)', border: '1px solid var(--app-border)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--app-text)', marginBottom: '0.2rem' }}>Status glow</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>
                  {summary.mode === 'broken' ? 'Glow cut. System looks colder until you recover.' : 'Glow active. The app should feel sharper when your streak is alive.'}
                </p>
              </div>
              <div style={{ borderRadius: 12, padding: '0.8rem', background: 'var(--app-bg2)', border: '1px solid var(--app-border)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--app-text)', marginBottom: '0.2rem' }}>Last log</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--app-muted)', lineHeight: 1.6 }}>
                  {summary.latestLogDate ? `${summary.latestLogDate}${summary.lastLog?.note ? ` · ${summary.lastLog.note}` : ''}` : 'No lock in logged yet.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--app-border)', padding: '1rem', boxShadow: '0 4px 24px rgba(233,100,136,0.08)' }}>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)', marginBottom: '0.2rem' }}>
              4-tier unlock system
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--app-muted)', lineHeight: 1.7 }}>
              Control first, then intelligence, then visibility, then status. Clean, predictable, and tied directly to effort.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.8rem' }}>
            {UNLOCK_TIERS.map((tier, index) => {
              const unlocked = summary.currentStreak >= tier.minStreak
              const lockedByPenalty = hiddenVisibility && index >= 2

              return (
                <div
                  key={tier.id}
                  style={{
                    borderRadius: 16,
                    padding: '0.95rem',
                    border: `1px solid ${unlocked ? 'rgba(95,205,140,0.35)' : 'var(--app-border)'}`,
                    background: unlocked ? 'linear-gradient(135deg,#f4fbf5,#fff)' : 'linear-gradient(135deg,#fff,#fff8fa)',
                    opacity: lockedByPenalty ? 0.38 : 1,
                    filter: lockedByPenalty ? 'blur(2px)' : 'none',
                  }}
                >
                  <p style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: unlocked ? '#3a7d4d' : 'var(--app-muted)', marginBottom: '0.25rem' }}>
                    Tier {tier.id}
                  </p>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--app-text)', marginBottom: '0.3rem' }}>
                    {tier.name}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--app-muted)', lineHeight: 1.65, marginBottom: '0.55rem' }}>
                    {tier.reward}
                  </p>
                  <p style={{ fontSize: '0.74rem', fontWeight: 700, color: unlocked ? '#3a7d4d' : 'var(--app-accent)' }}>
                    {unlocked ? 'Unlocked' : `Unlock at ${tier.minStreak} days`}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        <style>{`
          @media (max-width: 960px) {
            [style*="repeat(4, minmax(0, 1fr))"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            [style*="grid-template-columns: 1.2fr 1fr"] { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 640px) {
            [style*="repeat(4, minmax(0, 1fr))"] { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </div>
  )
}


