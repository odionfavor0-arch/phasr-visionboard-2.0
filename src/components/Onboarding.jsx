import { useMemo, useState } from 'react'

const PILLAR_PRESETS = [
  { id: 'health-fitness', emoji: '💪', name: 'Health & Fitness', details: 'Body, food, sleep, gym, energy' },
  { id: 'career-business', emoji: '💼', name: 'Career & Business', details: 'Job, entrepreneurship, income' },
  { id: 'wealth', emoji: '💰', name: 'Wealth', details: 'Savings, investing, financial freedom' },
  { id: 'relationships', emoji: '🤝', name: 'Relationships', details: 'Love, family, friendships, community' },
  { id: 'inner-life', emoji: '✨', name: 'Inner Life', details: 'Spirituality, mindfulness, mental health' },
  { id: 'personal-growth', emoji: '🌱', name: 'Personal Growth', details: 'Learning, creativity, self-development' },
]

const slides = [
  { id: 'phasr', kicker: '', headline: 'Break your vision into phases, daily tasks, and real accountability.', body: 'Phasr turns your vision into phases, daily tasks, and real accountability. Let\'s set up your first phase.', detail: 'A personal system built for follow-through.', theme: 'dark' },
  { id: 'sage', kicker: 'Sage', headline: 'Find what matters next', body: 'Sage helps you think clearly, remove doubt, and turn reflection into focused action.', detail: 'Clarity turns into direction.', theme: 'deep' },
  { id: 'vision', kicker: 'Vision Board', headline: 'Show it what you want. It builds the road.', body: 'Upload your before and after. Phasr turns that vision into resources, non-negotiables, and outcomes.', detail: 'Your vision becomes a working plan.', theme: 'roseBright' },
  { id: 'pillars', kicker: 'Your Focus', headline: 'What are you working on?', body: 'Pick your focus areas. Phasr will build your plan around them.', theme: 'rose', isCustom: true },
  { id: 'letter', kicker: 'Letter to Future You', headline: 'Write to the version of you who finishes this.', body: 'You will see this again when you complete your first phase.', theme: 'dark', isCustom: true },
  { id: 'close', kicker: '', headline: 'You have the goal. Now you have the plan.', body: 'Would you like to sync Phasr with your calendar so your plan lives where your day already does?', detail: '', theme: 'light', isClose: true },
]

const themes = {
  dark: { bg: 'linear-gradient(135deg, #180711 0%, #2c0f1f 58%, #45182e 100%)', text: '#fff7fb', muted: 'rgba(255,247,251,0.8)', panel: 'rgba(255,255,255,0.12)', border: 'rgba(255,255,255,0.18)' },
  deep: { bg: 'linear-gradient(135deg, #220915 0%, #4a1630 58%, #6f2c50 100%)', text: '#fff8fb', muted: 'rgba(255,248,251,0.82)', panel: 'rgba(255,255,255,0.14)', border: 'rgba(255,255,255,0.18)' },
  rose: { bg: 'linear-gradient(135deg, #43142d 0%, #7c2d57 58%, #b04d7c 100%)', text: '#fff9fc', muted: 'rgba(255,249,252,0.84)', panel: 'rgba(255,255,255,0.16)', border: 'rgba(255,255,255,0.2)' },
  roseBright: { bg: 'linear-gradient(135deg, #6a2447 0%, #b04879 58%, #ee8fb3 100%)', text: '#fff9fc', muted: 'rgba(255,249,252,0.86)', panel: 'rgba(255,255,255,0.18)', border: 'rgba(255,255,255,0.22)' },
  light: { bg: 'linear-gradient(135deg, #fff7fb 0%, #ffeef5 58%, #ffdfe8 100%)', text: '#5a1737', muted: 'rgba(90,23,55,0.78)', panel: 'rgba(255,255,255,0.88)', border: 'rgba(212,71,120,0.18)' },
}

