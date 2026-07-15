import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import { Flame, LayoutGrid, ArrowRight, Layers, Volume2, VolumeX } from 'lucide-react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'
import SageIntroBubble from '../components/marketing/SageIntroBubble'

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.15 },
  transition: { duration: 0.5, ease: 'easeOut', delay },
})

/* ─────────────── Hero cards — gently bob, as if drifting off the phone ─────────────── */
function FloatingCard({ className, delay = 0, floatDelay = 0, children }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={`lp-hero-card ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      <motion.div
        animate={reduced ? {} : { y: [0, -12, 0] }}
        transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity, delay: delay + floatDelay + 0.6 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ─────────────── How It Works mock cards ─────────────── */
function PhaseCard() {
  return (
    <div className="lp-mock-card">
      <div className="lp-mock-label">JANUARY PHASE</div>
      <div className="lp-mock-title">Land the role</div>
      <div className="lp-mock-bar-track"><div className="lp-mock-bar" style={{ width: '72%' }} /></div>
      <div className="lp-mock-meta">72% · 18 days in</div>
      <div className="lp-mock-pills">
        <span className="lp-mock-pill">Portfolio</span>
        <span className="lp-mock-pill">Interviews</span>
        <span className="lp-mock-pill">Networking</span>
      </div>
    </div>
  )
}

function CheckinCard() {
  return (
    <div className="lp-mock-card">
      <div className="lp-mock-label">TODAY'S CHECK-IN</div>
      <div className="lp-mock-streak-row">
        {[1,1,1,1,0,1,1].map((a,i) => (
          <div key={i} className={`lp-mock-dot${a ? ' active' : ''}`} />
        ))}
      </div>
      <div className="lp-mock-title" style={{ fontSize:15, display:'flex', alignItems:'center', gap:6 }}>
        6-day streak <Flame size={14} color="#f06090" />
      </div>
      <div className="lp-mock-checkin-q">What did you move forward today?</div>
      <div className="lp-mock-checkin-input">Applied to 2 jobs and updated LinkedIn...</div>
    </div>
  )
}

function WeeklyReflectCard() {
  return (
    <div className="lp-mock-card">
      <div className="lp-mock-label">WEEKLY REFLECTION</div>
      <div className="lp-mock-title">Your Sunday reset</div>
      <div className="lp-mock-checkin-q">Sage's note:</div>
      <div className="lp-mock-checkin-input">"You showed up 5 of 7 days — Tuesdays are still the hard one. Let's plan around that this week."</div>
      <div className="lp-mock-pills">
        <span className="lp-mock-pill">Wins</span>
        <span className="lp-mock-pill">Adjust</span>
        <span className="lp-mock-pill">Next week</span>
      </div>
    </div>
  )
}

const HOW_STEPS = [
  { label:'Set your phase', headline:'Pick the goal that matters most right now.', body:"Sage turns it into phases, weekly non-negotiables, and today's first step, so there's always something to actually do.", Visual:PhaseCard },
  { label:'Show up daily', headline:'One small thing a day.', body:'Miss a day, and Sage picks the plan back up with you the next time you open the app instead of wiping your streak.', Visual:CheckinCard },
  { label:'See it working', headline:'Every Sunday Sage shows you what moved.', body:'At the end of the phase, you see the person you became.', Visual:WeeklyReflectCard },
]

const SAGE_LETTER_INTRO = "Hi, my name is Sage. Nice to meet you."

const SAGE_LETTER_BODY = [
  "You already know what it's like to do this alone. To set the goal, lose the thread, and carry the disappointment quietly into next year. I'm the part that makes sure this year ends differently.",
  "I stay. Through the good weeks and the ones where you go quiet. I'll never make you feel behind for living your life, and I'll never let you talk yourself out of something you actually want.",
  "The first women in are the ones I grow with, and they lock in founding access before anyone else. You've spent years starting over. Come start something that finishes.",
]

const FEATURES = [
  { Icon:LayoutGrid, name:'Vision Board', front:'Map it', back:"You've made these before and watched them collect dust. With PHASR, that vision becomes something you actually work from.", href:'/features/vision-boards' },
  { Icon:Flame, name:'Daily Streak', front:'Show up daily', back:'Proof you followed through on the plan Sage and your board just built.', href:'/features/daily-streaks' },
  { Icon:Layers, name:'Weekly Phase', front:'Cut it down', back:'Your goal, cut into phases short enough to finish. One at a time, so you never face the whole mountain at once.', href:'/features/dashboard' },
]

const FAQ_ITEMS = [
  { q:'Is PHASR free?', a:'Yes, you can start free. Founding members lock in early pricing when paid plans launch.' },
  { q:'What does Sage actually do?', a:'She builds your plan, checks in daily, reflects with you every week, and remembers everything so her advice fits you and not some average user.' },
  { q:'What if I miss a few days?', a:'Nothing breaks. Sage picks the plan back up with you the next time you open the app.' },
  { q:'Is my journal private?', a:'Yes. Your journal and your conversations are yours, private and encrypted, and you can delete them anytime.' },
  { q:'When does PHASR launch?', a:"We're opening in phases. Join the waitlist to be first in and lock in founding pricing." },
]

const PAIN_POINTS = [
  "You've tried everything — the journals, the apps, the challenges. Nothing stuck.",
  'The problem was never motivation. It was never having a real system behind the intention.',
]

/* ─────────────── Marketing Ticker ─────────────── */
function StatsTicker() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px' })
  const reduced = useReducedMotion()
  const items = [
    "Your vision, turned into today's task",
    'Sage remembers everything, so you never explain yourself twice',
    'One goal, one phase, one clear next step',
    'For women who are done starting over',
    'From vision to done',
  ]
  const doubled = [...items, { sep:true }, ...items, { sep:true }]
  return (
    <div className="lp-ticker" ref={ref} aria-hidden="true">
      <motion.div
        className="lp-ticker-track"
        animate={reduced ? {} : inView ? { x: ['0%', '-50%'] } : false}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) =>
          item.sep ? (
            <span key={i} className="lp-ticker-sep">·</span>
          ) : (
            <span key={i} className="lp-ticker-item">
              <span className="lp-ticker-label">{item}</span>
            </span>
          )
        )}
      </motion.div>
    </div>
  )
}

/* ─────────────── Six tools flip card ─────────────── */
function ToolFlipCard({ tool, index }) {
  const [flipped, setFlipped] = useState(false)
  const toggle = () => setFlipped(f => !f)
  return (
    <motion.div className="lp-flip-outer" {...fade(index * 0.06)}>
      <div
        className="lp-flip-card"
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={`${tool.name} — tap to see the benefit`}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() } }}
      >
        <motion.div
          className="lp-flip-inner"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.55, ease: [0.4, 0.2, 0.2, 1] }}
        >
          <div className="lp-flip-face lp-flip-front">
            {tool.photo
              ? <img src="/images/sage-avatar.png" alt="" className="lp-flip-photo" />
              : <div className="lp-flip-icon"><tool.Icon size={20} strokeWidth={1.8} /></div>}
            <div className="lp-flip-name">{tool.name}</div>
            <div className="lp-flip-front-sub">{tool.front}</div>
            <div className="lp-flip-tap">Tap to see why ⟳</div>
          </div>
          <div className="lp-flip-face lp-flip-back">
            <p className="lp-flip-back-text">{tool.back}</p>
            <Link to={tool.href} className="lp-flip-back-link" onClick={(e) => e.stopPropagation()}>
              Learn more <ArrowRight size={12} />
            </Link>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ─────────────── Main page ─────────────── */
export default function LandingPage({ onGetStarted }) {
  const [activeStep, setActiveStep] = useState(0)
  const [faqOpen, setFaqOpen] = useState(null)
  const [heroPosterReady, setHeroPosterReady] = useState(false)
  const [sageVideoMuted, setSageVideoMuted] = useState(true)
  const reducedMotion = useReducedMotion()
  const sagePhotoRef = useRef(null)
  const sageVideoRef = useRef(null)
  const sageVideoInView = useInView(sagePhotoRef, { amount: 0.6 })

  function toggleSageVideoSound() {
    const el = sageVideoRef.current
    if (!el) return
    const next = !sageVideoMuted
    el.muted = next
    if (!next) el.play().catch(() => {})
    setSageVideoMuted(next)
  }

  // Sage talks when her video is actually on screen, and goes quiet the moment
  // it scrolls away — no need to hunt for the mute button to hear her.
  useEffect(() => {
    const el = sageVideoRef.current
    if (!el) return
    el.muted = !sageVideoInView
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the video element's own muted state, not derived React data
    setSageVideoMuted(!sageVideoInView)
    if (sageVideoInView) el.play().catch(() => {})
  }, [sageVideoInView])

  // Gate the hero phone's entrance on the poster frame actually being loaded —
  // without this the fade-in can start before the video/poster is ready, so the
  // phone flashes blank before the video pops in. A timeout fallback keeps the
  // hero from staying hidden if the image is slow or fails to load.
  useEffect(() => {
    let settled = false
    const finish = () => { if (!settled) { settled = true; setHeroPosterReady(true) } }
    const img = new Image()
    img.onload = finish
    img.onerror = finish
    img.src = '/images/hero-screen-poster.jpg'
    const fallback = setTimeout(finish, 1200)
    return () => clearTimeout(fallback)
  }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>
      <main>

        {/* ── 1. HERO (dark) ── */}
        <section className="lp-hero" aria-labelledby="lp-h1">
          <div className="lp-hero-inner lp-container">

            {/* Left */}
            <div className="lp-hero-left">
              <motion.span className="lp-eyebrow lp-hero-eyebrow"
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.6, ease:'easeOut' }}>
                YOUR MONTHLY SYSTEM
              </motion.span>
              <motion.h1 id="lp-h1" className="lp-hero-h1"
                initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.75, ease:'easeOut', delay:0.15 }}>
                The vision was never<br /><em>the problem.</em>
              </motion.h1>
              <motion.p className="lp-hero-sub"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.7, ease:'easeOut', delay:0.3 }}>
                PHASR turns your biggest goal into a clear plan you can actually follow. Sage keeps you moving every step of the way.
              </motion.p>
              <motion.div className="lp-hero-btns"
                initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.65, ease:'easeOut', delay:0.45 }}>
                <motion.button className="lp-btn-hero-primary" onClick={onGetStarted}
                  whileHover={{ scale:1.03, boxShadow:'0 8px 28px rgba(0,0,0,0.25)' }} whileTap={{ scale:0.97 }}>
                  Join the waitlist
                </motion.button>
                <motion.button className="lp-btn-hero-ghost"
                  onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior:'smooth' })}
                  whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
                  See how it works
                </motion.button>
              </motion.div>
              <motion.p className="lp-hero-trust"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.75 }}>
                Built for women who are done starting over.
              </motion.p>
            </div>

            <div className="lp-hero-divider" aria-hidden="true" />

            {/* Right — hand+phone composite: static photo + screen video + emerging cards */}
            <div className="lp-hero-right">
              <div className="lp-hero-glow" aria-hidden="true" />
              <motion.div className="lp-hero-mockup-wrap"
                initial={{ opacity:0, y:40 }}
                animate={heroPosterReady ? { opacity:1, y:0 } : {}}
                transition={{ duration:0.9, ease:'easeOut', delay:0.2 }}>
                <div className="lp-hero-photo-wrap">
                  <video
                    src="/hero-screen.mp4"
                    poster="/images/hero-screen-poster.jpg"
                    autoPlay muted loop playsInline preload="auto"
                    className="lp-hero-screen-video"
                    aria-label="PHASR app preview"
                    onPause={(e) => { if (!e.target.ended) e.target.play().catch(() => {}) }}
                  />
                  <img
                    src="/images/hero-hand-phone.png"
                    alt="Hand holding a phone showing the PHASR app"
                    className="lp-hero-hand-img"
                  />

                  {/* Mobile-only: a small notification card pinned to the phone's top-right
                      tip, clear of the screen crop, wobbling gently like a message ping.
                      Hidden on desktop via CSS — the 4 fanned cards below handle that view. */}
                  <motion.div
                    className="lp-hero-mobile-ping"
                    aria-hidden="true"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.8 }}
                  >
                    <motion.div
                      className="lp-hero-mobile-ping-card"
                      animate={reducedMotion ? {} : { x: [0, -4, 4, -2, 0] }}
                      transition={reducedMotion ? {} : { duration: 3.2, ease: 'easeInOut', repeat: Infinity, delay: 1.2 }}
                    >
                      <span className="lp-hero-mobile-ping-label">Sage</span>
                      <span className="lp-hero-mobile-ping-text">"6-day streak 💗"</span>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              <FloatingCard className="lp-hero-card-1" delay={0.55}>
                <div className="lp-hcard-label">Daily Streak</div>
                <div className="lp-hcard-streak-num">24</div>
                <div className="lp-hcard-streak-label"><Flame size={13} color="#f06090" style={{ verticalAlign:'-2px', marginRight:4 }} />days in a row</div>
              </FloatingCard>

              <FloatingCard className="lp-hero-card-2" delay={0.7} floatDelay={0.6}>
                <div className="lp-hcard-label" style={{ marginBottom:2 }}>New Sage Insight</div>
                <div className="lp-hcard-sage-text">"You've been showing up even on the hard days — that's the pattern that matters."</div>
              </FloatingCard>

              <FloatingCard className="lp-hero-card-3" delay={0.85} floatDelay={1.1}>
                <div className="lp-hcard-label"><LayoutGrid size={12} style={{ verticalAlign:'-2px', marginRight:4 }} />AI Vision Updated</div>
                <div className="lp-hcard-title">Career phase refreshed</div>
                <div className="lp-hcard-bar-track"><div className="lp-hcard-bar" style={{ width:'82%' }} /></div>
                <div className="lp-hcard-meta">82% aligned to your vision</div>
              </FloatingCard>

              <FloatingCard className="lp-hero-card-4" delay={1.0} floatDelay={1.6}>
                <div className="lp-hcard-label">Accountability Partner</div>
                <div className="lp-hcard-avatars">
                  <img src="/images/avatars/avatar-3.jpg" alt="" className="lp-hcard-av-img" />
                  <img src="/images/avatars/avatar-2.jpg" alt="" className="lp-hcard-av-img" />
                </div>
                <div className="lp-hcard-msg">"Nudged you — go finish today's check-in 💗"</div>
              </FloatingCard>
            </div>

          </div>
        </section>

        {/* ── 2. STATS TICKER ── */}
        <StatsTicker />

        {/* ── 3. PAIN POINT ── */}
        <section className="lp-problem" aria-labelledby="lp-prob-h2">
          <div className="lp-container lp-prob-grid">
            <div className="lp-prob-text">
              <motion.span className="lp-eyebrow" {...fade()}>THE REAL PROBLEM</motion.span>
              <motion.h2 id="lp-prob-h2" className="lp-prob-h2" {...fade(0.08)}>
                You've tried everything, and you<br />
                still have <em>nothing to show for the year.</em>
              </motion.h2>
              <motion.p className="lp-prob-sub" {...fade(0.14)}>
                You've downloaded the apps. Bought the planner. Made the vision board.
                And not one of them ever checked whether you actually follow through.
              </motion.p>
              <div className="lp-prob-list">
                {PAIN_POINTS.map((p, i) => (
                  <motion.p key={i} className="lp-prob-item"
                    initial={{ opacity:0, y:12 }}
                    whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true, margin:'-40px' }}
                    transition={{ duration:0.5, ease:'easeOut', delay:i * 0.08 }}>
                    <span className="lp-prob-dot">·</span>{p}
                  </motion.p>
                ))}
              </div>
              <motion.p className="lp-prob-pivot" {...fade(0.1)}>
                Vision was never your problem.<br />
                Not having <em>clear action steps</em> was.
              </motion.p>
            </div>
            <motion.div className="lp-prob-img-wrap" {...fade(0.15)}>
              <img src="/images/girlboss-2.jpg" alt="Two women in a bright, editorial space with Phasr branded boxes" className="lp-prob-img" />
            </motion.div>
          </div>
        </section>

        {/* ── 4. HOW IT WORKS ── */}
        <section id="how-it-works" className="lp-how" aria-labelledby="lp-how-h2">
          <div className="lp-container">
            <motion.span className="lp-eyebrow" {...fade()}>HOW IT WORKS</motion.span>
            <motion.h2 id="lp-how-h2" className="lp-section-display lp-how-h2" {...fade(0.05)}>
              How you <em>finish</em> this time.
            </motion.h2>
            <motion.p className="lp-how-intro" {...fade(0.1)}>
              You pick one goal. Sage builds the plan. You get one thing to do today.
            </motion.p>

            <div className="lp-how-tabs" role="tablist" aria-label="How PHASR works">
              {HOW_STEPS.map((s, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={activeStep === i}
                  className={`lp-how-tab${activeStep === i ? ' active' : ''}`}
                  onClick={() => setActiveStep(i)}
                >
                  <span className="lp-how-tab-num">Step {i + 1}</span>
                  <span className="lp-how-tab-label">{s.label}</span>
                </button>
              ))}
            </div>

            <div className="lp-how-stage">
              <AnimatePresence mode="wait" initial={false}>
                {HOW_STEPS.filter((_, i) => i === activeStep).map((s) => {
                  const V = s.Visual
                  return (
                    <motion.div
                      key={activeStep}
                      className="lp-how-block"
                      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -24 }}
                      transition={{ duration: 0.32, ease: 'easeOut' }}
                    >
                      <div className="lp-how-block-text">
                        <h3 className="lp-how-headline">{s.headline}</h3>
                        <p className="lp-how-body">{s.body}</p>
                      </div>
                      <div className="lp-how-block-visual">
                        <div className="lp-how-visual-glow" aria-hidden="true" />
                        <V />
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── 6. MEET SAGE (the anchor) ── */}
        <section className="lp-sage-anchor" aria-labelledby="lp-sage-h2">
          <div className="lp-container">
            <motion.h2 id="lp-sage-h2" className="lp-sage-h2" {...fade()}>Meet Sage, <em>Your AI Coach</em></motion.h2>
            <motion.p className="lp-sage-sub" {...fade(0.03)}>Always remembers. Always honest. Always moving with you.</motion.p>

            <div className="lp-sage-top">
              <motion.div className="lp-sage-video-col" ref={sagePhotoRef} {...fade(0.05)}>
                <div className="lp-sage-visual-frame">
                  <video
                    ref={sageVideoRef}
                    src="/sage-intro.mp4"
                    className="lp-sage-visual-img"
                    autoPlay muted loop playsInline preload="auto"
                    aria-label="Sage introducing herself"
                    onPause={(e) => { if (!e.target.ended) e.target.play().catch(() => {}) }}
                  />
                  <button
                    type="button"
                    className="lp-sage-sound-btn"
                    onClick={toggleSageVideoSound}
                    aria-label={sageVideoMuted ? 'Turn on Sage’s voice' : 'Mute Sage’s voice'}
                  >
                    {sageVideoMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                </div>
              </motion.div>

              <motion.div className="lp-sage-content-col" {...fade(0.1)}>
                <p className="lp-sage-letter-intro">{SAGE_LETTER_INTRO}</p>
                {SAGE_LETTER_BODY.map((p, i) => (
                  <p key={i} className="lp-sage-letter-body">{p}</p>
                ))}

                <button
                  type="button"
                  className="lp-sage-anchor-cta"
                  onClick={() => window.dispatchEvent(new CustomEvent('phasr:open-sage'))}
                >
                  Talk to Sage
                </button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── 7. THE VISION BOARD ── */}
        <section id="vision-board" className="lp-features" aria-labelledby="lp-feat-h2">
          <div className="lp-container">
            <div className="lp-feat-header">
              <motion.span className="lp-eyebrow" {...fade()}>THE VISION BOARD</motion.span>
              <motion.h2 id="lp-feat-h2" className="lp-section-display lp-feat-h2" {...fade(0.05)}>
                Your vision board,<br />but it actually <em>does something.</em>
              </motion.h2>
              <motion.p className="lp-feat-intro" {...fade(0.1)}>
                Put in the life you want. Sage reads it and builds the plan to get there: your phases, your weekly non-negotiables, and today's step.
              </motion.p>
            </div>

            <motion.div className="lp-feat-showcase" {...fade(0.1)}>
              <img
                src="/images/product-vision-dailystreak.png"
                alt="PHASR Vision Board and Daily Streak screens, side by side"
                className="lp-feat-showcase-img"
              />
            </motion.div>

            <div className="lp-flip-grid">
              {FEATURES.map((f, i) => (
                <ToolFlipCard key={f.name} tool={f} index={i} />
              ))}
            </div>

            <motion.div className="lp-feat-all-wrap" {...fade(0.35)}>
              <Link to="/features" className="lp-feat-all-link">
                See everything PHASR can do <ArrowRight size={14} />
              </Link>
              <span className="lp-feat-all-micro">There's more inside.</span>
            </motion.div>
          </div>
        </section>

        {/* ── 8. FAQ ── */}
        <section className="lp-faq" aria-labelledby="lp-faq-h2">
          <div className="lp-container lp-faq-inner">
            <motion.h2 id="lp-faq-h2" className="lp-section-display lp-faq-heading" {...fade(0.05)}>
              Quick answers for <em>curious women.</em>
            </motion.h2>
            <div className="lp-faq-list">
              {FAQ_ITEMS.map(({ q, a }, i) => (
                <motion.div key={i} className={`lp-faq-item${faqOpen===i ? ' open' : ''}`} {...fade(i*0.05)}>
                  <button className="lp-faq-q" onClick={() => setFaqOpen(faqOpen===i ? null : i)} aria-expanded={faqOpen===i}>
                    <span>{q}</span>
                    <span className="lp-faq-icon">{faqOpen===i ? '−' : '+'}</span>
                  </button>
                  {faqOpen===i && <p className="lp-faq-a">{a}</p>}
                </motion.div>
              ))}
            </div>
            <motion.p className="lp-faq-more" {...fade(0.2)}>
              More questions? <Link to="/faq" className="lp-faq-link">See the full FAQ →</Link>
            </motion.p>
          </div>
        </section>

        {/* ── 9. FINAL CTA ── */}
        <section className="lp-final-cta" aria-labelledby="lp-final-h2">
          <div className="lp-container lp-final-cta-inner">
            <motion.span className="lp-eyebrow lp-final-cta-eyebrow" {...fade()}>YOUR NEXT CHAPTER</motion.span>
            <motion.h2 id="lp-final-h2" className="lp-section-display lp-final-cta-h2" {...fade(0.05)}>
              Are you ready to start <em>working on your dreams?</em>
            </motion.h2>
            <motion.p className="lp-final-cta-sub" {...fade(0.1)}>
              Join the women who make sure every action counts.
            </motion.p>
            <motion.button className="lp-final-cta-btn" onClick={onGetStarted} {...fade(0.15)}
              whileHover={{ scale:1.03, boxShadow:'0 8px 28px rgba(0,0,0,0.18)' }} whileTap={{ scale:0.97 }}>
              Join the waitlist
            </motion.button>
            <motion.p className="lp-final-cta-trust" {...fade(0.2)}>
              Founding members are joining now.
            </motion.p>
          </div>
        </section>

      </main>

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: FAQ_ITEMS.map(({ q, a }) => ({
            '@type': 'Question',
            name: q,
            acceptedAnswer: { '@type': 'Answer', text: a },
          })),
        })}
      </script>

      <SageIntroBubble />
    </MarketingLayout>
  )
}

/* ═══════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════ */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .lp-container { max-width: 1120px; margin: 0 auto; padding: 0 32px; }

  /* ── Shared text ── */
  .lp-section-display {
    font-family: 'Fraunces', serif;
    font-size: clamp(30px, 4vw, 50px);
    font-weight: 700; color: #3d1020;
    line-height: 1.14; letter-spacing: -0.01em; text-wrap: balance;
  }
  .lp-section-display em {
    font-style: italic;
    color: #c2185b;
  }
  .lp-eyebrow {
    display: block; font-family: 'General Sans', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #f06090; margin-bottom: 16px;
  }
  .lp-eyebrow-pink { color: #f06090; }

  /* ── Buttons ── */
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: #c2185b; color: #fff;
    font-family: 'General Sans', sans-serif; font-size: 15px; font-weight: 700;
    padding: 13px 28px; border-radius: 12px; border: none; cursor: pointer;
    transition: background 0.2s; text-decoration: none;
  }
  .lp-btn-primary:hover { background: #a8124e; }

  /* ─────────────────────────────────────────────────
     HERO
  ───────────────────────────────────────────────── */
  .lp-hero {
    background: #ffffff;
    min-height: 100vh;
    margin-top: -80px;
    padding-top: 80px;
    display: flex; align-items: center;
    position: relative; overflow: visible;
  }
  .lp-hero-inner {
    display: grid; grid-template-columns: 1fr 1px 1.2fr; gap: 48px;
    align-items: stretch; padding: 100px 32px 20px;
    width: 100%; position: relative; z-index: 1;
    min-height: calc(100vh - 80px);
  }
  .lp-hero-divider {
    width: 1px; height: 100%;
    background: linear-gradient(180deg, transparent 0%, rgba(240,96,144,0.3) 18%, rgba(240,96,144,0.3) 82%, transparent 100%);
  }
  .lp-hero-left { display: flex; flex-direction: column; justify-content: center; min-width: 0; }
  .lp-hero-eyebrow { margin-bottom: 14px; }
  .lp-hero-h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(36px, 3.8vw, 54px);
    font-weight: 700; color: #3d1020;
    line-height: 1.1; letter-spacing: -0.03em;
    margin-bottom: 20px; text-wrap: balance;
  }
  .lp-hero-h1 em { font-style: italic; color: #f06090; }
  .lp-hero-sub {
    font-family: 'General Sans', sans-serif;
    font-size: 16px; font-weight: 500; color: #8a5060;
    line-height: 1.6; margin-bottom: 36px; max-width: 440px;
  }
  .lp-hero-btns { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
  .lp-btn-hero-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: #c2185b; color: #ffffff;
    font-family: 'General Sans', sans-serif; font-size: 15px; font-weight: 700;
    padding: 14px 32px; border-radius: 12px; border: none; cursor: pointer;
    transition: background 0.18s;
  }
  .lp-btn-hero-primary:hover { background: #a8124e; }
  .lp-btn-hero-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: #c2185b;
    font-family: 'General Sans', sans-serif; font-size: 15px; font-weight: 500;
    padding: 13px 28px; border-radius: 12px;
    border: 1.5px solid rgba(194,24,91,0.35); cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .lp-btn-hero-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
  .lp-hero-trust {
    font-family: 'General Sans', sans-serif;
    font-size: 13px; color: #b08090;
  }

  /* Immersive product video panel */
  .lp-hero-right {
    position: relative;
    display: flex; align-items: flex-end; justify-content: center;
    min-height: 520px; min-width: 0;
    padding-bottom: 0;
  }
  .lp-hero-glow {
    position: absolute;
    width: 130%; height: 110%;
    background: radial-gradient(ellipse 55% 60% at 50% 42%, rgba(240,96,144,0.32) 0%, rgba(240,96,144,0.14) 45%, transparent 75%);
    filter: blur(30px);
    z-index: 0; pointer-events: none;
  }
  .lp-hero-mockup-wrap {
    position: relative; z-index: 1;
    width: 100%; height: 100%;
    display: flex; align-items: flex-end; justify-content: center;
  }
  .lp-hero-photo-wrap {
    position: relative; z-index: 1;
    width: 100%; max-width: 520px;
    aspect-ratio: 1075 / 1074;
    margin: 0 auto -52px;
  }
  .lp-hero-hand-img {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    object-fit: contain;
    display: block; z-index: 2;
    pointer-events: none;
  }
  .lp-hero-screen-video {
    position: absolute;
    left: 28.5%; top: 12%; width: 39%; height: 77%;
    object-fit: cover; object-position: 50% 0%;
    background: #1a0a10;
    z-index: 1;
  }
  .lp-hero-card {
    position: absolute; z-index: 3;
    background: linear-gradient(150deg, rgba(255,255,255,0.5) 0%, rgba(255,235,242,0.22) 100%);
    backdrop-filter: blur(28px) saturate(1.7);
    -webkit-backdrop-filter: blur(28px) saturate(1.7);
    border: 1px solid rgba(255,255,255,0.75);
    border-top-color: rgba(255,255,255,0.98);
    border-radius: 20px; padding: 16px 18px; color: #3d1020;
    box-shadow:
      0 8px 28px rgba(194,24,91,0.16),
      0 24px 56px rgba(194,24,91,0.12),
      inset 0 1.5px 0 rgba(255,255,255,0.98),
      inset 0 -14px 26px -16px rgba(255,255,255,0.5);
    min-width: 180px; max-width: 215px;
  }
  /* Fanned out above/beside the phone — horizontally clear of the screen band, never over it */
  .lp-hero-card-1 { top: -2%; left: -18%; }
  .lp-hero-card-2 { top: 26%; left: -12%; }
  .lp-hero-card-3 { top: -6%; right: -16%; }
  .lp-hero-card-4 { top: 22%; right: -12%; }

  /* Mobile-only notification card — positioned relative to the phone photo itself
     (not the wider hero column) so it stays pinned to the phone's tip at any width. */
  .lp-hero-mobile-ping { display: none; }

  /* Card internals */
  .lp-hcard-label {
    font-family: 'General Sans', sans-serif; font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b;
    margin-bottom: 8px;
  }
  .lp-hcard-title {
    font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
    color: #3d1020; margin-bottom: 10px;
  }
  .lp-hcard-bar-track { height: 4px; background: rgba(240,96,144,0.18); border-radius: 100px; overflow: hidden; margin-bottom: 7px; }
  .lp-hcard-bar { height: 100%; background: #f06090; border-radius: 100px; }
  .lp-hcard-meta { font-family: 'General Sans', sans-serif; font-size: 12.5px; color: #8a5060; }
  .lp-hcard-sage-text { font-family: 'Fraunces', serif; font-size: 14.5px; color: #3d1020; line-height: 1.55; font-style: italic; }
  .lp-hcard-streak-num { font-family: 'Fraunces', serif; font-size: 52px; font-weight: 700; color: #c2185b; line-height: 1; }
  .lp-hcard-streak-label { font-family: 'General Sans', sans-serif; font-size: 13px; color: #8a5060; margin-top: 6px; }
  .lp-hcard-avatars { display: flex; align-items: center; margin: 4px 0 10px; }
  .lp-hcard-av-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.9); margin-left: -10px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(61,16,32,0.15); }
  .lp-hcard-av-img:first-child { margin-left: 0; }
  .lp-hcard-msg { font-family: 'General Sans', sans-serif; font-size: 13.5px; color: #3d1020; font-style: italic; line-height: 1.5; }

  /* ─────────────────────────────────────────────────
     STATS TICKER
  ───────────────────────────────────────────────── */
  .lp-ticker {
    position: relative; z-index: 5;
    width: 100%; overflow: hidden;
    background: #f06090; padding: 18px 0;
  }
  .lp-ticker-track {
    display: inline-flex; align-items: center;
    white-space: nowrap; will-change: transform;
  }
  .lp-ticker-item {
    display: inline-flex; align-items: center;
    gap: 10px; padding: 0 48px; flex-shrink: 0;
  }

  .lp-ticker-label { font-family: 'Fraunces', serif; font-style: italic; font-size: 17px; color: #ffffff; }
  .lp-ticker-sep { font-size: 18px; color: rgba(255,255,255,0.45); padding: 0 24px; flex-shrink: 0; }

  /* ─────────────────────────────────────────────────
     PROBLEM NAMING
  ───────────────────────────────────────────────── */
  .lp-problem { background: #ffffff; padding: 72px 0; }
  .lp-prob-grid { display: grid; grid-template-columns: 1.1fr 0.8fr; gap: 72px; align-items: center; }
  .lp-prob-text { text-align: left; min-width: 0; }
  .lp-prob-h2 {
    font-family: 'Fraunces', serif;
    font-size: clamp(32px, 4vw, 48px);
    font-weight: 700; color: #3d1020;
    line-height: 1.15; letter-spacing: -0.02em;
    margin-bottom: 24px; text-wrap: balance;
  }
  .lp-prob-h2 em { font-style: italic; color: #c2185b; }
  .lp-prob-sub {
    font-family: 'General Sans', sans-serif; font-size: 17px;
    color: rgba(61,16,32,0.68); line-height: 1.7;
    max-width: 480px; margin: 0 0 40px;
  }
  .lp-prob-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 40px; }
  .lp-prob-item {
    font-family: 'General Sans', sans-serif; font-size: 16px;
    color: rgba(61,16,32,0.8); padding: 0;
    display: flex; align-items: baseline; gap: 12px; justify-content: flex-start;
    text-align: left; max-width: 480px; width: 100%;
  }
  .lp-prob-dot { color: #f06090; font-size: 20px; flex-shrink: 0; line-height: 1; }
  .lp-prob-pivot {
    font-family: 'Fraunces', serif;
    font-size: clamp(22px, 2.6vw, 28px); font-weight: 600;
    color: #3d1020; line-height: 1.4; letter-spacing: -0.01em;
    max-width: 480px;
  }
  .lp-prob-pivot em { font-style: italic; color: #f06090; }
  .lp-prob-img-wrap { width: 100%; max-width: 100%; min-width: 0; }
  .lp-prob-img {
    width: 100%; max-width: 100%; height: auto; max-height: 640px; display: block;
    border-radius: 24px; object-fit: cover;
    box-shadow: 0 12px 30px rgba(61,16,32,0.10);
  }

  /* ─────────────────────────────────────────────────
     HOW IT WORKS
  ───────────────────────────────────────────────── */
  .lp-how { background: linear-gradient(180deg, #ffffff 0%, #fff0f5 50%, #ffffff 100%); padding: 64px 0 24px; }
  .lp-how-h2 { margin-bottom: 12px; }
  .lp-how-intro { font-family: 'General Sans', sans-serif; font-size: 16px; color: #8a5060; line-height: 1.6; max-width: 480px; margin-bottom: 32px; }
  .lp-how-tabs { display: flex; gap: 8px; margin-bottom: 36px; flex-wrap: wrap; }
  .lp-how-tab { display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 100px; border: 1.5px solid rgba(240,96,144,0.18); background: #fff; cursor: pointer; text-align: left; transition: background 0.2s, border-color 0.2s; }
  .lp-how-tab:hover { border-color: rgba(194,24,91,0.4); }
  .lp-how-tab.active { background: #c2185b; border-color: #c2185b; }
  .lp-how-tab-num { font-family: 'General Sans', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: #c2185b; }
  .lp-how-tab.active .lp-how-tab-num { color: rgba(255,255,255,0.8); }
  .lp-how-tab-label { font-family: 'General Sans', sans-serif; font-size: 13.5px; font-weight: 600; color: #3d1020; }
  .lp-how-tab.active .lp-how-tab-label { color: #fff; }
  .lp-how-stage { position: relative; min-height: 340px; }
  .lp-how-block {
    display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
  }
  .lp-how-headline { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #3d1020; line-height: 1.25; margin-bottom: 14px; }
  .lp-how-body { font-family: 'General Sans', sans-serif; font-size: 16px; color: #8a5060; line-height: 1.7; }
  .lp-how-block-text { min-width: 0; }
  .lp-how-block-visual { position: relative; min-width: 0; }
  .lp-how-visual-glow { position: absolute; inset: -32px; border-radius: 50%; background: radial-gradient(circle, rgba(240,96,144,0.12) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .lp-how-block-visual > *:not(.lp-how-visual-glow) { position: relative; z-index: 1; }

  /* Mock cards */
  .lp-mock-card {
    background: linear-gradient(150deg, rgba(255,225,235,0.50) 0%, rgba(240,96,144,0.16) 48%, rgba(194,24,91,0.22) 100%);
    backdrop-filter: blur(18px) saturate(1.5); -webkit-backdrop-filter: blur(18px) saturate(1.5);
    border: 1px solid rgba(240,155,175,0.40); border-top-color: rgba(255,240,248,0.80);
    border-radius: 18px; padding: 20px;
    box-shadow: 0 4px 20px rgba(194,24,91,0.16), 0 16px 40px rgba(194,24,91,0.08), inset 0 1.5px 0 rgba(255,255,255,0.90);
  }
  .lp-mock-label { font-family: 'General Sans', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #c2185b; margin-bottom: 8px; }
  .lp-mock-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #3d1020; margin-bottom: 12px; }
  .lp-mock-bar-track { height: 4px; background: rgba(240,96,144,0.18); border-radius: 100px; overflow: hidden; margin-bottom: 6px; }
  .lp-mock-bar { height: 100%; background: #f06090; border-radius: 100px; }
  .lp-mock-meta { font-family: 'General Sans', sans-serif; font-size: 12px; color: #8a5060; margin-bottom: 12px; }
  .lp-mock-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-mock-pill { background: rgba(255,240,244,0.8); color: #c2185b; font-family: 'General Sans', sans-serif; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(194,24,91,0.15); }
  .lp-mock-streak-row { display: flex; gap: 5px; margin-bottom: 8px; }
  .lp-mock-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(240,96,144,0.18); }
  .lp-mock-dot.active { background: #f06090; }
  .lp-mock-checkin-q { font-family: 'General Sans', sans-serif; font-size: 13px; color: #8a5060; margin: 8px 0 6px; }
  .lp-mock-checkin-input { font-family: 'General Sans', sans-serif; font-size: 13px; color: #3d1020; background: rgba(255,248,250,0.85); border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(240,96,144,0.18); }

  /* ─────────────────────────────────────────────────
     MEET SAGE (the differentiator)
  ───────────────────────────────────────────────── */
  .lp-sage-anchor { background: #ffffff; padding: 24px 0 56px; }
  .lp-sage-h2 {
    font-family: 'Fraunces', serif; font-weight: 700; color: #c2185b;
    font-size: clamp(26px, 3vw, 36px); line-height: 1.2; letter-spacing: -0.01em;
    margin-bottom: 8px; text-align: center; text-wrap: balance;
  }
  .lp-sage-h2 em { font-style: italic; }
  .lp-sage-sub {
    font-family: 'General Sans', sans-serif; font-size: 15px; color: #8a5060;
    text-align: center; margin-bottom: 36px;
  }

  /* Mobile-first: video centered on top, letter runs full width below it —
     a 4-paragraph letter squeezed into a ~150px side column is unreadable
     (2-3 words/line), so this section stacks below the two-column breakpoint.
     At ≥700px there's room for a real side-by-side read: video left, letter right. */
  .lp-sage-top {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
  }
  .lp-sage-video-col { min-width: 0; display: flex; justify-content: center; }
  .lp-sage-content-col { min-width: 0; max-width: 62ch; width: 100%; display: flex; flex-direction: column; gap: 16px; }

  .lp-sage-visual-frame {
    position: relative;
    width: 100%; max-width: 200px; aspect-ratio: 496 / 864;
    border-radius: 16px; overflow: hidden;
    background: #f7eef2;
    box-shadow: 0 12px 32px rgba(61,16,32,0.10);
  }
  @media (min-width: 700px) {
    .lp-sage-top { display: grid; grid-template-columns: minmax(200px, 260px) 1fr; gap: 48px; align-items: start; }
    .lp-sage-video-col { justify-content: flex-start; }
    .lp-sage-visual-frame { max-width: 260px; }
  }
  .lp-sage-visual-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .lp-sage-sound-btn {
    position: absolute; bottom: 12px; right: 12px; z-index: 2;
    width: 32px; height: 32px; border-radius: 50%; border: none; cursor: pointer;
    background: rgba(61,16,32,0.55); color: #fff;
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    transition: background 0.18s, transform 0.15s;
  }
  .lp-sage-sound-btn:hover { background: rgba(61,16,32,0.75); transform: scale(1.06); }

  .lp-sage-letter-intro {
    font-family: 'Fraunces', serif; font-style: italic; font-weight: 600;
    font-size: 22px; color: #c2185b; line-height: 1.4; margin-bottom: 4px;
  }
  .lp-sage-letter-body {
    font-family: 'General Sans', sans-serif; font-size: 16px;
    color: #3d1020; line-height: 1.75;
  }

  .lp-sage-anchor-cta {
    align-self: flex-start;
    display: inline-flex; align-items: center; gap: 8px;
    background: #c2185b; color: #ffffff;
    font-family: 'General Sans', sans-serif; font-size: 15px; font-weight: 700;
    padding: 13px 30px; border-radius: 12px; border: none; cursor: pointer;
    transition: background 0.18s;
  }
  .lp-sage-anchor-cta:hover { background: #a8124e; }

  /* ─────────────────────────────────────────────────
     FEATURES GRID
  ───────────────────────────────────────────────── */
  .lp-features {
    background: linear-gradient(180deg, #fff7fa 0%, #ffffff 12%, #ffffff 88%, #fff7fa 100%);
    padding: 72px 0;
    border-top: 1px solid rgba(240,96,144,0.10);
    border-bottom: 1px solid rgba(240,96,144,0.10);
  }
  .lp-feat-header { max-width: 700px; margin: 0 auto 32px; text-align: center; }
  .lp-feat-h2 { margin-bottom: 16px; }
  .lp-feat-intro { font-family: 'General Sans', sans-serif; font-size: 16px; color: #8a5060; line-height: 1.7; margin: 0 auto; }
  .lp-feat-showcase { text-align: center; margin-bottom: 40px; }
  .lp-feat-showcase-img { width: 100%; max-width: 920px; height: auto; display: block; margin: 0 auto; }


  /* Flip cards */
  .lp-flip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; max-width: 900px; margin: 0 auto 40px; }
  .lp-flip-outer { perspective: 1200px; }
  .lp-flip-card { height: 200px; cursor: pointer; outline: none; }
  .lp-flip-inner { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; }
  .lp-flip-face {
    position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden;
    border-radius: 20px; padding: 22px 20px;
    display: flex; flex-direction: column;
    border: 1px solid rgba(240,96,144,0.15);
    box-shadow: 0 8px 24px rgba(61,16,32,0.08);
  }
  .lp-flip-front { background: linear-gradient(135deg, rgba(255,255,255,0.88), rgba(240,96,144,0.07)); }
  .lp-flip-back {
    transform: rotateY(180deg); justify-content: space-between;
    background: linear-gradient(135deg, rgba(255,255,255,0.94), rgba(183,164,217,0.16));
    border-color: rgba(183,164,217,0.3);
  }
  .lp-flip-icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(194,24,91,0.10); display: flex; align-items: center; justify-content: center; color: #c2185b; margin-bottom: 12px; flex-shrink: 0; }
  .lp-flip-photo { width: 42px; height: 42px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; box-shadow: 0 4px 12px rgba(183,164,217,0.4); }
  .lp-flip-name { font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700; color: #3d1020; margin-bottom: 4px; }
  .lp-flip-front-sub { font-family: 'General Sans', sans-serif; font-size: 13px; color: #8a5060; }
  .lp-flip-tap { font-family: 'General Sans', sans-serif; font-size: 11px; color: #b08090; margin-top: auto; }
  .lp-flip-back-text { font-family: 'Fraunces', serif; font-style: italic; font-size: 15.5px; color: #3d1020; line-height: 1.5; }
  .lp-flip-back-link { font-family: 'General Sans', sans-serif; font-size: 12.5px; font-weight: 700; color: #c2185b; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }

  .lp-feat-all-wrap { text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .lp-feat-all-link { display: inline-flex; align-items: center; gap: 6px; font-family: 'General Sans', sans-serif; font-size: 14px; font-weight: 600; color: #c2185b; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); padding-bottom: 2px; transition: border-color 0.18s; }
  .lp-feat-all-link:hover { border-color: #c2185b; }
  .lp-feat-all-micro { font-family: 'General Sans', sans-serif; font-size: 13px; color: #b08090; font-style: italic; }

  /* ─────────────────────────────────────────────────
     FAQ
  ───────────────────────────────────────────────── */
  .lp-faq { background: #ffffff; padding: 64px 0; }
  .lp-faq-inner { max-width: 760px; margin: 0 auto; }
  .lp-faq-heading { text-align: center; margin-bottom: 32px; }
  .lp-faq-list { display: flex; flex-direction: column; gap: 0; }
  .lp-faq-item { border-bottom: 1px solid rgba(240,96,144,0.2); }
  .lp-faq-item:first-child { border-top: 1px solid rgba(240,96,144,0.2); }
  .lp-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 22px 0; gap: 16px; font-family: 'General Sans', sans-serif; font-size: 16px; font-weight: 600; color: #1a0a10; background: none; border: none; cursor: pointer; text-align: left; transition: color 0.18s; }
  .lp-faq-q:hover { color: #c2185b; }
  .lp-faq-icon { font-size: 20px; color: #f06090; flex-shrink: 0; }
  .lp-faq-a { font-family: 'General Sans', sans-serif; font-size: 15px; line-height: 1.7; color: #8a5060; padding-bottom: 20px; }
  .lp-faq-more { font-family: 'General Sans', sans-serif; font-size: 14px; color: #8a5060; text-align: center; margin-top: 40px; }
  .lp-faq-link { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); transition: border-color 0.18s; }
  .lp-faq-link:hover { border-color: #c2185b; }

  /* ─────────────────────────────────────────────────
     FINAL CTA
  ───────────────────────────────────────────────── */
  .lp-final-cta {
    background: #f06090;
    padding: 24px 0; text-align: center; position: relative; overflow: hidden;
  }
  .lp-final-cta::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .lp-final-cta-inner { max-width: 720px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; }
  .lp-final-cta-eyebrow { color: rgba(255,255,255,0.85); margin-bottom: 8px; }
  .lp-final-cta-h2 { margin-bottom: 8px; color: #ffffff; font-size: clamp(20px, 2.4vw, 28px); text-wrap: pretty; }
  .lp-final-cta-h2 em { color: #ffffff; }
  .lp-final-cta-sub { font-family: 'General Sans', sans-serif; font-size: 14.5px; color: rgba(255,255,255,0.88); line-height: 1.5; margin-bottom: 14px; }
  .lp-final-cta-trust { font-family: 'General Sans', sans-serif; font-size: 11.5px; color: rgba(255,255,255,0.7); margin-top: 8px; }
  .lp-final-cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: #ffffff; color: #c2185b;
    font-family: 'General Sans', sans-serif; font-size: 14px; font-weight: 700;
    padding: 11px 28px; border-radius: 12px; border: none; cursor: pointer;
    transition: background 0.18s;
  }
  .lp-final-cta-btn:hover { background: #fff0f5; }

  /* ── Float keyframe ── */
  @keyframes lp-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .lp-ticker-track { animation: none !important; }
  }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .lp-hero { min-height: auto; }
    .lp-hero-inner { grid-template-columns: 1fr; gap: 28px; padding: 28px 24px 48px; min-height: auto; }
    .lp-hero-left { padding-right: 0; }
    .lp-hero-divider { display: none; }
    .lp-hero-right { display: flex; align-items: center; min-height: auto; margin-top: 0; }
    .lp-hero-mockup-wrap { align-items: flex-end; }
    .lp-hero-photo-wrap { max-width: 320px; margin: 0 auto -48px; }
    .lp-hero-card { display: none; }
    .lp-hero-mobile-ping {
      display: block;
      position: absolute;
      top: -3%; right: 4%;
      z-index: 4;
      pointer-events: none;
    }
    .lp-hero-mobile-ping-card {
      display: flex; flex-direction: column; gap: 1px;
      background: linear-gradient(150deg, rgba(255,255,255,0.94) 0%, rgba(255,235,242,0.88) 100%);
      backdrop-filter: blur(14px) saturate(1.5);
      -webkit-backdrop-filter: blur(14px) saturate(1.5);
      border: 1px solid rgba(255,255,255,0.85);
      border-radius: 12px; padding: 7px 10px;
      box-shadow: 0 6px 16px rgba(194,24,91,0.18), inset 0 1px 0 rgba(255,255,255,0.9);
      max-width: 108px;
    }
    .lp-hero-mobile-ping-label {
      font-family: 'General Sans', sans-serif; font-size: 8.5px; font-weight: 700;
      letter-spacing: 0.06em; text-transform: uppercase; color: #c2185b;
    }
    .lp-hero-mobile-ping-text {
      font-family: 'General Sans', sans-serif; font-size: 10.5px; font-weight: 600;
      color: #3d1020; line-height: 1.3; white-space: nowrap;
    }
    .lp-hero-sub { max-width: 100%; margin-bottom: 24px; }
    .lp-hero-btns { margin-bottom: 16px; gap: 10px; }
    .lp-btn-hero-primary, .lp-btn-hero-ghost { padding: 11px 22px; font-size: 13.5px; }
    .lp-how-tabs { flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; margin-left: -24px; margin-right: -24px; padding-left: 24px; padding-right: 24px; gap: 6px; }
    .lp-how-tabs::-webkit-scrollbar { display: none; }
    .lp-how-tab { flex-shrink: 0; padding: 7px 12px; }
    .lp-how-tab-num { font-size: 9px; }
    .lp-how-tab-label { font-size: 12px; }
    .lp-how-stage { min-height: 0; }
    .lp-how-block { grid-template-columns: 1fr; gap: 24px; }
    .lp-flip-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
    .lp-feat-showcase { margin-left: -32px; margin-right: -32px; margin-bottom: 32px; }
    .lp-feat-showcase-img { max-width: none; width: 100%; border-radius: 0; }
    .lp-prob-grid { grid-template-columns: 1fr; gap: 32px; }
    .lp-prob-sub, .lp-prob-list, .lp-prob-item, .lp-prob-pivot { max-width: 100%; }
    .lp-prob-img { max-height: 60vh; border-radius: 20px; }
  }
  @media (max-width: 640px) {
    .lp-flip-grid { grid-template-columns: 1fr; }
    .lp-sage-anchor { padding: 48px 0; }
    .lp-prob-img { max-height: 55vh; }
  }
`
