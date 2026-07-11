import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { Flame, LayoutGrid, ArrowRight } from 'lucide-react'
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
/* `ping` swaps the loop for a notification-style pop: rises off the phone, holds, fades — repeats */
function FloatingCard({ className, delay = 0, floatDelay = 0, ping = false, children }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={`lp-hero-card ${className}`}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay }}
    >
      <motion.div
        animate={reduced ? {} : ping
          ? { y: [26, 0, 0, -10], opacity: [0, 1, 1, 0], scale: [0.88, 1, 1, 0.94] }
          : { y: [0, -12, 0] }}
        transition={reduced ? {} : ping
          ? { duration: 2.6, ease: [0.16, 1, 0.3, 1], times: [0, 0.3, 0.75, 1], repeat: Infinity, repeatDelay: 1.8, delay: delay + floatDelay + 0.6 }
          : { duration: 5, ease: 'easeInOut', repeat: Infinity, delay: delay + floatDelay + 0.6 }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

/* Tracks a single mobile breakpoint via matchMedia so the hero can swap
   the ping card in without touching any desktop layout rule. */
function useIsMobile(breakpoint = 960) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= breakpoint
  )
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [breakpoint])
  return isMobile
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
  { label:'Set your phase', headline:'Pick your monthly focus', body:'One meaningful goal. Not ten. PHASR gives you one clear phase so your energy actually lands somewhere real.', Visual:PhaseCard },
  { label:'Show up daily', headline:'Check in, track streaks, journal with Sage', body:'A quick daily pulse keeps momentum visible. Your streak is proof. Sage helps you reflect, not just record — guilt-free, even on the days you miss.', Visual:CheckinCard },
  { label:'Weekly reflection', headline:'A weekly reset with Sage', body:"Every Sunday, Sage reviews your check-ins and journal and helps you adjust before next week starts — steady course-correction, not a surprise recap once the month's already over.", Visual:WeeklyReflectCard },
]

const FEATURES = [
  { name:'Sage', photo:true, front:'Your thinking partner', back:'She sees your whole picture and coaches you from there.', href:'/features/ai-coach' },
  { Icon:LayoutGrid, name:'Vision Board', front:'Map it', back:'AI-generated non-negotiables, resources, and daily activities — built from your goal, every single week.', href:'/features/vision-boards' },
  { Icon:Flame, name:'Daily Streaks', front:'Show up daily', back:'Proof you followed through on the plan Sage and your board just built.', href:'/features/daily-streaks' },
]

const PROBLEMS = [
  'No clarity on what your actual next step is',
  'No structure that holds all your goals together',
  'No system that keeps you going past week two',
  'No accountability that feels real, not performative',
  'No way to see whether any of it is actually working',
]

const TRIED_ITEMS = [
  'Vision boards','Daily affirmations','Meditation apps','Habit trackers',
  'Manifestation rituals','Journaling apps','Goal planners','Morning routines',
  'Pinterest boards','Self-help books','75 Hard','Accountability buddies',
]

/* ─────────────── Marketing Ticker ─────────────── */
function StatsTicker() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px' })
  const reduced = useReducedMotion()
  const items = [
    "Your vision, turned into today's task",
    'Sage remembers everything — so you never start over',
    'One goal. One phase. One clear next step.',
    'For women who are done starting over',
    'From vision to done.',
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

/* ─────────────── Tried-It-All Ticker ─────────────── */
function ProblemTicker() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px' })
  const reduced = useReducedMotion()
  const doubled = [...TRIED_ITEMS, ...TRIED_ITEMS]
  return (
    <div className="lp-pticker" ref={ref} aria-hidden="true">
      <motion.div
        className="lp-pticker-track"
        animate={reduced ? {} : inView ? { x: ['0%', '-50%'] } : false}
        transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((item, i) => (
          <span key={i} className="lp-pticker-pill">{item}</span>
        ))}
      </motion.div>
    </div>
  )
}

