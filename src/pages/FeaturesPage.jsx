import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid, Flame, BookOpen, Award } from 'lucide-react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const FEATURES = [
  {
    to: '/features/vision-boards',
    label: 'Vision Board',
    tagline: 'The plan, not just the picture.',
    body: 'Set your phase, define your pillars, get AI-generated resources. The board is where you start, not where it ends.',
    Icon: LayoutGrid,
    cta: 'See how boards work',
  },
  {
    to: '/features/ai-coach',
    label: 'Sage',
    tagline: 'Your personal accountability companion, not a chatbot.',
    body: 'Sage knows your board, your streaks, your journal and asks the one question that matters this week.',
    photo: true,
    cta: 'Meet Sage',
  },
  {
    to: '/features/daily-streaks',
    label: 'Daily Streak',
    tagline: 'Momentum, not guilt.',
    body: 'One daily check-in keeps your streak alive. Ranks, unlocks, and milestones that make showing up feel earned.',
    Icon: Flame,
    cta: 'Track your streak',
  },
  {
    to: '/features/journal',
    label: 'Journal',
    tagline: 'Write to think. Sage responds.',
    body: "Free-write or use guided templates. Sage reads your journal and reflects back what you're ready to hear.",
    Icon: BookOpen,
    cta: 'Start journaling',
  },
  {
    to: '/features/dashboard',
    label: 'Phase Review',
    tagline: 'See who you became.',
    body: 'At the end of every phase, get a Wrapped-style recap — your wins, your patterns, your lessons, and what comes next.',
    Icon: Award,
    cta: 'See a phase review',
  },
]

const STYLES = `
.feat-hub-hero {
  padding: 32px 0 80px;
  text-align: center;
  border-bottom: 1px solid rgba(240,96,144,0.1);
}
.feat-hub-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.feat-hub-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 5vw, 3.8rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.feat-hub-h1 em {
  font-style: italic;
  color: #c2185b;
}
.feat-hub-sub {
  font-size: 1.1rem;
  color: #71717a;
  max-width: 520px;
  margin: 0 auto;
  line-height: 1.65;
}

/* Product showcase */
.feat-showcase {
  padding: 20px 0 80px;
  text-align: center;
  border-bottom: 1px solid rgba(240,96,144,0.1);
}
.feat-showcase-eyebrow {
  font-family: 'General Sans', sans-serif;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #c2185b;
  display: block;
  margin-bottom: 36px;
}
.feat-showcase-img {
  width: 100%;
  max-width: 1000px;
  height: auto;
  display: block;
  margin: 0 auto;
  mix-blend-mode: multiply;
}

/* Glass cards section */
.feat-cards-section {
  padding: 80px 0 100px;
  background: linear-gradient(150deg, #fff0f5 0%, #fff8fa 55%, #f8f3ff 100%);
  position: relative;
  overflow: hidden;
}
.feat-cards-blob-1 {
  position: absolute;
  width: 520px; height: 520px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(194,24,91,0.1) 0%, transparent 70%);
  top: -140px; right: -90px;
  filter: blur(64px);
  pointer-events: none;
}
.feat-cards-blob-2 {
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(155,63,204,0.09) 0%, transparent 70%);
  bottom: -100px; left: -70px;
  filter: blur(64px);
  pointer-events: none;
}
.feat-hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  position: relative;
  z-index: 1;
}
.feat-hub-card {
  background: #ffffff;
  border: 1px solid #f06090;
  border-radius: 24px;
  padding: 40px 32px;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: 0 8px 24px rgba(61, 16, 32, 0.06);
  transition: background 0.25s ease, border-color 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease;
  position: relative;
  overflow: hidden;
}
.feat-hub-card:hover {
  transform: translateY(-6px);
  background: rgba(240, 96, 144, 0.10);
  border-color: #f06090;
  box-shadow: 0 16px 40px rgba(194, 24, 91, 0.14);
}
.feat-hub-icon-wrap {
  width: 52px; height: 52px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(194,24,91,0.13) 0%, rgba(155,63,204,0.08) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 14px rgba(194,24,91,0.13),
    inset 0 1px 0 rgba(255,255,255,0.85);
  color: #c2185b;
  flex-shrink: 0;
  overflow: hidden;
}
.feat-hub-icon-photo {
  width: 100%; height: 100%;
  object-fit: cover;
  border-radius: 14px;
}
.feat-hub-card-label {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
}
.feat-hub-card-tagline {
  font-size: 0.875rem;
  font-weight: 600;
  color: #c2185b;
  line-height: 1.45;
}
.feat-hub-card-body {
  font-size: 0.875rem;
  color: #71717a;
  line-height: 1.68;
  flex: 1;
}
.feat-hub-card-cta {
  font-size: 0.82rem;
  font-weight: 700;
  color: #c2185b;
  letter-spacing: 0.01em;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap 0.25s ease;
}
.feat-hub-card:hover .feat-hub-card-cta { gap: 10px; }

.feat-hub-cta {
  text-align: center;
  padding: 80px 0;
}
.feat-hub-cta-h2 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.feat-hub-cta-h2 em {
  font-style: italic;
  color: #c2185b;
}
.feat-hub-cta-sub {
  color: #71717a;
  font-size: 0.95rem;
  margin: 0 0 32px;
}
.mkt-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 14px 32px;
  background: #c2185b;
  color: #fff;
  border-radius: 100px;
  font-family: 'General Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
  letter-spacing: -0.01em;
}
.mkt-btn-primary:hover {
  background: #a8124e;
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .feat-hub-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .feat-hub-grid { grid-template-columns: 1fr; gap: 16px; }
  .feat-hub-card { padding: 32px 24px; }
  .feat-hub-hero { padding: 80px 0 60px; }
  .feat-cards-section { padding: 60px 0 80px; }
}
`

