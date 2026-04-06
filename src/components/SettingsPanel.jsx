import { useEffect, useMemo, useState } from 'react'
import { enableCalendarIntegration, getCalendarPreference } from '../lib/calendarNotifications'
import { loadBoardData } from '../lib/lockIn'
import { getUserAccess } from '../lib/access'
import { submitIssueReport, supabaseConfigError } from '../lib/supabase'

const FAQ = [
  { q: 'How do I add a new phase?', a: 'Go to Vision Board and add a new phase from the phase tabs. Free users get 2 phases.' },
  { q: 'What is a Vision Circle?', a: 'A small accountability group where you can see who showed up and who needs a nudge.' },
  { q: 'How does the streak work?', a: 'Your streak grows when you log progress. Missing a day resets it.' },
  { q: 'What does Sage do?', a: 'Sage gives you daily direction, quick chat help, and deeper thinking sessions.' },
  { q: 'How do I change my pillar type?', a: 'In personalize mode, tap the icon on a pillar card and switch the focus area.' },
  { q: 'How do I contact support?', a: 'Use Contact in Settings or email hello@her-assist.services.' },
]

function getDisplayName(user) {
  const raw = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.user_metadata?.first_name || 'Phasr user'
  return String(raw).trim() || 'Phasr user'
}

function getEmail(user) {
  return user?.email || 'No email added'
}