/* ─────────────── Reviews marquee ─────────────── */
const REVIEWS = [
  { name:'Amara O.', photo:'/images/review-1.jpg', quote:"I've bought every planner on the internet. PHASR is the first one that actually knows what I did yesterday." },
  { name:'Jordan T.', photo:'/images/review-2.jpg', quote:'Sage caught a pattern in my journal I never noticed myself. That alone was worth it.' },
  { name:'Priya K.', photo:'/images/review-3.jpg', quote:"My streak isn't guilt anymore, it's just proof. Huge mental shift." },
  { name:'Bianca R.', photo:'/images/review-4.jpg', quote:'One goal a month sounded too simple. Turns out simple was the missing piece.' },
  { name:'Élise M.', photo:'/images/review-5.jpg', quote:'The check-ins take two minutes and somehow keep me honest all week.' },
  { name:'Naomi S.', photo:'/images/review-6.jpg', quote:"First app that felt like it was actually rooting for me, not just tracking me." },
]

function ReviewsMarquee() {
  const ref = useRef(null)
  const inView = useInView(ref, { margin: '0px' })
  const reduced = useReducedMotion()
  const doubled = [...REVIEWS, ...REVIEWS]
  return (
    <div className="lp-reviews-track-wrap" ref={ref}>
      <motion.div
        className="lp-reviews-track"
        animate={reduced ? {} : inView ? { x: ['0%', '-50%'] } : false}
        transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
      >
        {doubled.map((r, i) => (
          <div key={i} className="lp-review-card" aria-hidden={i >= REVIEWS.length}>
            <img src={r.photo} alt="" className="lp-review-avatar" />
            <p className="lp-review-quote">"{r.quote}"</p>
            <div className="lp-review-name">{r.name}</div>
          </div>
        ))}
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
              ? <img src="/images/sage.jpg" alt="" className="lp-flip-photo" />
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
  const reducedMotion = useReducedMotion()
  const sagePhotoRef = useRef(null)
  const sagePhotoInView = useInView(sagePhotoRef, { margin: '-80px' })
  const isMobile = useIsMobile(960)

  useEffect(() => {
    const targets = HOW_STEPS.map((_, i) => document.getElementById(`step-${i}`)).filter(Boolean)
    if (!targets.length) return
    const ratios = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => ratios.set(e.target, e.intersectionRatio))
      let bestIdx = -1, bestRatio = 0
      targets.forEach((target, i) => {
        const ratio = ratios.get(target) || 0
        if (ratio > bestRatio) { bestRatio = ratio; bestIdx = i }
      })
      if (bestIdx !== -1) setActiveStep(bestIdx)
    }, { threshold: [0, 0.25, 0.45, 0.5, 0.75, 1] })
    targets.forEach(t => observer.observe(t))
    return () => observer.disconnect()
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
              <motion.h1 id="lp-h1" className="lp-hero-h1"
                initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.75, ease:'easeOut', delay:0.15 }}>
                The vision was never<br /><em>the problem.</em>
              </motion.h1>
              <motion.p className="lp-hero-sub"
                initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.7, ease:'easeOut', delay:0.3 }}>
                It's the system you're missing — the one that turns your vision into one monthly goal with clear action steps, and keeps you showing up until it's done.
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
                  See video demo
                </motion.button>
              </motion.div>
              <motion.p className="lp-hero-trust"
                initial={{ opacity:0 }} animate={{ opacity:1 }}
                transition={{ delay:0.75 }}>
                Founding access · No credit card required
              </motion.p>
            </div>

            <div className="lp-hero-divider" aria-hidden="true" />

            {/* Right — hand+phone composite: static photo + screen video + emerging cards */}
            <div className="lp-hero-right">
              <div className="lp-hero-glow" aria-hidden="true" />
              <motion.div className="lp-hero-mockup-wrap"
                initial={{ opacity:0, y:40 }} animate={{ opacity:1, y:0 }}
                transition={{ duration:0.9, ease:'easeOut', delay:0.2 }}>
                <div className="lp-hero-photo-wrap">
                  <video
                    src="/hero-screen.mp4"
                    poster="/images/mockup-1.jpg"
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
                </div>
              </motion.div>

              <FloatingCard className="lp-hero-card-1" delay={0.55}>
                <div className="lp-hcard-label">Daily Streak</div>
                <div className="lp-hcard-streak-num">24</div>
                <div className="lp-hcard-streak-label"><Flame size={13} color="#f06090" style={{ verticalAlign:'-2px', marginRight:4 }} />days in a row</div>
              </FloatingCard>

              <FloatingCard className="lp-hero-card-2 lp-hero-card-ping" delay={0.7} floatDelay={0.6} ping={isMobile}>
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

        {/* ── 3. PROBLEM NAMING ── */}
        <section className="lp-problem" aria-labelledby="lp-prob-h2">
          <div className="lp-container lp-prob-grid">
            <div className="lp-prob-text">
              <motion.h2 id="lp-prob-h2" className="lp-prob-h2" {...fade(0.08)}>
                You've tried everything.<br />
                You still end up with<br />
                <em>nothing to show for the year.</em>
              </motion.h2>
              <motion.p className="lp-prob-sub" {...fade(0.14)}>
                Not because you're undisciplined.<br />
                Because you've been over-equipped with tools<br />
                that don't talk to each other.
              </motion.p>
              <div className="lp-prob-list">
                {PROBLEMS.map((p, i) => (
                  <motion.p key={i} className="lp-prob-item"
                    initial={{ opacity:0, y:12 }}
                    whileInView={{ opacity:1, y:0 }}
                    viewport={{ once:true, margin:'-40px' }}
                    transition={{ duration:0.5, ease:'easeOut', delay:i * 0.08 }}>
                    <span className="lp-prob-dot">·</span>{p}
                  </motion.p>
                ))}
              </div>
              <div className="lp-prob-ticker-wrap">
                <ProblemTicker />
              </div>
              <motion.p className="lp-prob-pivot" {...fade(0.1)}>
                The problem was never the vision.<br />
                It was never having a system<br />
                that <em>held all of it together.</em>
              </motion.p>
            </div>
            <motion.div className="lp-prob-img-wrap" {...fade(0.15)}>
              <img src="/images/girlboss.jpg" alt="Two women working together in a bright, editorial space" className="lp-prob-img" />
            </motion.div>
          </div>
        </section>

        {/* ── 4. HOW IT WORKS ── */}
        <section id="how-it-works" className="lp-how" aria-labelledby="lp-how-h2">
          <div className="lp-container">
            <motion.span className="lp-eyebrow" {...fade()}>HOW IT WORKS</motion.span>
            <motion.h2 id="lp-how-h2" className="lp-section-display lp-how-h2" {...fade(0.05)}>
              Simple. Monthly. <em>Together.</em>
            </motion.h2>
            <div className="lp-how-grid">
              <div className="lp-how-left">
                <div className="lp-how-mobile-step" aria-live="polite">
                  <span className="lp-how-mobile-num">Step {activeStep + 1}<span className="lp-how-mobile-of">/{HOW_STEPS.length}</span></span>
                  <span className="lp-how-mobile-label">{HOW_STEPS[activeStep].label}</span>
                </div>
                <div className="lp-how-nav">
                  {HOW_STEPS.map((s,i) => (
                    <button key={i}
                      className={`lp-how-tab${activeStep===i ? ' active' : ''}`}
                      onClick={() => { setActiveStep(i); document.getElementById(`step-${i}`)?.scrollIntoView({ behavior:'smooth', block:'center' }) }}>
                      <span className="lp-how-tab-num">Step {i+1}</span>
                      <span className="lp-how-tab-label">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="lp-how-right">
                {HOW_STEPS.map((s,i) => {
                  const V = s.Visual
                  return (
                    <div key={i} id={`step-${i}`} className={`lp-how-block${activeStep === i ? ' active' : ''}`}>
                      <div className="lp-how-block-text">
                        <span className="lp-how-eyebrow">Step {i+1}</span>
                        <h3 className="lp-how-headline">{s.headline}</h3>
                        <p className="lp-how-body">{s.body}</p>
                      </div>
                      <div className="lp-how-block-visual">
                        <div className="lp-how-visual-glow" aria-hidden="true" />
                        <V />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. REVIEWS ── */}
        <section className="lp-reviews" aria-labelledby="lp-rev-h2">
          <div className="lp-container">
            <motion.span className="lp-eyebrow" {...fade()}>REAL WOMEN, REAL PHASES</motion.span>
            <motion.h2 id="lp-rev-h2" className="lp-section-display lp-rev-h2" {...fade(0.05)}>
              They showed up. <em>It worked.</em>
            </motion.h2>
          </div>
          <ReviewsMarquee />
        </section>

        {/* ── 6. MEET SAGE (the anchor) ── */}
        <section className="lp-sage-anchor" aria-labelledby="lp-sage-h2">
          <div className="lp-container lp-sage-anchor-inner">
            <motion.span className="lp-eyebrow" {...fade()}>MEET SAGE</motion.span>
            <motion.h2 id="lp-sage-h2" className="lp-section-display lp-sage-anchor-h2" {...fade(0.05)}>
              The one who actually<br /><em>remembers you.</em>
            </motion.h2>
            <motion.div className="lp-sage-anchor-photo-wrap" ref={sagePhotoRef} {...fade(0.15)}>
              <motion.div
                className="lp-sage-anchor-glow" aria-hidden="true"
                animate={reducedMotion ? {} : { scale: [1, 1.08, 1], opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 4.5, ease: 'easeInOut', repeat: Infinity }}
              />
              <div className="lp-sage-anchor-photo-frame">
                <motion.img
                  src="/images/sage.jpg" alt="Sage" className="lp-sage-anchor-photo"
                  animate={reducedMotion ? {} : sagePhotoInView
                    ? { scale: [1, 1.07, 1, 1.04, 1] }
                    : {}}
                  transition={{ duration: 7, ease: 'easeInOut', repeat: Infinity }}
                  whileHover={reducedMotion ? {} : { scale: 1.12, transition: { duration: 0.5, ease: 'easeInOut' } }}
                  whileTap={reducedMotion ? {} : { scale: 1.06, transition: { duration: 0.5, ease: 'easeInOut' } }}
                />
              </div>
            </motion.div>
            <motion.p className="lp-sage-anchor-body" {...fade(0.22)}>
              She's not a chatbot you remember to open. Sage knows your vision, watches your streak, and reads your journal —
              then turns all of it into the one task that actually matters today. Every tool below is just a place she brings you to.
            </motion.p>
          </div>
        </section>

        {/* ── 7. THE TOOLS (what Sage connects) ── */}
        <section className="lp-features" aria-labelledby="lp-feat-h2">
          <div className="lp-container">
            <div className="lp-feat-header">
              <motion.span className="lp-eyebrow" {...fade()}>WHAT SAGE CONNECTS</motion.span>
              <motion.h2 id="lp-feat-h2" className="lp-section-display lp-feat-h2" {...fade(0.05)}>
                Five tools. One Sage.<br /><em>One system that finally works together.</em>
              </motion.h2>
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
              {[
                { q:'Is PHASR free?', a:'Yes. PHASR has a free tier with core features: vision board, daily streaks, and one active phase. Founding Member ($12/mo) unlocks full Sage AI coaching, the full journal, and Phase Review.' },
                { q:'What does Sage actually do?', a:"Sage reads your journal entries, checks your streak, and gives you a weekly reset. Not generic advice — responses that know exactly where you are in your phase. She plans with you, not at you." },
                { q:"What if I miss a few days?", a:"Streaks break, but momentum doesn't have to. PHASR shows you exactly where you stopped so you can pick back up without the shame spiral. Sage helps you reset every Sunday." },
                { q:'Is my journal private?', a:"Completely. Your journal entries are encrypted and never shared with anyone, anywhere. It's your space." },
              ].map(({ q, a }, i) => (
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

      </main>
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
    display: block; font-family: 'Manrope', sans-serif;
    font-size: 11px; font-weight: 700; letter-spacing: 0.18em;
    text-transform: uppercase; color: #f06090; margin-bottom: 16px;
  }
  .lp-eyebrow-pink { color: #f06090; }

  /* ── Buttons ── */
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: #c2185b; color: #fff;
    font-family: 'Manrope', sans-serif; font-size: 15px; font-weight: 700;
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
  .lp-hero-h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(36px, 3.8vw, 54px);
    font-weight: 700; color: #3d1020;
    line-height: 1.1; letter-spacing: -0.03em;
    margin-bottom: 20px; text-wrap: balance;
  }
  .lp-hero-h1 em { font-style: italic; color: #f06090; }
  .lp-hero-sub {
    font-family: 'Manrope', sans-serif;
    font-size: 16px; font-weight: 500; color: #8a5060;
    line-height: 1.6; margin-bottom: 36px; max-width: 440px;
  }
  .lp-hero-btns { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
  .lp-btn-hero-primary {
    display: inline-flex; align-items: center; gap: 8px;
    background: #c2185b; color: #ffffff;
    font-family: 'Manrope', sans-serif; font-size: 15px; font-weight: 700;
    padding: 14px 32px; border-radius: 12px; border: none; cursor: pointer;
    transition: background 0.18s;
  }
  .lp-btn-hero-primary:hover { background: #a8124e; }
  .lp-btn-hero-ghost {
    display: inline-flex; align-items: center; gap: 8px;
    background: transparent; color: #c2185b;
    font-family: 'Manrope', sans-serif; font-size: 15px; font-weight: 500;
    padding: 13px 28px; border-radius: 12px;
    border: 1.5px solid rgba(194,24,91,0.35); cursor: pointer;
    transition: border-color 0.18s, background 0.18s;
  }
  .lp-btn-hero-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
  .lp-hero-trust {
    font-family: 'Manrope', sans-serif;
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

  /* Card internals */
  .lp-hcard-label {
    font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b;
    margin-bottom: 8px;
  }
  .lp-hcard-title {
    font-family: 'Fraunces', serif; font-size: 17px; font-weight: 700;
    color: #3d1020; margin-bottom: 10px;
  }
  .lp-hcard-bar-track { height: 4px; background: rgba(240,96,144,0.18); border-radius: 100px; overflow: hidden; margin-bottom: 7px; }
  .lp-hcard-bar { height: 100%; background: #f06090; border-radius: 100px; }
  .lp-hcard-meta { font-family: 'Manrope', sans-serif; font-size: 12.5px; color: #8a5060; }
  .lp-hcard-sage-text { font-family: 'Fraunces', serif; font-size: 14.5px; color: #3d1020; line-height: 1.55; font-style: italic; }
  .lp-hcard-streak-num { font-family: 'Fraunces', serif; font-size: 52px; font-weight: 700; color: #c2185b; line-height: 1; }
  .lp-hcard-streak-label { font-family: 'Manrope', sans-serif; font-size: 13px; color: #8a5060; margin-top: 6px; }
  .lp-hcard-avatars { display: flex; align-items: center; margin: 4px 0 10px; }
  .lp-hcard-av-img { width: 34px; height: 34px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,0.9); margin-left: -10px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(61,16,32,0.15); }
  .lp-hcard-av-img:first-child { margin-left: 0; }
  .lp-hcard-msg { font-family: 'Manrope', sans-serif; font-size: 13.5px; color: #3d1020; font-style: italic; line-height: 1.5; }

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
    font-family: 'Manrope', sans-serif; font-size: 17px;
    color: rgba(61,16,32,0.68); line-height: 1.7;
    max-width: 480px; margin: 0 0 40px;
  }
  .lp-prob-list { display: flex; flex-direction: column; gap: 2px; margin-bottom: 48px; }
  .lp-prob-item {
    font-family: 'Manrope', sans-serif; font-size: 16px;
    color: rgba(61,16,32,0.8); padding: 10px 0;
    display: flex; align-items: baseline; gap: 12px; justify-content: flex-start;
    border-bottom: 1px solid rgba(240,96,144,0.08);
    text-align: left; max-width: 480px; width: 100%;
  }
  .lp-prob-dot { color: #f06090; font-size: 20px; flex-shrink: 0; line-height: 1; }
  .lp-prob-ticker-wrap { overflow: hidden; margin-bottom: 48px; max-width: 480px; }
  .lp-pticker { width: 100%; overflow: hidden; }
  .lp-pticker-track { display: inline-flex; align-items: center; gap: 12px; white-space: nowrap; will-change: transform; }
  .lp-pticker-pill {
    display: inline-block; background: #E8C9D1; color: #3d1020;
    border-radius: 999px; padding: 6px 16px;
    font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 500;
    flex-shrink: 0; white-space: nowrap;
  }
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
  .lp-how { background: linear-gradient(180deg, #ffffff 0%, #fff0f5 50%, #ffffff 100%); padding: 64px 0 48px; }
  .lp-how-h2 { margin-bottom: 40px; }
  .lp-how-grid { display: grid; grid-template-columns: 220px 1fr; gap: 56px; align-items: start; }
  .lp-how-left { position: sticky; top: 100px; }
  .lp-how-nav { display: flex; flex-direction: column; gap: 4px; }
  .lp-how-tab { display: flex; flex-direction: column; align-items: flex-start; padding: 14px 18px; border-radius: 12px; border: none; background: none; cursor: pointer; text-align: left; transition: background 0.2s; }
  .lp-how-tab:hover { background: rgba(240,96,144,0.08); }
  .lp-how-tab.active { background: rgba(240,96,144,0.10); }
  .lp-how-tab-num { font-family: 'Manrope', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #8a5060; margin-bottom: 3px; }
  .lp-how-tab.active .lp-how-tab-num { color: #c2185b; }
  .lp-how-tab-label { font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 600; color: #8a5060; }
  .lp-how-tab.active .lp-how-tab-label { color: #3d1020; }
  .lp-how-block {
    display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; padding: 32px 0;
    border-top: 1px solid rgba(240,96,144,0.12);
    opacity: 0.4; transform: scale(0.97);
    transition: opacity 0.4s ease-out, transform 0.4s ease-out;
  }
  .lp-how-block.active { opacity: 1; transform: scale(1); }
  .lp-how-block:first-child { border-top: none; padding-top: 0; }
  .lp-how-eyebrow { font-family: 'Manrope', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; display: block; margin-bottom: 12px; }
  .lp-how-headline { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 700; color: #3d1020; line-height: 1.25; margin-bottom: 14px; }
  .lp-how-body { font-family: 'Manrope', sans-serif; font-size: 16px; color: #8a5060; line-height: 1.7; }
  .lp-how-block-text { min-width: 0; }
  .lp-how-block-visual { position: relative; min-width: 0; }
  .lp-how-visual-glow { position: absolute; inset: -32px; border-radius: 50%; background: radial-gradient(circle, rgba(240,96,144,0.12) 0%, transparent 70%); pointer-events: none; z-index: 0; }
  .lp-how-block-visual > *:not(.lp-how-visual-glow) { position: relative; z-index: 1; }
  .lp-how-mobile-step { display: none; }

  /* Mock cards */
  .lp-mock-card {
    background: linear-gradient(150deg, rgba(255,225,235,0.50) 0%, rgba(240,96,144,0.16) 48%, rgba(194,24,91,0.22) 100%);
    backdrop-filter: blur(18px) saturate(1.5); -webkit-backdrop-filter: blur(18px) saturate(1.5);
    border: 1px solid rgba(240,155,175,0.40); border-top-color: rgba(255,240,248,0.80);
    border-radius: 18px; padding: 20px;
    box-shadow: 0 4px 20px rgba(194,24,91,0.16), 0 16px 40px rgba(194,24,91,0.08), inset 0 1.5px 0 rgba(255,255,255,0.90);
  }
  .lp-mock-label { font-family: 'Manrope', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #c2185b; margin-bottom: 8px; }
  .lp-mock-title { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 700; color: #3d1020; margin-bottom: 12px; }
  .lp-mock-bar-track { height: 4px; background: rgba(240,96,144,0.18); border-radius: 100px; overflow: hidden; margin-bottom: 6px; }
  .lp-mock-bar { height: 100%; background: #f06090; border-radius: 100px; }
  .lp-mock-meta { font-family: 'Manrope', sans-serif; font-size: 12px; color: #8a5060; margin-bottom: 12px; }
  .lp-mock-pills { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-mock-pill { background: rgba(255,240,244,0.8); color: #c2185b; font-family: 'Manrope', sans-serif; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 100px; border: 1px solid rgba(194,24,91,0.15); }
  .lp-mock-streak-row { display: flex; gap: 5px; margin-bottom: 8px; }
  .lp-mock-dot { width: 10px; height: 10px; border-radius: 50%; background: rgba(240,96,144,0.18); }
  .lp-mock-dot.active { background: #f06090; }
  .lp-mock-checkin-q { font-family: 'Manrope', sans-serif; font-size: 13px; color: #8a5060; margin: 8px 0 6px; }
  .lp-mock-checkin-input { font-family: 'Manrope', sans-serif; font-size: 13px; color: #3d1020; background: rgba(255,248,250,0.85); border-radius: 8px; padding: 8px 12px; border: 1px solid rgba(240,96,144,0.18); }
  .lp-mock-members { display: flex; align-items: center; margin-bottom: 12px; }
  .lp-mock-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; display: flex; align-items: center; justify-content: center; font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 700; color: #fff; border: 2px solid rgba(255,255,255,0.8); margin-left: -8px; flex-shrink: 0; }
  .lp-mock-avatar:first-child { margin-left: 0; }
  .lp-mock-avatar-more { margin-left: -8px; width: 32px; height: 32px; border-radius: 50%; background: rgba(255,240,244,0.85); color: #c2185b; display: flex; align-items: center; justify-content: center; font-family: 'Manrope', sans-serif; font-size: 11px; font-weight: 700; border: 2px solid rgba(255,255,255,0.8); }
  .lp-mock-post { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 10px; }
  .lp-mock-post:last-child { margin-bottom: 0; }
  .lp-mock-post-text { font-family: 'Manrope', sans-serif; font-size: 13px; color: #3d1020; line-height: 1.5; }

  /* ─────────────────────────────────────────────────
     MEET SAGE (anchor)
  ───────────────────────────────────────────────── */
  .lp-sage-anchor {
    background: #ffffff;
    padding: 72px 0 64px;
    text-align: center;
  }
  .lp-sage-anchor-inner {
    max-width: 640px; margin: 0 auto;
    display: flex; flex-direction: column; align-items: center;
  }
  .lp-sage-anchor-h2 { margin: 0 0 32px; }
  .lp-sage-anchor-photo-wrap {
    position: relative;
    width: 128px; height: 128px;
    margin: 0 0 28px;
  }
  .lp-sage-anchor-glow {
    position: absolute; inset: -26px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(183,164,217,0.45) 0%, rgba(183,164,217,0.18) 45%, transparent 72%);
    filter: blur(20px);
    z-index: 0;
  }
  .lp-sage-anchor-photo-frame {
    position: relative; z-index: 1;
    width: 100%; height: 100%;
    border-radius: 50%; overflow: hidden;
    box-shadow:
      0 24px 64px rgba(183,164,217,0.4),
      0 0 0 6px rgba(255,255,255,0.95),
      0 0 0 9px rgba(183,164,217,0.28);
  }
  .lp-sage-anchor-photo {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    cursor: pointer;
  }
  .lp-sage-anchor-body {
    font-family: 'Manrope', sans-serif; font-size: 17px;
    color: #6a4a5a; line-height: 1.75;
  }

  /* ─────────────────────────────────────────────────
     REVIEWS MARQUEE
  ───────────────────────────────────────────────── */
  .lp-reviews { background: #fff7fa; padding: 56px 0 64px; text-align: center; }
  .lp-rev-h2 { margin-bottom: 36px; }
  .lp-reviews-track-wrap { width: 100%; overflow: hidden; }
  .lp-reviews-track { display: inline-flex; align-items: stretch; gap: 20px; padding: 4px 32px; will-change: transform; }
  .lp-review-card {
    flex-shrink: 0; width: 300px;
    background: #ffffff; border-radius: 20px;
    border: 1px solid rgba(240,96,144,0.12);
    box-shadow: 0 8px 24px rgba(61,16,32,0.08);
    padding: 22px 24px; text-align: left;
    display: flex; flex-direction: column; gap: 12px;
    white-space: normal;
  }
  .lp-review-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(61,16,32,0.12); }
  .lp-review-quote { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; color: #3d1020; line-height: 1.55; }
  .lp-review-name { font-family: 'Manrope', sans-serif; font-size: 13px; font-weight: 700; color: #c2185b; }

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
  .lp-feat-intro { font-family: 'Manrope', sans-serif; font-size: 16px; color: #8a5060; line-height: 1.7; margin: 0 auto; }
  .lp-feat-showcase { text-align: center; margin-bottom: 40px; }
  .lp-feat-showcase-img { width: 100%; max-width: 920px; height: auto; display: block; margin: 0 auto; }


  /* Flip cards */
  .lp-flip-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; margin-bottom: 40px; }
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
  .lp-flip-front-sub { font-family: 'Manrope', sans-serif; font-size: 13px; color: #8a5060; }
  .lp-flip-tap { font-family: 'Manrope', sans-serif; font-size: 11px; color: #b08090; margin-top: auto; }
  .lp-flip-back-text { font-family: 'Fraunces', serif; font-style: italic; font-size: 15.5px; color: #3d1020; line-height: 1.5; }
  .lp-flip-back-link { font-family: 'Manrope', sans-serif; font-size: 12.5px; font-weight: 700; color: #c2185b; display: inline-flex; align-items: center; gap: 4px; text-decoration: none; }

  .lp-feat-all-wrap { text-align: center; }
  .lp-feat-all-link { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope', sans-serif; font-size: 14px; font-weight: 600; color: #c2185b; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); padding-bottom: 2px; transition: border-color 0.18s; }
  .lp-feat-all-link:hover { border-color: #c2185b; }


  /* ─────────────────────────────────────────────────
     FAQ
  ───────────────────────────────────────────────── */
  .lp-faq { background: #ffffff; padding: 64px 0; }
  .lp-faq-inner { max-width: 760px; margin: 0 auto; }
  .lp-faq-heading { text-align: center; margin-bottom: 32px; }
  .lp-faq-list { display: flex; flex-direction: column; gap: 0; }
  .lp-faq-item { border-bottom: 1px solid rgba(240,96,144,0.2); }
  .lp-faq-item:first-child { border-top: 1px solid rgba(240,96,144,0.2); }
  .lp-faq-q { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 22px 0; gap: 16px; font-family: 'Manrope', sans-serif; font-size: 16px; font-weight: 600; color: #1a0a10; background: none; border: none; cursor: pointer; text-align: left; transition: color 0.18s; }
  .lp-faq-q:hover { color: #c2185b; }
  .lp-faq-icon { font-size: 20px; color: #f06090; flex-shrink: 0; }
  .lp-faq-a { font-family: 'Manrope', sans-serif; font-size: 15px; line-height: 1.7; color: #8a5060; padding-bottom: 20px; }
  .lp-faq-more { font-family: 'Manrope', sans-serif; font-size: 14px; color: #8a5060; text-align: center; margin-top: 40px; }
  .lp-faq-link { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); transition: border-color 0.18s; }
  .lp-faq-link:hover { border-color: #c2185b; }

  /* ── Float keyframe ── */
  @keyframes lp-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }

  /* ── Reduced motion ── */
  @media (prefers-reduced-motion: reduce) {
    .lp-ticker-track, .lp-pticker-track { animation: none !important; }
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
    .lp-hero-card-ping {
      display: block;
      top: auto; left: auto;
      bottom: 16%; right: 2%;
      min-width: 168px; max-width: 190px;
      padding: 14px 16px;
    }
    .lp-hero-sub { max-width: 100%; margin-bottom: 24px; }
    .lp-hero-btns { margin-bottom: 16px; gap: 10px; }
    .lp-btn-hero-primary, .lp-btn-hero-ghost { padding: 11px 22px; font-size: 13.5px; }
    .lp-how-grid { grid-template-columns: 1fr; gap: 40px; }
    .lp-how-left {
      position: sticky; top: 62px; z-index: 2;
      background: linear-gradient(180deg, #fff0f5 0%, #fff0f5 78%, rgba(255,240,245,0) 100%);
      padding: 12px 0 16px;
    }
    .lp-how-mobile-step { display: flex; align-items: baseline; gap: 10px; }
    .lp-how-mobile-num { font-family: 'Fraunces', serif; font-weight: 700; font-size: 16px; color: #c2185b; }
    .lp-how-mobile-of { font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; color: #b08090; margin-left: 2px; }
    .lp-how-mobile-label { font-family: 'Manrope', sans-serif; font-size: 13.5px; font-weight: 600; color: #3d1020; }
    .lp-how-nav { display: none; }
    .lp-how-block { grid-template-columns: 1fr; gap: 32px; }
    .lp-flip-grid { grid-template-columns: 1fr; max-width: 420px; margin-left: auto; margin-right: auto; }
    .lp-prob-grid { grid-template-columns: 1fr; gap: 32px; }
    .lp-prob-sub, .lp-prob-list, .lp-prob-item, .lp-prob-ticker-wrap, .lp-prob-pivot { max-width: 100%; }
    .lp-prob-img { max-height: 60vh; border-radius: 20px; }
  }
  @media (max-width: 640px) {
    .lp-flip-grid { grid-template-columns: 1fr; }
    .lp-sage-anchor { padding: 56px 0 56px; }
    .lp-sage-anchor-photo-wrap { width: 128px; height: 128px; }
    .lp-review-card { width: 250px; padding: 18px 20px; }
    .lp-prob-img { max-height: 55vh; }
  }
`
