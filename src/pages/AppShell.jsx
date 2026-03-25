import { useEffect, useState } from 'react'
import VisionBoard from '../components/VisionBoard'
import Journal from '../components/Journal'
import DailyCheckin from '../components/DailyCheckin'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'

function ThemeSwitcher({ theme, onThemeChange }) {
  return (
    <div className="theme-switcher" title="Change theme">
      {['neutral', 'rose', 'slate'].map(t => (
        <div
          key={t}
          className={`theme-dot ${theme === t ? 'active' : ''}`}
          data-t={t}
          onClick={() => onThemeChange(t)}
          title={t.charAt(0).toUpperCase() + t.slice(1)}
        />
      ))}
    </div>
  )
}

export default function AppShell({ user, theme, onThemeChange, onSignOut }) {
  const [view, setView] = useState('board')
  const [lockInSummary, setLockInSummary] = useState(() => getLockInSummary(loadLockInState()))

  const email = user?.email || ''
  const initial = (email[0] || 'P').toUpperCase()

  function refreshLockIn() {
    setLockInSummary(getLockInSummary(loadLockInState()))
  }

  useEffect(() => {
    const handleUpdate = () => refreshLockIn()
    window.addEventListener('phasr-lock-in-updated', handleUpdate)
    return () => window.removeEventListener('phasr-lock-in-updated', handleUpdate)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif" }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.65rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #f472a8, #ffd6e7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            flexShrink: 0, cursor: 'pointer',
          }}>Phasr</span>

          <nav style={{ display: 'flex', gap: '0.2rem' }}>
            {[
              { id: 'board', label: 'Vision Board' },
              { id: 'journal', label: 'Journal' },
              { id: 'checkin', label: 'Lock In' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                style={{
                  padding: '0.38rem 0.85rem', borderRadius: 8, border: 'none',
                  background: view === tab.id ? 'rgba(232,64,122,0.12)' : 'transparent',
                  color: view === tab.id ? 'var(--accent2)' : 'var(--muted)',
                  fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {lockInSummary.currentStreak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: 99,
              background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--streak-color)',
            }}>
              <span style={{ fontSize: '0.9rem' }}>?</span>
              {lockInSummary.currentStreak} day{lockInSummary.currentStreak !== 1 ? 's' : ''}
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            padding: '0.3rem 0.75rem', borderRadius: 99,
            border: `1px solid ${lockInSummary.mode === 'broken' ? 'rgba(255,120,120,0.25)' : 'rgba(95,205,140,0.25)'}`,
            background: lockInSummary.mode === 'broken' ? 'rgba(255,120,120,0.08)' : 'rgba(95,205,140,0.08)',
            color: lockInSummary.mode === 'broken' ? '#ff8b8b' : '#7df0a6',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            Locked In Mode: {lockInSummary.mode === 'broken' ? 'Broken' : 'Active'}
          </div>

          {lockInSummary.warning && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: 99,
              border: '1px solid rgba(244,197,66,0.25)',
              background: 'rgba(244,197,66,0.08)',
              color: 'var(--streak-color)',
              fontSize: '0.75rem', fontWeight: 700,
            }}>
              1 miss warning
            </div>
          )}

          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.3rem 0.75rem', borderRadius: 99,
            border: '1px solid var(--border)', background: 'rgba(232,64,122,0.06)',
            fontSize: '0.75rem', color: 'var(--muted)',
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.68rem', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initial}</div>
            <span style={{
              maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{email || 'Local mode'}</span>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              style={{
                padding: '0.32rem 0.85rem', borderRadius: 99,
                border: '1px solid var(--border)', background: 'transparent',
                color: 'var(--muted)', fontSize: '0.74rem', cursor: 'pointer',
                transition: 'all 0.2s', fontFamily: "'DM Sans', sans-serif",
              }}
              onMouseEnter={e => { e.target.style.borderColor = 'var(--accent)'; e.target.style.color = 'var(--accent)' }}
              onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)' }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      {view === 'board' && <VisionBoard user={user} lockInSummary={lockInSummary} />}
      {view === 'journal' && <Journal user={user} />}
      {view === 'checkin' && <DailyCheckin user={user} onLockInChange={refreshLockIn} />}
    </div>
  )
}

