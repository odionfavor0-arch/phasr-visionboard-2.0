import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BookText,
  Flame,
  Image as ImageIcon,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import VisionBoard from './components/VisionBoard'
import Journal from './components/Journal'
import JournalEntries from './components/JournalEntries'
import DailyCheckin from './components/DailyCheckin'
import Analytics from './components/Analytics'
import ShowUp from './components/ShowUp'
import SettingsPanel from './components/SettingsPanel'
import { getLockInSummary, loadLockInState } from './lib/lockIn'

const MOBILE_QUERY = '(max-width: 768px)'
const DESKTOP_OPEN_WIDTH = 260
const DESKTOP_COLLAPSED_WIDTH = 80
const MOBILE_DRAWER_WIDTH = 240

function getDisplayName(user) {
  const raw =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.first_name ||
    user?.email?.split('@')[0] ||
    'User'

  return String(raw)
    .trim()
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitial(name) {
  return String(name || 'U').trim().charAt(0).toUpperCase() || 'U'
}

function NavItem({ item, active, expanded, onClick, mobile }) {
  const Icon = item.icon

  return (
    <button
      type="button"
      onClick={() => onClick(item.id)}
      style={{
        width: '100%',
        border: 'none',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: '#fff',
        borderRadius: 18,
        padding: expanded ? '0.78rem 0.9rem' : '0.72rem 0.3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: expanded ? 'flex-start' : 'center',
        gap: expanded ? '0.8rem' : 0,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: active ? 800 : 700,
        fontSize: expanded ? '0.92rem' : '0.72rem',
        minHeight: mobile ? 50 : 54,
        transition: 'background 0.2s ease, transform 0.2s ease',
        textAlign: 'left',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: active ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      {expanded && <span style={{ minWidth: 0 }}>{item.label}</span>}
    </button>
  )
}

function HamburgerButton({ open, onClick, mobile }) {
  const lineStyle = {
    width: mobile ? 18 : 20,
    height: 2,
    borderRadius: 999,
    background: mobile ? '#211320' : '#fff',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      style={{
        width: mobile ? 32 : 42,
        height: mobile ? 32 : 42,
        borderRadius: mobile ? 0 : 14,
        border: 'none',
        background: 'transparent',
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'grid', gap: 4 }}>
        <span style={{ ...lineStyle, transform: open ? 'translateY(6px) rotate(45deg)' : 'none' }} />
        <span style={{ ...lineStyle, opacity: open ? 0 : 1 }} />
        <span style={{ ...lineStyle, transform: open ? 'translateY(-6px) rotate(-45deg)' : 'none' }} />
      </span>
    </button>
  )
}

export default function AppShell({ user, theme, onThemeChange, onSignOut }) {
  const [view, setView] = useState('board')
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_QUERY).matches
  })
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true
    return !window.matchMedia(MOBILE_QUERY).matches
  })
  const [lockSummary, setLockSummary] = useState(() => getLockInSummary(loadLockInState()))

  const displayName = getDisplayName(user)
  const avatarInitial = getInitial(displayName)

  const navItems = useMemo(() => ([
    { id: 'board', label: 'Vision Board', title: 'Vision Board', icon: ImageIcon },
    { id: 'journal', label: 'Journal', title: 'Journal', icon: BookText },
    { id: 'checkin', label: 'Daily Streaks', title: 'Daily Streaks', icon: Flame },
    { id: 'showup', label: 'Show Up', title: 'Show Up', icon: Users },
    { id: 'analytics', label: 'Statistics', title: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', title: 'Settings', icon: Settings },
  ]), [])

  const currentTitle = navItems.find(item => item.id === view)?.title || 'Vision Board'
  const desktopExpanded = !isMobile && sidebarOpen
  const sidebarWidth = isMobile ? MOBILE_DRAWER_WIDTH : sidebarOpen ? DESKTOP_OPEN_WIDTH : DESKTOP_COLLAPSED_WIDTH

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const mediaQuery = window.matchMedia(MOBILE_QUERY)
    const syncLayout = event => {
      const nextMobile = event.matches
      setIsMobile(nextMobile)
      setSidebarOpen(!nextMobile)
    }

    syncLayout(mediaQuery)

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncLayout)
      return () => mediaQuery.removeEventListener('change', syncLayout)
    }

    mediaQuery.addListener(syncLayout)
    return () => mediaQuery.removeListener(syncLayout)
  }, [])

  useEffect(() => {
    const syncSummary = () => setLockSummary(getLockInSummary(loadLockInState()))
    window.addEventListener('storage', syncSummary)
    window.addEventListener('phasr-lockin-update', syncSummary)
    return () => {
      window.removeEventListener('storage', syncSummary)
      window.removeEventListener('phasr-lockin-update', syncSummary)
    }
  }, [])

  useEffect(() => {
    if (!isMobile || !sidebarOpen) return undefined

    const handleEscape = event => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isMobile, sidebarOpen])

  function handleToggleSidebar() {
    setSidebarOpen(current => !current)
  }

  function handleSelectView(nextView) {
    setView(nextView)
    if (isMobile) setSidebarOpen(false)
  }

  let content = (
    <VisionBoard
      user={user}
      lockInSummary={lockSummary}
      onOpenDailyStreak={() => setView('checkin')}
    />
  )

  if (view === 'journal') {
    content = <Journal user={user} onOpenEntries={() => setView('entries')} />
  } else if (view === 'entries') {
    content = <JournalEntries onBack={() => setView('journal')} />
  } else if (view === 'checkin') {
    content = <DailyCheckin onOpenBoard={() => setView('board')} />
  } else if (view === 'showup') {
    content = <ShowUp user={user} />
  } else if (view === 'analytics') {
    content = <Analytics />
  } else if (view === 'settings') {
    content = (
      <SettingsPanel
        user={user}
        theme={theme}
        onThemeChange={onThemeChange}
        onSignOut={onSignOut}
      />
    )
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--app-bg)',
        display: 'flex',
        width: '100%',
      }}
    >
      {isMobile && sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar overlay"
          style={{
            position: 'fixed',
            inset: 0,
            border: 'none',
            background: 'rgba(8, 6, 12, 0.56)',
            zIndex: 140,
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        style={{
          position: isMobile ? 'fixed' : 'sticky',
          top: 0,
          left: 0,
          height: '100vh',
          width: sidebarWidth,
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
          transition: 'width 0.22s ease, transform 0.22s ease',
          background: '#0c0913',
          color: '#fff',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          zIndex: isMobile ? 160 : 40,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            minHeight: 72,
            padding: desktopExpanded || isMobile ? '1rem 1rem 0.85rem' : '1rem 0.8rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: desktopExpanded || isMobile ? 'space-between' : 'center',
            gap: 10,
          }}
        >
          {isMobile ? (
            <HamburgerButton mobile={false} open={sidebarOpen} onClick={handleToggleSidebar} />
          ) : (
            <>
              {sidebarOpen && (
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: '1.18rem',
                    color: '#ffd9e7',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Phasr
                </span>
              )}
              <HamburgerButton mobile={false} open={sidebarOpen} onClick={handleToggleSidebar} />
            </>
          )}
        </div>

        <div style={{ padding: desktopExpanded || isMobile ? '0 0.85rem' : '0 0.45rem', display: 'grid', gap: 8 }}>
          {navItems.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={view === item.id}
              expanded={isMobile || desktopExpanded}
              mobile={isMobile}
              onClick={handleSelectView}
            />
          ))}
        </div>

        <div style={{ marginTop: 'auto', padding: desktopExpanded || isMobile ? '0.85rem' : '0.45rem', display: 'grid', gap: 8 }}>
          {(isMobile || desktopExpanded) && (
            <div
              style={{
                borderRadius: 18,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '0.9rem',
                display: 'grid',
                gap: 10,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)' }}>{user?.email || 'Signed in'}</p>
                <p style={{ margin: '0.25rem 0 0', fontWeight: 800, color: '#fff' }}>{displayName}</p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f472b6' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#38bdf8' }} />
              </div>
              <button
                type="button"
                onClick={onSignOut}
                style={{
                  minHeight: 42,
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'transparent',
                  color: '#fff',
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          )}

          {!isMobile && !desktopExpanded && (
            <button
              type="button"
              onClick={onSignOut}
              aria-label="Sign out"
              style={{
                width: '100%',
                minHeight: 48,
                borderRadius: 16,
                border: 'none',
                background: 'rgba(255,255,255,0.06)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
              }}
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          marginLeft: isMobile ? 0 : 0,
          width: '100%',
        }}
      >
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 30,
            minHeight: isMobile ? 52 : 72,
            background: 'rgba(255, 248, 251, 0.94)',
            backdropFilter: 'blur(18px)',
            borderBottom: '1px solid var(--app-border)',
            padding: isMobile ? '0.55rem 1rem 0.55rem 0.75rem' : '0.95rem 1.25rem',
            display: 'grid',
            gridTemplateColumns: isMobile ? '36px 1fr auto' : '1fr auto',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {isMobile ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <HamburgerButton mobile open={sidebarOpen} onClick={handleToggleSidebar} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--app-accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentTitle}
              </span>
            </div>
          )}

          <div
            style={{
              textAlign: isMobile ? 'center' : 'left',
              justifySelf: isMobile ? 'center' : 'start',
              minWidth: 0,
            }}
          >
            {isMobile && (
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--app-accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentTitle}
              </span>
            )}
          </div>

          <div
            className="topbar-user-pill"
            style={{
              justifySelf: 'end',
              display: 'inline-flex',
              alignItems: 'center',
              gap: isMobile ? 0 : 10,
              padding: isMobile ? '0.3rem' : '0.4rem 0.7rem 0.4rem 0.4rem',
              borderRadius: isMobile ? '999px' : '999px',
              border: '1px solid var(--app-border)',
              background: '#fff',
              minWidth: 0,
              maxWidth: isMobile ? 44 : 'min(100%, 280px)',
              overflow: 'hidden',
            }}
          >
            {!isMobile && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginRight: 2,
                  padding: '0.26rem 0.55rem',
                  borderRadius: 999,
                  background: '#fff4f8',
                  color: 'var(--app-accent)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                <Sparkles size={12} />
                {lockSummary.currentStreak}
              </span>
            )}
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {avatarInitial}
            </span>
            <span
              className="user-email-text"
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontWeight: 700,
                color: 'var(--app-text)',
              }}
            >
              {displayName}
            </span>
          </div>
        </header>

        <main style={{ minWidth: 0, width: '100%' }}>
          {content}
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .user-email-text { display: none; }
          .topbar-user-pill { padding: 0.3rem; border-radius: 50%; }
        }
      `}</style>
    </div>
  )
}
