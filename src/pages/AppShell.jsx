import { useEffect, useMemo, useRef, useState } from 'react'
import VisionBoard from '../components/VisionBoard'
import Journal from '../components/Journal'
import JournalEntries from '../components/JournalEntries'
import DailyCheckin from '../components/DailyCheckin'
import Analytics from '../components/Analytics'
import ShowUp from '../components/ShowUp'
import SageCoach, { QuickSageBubble } from '../components/SageCoach'
import SettingsPanel from '../components/SettingsPanel'
import { getLockInSummary, loadLockInState } from '../lib/lockIn'
import { getDueCalendarNotifications, markNotificationSent } from '../lib/calendarNotifications'

function RailIcon({ type, active }) {
  const color = active ? '#ffffff' : 'rgba(255,255,255,0.78)'
  const stroke = active ? '#ffffff' : 'rgba(255,255,255,0.78)'
  const bg = active ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.06)'

  return (
    <span style={{ width: 34, height: 34, borderRadius: 10, display: 'grid', placeItems: 'center', background: bg, flexShrink: 0 }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        {type === 'board' && (
          <>
            <rect x="2.5" y="3" width="15" height="12.5" rx="2.5" stroke={stroke} strokeWidth="1.6" />
            <path d="M5.2 12.7 8.2 9.7l2.3 2.1 2.8-3.2 1.5 1.8" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="7.1" cy="7" r="1.1" fill={color} />
          </>
        )}
        {type === 'journal' && (
          <>
            <path d="M5 3.5h7.8c1.7 0 2.7 1 2.7 2.7V16.5H7.2C6 16.5 5 15.5 5 14.3V3.5Z" stroke={stroke} strokeWidth="1.6" strokeLinejoin="round" />
            <path d="M7.5 7h5.5M7.5 10h5.5M7.5 13h3.6" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
        {type === 'streaks' && <path d="M10 2.8c.9 2.4-.8 3.7-.8 5.6 0 1.1.6 1.8 1.4 2.4.2-1.4.9-2.4 2.1-3.3 1.4 1.4 2.4 3.2 2.4 5.2 0 2.8-2.2 4.8-5.1 4.8S4.9 15.5 4.9 12.8c0-2.1 1.1-4 3-5.8.2 1.3.8 2.1 1.5 2.7.9-1.1 1.2-2.4.6-4.7Z" fill={color} />}
        {type === 'analytics' && (
          <>
            <path d="M3 16.5h14" stroke={stroke} strokeWidth="1.6" strokeLinecap="round" />
            <rect x="4" y="9.5" width="2.5" height="5" rx="1" fill={color} />
            <rect x="8.7" y="6.5" width="2.5" height="8" rx="1" fill={color} />
            <rect x="13.4" y="4" width="2.5" height="10.5" rx="1" fill={color} />
          </>
        )}
        {type === 'showup' && (
          <>
            <circle cx="7" cy="7.2" r="2.2" stroke={stroke} strokeWidth="1.4" />
            <circle cx="13.2" cy="8" r="1.8" stroke={stroke} strokeWidth="1.4" />
            <path d="M3.5 15.6c.8-2.3 2.4-3.4 4.8-3.4s4 1.1 4.8 3.4" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
            <path d="M11.7 15.1c.4-1.6 1.5-2.4 3.1-2.4 1 0 1.9.3 2.7 1" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
          </>
        )}
        {type === 'sage' && (
          <>
            <ellipse cx="10" cy="8.5" rx="3.5" ry="4" stroke={stroke} strokeWidth="1.5" />
            <circle cx="8.8" cy="7.8" r=".6" fill={color} />
            <circle cx="11.2" cy="7.8" r=".6" fill={color} />
            <path d="M8.8 10.2q1.2.7 2.4 0" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
            <path d="M5.2 17c1.1-2.2 2.7-3.2 4.8-3.2S13.7 14.8 14.8 17" stroke={stroke} strokeWidth="1.4" strokeLinecap="round" />
          </>
        )}
        {type === 'settings' && (
          <>
            <circle cx="10" cy="10" r="2.3" stroke={stroke} strokeWidth="1.4" />
            <path d="M10 3.4v1.6M10 15v1.6M15 10h1.6M3.4 10H5M13.9 6.1l1.1-1.1M5 15l1.1-1.1M13.9 13.9l1.1 1.1M5 5l1.1 1.1" stroke={stroke} strokeWidth="1.3" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  )
}

function getDisplayName(user) {
  const raw = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || user?.email?.split('@')[0] || 'Phasr user'
  const clean = String(raw).trim()
  if (!clean) return 'Phasr user'
  return clean
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function AppShell({ user, theme, onThemeChange, onSignOut }) {
  const [view, setView] = useState('board')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [boardEditing, setBoardEditing] = useState(false)
  const [lockInSummary, setLockInSummary] = useState(() => getLockInSummary(loadLockInState()))
  const [calendarBanner, setCalendarBanner] = useState(null)
  const [isMobileView, setIsMobileView] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false)
  const contentRef = useRef(null)
  const bannerTouchX = useRef(null)

  const displayName = useMemo(() => getDisplayName(user), [user])
  const initial = displayName.charAt(0).toUpperCase()
  const closedRailWidth = isMobileView ? 58 : 110
  const sidebarWidth = isMobileView ? 94 : 260

  function refreshLockIn() {
    setLockInSummary(getLockInSummary(loadLockInState()))
  }

  useEffect(() => {
    const handleUpdate = () => refreshLockIn()
    window.addEventListener('phasr-lock-in-updated', handleUpdate)
    return () => window.removeEventListener('phasr-lock-in-updated', handleUpdate)
  }, [])

  useEffect(() => {
    const showDueNotifications = () => {
      const due = getDueCalendarNotifications(new Date())
      due.forEach(item => {
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(item.title, { body: item.message })
          } catch {
            // ignore browser notification failures
          }
        }
        setCalendarBanner({ title: item.title, message: item.message })
        markNotificationSent(item.eventId, item.stage)
      })
    }

    showDueNotifications()
    const timer = window.setInterval(showDueNotifications, 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleCalendarFeedback = event => {
      if (event.detail?.message) {
        setCalendarBanner({
          title: event.detail.title || 'Calendar',
          message: event.detail.message,
        })
      }
    }

    window.addEventListener('phasr-calendar-feedback', handleCalendarFeedback)
    return () => window.removeEventListener('phasr-calendar-feedback', handleCalendarFeedback)
  }, [])

  useEffect(() => {
    const handleOpenJournal = () => setView('journal')
    window.addEventListener('phasr-open-journal', handleOpenJournal)
    return () => window.removeEventListener('phasr-open-journal', handleOpenJournal)
  }, [])

  useEffect(() => {
    const handleOpenView = event => {
      const nextView = event.detail?.view
      if (nextView) setView(nextView)
    }
    window.addEventListener('phasr-open-view', handleOpenView)
    return () => window.removeEventListener('phasr-open-view', handleOpenView)
  }, [])

  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [view])

  function handleBannerTouchStart(event) {
    bannerTouchX.current = event.touches?.[0]?.clientX ?? null
  }

  function handleBannerTouchEnd(event) {
    if (bannerTouchX.current == null) return
    const endX = event.changedTouches?.[0]?.clientX ?? bannerTouchX.current
    if (Math.abs(endX - bannerTouchX.current) > 70) {
      setCalendarBanner(null)
    }
    bannerTouchX.current = null
  }

  const tabs = [
    { id: 'board', label: 'Vision Board', icon: 'board' },
    { id: 'journal', label: 'Journal', icon: 'journal' },
    { id: 'checkin', label: 'Daily Streaks', icon: 'streaks' },
    { id: 'showup', label: 'Show Up', icon: 'showup' },
    { id: 'analytics', label: 'Statistics', icon: 'analytics' },
  ]

  useEffect(() => {
    if (view === 'research' || view === 'sage') {
      setView('board')
    }
  }, [view])

  return (
    <div
      style={{
        '--phasr-sidebar-width': `${sidebarOpen ? sidebarWidth : closedRailWidth}px`,
        display: 'flex',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        background: 'var(--app-bg)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <aside
        className="hamburger-menu-shell"
        style={{
          position: 'relative',
          width: `${sidebarOpen ? sidebarWidth : closedRailWidth}px`,
          minWidth: `${sidebarOpen ? sidebarWidth : closedRailWidth}px`,
          flexShrink: 0,
          height: '100vh',
          overflow: 'hidden',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
          zIndex: 500,
        }}
      >
        <div
          className="hamburger-menu"
          style={{
            width: '100%',
            background: 'rgba(5,5,10,0.98)',
            borderRight: '1px solid var(--border)',
            padding: isMobileView ? '12px 6px' : '20px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.9rem',
            height: '100vh',
            minHeight: '100vh',
            overflowX: 'hidden',
            overflowY: 'hidden',
            transition: 'box-shadow 0.12s ease',
            boxShadow: sidebarOpen ? '12px 0 28px rgba(7,7,14,0.12)' : 'none',
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', minHeight: isMobileView ? 38 : 44 }}>
          <button
            onClick={() => setSidebarOpen(open => !open)}
            aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
            style={{ width: isMobileView ? 36 : 44, height: isMobileView ? 36 : 44, borderRadius: isMobileView ? 10 : 12, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center', flexShrink: 0 }}
          >
            <span style={{ display: 'grid', gap: 4 }}>
              <span style={{ display: 'block', width: isMobileView ? 16 : 18, height: 2, borderRadius: 999, background: '#ffffff' }} />
              <span style={{ display: 'block', width: isMobileView ? 16 : 18, height: 2, borderRadius: 999, background: '#ffffff' }} />
              <span style={{ display: 'block', width: isMobileView ? 16 : 18, height: 2, borderRadius: 999, background: '#ffffff' }} />
            </span>
          </button>
          {!isMobileView && sidebarOpen && <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.15rem', color: '#ffffff' }}>Phasr</span>}
        </div>

        <div style={{ display: 'grid', gap: '0.2rem' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className="menu-item"
              onClick={() => setView(tab.id)}
              style={{
                minHeight: isMobileView ? 54 : (sidebarOpen ? 46 : 64),
                width: '100%',
                padding: isMobileView ? '7px 2px' : (sidebarOpen ? '10px 16px' : '8px 4px'),
                borderRadius: 14,
                border: 'none',
                display: 'flex',
                flexDirection: isMobileView ? 'column' : (sidebarOpen ? 'row' : 'column'),
                alignItems: 'center',
                justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: isMobileView ? '0.28rem' : '0.55rem',
                background: view === tab.id ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              <RailIcon type={tab.icon} active={view === tab.id} />
              {(!isMobileView || sidebarOpen) && (
                <span style={isMobileView
                  ? { fontSize: '0.54rem', textAlign: 'center', width: '100%', whiteSpace: 'normal', overflow: 'hidden', lineHeight: 1.05 }
                  : sidebarOpen
                    ? { whiteSpace: 'nowrap', lineHeight: 1.15, textAlign: 'left', fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }
                    : { fontSize: '0.68rem', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '2px', paddingRight: '2px', lineHeight: 1.1 }
                }>
                  {tab.shortLabel || tab.label}
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: '0.3rem' }}>
          <button
            className="menu-item"
            onClick={() => setView('settings')}
            style={{
              minHeight: isMobileView ? 54 : (sidebarOpen ? 46 : 64),
              width: '100%',
              padding: isMobileView ? '7px 2px' : (sidebarOpen ? '10px 16px' : '8px 4px'),
              borderRadius: 14,
              border: 'none',
              display: 'flex',
              flexDirection: isMobileView ? 'column' : (sidebarOpen ? 'row' : 'column'),
              alignItems: 'center',
              justifyContent: sidebarOpen ? 'flex-start' : 'center',
                gap: isMobileView ? '0.28rem' : '0.55rem',
                background: view === 'settings' ? 'color-mix(in srgb, var(--accent) 16%, transparent)' : 'transparent',
                color: '#ffffff',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            <RailIcon type="settings" active={view === 'settings'} />
            {(!isMobileView || sidebarOpen) && (
              <span style={isMobileView
                ? { fontSize: '0.54rem', textAlign: 'center', width: '100%', whiteSpace: 'normal', overflow: 'hidden', lineHeight: 1.05 }
                : sidebarOpen
                  ? { whiteSpace: 'nowrap', lineHeight: 1.15, textAlign: 'left', fontSize: '0.82rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }
                  : { fontSize: '0.68rem', textAlign: 'center', width: '100%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingLeft: '2px', paddingRight: '2px', lineHeight: 1.1 }
              }>
                Settings
              </span>
            )}
          </button>
        </div>
        </div>
      </aside>

      <div ref={contentRef} style={{ position: 'relative', zIndex: 1, width: '100%', height: '100vh', overflowY: 'auto', overflowX: 'hidden', minWidth: 0 }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 80, background: 'color-mix(in srgb, var(--app-bg) 88%, white)', backdropFilter: 'blur(18px)', borderBottom: '1px solid var(--app-border)', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>
              {(tabs.find(tab => tab.id === view)?.label) || (view === 'settings' ? 'Settings' : 'Phasr')}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', padding: '0.38rem 0.8rem', borderRadius: 999, border: '1px solid var(--app-border)', background: '#fff' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '0.78rem' }}>{initial}</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--app-text)' }}>{displayName}</span>
            </div>
          </div>
        </header>

        {calendarBanner && (
          <div style={{ position: 'fixed', right: 20, top: 84, zIndex: 140 }}>
            <div style={{ maxWidth: 320 }}>
              <div
                onTouchStart={handleBannerTouchStart}
                onTouchEnd={handleBannerTouchEnd}
                style={{ position: 'relative', background: '#fff1f6', border: '1px solid #f2c8d6', color: 'var(--app-text)', borderRadius: 16, padding: '0.85rem 2.4rem 0.85rem 0.9rem', display: 'flex', gap: '0.45rem', alignItems: 'flex-start', boxShadow: '0 14px 32px rgba(185,87,122,0.16)' }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: '0.66rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>{calendarBanner.title || 'Reminder'}</p>
                  <p style={{ margin: '0.18rem 0 0', fontSize: '0.82rem', lineHeight: 1.5 }}>{calendarBanner.message}</p>
                </div>
                <button onClick={() => setCalendarBanner(null)} aria-label="Close reminder" style={{ position: 'absolute', top: 10, right: 10, width: 24, height: 24, borderRadius: '50%', border: '1px solid #efc3d1', background: '#fff', color: '#b85a82', cursor: 'pointer', padding: 0, lineHeight: 1 }}>×</button>
              </div>
            </div>
          </div>
        )}

        {view === 'board' && <VisionBoard user={user} lockInSummary={lockInSummary} editing={boardEditing} onEditingChange={setBoardEditing} onOpenDailyStreak={() => setView('checkin')} />}
        {view === 'journal' && <Journal user={user} onOpenEntries={() => setView('entries')} />}
        {view === 'entries' && <JournalEntries onBack={() => setView('journal')} />}
        {view === 'checkin' && <DailyCheckin user={user} onLockInChange={refreshLockIn} onOpenBoard={() => setView('board')} />}
        {view === 'analytics' && <Analytics />}
        {view === 'showup' && <ShowUp user={user} onLockInChange={refreshLockIn} />}
        {view === 'settings' && <SettingsPanel user={user} theme={theme} onThemeChange={onThemeChange} onSignOut={onSignOut} />}

        <style>{`
          @media (max-width: 768px) {
            aside.hamburger-menu-shell {
              width: ${sidebarOpen ? '94px' : '58px'} !important;
              min-width: ${sidebarOpen ? '94px' : '58px'} !important;
            }
            div.hamburger-menu {
              width: 100% !important;
            }
            button.menu-item {
              min-height: 54px !important;
            }
          }
        `}</style>
      </div>
      <QuickSageBubble />
    </div>
  )
}
