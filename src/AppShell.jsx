// src/pages/AppShell.jsx
// ─────────────────────────────────────────────
// The inner app — shown after login.
// Contains: Vision Board | Journal | Daily Check-in
// ─────────────────────────────────────────────

import { useState } from 'react'
import VisionBoard  from '../components/VisionBoard'
import Journal      from '../components/Journal'
import DailyCheckin from '../components/DailyCheckin'

/* ── Theme dot selector (reusable) ── */
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

export default function AppShell({ user, theme, onThemeChange, streak, onSignOut }) {
  const [view, setView] = useState('board') // 'board' | 'journal' | 'checkin'

  const email   = user?.email || ''
  const initial = (email[0] || 'U').toUpperCase()

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg)', fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── Top Bar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(5,5,10,0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0.65rem 1.25rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      }}>
        {/* Logo + Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #f472a8, #ffd6e7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            flexShrink: 0, cursor: 'pointer',
          }}>Phasr</span>

          {/* Nav tabs */}
          <nav style={{ display: 'flex', gap: '0.2rem' }}>
            {[
              { id: 'board',    label: 'Vision Board' },
              { id: 'journal',  label: 'Journal'      },
              { id: 'checkin',  label: 'Daily Check-in' },
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

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>

          {/* Streak counter */}
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.3rem 0.75rem', borderRadius: 99,
              background: 'rgba(244,197,66,0.1)', border: '1px solid rgba(244,197,66,0.25)',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--streak-color)',
            }}>
              <span style={{ fontSize: '0.9rem' }}>⚡</span>
              {streak} day{streak !== 1 ? 's' : ''}
            </div>
          )}

          {/* Theme switcher */}
          <ThemeSwitcher theme={theme} onThemeChange={onThemeChange} />

          {/* User */}
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
            }}>{email}</span>
          </div>

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
        </div>
      </header>

      {/* ── Views ── */}
      {view === 'board'   && <VisionBoard  user={user} />}
      {view === 'journal' && <Journal      user={user} />}
      {view === 'checkin' && <DailyCheckin user={user} streak={streak} />}
    </div>
  )
}
