import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  BookText,
  Flame,
  Image as ImageIcon,
  Settings,
  Sparkles,
  Users,
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
const DESKTOP_RAIL_WIDTH = 88
const MOBILE_RAIL_WIDTH = 112
const MOBILE_HEADER_HEIGHT = 52

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
        background: active ? 'rgba(240, 96, 144, 0.12)' : 'transparent',
        color: 'var(--app-text)',
        borderRadius: 18,
        padding: expanded ? '0.78rem 0.45rem 0.72rem' : '0.72rem 0.3rem',
        display: 'grid',
        justifyItems: 'center',
        alignContent: 'center',
        gap: expanded ? 7 : 0,
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: active ? 800 : 700,
        fontSize: expanded ? '0.76rem' : '0.72rem',
        minHeight: expanded ? (mobile ? 72 : 76) : (mobile ? 50 : 54),
        transition: 'background 0.2s ease, transform 0.2s ease',
        textAlign: 'center',
      }}
    >
        <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: active ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'var(--app-bg2)',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
          color: active ? '#fff' : 'var(--app-accent)',
        }}
      >
        <Icon size={18} strokeWidth={2.2} />
      </span>
      {expanded && (
        <span
          style={{
            minWidth: 0,
            maxWidth: '100%',
            lineHeight: 1.15,
            whiteSpace: 'normal',
          }}
        >
          {item.label}
        </span>
      )}
    </button>
  )
}

function HamburgerButton({ open, onClick, mobile }) {
  const lineStyle = {
    width: mobile ? 18 : 20,
    height: 2,
    borderRadius: 999,
    background: mobile ? 'var(--app-text)' : 'var(--app-accent)',
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
      style={{
        width: mobile ? 28 : 42,
        height: mobile ? 28 : 24,
        borderRadius: mobile ? 0 : 14,
        border: 'none',
        background: 'transparent',
        display: 'grid',
        placeItems: mobile ? 'center' : 'end center',
        cursor: 'pointer',
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span style={{ display: 'grid', gap: 4 }}>
        <span style={lineStyle} />
        <span style={lineStyle} />
        <span style={lineStyle} />
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
  const firstName = displayName.split(' ')[0] || displayName

  const navItems = useMemo(() => ([
    { id: 'board', label: 'Vision Board', title: 'Vision Board', icon: ImageIcon },
    { id: 'journal', label: 'Journal', title: 'Journal', icon: BookText },
    { id: 'checkin', label: 'Daily Streaks', title: 'Daily Streaks', icon: Flame },
    { id: 'showup', label: 'Show Up', title: 'Show Up', icon: Users },
    { id: 'analytics', label: 'Statistics', title: 'Statistics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', title: 'Settings', icon: Settings },
  ]), [])
  const primaryNavItems = navItems.filter(item => item.id !== 'settings')
  const settingsNavItem = navItems.find(item => item.id === 'settings')

  const currentTitle = navItems.find(item => item.id === view)?.title || 'Vision Board'
  const mobileTitle = view === 'board'
    ? 'My Vision Board'
    : view === 'journal'
      ? `${firstName}'s Journal`
      : currentTitle
  const sidebarWidth = isMobile ? MOBILE_RAIL_WIDTH : DESKTOP_RAIL_WIDTH

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

  function handleToggleSidebar() {
    setSidebarOpen(current => !current)
  }

  function handleSelectView(nextView) {
    setView(nextView)
    if (isMobile) {
      setSidebarOpen(false)
    }
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
        height: '100vh',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {isMobile && sidebarOpen && (
        <button
          type="button"
          aria-label="Close mobile menu"
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            border: 'none',
            background: 'rgba(255, 248, 251, 0.58)',
            backdropFilter: 'blur(5px)',
            zIndex: 45,
            padding: 0,
            cursor: 'pointer',
          }}
        />
      )}

      <aside
        style={{
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          bottom: 0,
          width: sidebarWidth,
          height: '100vh',
          transform: isMobile ? (sidebarOpen ? 'translateX(0)' : `translateX(-${MOBILE_RAIL_WIDTH + 12}px)`) : 'none',
          transition: 'transform 0.22s ease',
          background: 'rgba(255, 248, 251, 0.98)',
          color: 'var(--app-text)',
          borderRight: '1px solid #f2c4d0',
          borderTop: isMobile ? '1px solid var(--app-border)' : 'none',
          zIndex: isMobile ? 55 : 35,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          overflow: 'hidden',
          pointerEvents: isMobile && !sidebarOpen ? 'none' : 'auto',
          boxShadow: isMobile && sidebarOpen ? '0 10px 24px rgba(237, 113, 155, 0.14)' : 'none',
        }}
      >
        <div
          style={{
            minHeight: isMobile ? MOBILE_HEADER_HEIGHT : 56,
            padding: isMobile ? '0 0.75rem' : '0',
            display: isMobile ? 'flex' : 'grid',
            alignItems: 'center',
            justifyContent: isMobile ? 'space-between' : 'center',
            justifyItems: 'center',
            alignContent: 'center',
            gap: 0,
            borderBottom: '1px solid #f2c4d0',
          }}
        >
          {isMobile ? (
            <>
              <span
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: 'var(--app-accent)',
                }}
              >
                Phasr
              </span>
              <HamburgerButton mobile open={sidebarOpen} onClick={handleToggleSidebar} />
            </>
          ) : null}
          {!isMobile && <HamburgerButton mobile={false} open={sidebarOpen} onClick={handleToggleSidebar} />}
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem',
            padding: isMobile ? '0.75rem 0.5rem 1rem' : '0.5rem',
          }}
        >
          {primaryNavItems.map(item => (
            <NavItem
              key={item.id}
              item={item}
              active={view === item.id}
              expanded={sidebarOpen}
              mobile={isMobile}
              onClick={handleSelectView}
            />
          ))}
          <div style={{ flex: 1 }} />
          {settingsNavItem && (
            <NavItem
              item={settingsNavItem}
              active={view === settingsNavItem.id}
              expanded={sidebarOpen}
              mobile={isMobile}
              onClick={handleSelectView}
            />
          )}
        </div>
      </aside>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            position: isMobile ? 'sticky' : 'relative',
            top: isMobile ? 0 : 'auto',
            zIndex: isMobile ? 40 : 'auto',
            height: isMobile ? 52 : 56,
            minHeight: isMobile ? 52 : 56,
            maxHeight: isMobile ? 52 : 56,
            background: 'rgba(255, 248, 251, 0.94)',
            backdropFilter: 'blur(18px)',
            borderBottom: isMobile ? '1px solid var(--app-border)' : '1px solid #f2c4d0',
            padding: isMobile ? '0 1rem' : '0 1.25rem',
            display: isMobile ? 'grid' : 'flex',
            gridTemplateColumns: isMobile ? '36px 1fr auto' : 'none',
            alignItems: 'center',
            justifyContent: isMobile ? 'normal' : 'space-between',
            gap: 12,
            overflow: 'hidden',
          }}
        >
          {isMobile ? (
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              {!sidebarOpen && <HamburgerButton mobile open={sidebarOpen} onClick={handleToggleSidebar} />}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: '100%', alignSelf: 'center', flex: 1 }}>
              <span
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'var(--app-accent)',
                  whiteSpace: 'nowrap',
                  lineHeight: 1,
                  alignSelf: 'center',
                  margin: 0,
                  padding: 0,
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
              alignSelf: 'center',
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
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'block',
                }}
              >
                {mobileTitle}
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
              alignSelf: 'center',
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

        <main style={{ minWidth: 0, width: '100%', flex: 1, overflowY: 'auto' }}>
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