function PreviewCard({ slide, theme, isPhone }) {
  const isLight = slide.theme === 'light'
  const commonCard = {
    width: '100%', maxWidth: isPhone ? 288 : 460, borderRadius: isPhone ? 22 : 28, padding: isPhone ? 14 : 24,
    background: isLight ? 'linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,251,0.82))' : 'linear-gradient(180deg,rgba(255,255,255,0.36),rgba(255,255,255,0.12))',
    border: isLight ? '1px solid rgba(240,96,144,0.16)' : '1px solid rgba(255,255,255,0.24)',
    boxShadow: isLight ? '0 24px 72px rgba(191,110,144,0.18)' : '0 24px 72px rgba(0,0,0,0.18)',
    backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', boxSizing: 'border-box', color: theme.text,
  }

  if (slide.id === 'phasr') {
    return (
      <div style={commonCard}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isPhone ? '3.1rem' : 'clamp(3.4rem,8vw,5.8rem)', lineHeight: 0.9, textAlign: 'center', letterSpacing: '-0.05em' }}>Phasr</div>
        <p style={{ margin: '16px 0 0', textAlign: 'center', fontSize: '0.92rem', lineHeight: 1.6 }}>Clear structure for consistent action.</p>
      </div>
    )
  }

  if (slide.id === 'vision') {
    return (
      <div style={{ ...commonCard, display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 14 }}>
        <div style={{ minHeight: isPhone ? 140 : 180, borderRadius: 22, padding: 14, display: 'flex', alignItems: 'flex-end', fontWeight: 700, background: 'linear-gradient(135deg,#d2c4cb,#bcaab2)', color: '#5d4050' }}><span>Before</span></div>
        <div style={{ minHeight: isPhone ? 140 : 180, borderRadius: 22, padding: 14, display: 'flex', alignItems: 'flex-end', fontWeight: 700, background: 'linear-gradient(135deg,#ef6d9c,#c83068)', color: '#fff' }}><span>After</span></div>
      </div>
    )
  }

  if (slide.id === 'sage') {
    return (
      <div style={commonCard}>
        <div style={{ marginLeft: 'auto', width: 'fit-content', maxWidth: '86%', padding: isPhone ? '0.76rem 0.88rem' : '0.92rem 1rem', borderRadius: 18, fontSize: isPhone ? '0.8rem' : '0.88rem', lineHeight: 1.5, background: 'linear-gradient(135deg,#e8407a,#f472a8)', color: '#fff' }}>What should I do next?</div>
        <div style={{ marginTop: 12, width: 'fit-content', maxWidth: '86%', padding: isPhone ? '0.76rem 0.88rem' : '0.92rem 1rem', borderRadius: 18, fontSize: isPhone ? '0.8rem' : '0.88rem', lineHeight: 1.5, background: 'rgba(255,255,255,0.82)', color: '#451425' }}>Start with the smallest visible step today.</div>
        <div style={{ display: 'inline-flex', marginTop: isPhone ? 12 : 16, padding: '0.62rem 0.94rem', borderRadius: 999, background: 'rgba(240,96,144,0.14)', color: '#d14579', fontSize: isPhone ? '0.76rem' : '0.82rem', fontWeight: 700 }}>Think with Sage</div>
      </div>
    )
  }

  if (slide.id === 'pillars') {
    return (
      <div style={{ ...commonCard, display: 'grid', gap: 10 }}>
        {PILLAR_PRESETS.slice(0, 4).map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}>
            <span style={{ fontSize: '1.1rem' }}>{p.emoji}</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{p.name}</span>
          </div>
        ))}
      </div>
    )
  }

  if (slide.id === 'letter') {
    return (
      <div style={{ ...commonCard, display: 'grid', gap: 12 }}>
        <div style={{ fontSize: '2.5rem', textAlign: 'center' }}>✉️</div>
        <p style={{ margin: 0, fontSize: '0.88rem', lineHeight: 1.65, fontStyle: 'italic', opacity: 0.9 }}>
          "In 90 days, I want you to know that you followed through when it mattered most..."
        </p>
        <div style={{ height: 1, background: 'rgba(255,255,255,0.2)' }} />
        <p style={{ margin: 0, fontSize: '0.76rem', opacity: 0.7 }}>Your words. Sealed for your future self.</p>
      </div>
    )
  }

  return <div style={commonCard} />
}

