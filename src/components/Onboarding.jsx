import { useMemo, useState } from 'react'

const slides = [
  {
    id: 'phasr',
    kicker: '',
    headline: 'Phasr turns your vision into phases, daily tasks, and real accountability. Let’s set up your first phase.',
    body: 'Phasr turns your vision into phases, daily tasks, and real accountability. Let’s set up your first phase.',
    detail: 'A personal system built for follow-through.',
    theme: 'dark',
  },
  {
    id: 'phases',
    kicker: 'Phases',
    headline: 'Your goal, broken into phases.',
    body: 'Not one overwhelming mountain. Just the next clear chapter, structured, timed, and ready to move.',
    detail: 'One clear chapter at a time.',
    theme: 'deep',
  },
  {
    id: 'weekly',
    kicker: 'Weekly Flow',
    headline: 'Every week has a job.',
    body: 'Phasr breaks your phase into weekly actions so you always know what this week is asking of you.',
    detail: 'No guessing. Just the next ask.',
    theme: 'rose',
  },
  {
    id: 'vision',
    kicker: 'Vision Board',
    headline: 'Show it what you want. It builds the road.',
    body: 'Upload your before and after. Phasr turns that vision into resources, non-negotiables, and outcomes.',
    detail: 'Your vision becomes a working plan.',
    theme: 'roseBright',
  },
  {
    id: 'close',
    kicker: '',
    headline: 'You have the goal. Now you have the plan.',
    body: 'Would you like to sync Phasr with your calendar so your plan lives where your day already does?',
    detail: '',
    theme: 'light',
    isClose: true,
  },
]

const themes = {
  dark: {
    bg: 'linear-gradient(135deg, #180711 0%, #2c0f1f 58%, #45182e 100%)',
    text: '#fff7fb',
    muted: 'rgba(255,247,251,0.8)',
    panel: 'rgba(255,255,255,0.12)',
    border: 'rgba(255,255,255,0.18)',
  },
  deep: {
    bg: 'linear-gradient(135deg, #220915 0%, #4a1630 58%, #6f2c50 100%)',
    text: '#fff8fb',
    muted: 'rgba(255,248,251,0.82)',
    panel: 'rgba(255,255,255,0.14)',
    border: 'rgba(255,255,255,0.18)',
  },
  rose: {
    bg: 'linear-gradient(135deg, #43142d 0%, #7c2d57 58%, #b04d7c 100%)',
    text: '#fff9fc',
    muted: 'rgba(255,249,252,0.84)',
    panel: 'rgba(255,255,255,0.16)',
    border: 'rgba(255,255,255,0.2)',
  },
  roseBright: {
    bg: 'linear-gradient(135deg, #6a2447 0%, #b04879 58%, #ee8fb3 100%)',
    text: '#fff9fc',
    muted: 'rgba(255,249,252,0.86)',
    panel: 'rgba(255,255,255,0.18)',
    border: 'rgba(255,255,255,0.22)',
  },
  light: {
    bg: 'linear-gradient(135deg, #fff7fb 0%, #ffeef5 58%, #ffdfe8 100%)',
    text: '#5a1737',
    muted: 'rgba(90,23,55,0.78)',
    panel: 'rgba(255,255,255,0.88)',
    border: 'rgba(212,71,120,0.18)',
  },
}

