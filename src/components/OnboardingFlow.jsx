import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  NotebookPen,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { enableCalendarIntegration, skipCalendarIntegration } from '../lib/calendarNotifications'
import { loadBoardData } from '../lib/lockIn'

const WALKTHROUGH_SLIDES = [
  {
    id: 'vision',
    title: 'Vision Board',
    body: 'Upload before/after images and a short description. Phasr turns it into a plan with resources, weekly non-negotiables, activities, and outcome.',
    detail: 'All you do is upload a photo + short description of what you want. Sage generates a plan and you can edit or regenerate anything.',
    icon: ImageIcon,
    accent: 'linear-gradient(135deg,#f78fb0,#f06090)',
  },
  {
    id: 'phases',
    title: 'Phases & Timeframe',
    body: 'Split your year into Phases. Each Phase has 2 pillars and its own start and end date.',
    detail: 'Set the timeframe you want, and Phasr uses it to break your goals into weeks and remind you to add them to your calendar.',
    icon: CalendarDays,
    accent: 'linear-gradient(135deg,#ffb3c9,#f95f85)',
  },
  {
    id: 'streaks',
    title: 'Daily Streaks',
    body: 'Your plan turns into weekly non-negotiables, then daily action. Week 1 unlocks first and later weeks unlock as you finish.',
    detail: 'The more you finish, the more features and momentum you unlock, even on free.',
    icon: CheckSquare,
    accent: 'linear-gradient(135deg,#ff9ec1,#ff719f)',
  },
  {
    id: 'journal',
    title: 'Journal',
    body: 'Speak or type. Sage gives you a title, summary, score, and one or two next steps.',
    detail: 'Your entries are saved and linked to your Phases and stats, so reflection becomes part of the plan.',
    icon: NotebookPen,
    accent: 'linear-gradient(135deg,#ffc5d9,#f78fb0)',
  },
  {
    id: 'community',
    title: 'Show Up, Stats & Strategy',
    body: 'Join small accountability rooms, see your stats, and use Strategy or the floating Sage icon to think through your next move.',
    detail: 'You can also change the app theme later in Settings > Appearance.',
    icon: Users,
    accent: 'linear-gradient(135deg,#f6a6c1,#f06292)',
  },
]

function StepDot({ active }) {
  return (
    <span
      style={{
        width: active ? 22 : 8,
        height: 8,
        borderRadius: 999,
        background: active ? 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))' : 'color-mix(in srgb, var(--app-accent) 18%, #ffffff)',
        transition: 'all 0.2s ease',
      }}
    />
  )
}

function VisualCard({ slide }) {
  const Icon = slide.icon

  return (
    <div
      style={{
        borderRadius: 26,
        overflow: 'hidden',
        border: '1px solid color-mix(in srgb, var(--app-accent) 18%, #ffffff)',
        background: '#fff',
        boxShadow: '0 26px 44px rgba(240,96,144,0.12)',
      }}
    >
      <div
        style={{
          minHeight: 220,
          padding: '1.2rem',
          background: slide.accent,
          color: '#fff',
          position: 'relative',
          display: 'grid',
          alignItems: 'end',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 54,
            height: 54,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.16)',
            border: '1px solid rgba(255,255,255,0.28)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon size={26} />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.7rem',
            alignItems: 'end',
          }}
        >
          <div
            style={{
              minHeight: 120,
              borderRadius: 18,
              background: 'rgba(255,255,255,0.14)',
              border: '1px solid rgba(255,255,255,0.24)',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>
              Inside Phasr
            </span>
            <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.45, fontWeight: 700 }}>
              {slide.title}
            </p>
          </div>
          <div
            style={{
              minHeight: 120,
              borderRadius: 18,
              background: 'rgba(16,16,24,0.18)',
              border: '1px solid rgba(255,255,255,0.18)',
              padding: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 800 }}>
              What happens
            </span>
            <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>
              {slide.id === 'vision' && 'Before / after + prompt becomes a guided plan.'}
              {slide.id === 'phases' && 'Start and end dates define your weekly structure.'}
              {slide.id === 'streaks' && 'Daily action feeds weekly progress and streaks.'}
              {slide.id === 'journal' && 'Reflection becomes summary, score, and a next step.'}
              {slide.id === 'community' && 'Accountability + stats + Sage strategy stay connected.'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '1.1rem 1.15rem 1.2rem' }}>
        <p style={{ margin: 0, color: 'var(--app-text)', fontWeight: 800, fontSize: '1.05rem' }}>{slide.title}</p>
        <p style={{ margin: '0.45rem 0 0', color: 'var(--app-muted)', lineHeight: 1.65, fontSize: '0.93rem' }}>{slide.body}</p>
        <p style={{ margin: '0.65rem 0 0', color: '#9f5d78', lineHeight: 1.62, fontSize: '0.88rem', fontWeight: 600 }}>{slide.detail}</p>
      </div>
    </div>
  )
}

