import { useEffect, useRef, useState } from 'react'

function saveToWaitlist(email) {
  const list = JSON.parse(localStorage.getItem('phasr_waitlist') || '[]')
  if (!list.includes(email)) list.push(email)
  localStorage.setItem('phasr_waitlist', JSON.stringify(list))
}

function useInView(threshold = 0.15) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true)
      },
      { threshold },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return [ref, inView]
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}

const features = [
  {
    icon: '◈',
    title: 'Phased Planning',
    desc: 'Break your year into clear chapters so your next move is always visible.',
    delay: 0,
  },
  {
    icon: '◉',
    title: 'Sage AI Coach',
    desc: 'Get direct guidance that understands your goals, your phase, and your journal.',
    delay: 0.08,
  },
  {
    icon: '◎',
    title: 'Show Up Rooms',
    desc: 'Join focus-based rooms, react to check-ins, nudge people, and comment in real time.',
    delay: 0.16,
  },
  {
    icon: '▣',
    title: 'Daily Journal',
    desc: 'Speak or type, then turn reflection into a summary and a next step.',
    delay: 0.24,
  },
]

const phases = [
  { n: '01', name: 'Set your vision', period: 'Step 01', desc: 'Upload your before and after. Set your goal, pick your focus area, and Phasr builds your plan, phases, weekly actions, and daily habits automatically.', color: '#e8407a' },
  { n: '02', name: 'Follow the system', period: 'Step 02', desc: 'Each week unlocks the next. Complete your daily actions, hit your weekly non-negotiables, and watch your streak build. Miss one, feel it. Stay consistent, unlock more.', color: '#f472a8' },
  { n: '03', name: 'Show up with others', period: 'Step 03', desc: 'Join a Show Up room built around your focus area, fitness, finance, relationships. Check in daily, react to others, send nudges. Accountability that actually works.', color: '#f9a8c4' },
  { n: '04', name: 'Reflect and advance', period: 'Step 04', desc: 'Journal your progress, get a score and next step from Sage, review what worked at the end of each phase, and move forward with a sharper strategy.', color: '#fdd7e5' },
]

const testimonials = [
  {
    quote:
      'I used to set goals and forget them after a few days. Everything felt scattered. This made me slow down and get clear. For the first time, I know exactly what I am working towards and why.',
    name: 'Aisha',
  },
  {
    quote:
      'I am someone who starts things and never finishes. After using this, I actually show up daily. It is not pressure, it just keeps me locked in. I have never been this consistent in my life.',
    name: 'James',
  },
  {
    quote:
      'I did not realize how disconnected I was from my own goals. This made me reconnect with myself. It is not just planning, it feels personal. I care about what I am building again.',
    name: 'Daniel',
  },
  {
    quote:
      'I stopped trusting myself because I kept breaking promises to myself. This changed that. Now when I say I will do something, I do it. That alone changed everything for me.',
    name: 'Priya',
  },
]