export default function Onboarding({ userName = 'there', onComplete }) {
  const [step, setStep] = useState(0)
  const [closing, setClosing] = useState(false)
  const [selectedPillars, setSelectedPillars] = useState([])
  const [letterText, setLetterText] = useState('')
  const [letterSealed, setLetterSealed] = useState(false)

  const slide = slides[step] || slides[0]
  const theme = themes[slide.theme] || themes.dark
  const firstName = userName !== 'there' ? String(userName).split(' ')[0] : 'there'
  const welcomeKicker = useMemo(() => `Welcome, ${firstName}`, [firstName])
  const isMobile = typeof window !== 'undefined' ? window.innerWidth <= 900 : false
  const isPhone = typeof window !== 'undefined' ? window.innerWidth <= 540 : false

  function togglePillar(id) {
    setSelectedPillars(current =>
      current.includes(id) ? current.filter(x => x !== id) : current.length < 3 ? [...current, id] : current
    )
  }

  function sealLetter() {
    if (!letterText.trim()) return
    const date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    try {
      localStorage.setItem('phasr_future_letter_p1', JSON.stringify({ message: letterText.trim(), date }))
    } catch {}
    setLetterSealed(true)
  }

  function savePillars() {
    const names = selectedPillars.map(id => PILLAR_PRESETS.find(p => p.id === id)?.name).filter(Boolean)
    try {
      localStorage.setItem('phasr_onboarding_pillars', JSON.stringify(names))
    } catch {}
  }

  function next() {
    if (slide.id === 'pillars') {
      if (selectedPillars.length === 0) return
      savePillars()
    }
    if (slide.id === 'letter' && !letterSealed && letterText.trim()) {
      sealLetter()
    }
    if (step < slides.length - 1) { setStep(c => c + 1); return }
    onComplete?.('later')
  }

  function back() {
    if (step > 0) setStep(c => c - 1)
  }

  function finish(choice) {
    if (closing) return
    setClosing(true)
    try { localStorage.setItem('phasr_calendar_choice', choice) } catch {}
    onComplete?.(choice)
  }

  const canProceed = slide.id === 'pillars' ? selectedPillars.length > 0 : true

  return (
    <>
      <style>{`
        .ob-fade-up { opacity:0; animation:obFadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards; }
        .ob-delay-1 { animation-delay:0.06s; }
        .ob-delay-2 { animation-delay:0.14s; }
        @keyframes obFadeUp { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9000, overflow: 'hidden', background: theme.bg, color: theme.text, fontFamily: "'DM Sans',sans-serif" }}>
        <div style={{ width: 'min(1120px,calc(100% - 32px))', height: '100dvh', margin: '0 auto', padding: isPhone ? '10px 0 96px' : '18px 0 16px', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>

          {/* Top bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: isPhone ? 30 : 38, marginBottom: isPhone ? 8 : 12 }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(1.8rem,3vw,2.6rem)', fontWeight: 600, letterSpacing: '-0.03em' }}>
              {step === 0 ? `Welcome, ${firstName}` : 'Phasr'}
            </div>
            {!slide.isClose && (
              <div style={{ display: 'flex', gap: 7 }}>
                {slides.map((item, index) => (
                  <span key={item.id} style={{ width: index === step ? 28 : 7, height: 7, borderRadius: 999, background: index === step ? '#f06090' : index < step ? 'rgba(240,96,144,0.64)' : 'rgba(255,255,255,0.26)' }} />
                ))}
              </div>
            )}
          </div>

          {/* Close / Calendar slide */}
          {slide.isClose ? (
            <div style={{ flex: 1, display: 'grid', placeItems: 'center', overflowY: isPhone ? 'auto' : 'visible', paddingBottom: isPhone ? 18 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', maxWidth: 520, paddingBottom: isPhone ? 12 : 0 }}>
                <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: isPhone ? '2.45rem' : 'clamp(2.8rem,6vw,4.8rem)', lineHeight: 1, fontWeight: 300, letterSpacing: '-0.04em' }}>{slide.headline}</h1>
                <p style={{ margin: '16px 0 24px', fontSize: isPhone ? '0.95rem' : '1rem', lineHeight: 1.7, color: theme.muted }}>{slide.body}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  <button type="button" onClick={() => finish('connected')} style={primaryButton}>Yes, connect my calendar</button>
                  <button type="button" onClick={() => finish('later')} style={{ ...ghostButton, color: theme.text, borderColor: theme.border }}>Maybe later</button>
                </div>
              </div>
            </div>

          ) : slide.id === 'pillars' ? (
            /* Pillars selection slide */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, overflowY: 'auto', paddingBottom: isPhone ? 120 : 0 }}>
              <div className="ob-fade-up ob-delay-1" style={{ width: '100%', maxWidth: 560, textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', minHeight: 34, padding: '0.38rem 0.85rem', borderRadius: 999, border: `1px solid ${theme.border}`, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: theme.panel, marginBottom: 14 }}>
                  {slide.kicker}
                </div>
                <h1 style={{ margin: '0 0 12px', fontFamily: "'Cormorant Garamond',serif", fontSize: isPhone ? '2.4rem' : 'clamp(2.6rem,6vw,4.2rem)', lineHeight: 1, fontWeight: 300, letterSpacing: '-0.04em' }}>{slide.headline}</h1>
                <p style={{ margin: '0 0 24px', fontSize: '0.96rem', lineHeight: 1.65, color: theme.muted }}>Pick up to 3. You can change these later.</p>
              </div>
              <div className="ob-fade-up ob-delay-2" style={{ display: 'grid', gridTemplateColumns: isPhone ? '1fr 1fr' : 'repeat(3,1fr)', gap: 10, width: '100%', maxWidth: 580 }}>
                {PILLAR_PRESETS.map(p => {
                  const active = selectedPillars.includes(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePillar(p.id)}
                      style={{
                        padding: '14px 12px', borderRadius: 16, border: active ? 'none' : `1px solid ${theme.border}`,
                        background: active ? 'linear-gradient(135deg,#e8407a,#f472a8)' : theme.panel,
                        color: theme.text, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, textAlign: 'center',
                        transition: 'all 0.18s', boxShadow: active ? '0 10px 24px rgba(232,64,122,0.28)' : 'none',
                      }}
                    >
                      <span style={{ fontSize: '1.6rem' }}>{p.emoji}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, lineHeight: 1.2 }}>{p.name}</span>
                      <span style={{ fontSize: '0.7rem', opacity: 0.75, lineHeight: 1.3 }}>{p.details}</span>
                    </button>
                  )
                })}
              </div>
              <div style={{ position: isPhone ? 'fixed' : 'static', bottom: isPhone ? 10 : 'auto', left: isPhone ? 12 : 'auto', right: isPhone ? 12 : 'auto', marginTop: isPhone ? 0 : 24, display: 'flex', justifyContent: 'space-between', gap: 12, width: isPhone ? 'calc(100% - 24px)' : '100%', maxWidth: 580, zIndex: 4 }}>
                <button type="button" onClick={back} style={{ ...ghostButton, color: theme.text, borderColor: theme.border }}>Back</button>
                <button type="button" onClick={next} disabled={!canProceed} style={{ ...primaryButton, opacity: canProceed ? 1 : 0.45 }}>Continue</button>
              </div>
            </div>

          ) : slide.id === 'letter' ? (
            /* Letter to future self slide */
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflowY: 'auto', paddingBottom: isPhone ? 120 : 0 }}>
              <div className="ob-fade-up ob-delay-1" style={{ width: '100%', maxWidth: 520, textAlign: 'center', marginBottom: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', minHeight: 34, padding: '0.38rem 0.85rem', borderRadius: 999, border: `1px solid ${theme.border}`, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: theme.panel, marginBottom: 14 }}>
                  {slide.kicker}
                </div>
                <h1 style={{ margin: '0 0 10px', fontFamily: "'Cormorant Garamond',serif", fontSize: isPhone ? '2.2rem' : 'clamp(2.4rem,5vw,3.8rem)', lineHeight: 1.05, fontWeight: 300, letterSpacing: '-0.04em' }}>{slide.headline}</h1>
                <p style={{ margin: '0 0 20px', fontSize: '0.94rem', lineHeight: 1.65, color: theme.muted }}>{slide.body}</p>
              </div>

              <div className="ob-fade-up ob-delay-2" style={{ width: '100%', maxWidth: 520 }}>
                {letterSealed ? (
                  <div style={{ padding: '20px', borderRadius: 18, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>✉️</div>
                    <p style={{ margin: 0, fontWeight: 800, color: theme.text }}>Letter sealed.</p>
                    <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: theme.muted }}>Sage will share it with you when you complete your first phase.</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={letterText}
                      onChange={e => setLetterText(e.target.value)}
                      placeholder={`In 90 days, I want you to know...`}
                      rows={isPhone ? 5 : 7}
                      style={{
                        width: '100%', boxSizing: 'border-box', borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                        color: theme.text, fontFamily: "'DM Sans',sans-serif",
                        fontSize: '0.96rem', lineHeight: 1.65,
                        padding: '16px', resize: 'none', outline: 'none',
                        marginBottom: 12,
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <button
                        type="button"
                        onClick={sealLetter}
                        disabled={!letterText.trim()}
                        style={{ ...primaryButton, flex: 1, opacity: letterText.trim() ? 1 : 0.45 }}
                      >
                        Seal this letter ✉️
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div style={{ position: isPhone ? 'fixed' : 'static', bottom: isPhone ? 10 : 'auto', left: isPhone ? 12 : 'auto', right: isPhone ? 12 : 'auto', marginTop: isPhone ? 0 : 24, display: 'flex', justifyContent: 'space-between', gap: 12, width: isPhone ? 'calc(100% - 24px)' : '100%', maxWidth: 520, zIndex: 4 }}>
                <button type="button" onClick={back} style={{ ...ghostButton, color: theme.text, borderColor: theme.border }}>Back</button>
                <button type="button" onClick={next} style={primaryButton}>{letterSealed ? 'Continue' : 'Skip for now'}</button>
              </div>
            </div>

          ) : (
            /* Regular slides (phasr, sage, vision) */
            <>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0,1fr) minmax(0,1fr)', alignItems: 'center', gap: isMobile ? 16 : 48, overflowY: isPhone ? 'auto' : 'visible', paddingBottom: isPhone ? 120 : 0 }}>
                <div className="ob-fade-up ob-delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
                  <PreviewCard slide={slide} theme={theme} isPhone={isPhone} />
                </div>

                <div className="ob-fade-up ob-delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: isMobile ? 'center' : 'flex-start', textAlign: isMobile ? 'center' : 'left' }}>
                  <div style={{ display: slide.id === 'phasr' ? 'none' : 'inline-flex', alignItems: 'center', minHeight: 34, padding: '0.38rem 0.85rem', borderRadius: 999, border: `1px solid ${theme.border}`, fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: theme.panel, color: theme.text, marginBottom: 14 }}>
                    {slide.id === 'phasr' ? welcomeKicker : slide.kicker}
                  </div>

                  <h1 style={{ margin: 0, fontFamily: "'Cormorant Garamond',serif", fontSize: isPhone ? '2.7rem' : 'clamp(2.9rem,7vw,5.35rem)', lineHeight: 0.98, fontWeight: 300, letterSpacing: '-0.04em', color: theme.text, textShadow: slide.theme === 'light' ? '0 1px 0 rgba(255,255,255,0.6)' : 'none' }}>
                    {slide.headline}
                  </h1>

                  {slide.id !== 'phasr' && (
                    <p style={{ margin: '16px 0 18px', maxWidth: 500, fontSize: isPhone ? '0.94rem' : '1rem', lineHeight: 1.7, color: theme.muted }}>
                      {slide.body}
                    </p>
                  )}

                  {slide.id === 'phasr' ? (
                    <div style={{ width: '100%', display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end', marginTop: isMobile ? 0 : '0.75rem' }}>
                      <button type="button" onClick={next} style={primaryButton}>Let&apos;s go &rarr;</button>
                    </div>
                  ) : (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, minHeight: 44, padding: '0.68rem 0.98rem', borderRadius: 18, border: `1px solid ${theme.border}`, background: theme.panel }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f06090', flex: '0 0 auto' }} />
                      <span>{slide.detail}</span>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14, paddingTop: isPhone ? 8 : 10, position: isPhone ? 'fixed' : 'static', left: isPhone ? 12 : 'auto', right: isPhone ? 12 : 'auto', bottom: isPhone ? 10 : 'auto', zIndex: isPhone ? 4 : 'auto', background: isPhone ? `linear-gradient(180deg,rgba(255,255,255,0) 0%,${slide.theme === 'light' ? 'rgba(255,247,251,0.98)' : 'rgba(24,7,17,0.88)'} 100%)` : 'transparent', backdropFilter: isPhone ? 'blur(10px)' : 'none', WebkitBackdropFilter: isPhone ? 'blur(10px)' : 'none', borderRadius: isPhone ? 20 : 0, padding: isPhone ? '12px 12px 10px' : undefined, boxShadow: isPhone ? '0 -12px 30px rgba(0,0,0,0.08)' : 'none' }}>
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
  minHeight: 46, padding: '0.76rem 1.1rem', borderRadius: 999, border: 'none',
  background: 'linear-gradient(135deg,#e8407a,#f472a8)', color: '#fff',
  font: 'inherit', fontWeight: 700, cursor: 'pointer', boxShadow: '0 14px 30px rgba(232,64,122,0.28)',
}

const ghostButton = {
  minHeight: 46, padding: '0.76rem 1.1rem', borderRadius: 999,
  background: 'transparent', border: '1px solid rgba(255,255,255,0.22)',
  font: 'inherit', fontWeight: 700, cursor: 'pointer',
}