function PreviewCard({ slide, theme, isPhone }) {
  const isLight = slide.theme === 'light'
  const commonCard = {
    width: '100%',
    maxWidth: isPhone ? 288 : 460,
    borderRadius: isPhone ? 22 : 28,
    padding: isPhone ? 14 : 24,
    background: isLight
      ? 'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(255,247,251,0.82))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.12))',
    border: isLight ? '1px solid rgba(240,96,144,0.16)' : '1px solid rgba(255,255,255,0.24)',
    boxShadow: isLight ? '0 24px 72px rgba(191,110,144,0.18)' : '0 24px 72px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(22px)',
    WebkitBackdropFilter: 'blur(22px)',
    boxSizing: 'border-box',
    color: theme.text,
  }

  if (slide.id === 'phasr') {
    return (
        <div style={commonCard}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isPhone ? '3.1rem' : 'clamp(3.4rem, 8vw, 5.8rem)', lineHeight: 0.9, textAlign: 'center', letterSpacing: '-0.05em' }}>
          Phasr
        </div>
        <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: '0.92rem', lineHeight: 1.6 }}>
          Clear structure for consistent action.
        </p>
      </div>
    )
  }

  if (slide.id === 'phases') {
    return (
      <div style={commonCard}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={chipActive}>Phase 1</span>
          <span style={chip}>Phase 2</span>
        </div>
        <div style={{ ...miniLabel, color: isLight ? '#b43f70' : 'rgba(255,255,255,0.92)' }}>Foundation timeline</div>
        <div style={progressTrack}><span style={{ ...progressFill, width: '42%' }} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          {['W1', 'W2', 'W3', 'W4'].map(item => <span key={item} style={weekChip}>{item}</span>)}
        </div>
      </div>
    )
  }

  if (slide.id === 'weekly') {
    return (
      <div style={commonCard}>
        <div style={{ ...miniLabel, color: isLight ? '#b43f70' : 'rgba(255,255,255,0.92)' }}>This week</div>
        {['Plan the week clearly', 'Do the first focused action', 'Reset before Sunday'].map(item => (
          <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
            <span style={dot} />
            <span style={{ fontSize: '0.94rem', lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>
    )
  }

  if (slide.id === 'vision') {
    return (
      <div style={{ ...commonCard, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
        <div style={{ ...photoBefore, minHeight: isPhone ? 140 : photoBefore.minHeight }}><span>Before</span></div>
        <div style={{ ...photoAfter, minHeight: isPhone ? 140 : photoAfter.minHeight }}><span>After</span></div>
      </div>
    )
  }

  if (slide.id === 'streaks') {
    return (
      <div style={commonCard}>
        <div style={{ ...miniLabel, color: isLight ? '#b43f70' : 'rgba(255,255,255,0.92)' }}>Daily check-in</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((item, index) => (
            <span key={item} style={index < 4 ? weekDoneChip : weekChip}>{item}</span>
          ))}
        </div>
        <div style={{ ...progressTrack, background: 'rgba(240,96,144,0.16)' }}><span style={{ ...progressFill, width: '68%' }} /></div>
        <p style={{ margin: '14px 0 0', fontSize: '0.9rem', lineHeight: 1.6 }}>4 of 7 days checked in</p>
      </div>
    )
  }

  if (slide.id === 'journal') {
    const lineStyle = isLight
      ? { ...textLine, background: 'rgba(212,71,120,0.12)' }
      : textLine
    return (
      <div style={commonCard}>
        <div style={{ ...miniLabel, color: isLight ? '#b43f70' : 'rgba(255,255,255,0.92)' }}>Journal</div>
        <div style={{ ...lineStyle, width: '86%' }} />
        <div style={lineStyle} />
        <div style={{ ...lineStyle, width: '66%' }} />
        <p style={{ margin: '14px 0 0', fontSize: isPhone ? '0.86rem' : '0.92rem', fontWeight: 700 }}>Helpful next step ready</p>
      </div>
    )
  }

  if (slide.id === 'sage') {
    return (
      <div style={commonCard}>
        <div style={{ ...chatUser, fontSize: isPhone ? '0.8rem' : chatUser.fontSize, padding: isPhone ? '0.76rem 0.88rem' : chatUser.padding }}>What should I do next?</div>
        <div style={{ ...chatSage, fontSize: isPhone ? '0.8rem' : chatSage.fontSize, padding: isPhone ? '0.76rem 0.88rem' : chatSage.padding }}>Start with the smallest visible step today.</div>
        <div style={{ ...thinkPill, marginTop: isPhone ? 12 : thinkPill.marginTop, fontSize: isPhone ? '0.76rem' : thinkPill.fontSize }}>Think with Sage</div>
      </div>
    )
  }

  return <div style={commonCard} />
}

const chip = {
  minHeight: 36,
  padding: '0.4rem 0.82rem',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.72)',
  color: '#752a4b',
  fontSize: '0.76rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
}

const chipActive = {
  ...chip,
  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
  color: '#fff',
}

const miniLabel = {
  marginTop: 16,
  marginBottom: 14,
  display: 'inline-flex',
  fontSize: '0.72rem',
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
}

const progressTrack = {
  height: 8,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.46)',
  overflow: 'hidden',
}

const progressFill = {
  display: 'block',
  height: '100%',
  borderRadius: 999,
  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
}

const weekChip = {
  minHeight: 36,
  padding: '0.4rem 0.76rem',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.72)',
  color: '#752a4b',
  fontSize: '0.74rem',
  fontWeight: 700,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const weekDoneChip = {
  ...weekChip,
  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
  color: '#fff',
}

const dot = {
  width: 8,
  height: 8,
  borderRadius: '50%',
  background: '#f06090',
  flex: '0 0 auto',
}

const photoBefore = {
  minHeight: 180,
  borderRadius: 22,
  padding: 14,
  display: 'flex',
  alignItems: 'flex-end',
  fontWeight: 700,
  background: 'linear-gradient(135deg, #d2c4cb, #bcaab2)',
  color: '#5d4050',
}

const photoAfter = {
  ...photoBefore,
  background: 'linear-gradient(135deg, #ef6d9c, #c83068)',
  color: '#fff',
}

const textLine = {
  height: 10,
  borderRadius: 999,
  background: 'rgba(255,255,255,0.66)',
  marginTop: 12,
}

const textLineLong = { ...textLine, width: '86%' }
const textLineShort = { ...textLine, width: '66%' }

const chatUser = {
  marginLeft: 'auto',
  width: 'fit-content',
  maxWidth: '86%',
  padding: '0.92rem 1rem',
  borderRadius: 18,
  fontSize: '0.88rem',
  lineHeight: 1.5,
  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
  color: '#fff',
}

const chatSage = {
  marginTop: 12,
  width: 'fit-content',
  maxWidth: '86%',
  padding: '0.92rem 1rem',
  borderRadius: 18,
  fontSize: '0.88rem',
  lineHeight: 1.5,
  background: 'rgba(255,255,255,0.82)',
  color: '#451425',
}

const thinkPill = {
  display: 'inline-flex',
  marginTop: 16,
  padding: '0.62rem 0.94rem',
  borderRadius: 999,
  background: 'rgba(240,96,144,0.14)',
  color: '#d14579',
  fontSize: '0.82rem',
  fontWeight: 700,
}

export default function Onboarding({ userName = 'there', onComplete }) {
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)

  const slide = slides[step] || slides[0]
  const theme = themes[slide.theme] || themes.dark
  const firstName = userName !== 'there' ? String(userName).split(' ')[0] : 'there'
  const welcomeKicker = useMemo(() => `Welcome, ${firstName}`, [firstName])
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  const isPhone = typeof window !== 'undefined' ? window.innerWidth <= 540 : false

  function next() {
    if (step < slides.length - 1) {
      setStep(current => current + 1)
      return
    }
    onComplete?.('later')
  }

  function back() {
    if (step > 0) setStep(current => current - 1)
  }

  function finish(choice) {
    if (closing) return
    setClosing(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('phasr_calendar_choice', choice)
    }
    onComplete?.(choice)
  }

  return (
    <>
      <style>{`
        .ob-fade-up {
          opacity: 0;
          animation: obFadeUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .ob-delay-1 { animation-delay: 0.06s; }
        .ob-delay-2 { animation-delay: 0.14s; }

        @keyframes obFadeUp {
          from {
            opacity: 0;
            transform: translateY(22px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9000,
          overflow: 'hidden',
          background: theme.bg,
          color: theme.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <div
          style={{
            width: 'min(1120px, calc(100% - 32px))',
            height: '100dvh',
            margin: '0 auto',
            padding: isPhone ? '10px 0 96px' : '18px 0 16px',
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
          }}
        >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: isPhone ? 30 : 38, marginBottom: isPhone ? 8 : 12 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 600, letterSpacing: '-0.03em' }}>
            {step === 0 ? `Welcome, ${firstName}` : 'Phasr'}
          </div>
          {!slide.isClose && (
            <div style={{ display: 'flex', gap: 7 }}>
              {slides.map((item, index) => (
                <span
                  key={item.id}
                  style={{
                    width: index === step ? 28 : 7,
                    height: 7,
                    borderRadius: 999,
                    background: index === step ? '#f06090' : index < step ? 'rgba(240,96,144,0.64)' : 'rgba(255,255,255,0.26)',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {slide.isClose ? (
          <div style={{ flex: 1, display: 'grid', placeItems: 'center', overflowY: isPhone ? 'auto' : 'visible', paddingBottom: isPhone ? 18 : 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 520, paddingBottom: isPhone ? 12 : 0 }}>
              <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: isPhone ? '2.45rem' : 'clamp(2.8rem, 6vw, 4.8rem)', lineHeight: 1, fontWeight: 300, letterSpacing: '-0.04em' }}>
                {slide.headline}
              </h1>
              <p style={{ margin: '16px 0 24px', fontSize: isPhone ? '0.95rem' : '1rem', lineHeight: 1.7, color: theme.muted }}>{slide.body}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                <button type="button" onClick={() => finish('connected')} style={primaryButton}>Yes, connect my calendar</button>
                <button type="button" onClick={() => finish('later')} style={{ ...ghostButton, color: theme.text, borderColor: theme.border }}>Maybe later</button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 1fr) minmax(0, 1fr)',
                alignItems: 'center',
                gap: isMobile ? 16 : 48,
                overflowY: isPhone ? 'auto' : 'visible',
                paddingBottom: isPhone ? 120 : 0,
              }}
            >
            <div className="ob-fade-up ob-delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
                <PreviewCard slide={slide} theme={theme} isPhone={isPhone} />
              </div>

              <div className="ob-fade-up ob-delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', textAlign: isMobile ? 'center' : 'left' }}>
                <div
                  style={{
                    display: slide.id === 'phasr' ? 'none' : 'inline-flex',
                    alignItems: 'center',
                    minHeight: 34,
                    padding: '0.38rem 0.85rem',
                    borderRadius: 999,
                    border: `1px solid ${theme.border}`,
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: theme.panel,
                    color: slide.id === 'phasr' ? '#ffbfd7' : theme.text,
                    marginBottom: 14,
                  }}
                >
                  {slide.id === 'phasr' ? welcomeKicker : slide.kicker}
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: slide.id === 'phasr'
                      ? (isPhone ? '2.05rem' : 'clamp(2.25rem, 5.2vw, 3.7rem)')
                      : (isPhone ? '2.7rem' : 'clamp(2.9rem, 7vw, 5.35rem)'),
                    lineHeight: 0.98,
                    fontWeight: 300,
                    letterSpacing: '-0.04em',
                    maxWidth: slide.id === 'phasr' ? 560 : 'none',
                    color: theme.text,
                    textShadow: slide.theme === 'light' ? '0 1px 0 rgba(255,255,255,0.6)' : 'none',
                  }}
                >
                  {slide.headline}
                </h1>

                <p style={{ margin: '16px 0 18px', maxWidth: slide.id === 'phasr' ? 420 : 500, fontSize: slide.id === 'phasr' ? (isPhone ? '0.98rem' : '1.02rem') : (isPhone ? '0.94rem' : '1rem'), lineHeight: 1.7, color: theme.muted, fontWeight: slide.id === 'phasr' ? 700 : 400 }}>
                  {slide.id === 'phasr' ? 'Your system is ready.' : slide.body}
                </p>

                {slide.id === 'phasr' ? (
                  <div style={{ width: '100%', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    <button type="button" onClick={next} style={primaryButton}>Let&apos;s go -&gt;</button>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0.68rem 0.98rem', borderRadius: 18, border: `1px solid ${theme.border}`, background: theme.panel }}>
                    <span style={dot} />
                    <span>{slide.detail}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingTop: isPhone ? 8 : 10, position: isPhone ? 'fixed' : 'static', left: isPhone ? 12 : 'auto', right: isPhone ? 12 : 'auto', bottom: isPhone ? 10 : 'auto', zIndex: isPhone ? 4 : 'auto', background: isPhone ? `linear-gradient(180deg, rgba(255,255,255,0) 0%, ${slide.theme === 'light' ? 'rgba(255,247,251,0.98)' : 'rgba(24,7,17,0.88)'} 100%)` : 'transparent', backdropFilter: isPhone ? 'blur(10px)' : 'none', WebkitBackdropFilter: isPhone ? 'blur(10px)' : 'none', borderRadius: isPhone ? 20 : 0, padding: isPhone ? '12px 12px 10px' : undefined, boxShadow: isPhone ? '0 -12px 30px rgba(0,0,0,0.08)' : 'none' }}>
              {step > 0 ? (
                <button type="button" onClick={back} style={{ ...ghostButton, color: theme.text, borderColor: theme.border }}>Back</button>
              ) : (
                <div />
              )}
              {step === 0 ? (
                <div style={{ minWidth: 120, minHeight: 1 }} />
              ) : (
                <button type="button" onClick={next} style={primaryButton}>Next</button>
              )}
            </div>
          </>
        )}
        </div>
      </div>
    </>
  )
}

const primaryButton = {
  minHeight: 46,
  padding: '0.76rem 1.1rem',
  borderRadius: 999,
  border: 'none',
  background: 'linear-gradient(135deg, #e8407a, #f472a8)',
  color: '#fff',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 14px 30px rgba(232,64,122,0.28)',
}

const ghostButton = {
  minHeight: 46,
  padding: '0.76rem 1.1rem',
  borderRadius: 999,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.22)',
  font: 'inherit',
  fontWeight: 700,
  cursor: 'pointer',
}