function AccordionItem({ title, children, isOpen, onToggle, danger = false }) {
  return (
    <div style={{ borderRadius: 16, border: '1px solid var(--app-border)', background: '#fff', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{ width: '100%', border: 'none', background: 'transparent', padding: '1rem 1.05rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", color: danger ? '#c0445a' : 'var(--app-text)', fontWeight: 800, textAlign: 'left' }}
      >
        {title}
        <span style={{ color: 'var(--app-muted)', transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>+</span>
      </button>
      {isOpen && <div style={{ borderTop: '1px solid var(--app-border)', padding: '1rem 1.05rem' }}>{children}</div>}
    </div>
  )
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ borderRadius: 12, border: '1px solid var(--app-border)', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        style={{ width: '100%', border: 'none', background: 'transparent', padding: '0.8rem 0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', cursor: 'pointer', color: 'var(--app-text)', fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textAlign: 'left' }}
      >
        {q}
        <span style={{ color: 'var(--app-muted)' }}>{open ? '-' : '+'}</span>
      </button>
      {open && <div style={{ borderTop: '1px solid var(--app-border)', padding: '0.8rem 0.9rem', background: 'var(--app-bg2)', color: 'var(--app-muted)', fontSize: '0.84rem', lineHeight: 1.65 }}>{a}</div>}
    </div>
  )
}

function ThemeButton({ active, label, swatch, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: active ? '1px solid transparent' : '1px solid var(--app-border)',
        background: active ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : '#fff',
        color: active ? '#fff' : 'var(--app-text)',
        borderRadius: 999,
        padding: '0.72rem 1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        cursor: 'pointer',
        fontWeight: 700,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span style={{ width: 12, height: 12, borderRadius: '50%', background: swatch, border: active ? '1px solid rgba(255,255,255,0.55)' : '1px solid rgba(0,0,0,0.08)' }} />
      {label}
    </button>
  )
}

export default function SettingsPanel({ user, theme, onThemeChange, onSignOut }) {
  const [openSection, setOpenSection] = useState(null)
  const [notificationsOn, setNotificationsOn] = useState(true)
  const [privacyMode, setPrivacyMode] = useState('standard')
  const [calendarStatus, setCalendarStatus] = useState(() => getCalendarPreference())
  const [faqSearch, setFaqSearch] = useState('')
  const [reportText, setReportText] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [reportError, setReportError] = useState('')
  const access = useMemo(() => getUserAccess(user), [user])

  const themeOptions = useMemo(() => ([
    { value: 'rose', label: 'Pink', swatch: 'linear-gradient(135deg,#f78fb0,#f06090)' },
    { value: 'slate', label: 'Blue', swatch: 'linear-gradient(135deg,#7b94f8,#4a6cf7)' },
  ]), [])

  const filteredFaq = faqSearch.trim()
    ? FAQ.filter(item => item.q.toLowerCase().includes(faqSearch.toLowerCase()) || item.a.toLowerCase().includes(faqSearch.toLowerCase()))
    : FAQ

  useEffect(() => {
    setOpenSection(null)
  }, [])

  async function connectCalendar() {
    await enableCalendarIntegration(loadBoardData())
    setCalendarStatus('allowed')
  }

  async function submitReport() {
    if (!reportText.trim()) return
    setReporting(true)
    setReportError('')

    try {
      await submitIssueReport({
        user,
        message: reportText,
        context: {
          theme,
          calendarStatus,
          accessPlan: access.plan,
          trialDaysLeft: access.trialDaysLeft,
          screen: 'settings',
        },
      })
      setReportSent(true)
      setReportText('')
      window.setTimeout(() => setReportSent(false), 4000)
    } catch (error) {
      setReportError(error?.message || 'Could not send the issue report.')
    } finally {
      setReporting(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--app-bg)', padding: '1.5rem 1rem 4rem', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '1240px', margin: '0 auto', display: 'grid', gap: '0.9rem' }}>
        <AccordionItem title="Profile" isOpen={openSection === 'profile'} onToggle={() => setOpenSection(current => current === 'profile' ? null : 'profile')}>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.85rem 0.95rem' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Name</p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--app-text)' }}>{getDisplayName(user)}</p>
            </div>
            <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.85rem 0.95rem' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Email</p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '1rem', fontWeight: 700, color: 'var(--app-text)' }}>{getEmail(user)}</p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Notifications" isOpen={openSection === 'notifications'} onToggle={() => setOpenSection(current => current === 'notifications' ? null : 'notifications')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--app-text)' }}>Nudges</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--app-muted)' }}>Turn reminders on or off.</p>
            </div>
            <button type="button" onClick={() => setNotificationsOn(value => !value)} style={{ minWidth: 110, border: 'none', borderRadius: 999, padding: '0.72rem 1rem', background: notificationsOn ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'var(--app-bg2)', color: notificationsOn ? '#fff' : 'var(--app-text)', cursor: 'pointer', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{notificationsOn ? 'On' : 'Off'}</button>
          </div>
        </AccordionItem>

        <AccordionItem title="Calendar Integration" isOpen={openSection === 'calendar'} onToggle={() => setOpenSection(current => current === 'calendar' ? null : 'calendar')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.96rem', fontWeight: 700, color: 'var(--app-text)' }}>Calendar</p>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--app-muted)' }}>{calendarStatus === 'allowed' ? 'Connected.' : 'Add your plan to your calendar.'}</p>
            </div>
            <button type="button" onClick={connectCalendar} style={{ border: '1px solid var(--app-border)', borderRadius: 999, padding: '0.72rem 1rem', background: '#fff', color: 'var(--app-accent)', cursor: 'pointer', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{calendarStatus === 'allowed' ? 'Connected' : 'Connect'}</button>
          </div>
        </AccordionItem>

        <AccordionItem title="Theme" isOpen={openSection === 'theme'} onToggle={() => setOpenSection(current => current === 'theme' ? null : 'theme')}>
          <div style={{ display: 'grid', gap: '0.9rem' }}>
            <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
              {themeOptions.map(option => (
                <ThemeButton key={option.value} active={theme === option.value} label={option.label} swatch={option.swatch} onClick={() => onThemeChange?.(option.value)} />
              ))}
            </div>
            <div style={{ borderRadius: 14, background: 'var(--app-bg2)', padding: '0.9rem 1rem' }}>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Access</p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--app-text)' }}>
                {access.isTrial ? `Pro trial active · ${access.trialDaysLeft} day${access.trialDaysLeft === 1 ? '' : 's'} left` : access.isPro ? 'Pro active' : 'Free plan'}
              </p>
              <p style={{ margin: '0.22rem 0 0', fontSize: '0.82rem', color: 'var(--app-muted)' }}>
                New users start with a 3-day Pro trial so they can experience the full app before dropping back to free.
              </p>
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Privacy" isOpen={openSection === 'privacy'} onToggle={() => setOpenSection(current => current === 'privacy' ? null : 'privacy')}>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {['standard', 'private'].map(value => (
              <button key={value} type="button" onClick={() => setPrivacyMode(value)} style={{ border: privacyMode === value ? '1px solid transparent' : '1px solid var(--app-border)', borderRadius: 16, padding: '0.9rem 1rem', background: privacyMode === value ? 'var(--app-bg2)' : '#fff', color: 'var(--app-text)', textAlign: 'left', cursor: 'pointer', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                {value === 'standard' ? 'Standard' : 'Private'}
              </button>
            ))}
          </div>
        </AccordionItem>

        <AccordionItem title="Support" isOpen={openSection === 'support'} onToggle={() => setOpenSection(current => current === 'support' ? null : 'support')}>
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            <input value={faqSearch} onChange={event => setFaqSearch(event.target.value)} placeholder="Search for help..." style={{ width: '100%', border: '1px solid var(--app-border)', borderRadius: 12, padding: '0.72rem 0.9rem', background: 'var(--app-bg2)', color: 'var(--app-text)', fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
            <div style={{ display: 'grid', gap: '0.55rem' }}>
              {filteredFaq.map(item => <FaqItem key={item.q} q={item.q} a={item.a} />)}
            </div>
          </div>
        </AccordionItem>

        <AccordionItem title="Contact" isOpen={openSection === 'contact'} onToggle={() => setOpenSection(current => current === 'contact' ? null : 'contact')}>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <a href="mailto:hello@her-assist.services" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', width: 'fit-content', padding: '0.75rem 1rem', borderRadius: 12, border: '1px solid var(--app-border)', background: 'var(--app-bg2)', color: 'var(--app-text)', textDecoration: 'none', fontWeight: 700 }}>hello@her-assist.services</a>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--app-muted)' }}>We respond within 24 hours.</p>
          </div>
        </AccordionItem>

        <AccordionItem title="Report Issue" isOpen={openSection === 'report'} onToggle={() => setOpenSection(current => current === 'report' ? null : 'report')}>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            {reportSent ? (
              <div style={{ padding: '0.85rem 0.95rem', borderRadius: 12, background: '#f4fbf5', border: '1px solid #b9dfc0', color: '#3a7d4d', fontWeight: 700 }}>Report submitted. Thank you.</div>
            ) : (
              <>
                <textarea value={reportText} onChange={event => setReportText(event.target.value)} placeholder="Describe the issue." rows={5} style={{ width: '100%', border: '1px solid var(--app-border)', borderRadius: 12, padding: '0.8rem 0.9rem', background: 'var(--app-bg2)', color: 'var(--app-text)', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', outline: 'none', lineHeight: 1.6 }} />
                {reportError && <div style={{ padding: '0.75rem 0.9rem', borderRadius: 12, background: '#fff6f6', border: '1px solid #f4ccd3', color: '#b54962', fontSize: '0.82rem', lineHeight: 1.5 }}>{supabaseConfigError ? supabaseConfigError : reportError}</div>}
                <button type="button" onClick={submitReport} disabled={!reportText.trim() || reporting} style={{ width: 'fit-content', border: 'none', borderRadius: 999, padding: '0.72rem 1rem', background: reportText.trim() && !reporting ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'var(--app-border)', color: reportText.trim() && !reporting ? '#fff' : 'var(--app-muted)', cursor: reportText.trim() && !reporting ? 'pointer' : 'not-allowed', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>{reporting ? 'Submitting...' : 'Submit report'}</button>
              </>
            )}
          </div>
        </AccordionItem>

        <AccordionItem title="Log out" isOpen={openSection === 'logout'} onToggle={() => setOpenSection(current => current === 'logout' ? null : 'logout')} danger>
          <div style={{ display: 'grid', gap: '0.7rem' }}>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--app-muted)' }}>You will be signed out on this device.</p>
            <button type="button" onClick={onSignOut} style={{ width: 'fit-content', border: '1px solid #f9cdd3', borderRadius: 999, padding: '0.72rem 1rem', background: '#fff8f8', color: '#c0445a', cursor: 'pointer', fontWeight: 800, fontFamily: "'DM Sans', sans-serif" }}>Sign out</button>
          </div>
        </AccordionItem>
      </div>
    </div>
  )
}