export default function LandingPage({ onGetStarted }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pricingRegion, setPricingRegion] = useState('USD')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const locale = `${navigator.language || ''} ${Intl.DateTimeFormat().resolvedOptions().timeZone || ''}`.toLowerCase()
    if (locale.includes('ng') || locale.includes('lagos') || locale.includes('nigeria')) {
      setPricingRegion('NGN')
    }
  }, [])

  async function handleWaitlist(event) {
    event.preventDefault()
    if (!email || submitting) return
    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 700))
    saveToWaitlist(email)
    setSubmitted(true)
    setSubmitting(false)
  }

  function handleGetStarted(event) {
    if (!onGetStarted) return
    event.preventDefault()
    setMenuOpen(false)
    onGetStarted()
  }

  const priceCopy =
    pricingRegion === 'NGN'
      ? {
          free: '₦0',
          pro: '₦2,000',
          coach: '₦5,000',
          period: 'per month',
        }
      : {
          free: '$0',
          pro: '$5',
          coach: '$15',
          period: 'per month',
        }

  return (
    <>
      <style>{styles}</style>

      <nav className={`lp-nav ${scrolled ? 'lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <span className="lp-logo">Phasr</span>
          <a href="#waitlist" className="lp-nav-cta lp-nav-cta-mobile" onClick={handleGetStarted}>Get started</a>
          <div className={`lp-nav-links ${menuOpen ? 'lp-nav-open' : ''}`}>
            <div className="lp-menu-top">
              <span className="lp-logo">Phasr</span>
              <button
                type="button"
                className="lp-menu-close"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                X
              </button>
            </div>
            <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" onClick={() => setMenuOpen(false)}>How it works</a>
            <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="/story#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="/story" onClick={() => setMenuOpen(false)}>Our Story</a>
            <a href="#waitlist" className="lp-nav-cta" onClick={handleGetStarted}>Get started</a>
          </div>
          <button className="lp-hamburger" onClick={() => setMenuOpen(open => !open)}>
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      <section className="lp-hero">
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />
        <div className="lp-noise" />
        <div className="lp-grid" />

        <div className="lp-hero-inner">
          <div className="lp-hero-content">
            <div className="lp-badge">
              <span className="lp-badge-dot" />
              AI-powered vision board
            </div>
            <div className="lp-hero-rule" />

            <h1 className="lp-h1">
              <span className="lp-h1-line">Visualize.</span>
              <span className="lp-h1-line lp-h1-delay1">Plan.</span>
              <span className="lp-h1-line lp-h1-accent lp-h1-delay2 lp-h1-execute">Execute.</span>
            </h1>

            {!submitted ? (
              <form className="lp-hero-form" onSubmit={handleWaitlist}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email..."
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="lp-email-input"
                />
                <button type="submit" className="lp-btn-primary" disabled={submitting}>
                  {submitting ? <span className="lp-spinner" /> : 'Get started'}
                </button>
              </form>
            ) : (
              <div className="lp-success">You&apos;re on the list. We&apos;ll be in touch soon.</div>
            )}
            <div className="lp-hero-mobile-gap" aria-hidden="true" />
          </div>

          <div className="lp-hero-visual">
            <div className="lp-mockup">
              <div className="lp-mockup-bar">
                <span />
                <span />
                <span />
              </div>

              <div className="lp-mockup-body">
                <div className="lp-mock-tabs">
                  <div className="lp-mock-tab lp-mock-tab-active">Phase 1</div>
                  <div className="lp-mock-tab">Phase 2</div>
                  <div className="lp-mock-tab">Phase 3</div>
                </div>

                <div className="lp-mock-affirmation">
                  &quot;I am becoming who I was always meant to be.&quot;
                </div>

                <div className="lp-mock-cards">
                  {[
                    { tag: 'Career', title: 'Weekly focus locked', color: '#e8407a' },
                    { tag: 'Fitness', title: '3 habits scheduled', color: '#34d399' },
                    { tag: 'Journal', title: 'Journal synced', color: '#a78bfa' },
                  ].map((card, index) => (
                    <div key={card.tag} className="lp-mock-card" style={{ animationDelay: `${index * 0.2}s` }}>
                      <div className="lp-mock-card-header" style={{ background: `${card.color}22`, borderColor: `${card.color}44` }}>
                        <span>{card.tag}</span>
                      </div>
                      <div className="lp-mock-card-lines">
                        <div className="lp-mock-card-name">{card.title}</div>
                        <div className="lp-mock-line" style={{ width: '80%' }} />
                        <div className="lp-mock-line" style={{ width: '58%' }} />
                        <div className="lp-mock-line lp-mock-line-accent" style={{ width: '72%', background: card.color }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="lp-mock-showup">
                  <div className="lp-mock-showup-head">
                    <span>Show Up Room</span>
                    <span className="lp-mock-showup-pill">Fitness</span>
                  </div>
                  <div className="lp-mock-showup-row">
                    <span className="lp-mock-avatar">A</span>
                    <span className="lp-mock-checkin">Morning workout done</span>
                    <span className="lp-mock-react">+12</span>
                  </div>
                  <div className="lp-mock-actions">
                    <span>React</span>
                    <span>Nudge</span>
                    <span>Comment</span>
                  </div>
                </div>

                <div className="lp-mock-sage">
                  <div className="lp-mock-sage-av">S</div>
                  <div className="lp-mock-sage-msg">Decide the one action that matters most today.</div>
                </div>
              </div>
            </div>

            <div className="lp-float lp-float-1">
              <span className="lp-float-dot" style={{ background: '#34d399' }} />
              Goal completed
            </div>
            <div className="lp-float lp-float-2">
              <span className="lp-float-dot" style={{ background: '#f472a8' }} />
              Show Up live
            </div>
            <div className="lp-float lp-float-3">
              <span className="lp-float-dot" style={{ background: '#fbbf24' }} />
              7-day streak
            </div>
          </div>
        </div>

        <div className="lp-strip">
          {['Fitness', 'Finance', 'Career', 'Business', 'Relationships', 'Inner Life', 'Personal Growth', 'Wealth'].map(item => (
            <span key={item} className="lp-pill">{item}</span>
          ))}
        </div>
      </section>

      <section className="lp-section lp-feature-section" id="features">
        <div className="lp-container">
          <Reveal>
            <p className="lp-label lp-label-light">Core features</p>
            <h2 className="lp-h2">Everything works together.</h2>
            <p className="lp-section-sub lp-section-sub-dark">
              Structure, coaching, accountability, and reflection. The strongest parts of Phasr are built to move as one system.
            </p>
          </Reveal>

          <div className="lp-feat-grid">
            {features.map(feature => (
              <Reveal key={feature.title} delay={feature.delay}>
                <div className="lp-feat-card">
                  <div className="lp-feat-top">
                    <div className="lp-feat-icon">{feature.icon}</div>
                  </div>
                  <h3 className="lp-feat-title">{feature.title}</h3>
                  <p className="lp-feat-desc">{feature.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.26}>
            <div className="lp-feature-strip">
              {['Before and after', 'Calendar sync', 'Weekly non-negotiables', 'Real-time accountability'].map(item => (
                <span key={item} className="lp-feature-pill">{item}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="lp-section lp-dark-section" id="how">
        <div className="lp-container">
          <Reveal>
            <p className="lp-label lp-label-light">How it works</p>
            <h2 className="lp-h2">Your year in phases.<br />Your goals on track.</h2>
          </Reveal>

          <div className="lp-phases">
            {phases.map((phase, index) => (
              <Reveal key={phase.name} delay={index * 0.12}>
                <div className="lp-phase-card">
                  <div className="lp-phase-num" style={{ color: phase.color }}>{phase.n}</div>
                  <h3 className="lp-phase-name">{phase.name}</h3>
                  <p className="lp-phase-desc">{phase.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-dark-section" id="experience">
        <div className="lp-container">
          <Reveal>
            <p className="lp-label lp-label-pill">Users Experience</p>
            <h2 className="lp-h2 lp-review-title">What people say when it clicks.</h2>
          </Reveal>

          <div className="lp-review-lanes">
            <div className="lp-review-marquee">
              <div className="lp-review-track lp-review-track-left">
                {[testimonials[0], testimonials[3], testimonials[0], testimonials[3]].map((item, index) => (
                  <div key={`${item.name}-left-${index}`} className="lp-review-card">
                    <p className="lp-review-quote">"{item.quote}"</p>
                    <span className="lp-review-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-review-marquee">
              <div className="lp-review-track lp-review-track-right">
                {[testimonials[2], testimonials[1], testimonials[2], testimonials[1]].map((item, index) => (
                  <div key={`${item.name}-right-${index}`} className="lp-review-card">
                    <p className="lp-review-quote">"{item.quote}"</p>
                    <span className="lp-review-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-dark-section" id="pricing">
        <div className="lp-container">
          <Reveal>
            <h2 className="lp-h2">Pricing</h2>
          </Reveal>

          <div className="lp-price-grid">
            <Reveal>
              <div className="lp-price-card">
                <p className="lp-price-name">Free</p>
                <div className="lp-price-amount">{priceCopy.free}</div>
                <p className="lp-price-period">forever</p>
                <div className="lp-price-divider" />
                <ul className="lp-price-feats">
                  {['1 Vision Board', '2 Phases', 'Daily Journal', 'Weekly Check-ins', 'Basic templates'].map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="lp-price-btn lp-price-btn-outline" onClick={handleGetStarted}>Get started</button>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="lp-price-card lp-price-card-hot">
                <div className="lp-price-badge">Most Popular</div>
                <p className="lp-price-name">Pro</p>
                <div className="lp-price-amount">{priceCopy.pro}</div>
                <p className="lp-price-period">{priceCopy.period}</p>
                <div className="lp-price-divider" />
                <ul className="lp-price-feats">
                  {['Unlimited boards', 'Unlimited phases', 'Sage AI coach', 'Show Up rooms', 'Advanced analytics', 'Calendar sync'].map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="lp-price-btn lp-price-btn-hot" onClick={handleGetStarted}>Get started</button>
              </div>
            </Reveal>

            <Reveal delay={0.16}>
              <div className="lp-price-card">
                <p className="lp-price-name">Coach</p>
                <div className="lp-price-amount">{priceCopy.coach}</div>
                <p className="lp-price-period">{priceCopy.period}</p>
                <div className="lp-price-divider" />
                <ul className="lp-price-feats">
                  {['Everything in Pro', 'Up to 20 client boards', 'Client dashboard', 'Branded boards', 'Priority support'].map(item => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <button className="lp-price-btn lp-price-btn-outline" onClick={handleGetStarted}>Get started</button>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lp-section lp-waitlist-section" id="waitlist">
        <div className="lp-orb lp-orb-cta-1" />
        <div className="lp-orb lp-orb-cta-2" />
        <div className="lp-container lp-waitlist-inner">
          <Reveal>
            <p className="lp-label lp-label-light">Early access</p>
            <h2 className="lp-h2 lp-waitlist-h2">Your goals are not going to build themselves.</h2>
            <p className="lp-waitlist-sub">
              Join early and be one of the first to use Phasr with phased planning, daily structure, Sage, and Show Up rooms.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            {!submitted ? (
              <form className="lp-waitlist-form" onSubmit={handleWaitlist}>
                <input
                  type="email"
                  required
                  placeholder="Your email address..."
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  className="lp-email-input lp-email-input-lg"
                />
                <button type="submit" className="lp-btn-primary lp-btn-lg" disabled={submitting}>
                  {submitting ? <span className="lp-spinner" /> : 'Get started'}
                </button>
              </form>
            ) : (
              <div className="lp-success lp-success-lg">You&apos;re on the list. We&apos;ll reach out soon.</div>
            )}
            <p className="lp-hero-note lp-hero-note-light">Free to join · No credit card · Early access perks included</p>
          </Reveal>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-top">
          <div className="lp-footer-brand">
            <span className="lp-logo">Phasr</span>
            <p className="lp-footer-blurb">
              Your personal goal operating system for structure, consistency, and real forward movement.
            </p>
          </div>
          <div className="lp-footer-columns">
            <div className="lp-footer-col">
              <span className="lp-footer-title">Product</span>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#waitlist">Get started</a>
            </div>
            <div className="lp-footer-col">
              <span className="lp-footer-title">Explore</span>
              <a href="#how">How it works</a>
              <a href="#pricing">Plans</a>
              <a href="#waitlist">Early access</a>
            </div>
          </div>
        </div>
        <div className="lp-container lp-footer-bottom">
          <p className="lp-footer-copy">© 2026 Phaer. All rights reserved. Unauthorized use, reproduction, or distribution is prohibited.</p>
          <p className="lp-footer-copy">Lagos · Global mindset</p>
        </div>
      </footer>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --dark: #07040f;
    --dark2: #0f0818;
    --accent: #e8407a;
    --accent2: #f472a8;
    --accent3: #fbb6ce;
    --text: #f0eeff;
    --muted: #8b85aa;
    --border: rgba(232,64,122,0.18);
    --light-bg: #fffbfc;
    --light-bg2: #fff5f7;
    --app-text: #3d1f2b;
    --app-muted: #7a5a66;
    --app-border: #f2c4d0;
  }

  html { scroll-behavior: smooth; }
  body { font-family: 'DM Sans', sans-serif; background: var(--dark); color: var(--text); overflow-x: hidden; }

  .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 1.1rem 2rem; transition: all 0.3s ease; }
  .lp-nav-scrolled { background: rgba(7,4,15,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid var(--border); padding: 0.75rem 2rem; }
  .lp-nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
  .lp-logo { font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.4rem; background: linear-gradient(135deg, #f472a8, #ffd6e7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; cursor: pointer; flex-shrink: 0; }
  .lp-nav-links { display: flex; align-items: center; gap: 2rem; }
  .lp-menu-top { display: none; }
  .lp-menu-close { display: none; }
  .lp-nav-links a { color: var(--muted); font-size: 0.88rem; text-decoration: none; transition: color 0.2s; }
  .lp-nav-links a:hover { color: var(--text); }
  .lp-nav-cta { padding: 0.45rem 1.2rem; border-radius: 99px; background: var(--accent); color: #fff !important; font-weight: 600; font-size: 0.82rem; }
  .lp-nav-cta-mobile { display: none; }
  .lp-hamburger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
  .lp-hamburger span { display: block; width: 22px; height: 2px; background: var(--text); border-radius: 2px; transition: all 0.2s; }
  .lp-hero-mobile-gap { display: none; }

  .lp-hero { min-height: auto; background: radial-gradient(ellipse 100% 70% at 50% -10%, rgba(232,64,122,0.22) 0%, transparent 60%), var(--dark); position: relative; overflow: hidden; display: flex; flex-direction: column; padding-top: 84px; }
  .lp-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
  .lp-orb-1 { width: 700px; height: 700px; top: -200px; left: -200px; background: radial-gradient(circle, rgba(192,36,93,0.3) 0%, transparent 70%); animation: orbf1 10s ease-in-out infinite; }
  .lp-orb-2 { width: 500px; height: 500px; bottom: -100px; right: -100px; background: radial-gradient(circle, rgba(122,16,64,0.25) 0%, transparent 70%); animation: orbf2 13s ease-in-out infinite; }
  .lp-orb-3 { width: 300px; height: 300px; top: 50%; left: 50%; transform: translate(-50%,-50%); background: radial-gradient(circle, rgba(244,114,168,0.12) 0%, transparent 70%); animation: orbf3 7s ease-in-out infinite; }
  @keyframes orbf1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(50px,40px)} }
  @keyframes orbf2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-40px,-30px)} }
  @keyframes orbf3 { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.4)} }
  .lp-noise { position: absolute; inset: 0; pointer-events: none; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E"); background-size: 200px; opacity: 0.5; mix-blend-mode: overlay; }
  .lp-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(232,64,122,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(232,64,122,0.04) 1px, transparent 1px); background-size: 60px 60px; }
  .lp-hero-inner { max-width: 1200px; margin: 0 auto; padding: 1.55rem 2rem 0.75rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1.4rem; align-items: start; flex: 1; position: relative; z-index: 1; }
  .lp-hero-content { padding-top: 0.2rem; }

  .lp-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.28rem 0.82rem; border-radius: 99px; border: 1px solid var(--border); background: rgba(232,64,122,0.08); font-size: 0.68rem; font-weight: 600; color: var(--accent3); margin-bottom: 0.55rem; animation: fadeUp 0.8s ease both; }
  .lp-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 2s infinite; }
  .lp-hero-rule { width: 112px; height: 2px; border-radius: 999px; background: linear-gradient(90deg, rgba(255,255,255,0.92), rgba(244,114,168,0.92)); margin-bottom: 0.85rem; box-shadow: 0 0 18px rgba(244,114,168,0.22); }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
  .lp-h1 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(3rem, 6.6vw, 5rem); line-height: 0.92; margin-bottom: 0.85rem; display: flex; flex-direction: column; gap: 0; }
  .lp-h1-line { display: block; color: #fff6fb; text-shadow: 0 2px 14px rgba(0,0,0,0.16); animation: fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both; }
  .lp-h1-delay1 { animation-delay: 0.1s; }
  .lp-h1-delay2 { animation-delay: 0.2s; }
  .lp-h1-accent { color: #ff9cc6; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
  .lp-hero-form { display: flex; gap: 0.75rem; flex-wrap: wrap; animation: fadeUp 0.8s ease 0.4s both; margin-bottom: 0; }
  .lp-email-input { flex: 1; min-width: 220px; padding: 0.8rem 1.2rem; border-radius: 99px; border: 1.5px solid var(--border); background: rgba(255,255,255,0.05); color: var(--text); font-size: 0.9rem; outline: none; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s; }
  .lp-email-input:focus { border-color: var(--accent2); }
  .lp-email-input::placeholder { color: var(--muted); }
  .lp-btn-primary { padding: 0.8rem 1.8rem; border-radius: 99px; border: none; background: linear-gradient(135deg, var(--accent), #f472a8); color: #fff; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'DM Sans', sans-serif; box-shadow: 0 4px 20px rgba(232,64,122,0.4); white-space: nowrap; }
  .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,64,122,0.5); }
  .lp-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .lp-hero-note { font-size: 0.75rem; color: var(--muted); margin-top: 0.75rem; animation: fadeUp 0.8s ease 0.5s both; }
  .lp-hero-note-light { color: rgba(255,255,255,0.4); margin-top: 1rem; }
  .lp-success { padding: 0.85rem 1.4rem; border-radius: 12px; background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.3); color: #6ee7b7; font-size: 0.9rem; display: inline-block; }
  .lp-success-lg { font-size: 1rem; padding: 1rem 1.8rem; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .lp-spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; animation: spin 0.7s linear infinite; display: inline-block; }

  .lp-hero-visual { position: relative; animation: fadeUp 0.8s ease 0.3s both; margin-top: 0; }
  .lp-mockup { max-width: 520px; margin-left: auto; background: rgba(13,8,22,0.8); border-radius: 16px; border: 1px solid rgba(232,64,122,0.2); box-shadow: 0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,64,122,0.1); overflow: hidden; backdrop-filter: blur(10px); }
  .lp-mockup-bar { background: rgba(255,255,255,0.04); padding: 0.7rem 1rem; display: flex; gap: 6px; align-items: center; border-bottom: 1px solid rgba(232,64,122,0.1); }
  .lp-mockup-bar span { width: 10px; height: 10px; border-radius: 50%; background: rgba(255,255,255,0.12); }
  .lp-mockup-bar span:first-child { background: #ff5f57; }
  .lp-mockup-bar span:nth-child(2) { background: #febc2e; }
  .lp-mockup-bar span:nth-child(3) { background: #28c840; }
  .lp-mockup-body { padding: 1.2rem; display: flex; flex-direction: column; gap: 0.9rem; }
  .lp-mock-tabs { display: flex; gap: 0.5rem; }
  .lp-mock-tab { padding: 0.35rem 0.9rem; border-radius: 99px; font-size: 0.72rem; font-weight: 600; border: 1px solid rgba(232,64,122,0.2); color: var(--muted); background: transparent; }
  .lp-mock-tab-active { background: linear-gradient(135deg, var(--accent), #f472a8); color: #fff; border-color: transparent; }
  .lp-mock-affirmation { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.85rem; color: rgba(244,114,168,0.8); padding: 0.6rem 0.8rem; background: rgba(232,64,122,0.06); border-radius: 8px; border-left: 2px solid rgba(232,64,122,0.3); animation: textPulse 4s ease-in-out infinite; }
  @keyframes textPulse { 0%,100%{opacity:0.7} 50%{opacity:1} }
  .lp-mock-cards { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.5rem; }
  .lp-mock-card { border-radius: 10px; overflow: hidden; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); animation: cardFloat 3s ease-in-out infinite; }
  @keyframes cardFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  .lp-mock-card-header { padding: 0.5rem; display: flex; align-items: center; gap: 0.35rem; font-size: 0.65rem; font-weight: 600; color: rgba(255,255,255,0.7); border-bottom: 1px solid; border-radius: 0; }
  .lp-mock-card-name { font-size: 0.68rem; color: rgba(255,255,255,0.78); margin-bottom: 0.3rem; }
  .lp-mock-card-lines { padding: 0.5rem; display: flex; flex-direction: column; gap: 4px; }
  .lp-mock-line { height: 4px; border-radius: 2px; background: rgba(255,255,255,0.08); }
  .lp-mock-line-accent { opacity: 0.5; }
  .lp-mock-showup { display: flex; flex-direction: column; gap: 0.5rem; padding: 0.6rem; background: rgba(255,255,255,0.03); border-radius: 10px; border: 1px solid rgba(232,64,122,0.15); }
  .lp-mock-showup-head,.lp-mock-showup-row,.lp-mock-actions { display: flex; align-items: center; justify-content: space-between; }
  .lp-mock-showup-head { color: rgba(255,255,255,0.75); font-size: 0.7rem; font-weight: 600; }
  .lp-mock-showup-pill { padding: 0.16rem 0.5rem; border-radius: 999px; background: rgba(244,114,168,0.14); color: #ffd6e7; font-size: 0.58rem; }
  .lp-mock-avatar { width: 22px; height: 22px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #f472a8); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.62rem; font-weight: 700; flex-shrink: 0; }
  .lp-mock-checkin { flex: 1; color: rgba(255,255,255,0.6); font-size: 0.68rem; margin-left: 0.5rem; }
  .lp-mock-react { color: #78e5b5; font-size: 0.66rem; font-weight: 700; }
  .lp-mock-actions { color: rgba(244,114,168,0.78); font-size: 0.62rem; font-weight: 600; }
  .lp-mock-sage { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.6rem; background: rgba(232,64,122,0.06); border-radius: 10px; border: 1px solid rgba(232,64,122,0.15); }
  .lp-mock-sage-av { width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--accent), #f472a8); display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.6rem; color: #fff; }
  .lp-mock-sage-msg { font-size: 0.72rem; color: rgba(255,255,255,0.55); line-height: 1.5; }

  .lp-float { position: absolute; display: flex; align-items: center; gap: 0.45rem; padding: 0.45rem 0.85rem; border-radius: 99px; background: rgba(7,4,15,0.85); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(12px); font-size: 0.72rem; color: rgba(255,255,255,0.75); white-space: nowrap; }
  .lp-float-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .lp-float-1 { top: -16px; left: -20px; animation: floatAnim 3s ease-in-out infinite; }
  .lp-float-2 { top: 30%; right: -24px; animation: floatAnim 3s ease-in-out 1s infinite; }
  .lp-float-3 { bottom: 10%; left: -24px; animation: floatAnim 3s ease-in-out 2s infinite; }
  @keyframes floatAnim { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  .lp-strip { border-top: 1px solid var(--border); padding: 0.55rem 0 0.75rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap; background: rgba(232,64,122,0.03); position: relative; z-index: 1; }
  .lp-pill { padding: 0.35rem 1rem; border-radius: 99px; border: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); font-weight: 500; }

  .lp-section { padding: 5.2rem 1.5rem; }
  .lp-feature-section { background: linear-gradient(180deg, #2a0d21 0%, #4a1230 54%, #2a0d21 100%); }
  .lp-dark-section { background: linear-gradient(180deg, #120916 0%, #1a0d1d 100%); }
  .lp-dark-soft { background: linear-gradient(180deg, #190b19 0%, #23101f 100%); }
  .lp-container { max-width: 1100px; margin: 0 auto; }
  .lp-label { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent2); margin-bottom: 0.75rem; }
  .lp-label-pill { display: inline-flex; padding: 0.35rem 0.9rem; border-radius: 999px; border: 1px solid rgba(244,114,168,0.6); background: rgba(244,114,168,0.08); }
  .lp-label-light { color: var(--accent2); }
  .lp-h2 { font-family: 'Syne', sans-serif; font-weight: 800; font-size: clamp(2rem, 4.5vw, 3rem); line-height: 1.15; margin-bottom: 1rem; color: var(--text); }
  .lp-section-sub,.lp-waitlist-sub { color: rgba(255, 214, 231, 0.72); font-size: 1rem; line-height: 1.75; max-width: 540px; }
  .lp-section-sub-dark { color: rgba(255, 214, 231, 0.74); }
  .lp-feat-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-top: 2.6rem; }
  .lp-feat-card { min-height: 210px; padding: 1.45rem; border-radius: 24px; background: linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.04) 100%); border: 1px solid rgba(255, 194, 217, 0.18); box-shadow: 0 18px 40px rgba(17, 2, 12, 0.18), inset 0 1px 0 rgba(255,255,255,0.06); transition: transform 0.25s ease, border-color 0.25s ease; }
  .lp-feat-card:hover { transform: translateY(-4px); border-color: rgba(255, 194, 217, 0.34); }
  .lp-feat-top { margin-bottom: 1rem; }
  .lp-feat-icon { width: 54px; height: 54px; border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(255, 194, 217, 0.18), rgba(244, 114, 168, 0.12)); border: 1px solid rgba(255, 214, 231, 0.18); color: var(--accent3); font-size: 1.25rem; font-family: 'Syne', sans-serif; font-weight: 800; }
  .lp-feat-title { margin-bottom: 0.55rem; color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.06rem; font-weight: 700; }
  .lp-feat-desc { color: rgba(255, 214, 231, 0.74); font-size: 0.93rem; line-height: 1.68; max-width: 32ch; }
  .lp-feature-strip { display: flex; gap: 0.8rem; flex-wrap: wrap; margin-top: 1.3rem; }
  .lp-feature-pill { padding: 0.52rem 0.9rem; border-radius: 999px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255, 214, 231, 0.14); color: rgba(255, 214, 231, 0.82); font-size: 0.8rem; }
  .lp-phases,.lp-price-grid { display: grid; gap: 1.2rem; margin-top: 3.2rem; }
  .lp-phases { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lp-price-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; }
  .lp-phase-card { padding: 1.5rem; border-radius: 18px; background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(232, 64, 122, 0.14); transition: transform 0.25s ease, background 0.25s ease; }
  .lp-phase-card:hover { background: rgba(255, 255, 255, 0.06); transform: translateY(-4px); }
  .lp-phase-num { margin-bottom: 0.8rem; font-family: 'Syne', sans-serif; font-size: 2.8rem; font-weight: 800; line-height: 1; opacity: 0.7; }
  .lp-phase-period { display: inline-block; margin-bottom: 0.8rem; padding: 0.2rem 0.65rem; border-radius: 999px; font-size: 0.68rem; font-weight: 700; }
  .lp-phase-name { margin-bottom: 0.55rem; color: var(--text); font-family: 'Syne', sans-serif; font-size: 1.08rem; font-weight: 700; }
  .lp-phase-desc { color: var(--muted); font-size: 0.85rem; line-height: 1.65; }
  .lp-review-title { margin-bottom: 0; max-width: 720px; }
  .lp-review-lanes { margin-top: 2.8rem; display: flex; flex-direction: column; gap: 1rem; }
  .lp-review-marquee { padding: 0.25rem 0; overflow: hidden; mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent); }
  .lp-review-track { display: flex; gap: 1rem; width: max-content; }
  .lp-review-track-left { animation: reviewScrollLeft 32s linear infinite; }
  .lp-review-track-right { animation: reviewScrollRight 32s linear infinite; }
  .lp-review-card { width: 320px; min-height: 168px; padding: 1rem 1.1rem; border-radius: 24px; background: linear-gradient(135deg, rgba(255, 143, 183, 0.18), rgba(244, 114, 168, 0.1)); border: 1px solid rgba(255, 194, 217, 0.18); color: var(--text); display: flex; flex-direction: column; justify-content: space-between; }
  .lp-review-quote { color: var(--text); font-size: 0.88rem; font-style: italic; line-height: 1.65; white-space: normal; }
  .lp-review-name { align-self: flex-start; margin-top: 0.9rem; padding: 0.25rem 0.55rem; border-radius: 999px; background: rgba(255,255,255,0.08); color: rgba(255, 214, 231, 0.88); font-size: 0.75rem; font-weight: 700; }
  .lp-founder-section { background: linear-gradient(180deg, #120816 0%, #1a0d1d 100%); }
  .lp-founder-wrap { max-width: 760px; margin: 0 auto; padding: 0 1.5rem; }
  .lp-founder-label { color: var(--accent2); }
  .lp-founder-story { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; line-height: 1.9; color: rgba(255, 237, 245, 0.92); display: flex; flex-direction: column; gap: 0.9rem; }
  .lp-founder-quote { border-left: 3px solid rgba(244, 114, 168, 0.9); padding-left: 1rem; color: #ffd6e7; }
  .lp-founder-signoff { display: flex; align-items: center; gap: 0.9rem; margin-top: 2rem; }
  .lp-founder-avatar { width: 54px; height: 54px; border-radius: 50%; background-size: cover; background-position: center; border: 2px solid rgba(244, 114, 168, 0.55); box-shadow: 0 8px 18px rgba(0,0,0,0.35); }
  .lp-founder-name { font-size: 1rem; font-weight: 700; color: #fff; }
  .lp-founder-title { font-size: 0.85rem; color: rgba(255, 214, 231, 0.7); }
  .lp-price-card { border-radius: 16px; padding: 2rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(232,64,122,0.15); position: relative; transition: all 0.3s; }
  .lp-price-card-hot { background: linear-gradient(135deg, rgba(232,64,122,0.15), rgba(244,114,168,0.08)); border-color: var(--accent); box-shadow: 0 0 40px rgba(232,64,122,0.25); transform: scale(1.03); }
  .lp-price-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: #fff; font-size: 0.7rem; font-weight: 700; padding: 0.22rem 0.9rem; border-radius: 99px; white-space: nowrap; }
  .lp-price-name { font-family: 'Syne', sans-serif; font-size: 0.8rem; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.75rem; }
  .lp-price-amount { font-family: 'Syne', sans-serif; font-size: 3rem; font-weight: 800; line-height: 1; color: var(--text); }
  .lp-price-period { font-size: 0.8rem; color: var(--muted); margin-bottom: 1.2rem; margin-top: 0.2rem; }
  .lp-price-divider { height: 1px; background: rgba(232,64,122,0.15); margin: 1rem 0; }
  .lp-price-feats { list-style: none; display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.6rem; }
  .lp-price-feats li { font-size: 0.85rem; color: var(--muted); display: flex; align-items: center; gap: 0.5rem; }
  .lp-price-feats li::before { content: '•'; color: var(--accent2); font-weight: 700; flex-shrink: 0; }
  .lp-price-btn { width: 100%; padding: 0.8rem; border-radius: 99px; font-size: 0.88rem; font-weight: 600; cursor: pointer; transition: all 0.25s; font-family: 'DM Sans', sans-serif; }
  .lp-price-btn-outline { border: 1.5px solid rgba(232,64,122,0.3); background: transparent; color: var(--text); }
  .lp-price-btn-outline:hover { border-color: var(--accent); color: var(--accent3); }
  .lp-price-btn-hot { border: none; background: linear-gradient(135deg, var(--accent), #f472a8); color: #fff; box-shadow: 0 4px 20px rgba(232,64,122,0.35); }
  .lp-price-btn-hot:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(232,64,122,0.5); }

  .lp-waitlist-section { background: var(--dark); position: relative; overflow: hidden; text-align: center; padding: 8rem 1.5rem; }
  .lp-orb-cta-1 { width: 600px; height: 600px; top: 50%; left: 50%; transform: translate(-50%, -50%); background: radial-gradient(circle, rgba(232,64,122,0.18) 0%, transparent 70%); animation: none; }
  .lp-orb-cta-2 { width: 300px; height: 300px; top: 0; right: 0; background: radial-gradient(circle, rgba(122,16,64,0.2) 0%, transparent 70%); animation: none; }
  .lp-waitlist-inner { position: relative; z-index: 1; }
  .lp-waitlist-h2 { color: var(--text); margin-bottom: 1rem; }
  .lp-waitlist-sub { margin: 0 auto 2rem; }
  .lp-email-input-lg { min-width: 280px; }
  .lp-btn-lg { padding: 0.9rem 2rem; font-size: 0.95rem; }

  .lp-footer { padding: 3rem 1.5rem 2rem; border-top: 1px solid var(--border); background: linear-gradient(180deg, #110816 0%, #09040e 100%); }
  .lp-footer-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; flex-wrap: wrap; padding-bottom: 1.8rem; }
  .lp-footer-brand { max-width: 360px; }
  .lp-footer-blurb { margin-top: 0.9rem; color: var(--muted); font-size: 0.9rem; line-height: 1.7; }
  .lp-footer-columns { display: flex; gap: 3rem; flex-wrap: wrap; }
  .lp-footer-col { display: flex; flex-direction: column; gap: 0.65rem; }
  .lp-footer-title { color: var(--text); font-size: 0.78rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
  .lp-footer-col a { color: var(--muted); text-decoration: none; font-size: 0.88rem; }
  .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; padding-top: 1.2rem; border-top: 1px solid rgba(232, 64, 122, 0.14); }
  .lp-footer-copy { color: var(--muted); font-size: 0.78rem; }

  @keyframes reviewScrollLeft { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes reviewScrollRight { from { transform: translateX(-50%); } to { transform: translateX(0); } }

  @media (max-width: 900px) {
    .lp-hero-inner, .lp-price-grid, .lp-phases { grid-template-columns: 1fr; }
    .lp-hero-inner { gap: 1.15rem; }
    .lp-footer-top, .lp-footer-bottom { flex-direction: column; align-items: flex-start; }
  }
  @media (max-width: 768px) {
    .lp-nav,
    .lp-nav-scrolled,
    .lp-hero-inner,
    .lp-section,
    .lp-waitlist-section,
    .lp-footer,
    .lp-founder-wrap {
      width: 100%;
      max-width: 100%;
      margin-left: 0;
      margin-right: 0;
      padding-left: 16px;
      padding-right: 16px;
    }
    .lp-container,
    .lp-nav-inner,
    .lp-waitlist-inner,
    .lp-footer-top,
    .lp-footer-bottom {
      width: 100%;
      max-width: 100%;
      margin-left: 0;
      margin-right: 0;
      padding-left: 0;
      padding-right: 0;
    }

    .lp-nav-links {
      display: none;
      margin-left: auto;
    }
    .lp-nav-links a { display: block; width: 100%; }
    .lp-nav-cta-mobile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-left: auto;
      margin-right: 14px;
      padding: 0.5rem 1rem;
      font-size: 0.82rem;
      white-space: nowrap;
      text-decoration: none;
      box-shadow: 0 6px 18px rgba(232,64,122,0.28);
    }
    .lp-hamburger { display: flex; }
    .lp-menu-top {
      display: flex;
      width: 100%;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .lp-menu-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text);
      font-size: 2rem;
      line-height: 1;
      cursor: pointer;
    }
    .lp-nav-links.lp-nav-open {
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      flex-direction: column;
      align-items: flex-start;
      gap: 0;
      min-height: 100svh;
      padding: 16px;
      background: rgba(7, 4, 15, 0.98);
      border-bottom: 1px solid var(--border);
      z-index: 200;
    }
    .lp-nav-links.lp-nav-open a {
      display: block;
      width: 100%;
      padding: 18px 0;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      color: var(--text);
      font-size: 1.1rem;
    }
    .lp-nav-links.lp-nav-open .lp-nav-cta {
      margin-top: 18px;
      width: 100%;
      justify-content: center;
      text-align: center;
      padding: 0.95rem 1rem;
      border-bottom: 0;
      font-size: 1rem;
      background: var(--accent);
      color: #fff !important;
    }
    .lp-hero {
      overflow-x: clip;
    }
    .lp-hero-inner {
      grid-template-columns: 1fr;
      gap: 1.25rem;
      padding-top: 1.2rem;
      padding-bottom: 1rem;
    }
    .lp-hero-content,
    .lp-hero-visual,
    .lp-mockup,
    .lp-mockup-body,
    .lp-mock-showup,
    .lp-mock-sage,
    .lp-price-card,
    .lp-phase-card,
    .lp-feat-card {
      width: 100%;
      max-width: 100%;
      margin: 0;
    }
    .lp-hero-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .lp-badge,
    .lp-hero-rule {
      margin-left: 0;
      margin-right: 0;
    }
    .lp-badge {
      align-self: center;
      margin-bottom: 0.55rem;
    }
    .lp-hero-rule {
      display: none;
    }
    .lp-h1 {
      width: 100%;
      margin-bottom: 0.65rem;
      font-size: clamp(2.15rem, 8vw, 2.95rem);
      line-height: 0.98;
      text-align: center;
      display: grid;
      grid-template-columns: max-content max-content;
      justify-content: center;
      align-items: end;
      column-gap: 0.28em;
      row-gap: 0.12em;
      max-width: 100%;
    }
    .lp-h1-line {
      display: block;
      white-space: nowrap;
    }
    .lp-h1-line:nth-child(3) {
      grid-column: 1 / span 2;
      justify-self: center;
    }
    .lp-h1-execute {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 700;
      letter-spacing: 0.01em;
      font-size: 1.08em;
      line-height: 0.9;
    }
    .lp-hero-form {
      flex-direction: row;
      width: 100%;
      align-items: center;
      gap: 10px;
      max-width: 720px;
      margin-top: 0;
      padding: 0;
      border-radius: 0;
      background: transparent;
      border: 0;
      box-shadow: none;
      backdrop-filter: none;
    }
    .lp-email-input,
    .lp-email-input-lg,
    .lp-btn-primary,
    .lp-btn-lg {
      text-align: center;
      width: 100%;
      min-width: 0;
    }
    .lp-email-input,
    .lp-email-input-lg {
      flex: 1 1 auto;
      padding: 0.68rem 1rem;
      font-size: 0.88rem;
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.18);
      border-radius: 999px;
    }
    .lp-btn-primary,
    .lp-btn-lg {
      flex: 0 0 auto;
      width: auto;
      min-width: 132px;
      padding: 0.74rem 1rem;
      font-size: 0.88rem;
      background: #ffffff;
      color: #190d1c;
      border-radius: 999px;
      box-shadow: 0 8px 22px rgba(255,255,255,0.18);
    }
    .lp-hero-mobile-gap {
      display: block;
      width: 100%;
      height: 36px;
    }

    .lp-mockup {
      overflow: hidden;
    }
    .lp-mockup-body {
      overflow-x: hidden;
    }
    .lp-mock-tabs {
      flex-wrap: wrap;
    }
    .lp-mock-tab {
      flex: 1 1 calc(33.333% - 0.34rem);
      text-align: center;
    }
    .lp-mock-cards {
      grid-template-columns: 1fr;
      width: 100%;
    }
    .lp-mock-card {
      width: 100%;
    }
    .lp-mock-showup-head,
    .lp-mock-showup-row,
    .lp-mock-actions {
      width: 100%;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .lp-mock-checkin {
      min-width: 0;
      margin-left: 0;
    }
    .lp-mock-react {
      margin-left: auto;
    }

    .lp-section-sub,
    .lp-waitlist-sub {
      max-width: 100%;
    }
    .lp-waitlist-section {
      text-align: left;
    }
    .lp-waitlist-sub {
      margin-left: 0;
      margin-right: 0;
    }

    .lp-strip { overflow-x: auto; white-space: nowrap; flex-wrap: nowrap; scrollbar-width: none; }
    .lp-strip::-webkit-scrollbar { display: none; }
    .lp-pill { flex: 0 0 auto; }
  }
  @media (max-width: 760px) {
    .lp-float { display: none; }
  }
  @media (max-width: 640px) {
    .lp-feat-grid { grid-template-columns: 1fr; gap: 0.9rem; }
    .lp-review-card { width: 280px; min-height: 188px; padding: 0.95rem 1rem; }
    .lp-review-quote { font-size: 0.82rem; }
    .lp-hero-inner { gap: 1rem; padding-top: 1rem; padding-bottom: 0.7rem; }
    .lp-badge { font-size: 0.66rem; }
    .lp-hero-rule { width: 88px; margin-bottom: 0.7rem; }
    .lp-nav-cta-mobile {
      margin-right: 12px;
      padding: 0.48rem 0.9rem;
      font-size: 0.78rem;
    }
    .lp-h1 {
      font-size: clamp(1.9rem, 7vw, 2.45rem);
      margin-bottom: 0.55rem;
      line-height: 0.98;
      column-gap: 0.24em;
      row-gap: 0.08em;
    }
    .lp-h1-line { display: block; }
    .lp-h1-execute {
      font-size: 1.06em;
    }
    .lp-hero-form {
      max-width: 100%;
      gap: 8px;
      align-items: center;
    }
    .lp-email-input,
    .lp-email-input-lg {
      padding: 0.66rem 0.95rem;
    }
    .lp-btn-primary,
    .lp-btn-lg {
      min-width: 124px;
      padding: 0.66rem 0.95rem;
    }
    .lp-hero-mobile-gap {
      height: 42px;
    }
    .lp-mock-tab { flex-basis: 100%; }
  }
`