export default function FeaturesPage() {
  useEffect(() => { document.title = 'Features — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="feat-hub-hero">
        <div className="mkt-container">
          <span className="feat-hub-label">Every tool, in detail</span>
          <h1 className="feat-hub-h1">How each piece<br /><em>actually works.</em></h1>
          <p className="feat-hub-sub">
            Five tools, one system, threaded together by Sage. Here's exactly what each one does and how it connects to the rest.
          </p>
        </div>
      </section>

      <section className="feat-showcase">
        <div className="mkt-container">
          <span className="feat-showcase-eyebrow">Every screen, working together</span>
          <img
            src="/images/mockup-3.jpg"
            alt="PHASR app — vision board, daily streaks, journal, and phase review working together"
            className="feat-showcase-img"
          />
        </div>
      </section>

      <section className="feat-cards-section">
        <div className="feat-cards-blob-1" aria-hidden="true" />
        <div className="feat-cards-blob-2" aria-hidden="true" />
        <div className="mkt-container">
          <div className="feat-hub-grid">
            {FEATURES.map(({ to, label, tagline, body, Icon, photo, cta }) => (
              <Link key={to} to={to} className="feat-hub-card">
                <div className="feat-hub-icon-wrap">
                  {photo
                    ? <img src="/images/sage.jpg" alt="" className="feat-hub-icon-photo" />
                    : <Icon size={22} strokeWidth={1.8} />}
                </div>
                <p className="feat-hub-card-label">{label}</p>
                <p className="feat-hub-card-tagline">{tagline}</p>
                <p className="feat-hub-card-body">{body}</p>
                <span className="feat-hub-card-cta">{cta} &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="feat-hub-cta">
        <div className="mkt-container">
          <h2 className="feat-hub-cta-h2">Built to work <em>together.</em></h2>
          <p className="feat-hub-cta-sub">Every feature connects. Your board feeds your streaks. Your streaks feed Sage. Sage feeds your next phase.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