export default function OnboardingFlow({ user, onComplete }) {
  const [step, setStep] = useState('welcome')
  const [slideIndex, setSlideIndex] = useState(0)
  const [busy, setBusy] = useState(false)

  const slide = WALKTHROUGH_SLIDES[slideIndex]
  const totalSlides = WALKTHROUGH_SLIDES.length

  const welcomeName = useMemo(() => {
    const raw = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'
    return String(raw).trim() || 'there'
  }, [user])

  async function handleCalendarChoice(choice) {
    if (busy) return
    setBusy(true)

    try {
      if (choice === 'allowed') {
        await enableCalendarIntegration(loadBoardData() || {})
      } else {
        skipCalendarIntegration()
      }

      onComplete?.(choice)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        background: 'rgba(250,244,247,0.92)',
        backdropFilter: 'blur(8px)',
        padding: 'clamp(0.8rem, 3vw, 1.4rem)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        style={{
          width: 'min(100%, 1080px)',
          maxHeight: 'calc(100vh - 24px)',
          overflowY: 'auto',
          borderRadius: 34,
          background: 'linear-gradient(180deg,#fff8fb 0%, #fff 100%)',
          border: '1px solid color-mix(in srgb, var(--app-accent) 16%, #ffffff)',
          boxShadow: '0 26px 56px rgba(202,84,128,0.16)',
          padding: 'clamp(1rem, 3vw, 1.4rem)',
        }}
      >
        {step === 'welcome' && (
          <div
            className="phasr-onboarding-grid"
            style={{
              minHeight: 'min(82vh, 720px)',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.08fr) minmax(0, 0.92fr)',
              gap: '1rem',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                borderRadius: 28,
                padding: 'clamp(1.2rem, 4vw, 2rem)',
                background: 'linear-gradient(145deg,#fff 0%, #fff3f7 100%)',
                border: '1px solid color-mix(in srgb, var(--app-accent) 14%, #ffffff)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.45rem 0.78rem', borderRadius: 999, background: '#fff1f6', border: '1px solid #f2c8d6', color: 'var(--app-accent)', fontSize: '0.73rem', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <Sparkles size={14} />
                  Welcome
                </div>
                <h1 style={{ margin: '1rem 0 0.75rem', fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.2rem, 5vw, 4rem)', lineHeight: 1.03, color: 'var(--app-text)' }}>
                  Hello, welcome to phasr.
                </h1>
                <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.8, color: 'var(--app-muted)', maxWidth: 540 }}>
                  Let&apos;s set up your vision and daily actions.
                </p>
                <p style={{ margin: '0.9rem 0 0', fontSize: '0.96rem', lineHeight: 1.8, color: '#8c5f71', maxWidth: 560 }}>
                  {welcomeName}, this intro is short. In under a minute you&apos;ll see how Vision Board, Daily Streaks, Journal, Show Up, Strategy, and Sage all connect.
                </p>
              </div>

              <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
                {[
                  'Visual setup',
                  'Weekly structure',
                  'Daily guidance',
                  'Calendar-ready',
                ].map(label => (
                  <div key={label} style={{ borderRadius: 18, border: '1px solid #f2d4df', background: '#fff', padding: '0.9rem 1rem' }}>
                    <p style={{ margin: 0, color: 'var(--app-text)', fontWeight: 800 }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                borderRadius: 28,
                padding: '1.1rem',
                background: 'linear-gradient(160deg,#f78fb0 0%, #f06090 100%)',
                border: '1px solid rgba(255,255,255,0.28)',
                color: '#fff',
                display: 'grid',
                gridTemplateRows: 'auto 1fr auto',
                gap: '0.9rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>What you will set up</span>
                <Target size={18} />
              </div>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[
                  'Vision board with before/after, resources, activities, weekly non-negotiables, and outcome',
                  'Phase dates and timeframe',
                  'Daily streaks and weekly progression',
                  'Journal summaries and action steps',
                  'Show Up challenge rooms and Strategy with Sage',
                ].map(item => (
                  <div key={item} style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 18, padding: '0.9rem 1rem', lineHeight: 1.6, fontSize: '0.92rem' }}>
                    {item}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep('walkthrough')}
                style={{
                  border: 'none',
                  borderRadius: 18,
                  padding: '1rem 1.1rem',
                  background: '#fff',
                  color: '#b74872',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                Start walkthrough
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {step === 'walkthrough' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Mini talk</p>
                <h2 style={{ margin: '0.35rem 0 0', fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.5rem, 3vw, 2.5rem)', color: 'var(--app-text)' }}>
                  See how your flow works
                </h2>
              </div>
              <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                {WALKTHROUGH_SLIDES.map((item, index) => <StepDot key={item.id} active={index === slideIndex} />)}
              </div>
            </div>

            <VisualCard slide={slide} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.9rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  if (slideIndex === 0) setStep('welcome')
                  else setSlideIndex(index => Math.max(0, index - 1))
                }}
                style={{
                  border: '1px solid var(--app-border)',
                  borderRadius: 999,
                  padding: '0.8rem 1.05rem',
                  background: '#fff',
                  color: 'var(--app-text)',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                <ChevronLeft size={16} />
                Back
              </button>

              <span style={{ color: 'var(--app-muted)', fontSize: '0.86rem', fontWeight: 700 }}>
                {slideIndex + 1} / {totalSlides}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (slideIndex === totalSlides - 1) setStep('calendar')
                  else setSlideIndex(index => Math.min(totalSlides - 1, index + 1))
                }}
                style={{
                  border: 'none',
                  borderRadius: 999,
                  padding: '0.82rem 1.08rem',
                  background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                  color: '#fff',
                  fontFamily: "'DM Sans', sans-serif",
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                }}
              >
                {slideIndex === totalSlides - 1 ? 'Continue' : 'Next'}
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 'calendar' && (
          <div
            className="phasr-onboarding-grid"
            style={{
              minHeight: 'min(78vh, 620px)',
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 0.94fr) minmax(0, 1.06fr)',
              gap: '1rem',
              alignItems: 'stretch',
            }}
          >
            <div
              style={{
                borderRadius: 28,
                padding: '1.2rem',
                background: '#fff',
                border: '1px solid color-mix(in srgb, var(--app-accent) 14%, #ffffff)',
                display: 'grid',
                gap: '0.85rem',
                alignContent: 'start',
              }}
            >
              <div style={{ width: 58, height: 58, borderRadius: 20, background: '#fff1f6', border: '1px solid #f2c8d6', display: 'grid', placeItems: 'center', color: 'var(--app-accent)' }}>
                <CalendarDays size={28} />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--app-accent)' }}>Calendar</p>
              <h2 style={{ margin: 0, fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.65rem, 3vw, 2.7rem)', lineHeight: 1.08, color: 'var(--app-text)' }}>
                Would you like to integrate Phasr with your phone calendar?
              </h2>
              <p style={{ margin: 0, color: 'var(--app-muted)', lineHeight: 1.8 }}>
                So tasks and Phase deadlines are added automatically.
              </p>
            </div>

            <div
              style={{
                borderRadius: 28,
                padding: '1.2rem',
                background: 'linear-gradient(180deg,#fff 0%, #fff4f8 100%)',
                border: '1px solid color-mix(in srgb, var(--app-accent) 16%, #ffffff)',
                display: 'grid',
                gap: '0.95rem',
                alignContent: 'space-between',
              }}
            >
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {[
                  'Phase deadlines can be added to your phone calendar',
                  'Weekly non-negotiables can be synced automatically',
                  'If you skip now, you can turn it on later in Settings > Calendar',
                ].map(item => (
                  <div key={item} style={{ borderRadius: 18, border: '1px solid #f2d4df', background: '#fff', padding: '0.95rem 1rem', color: 'var(--app-text)', lineHeight: 1.65 }}>
                    {item}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gap: '0.8rem' }}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCalendarChoice('allowed')}
                  style={{
                    border: 'none',
                    borderRadius: 18,
                    padding: '1rem 1.1rem',
                    background: 'linear-gradient(135deg,var(--app-accent2),var(--app-accent))',
                    color: '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >
                  {busy ? 'Opening calendar…' : 'Yes, integrate calendar'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleCalendarChoice('skipped')}
                  style={{
                    border: '1px solid var(--app-border)',
                    borderRadius: 18,
                    padding: '1rem 1.1rem',
                    background: '#fff',
                    color: 'var(--app-text)',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: busy ? 'wait' : 'pointer',
                  }}
                >
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .phasr-onboarding-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
