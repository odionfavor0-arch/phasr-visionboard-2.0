import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Layers, Compass, Flag } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

const BLOCKS = [
  {
    Icon: Layers,
    title: 'Your whole phase, in one place',
    body: 'Every win, every streak, the photos you added to your journal, the conversations that mattered. All of it, gathered.',
  },
  {
    Icon: Compass,
    title: "The patterns you couldn't see",
    body: "Sage names the growth you'd never pinpoint yourself, and the blind spots worth watching in the next phase.",
  },
  {
    Icon: Flag,
    title: "What's next",
    body: 'A clear read on where you are now and what the next phase could hold, so you start it on purpose instead of by accident.',
  },
]

export default function DashboardFeaturePage() {
  useEffect(() => {
    document.title = 'Phase Review, See Who You Became | PHASR'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', "At the end of every phase, Sage shows your wins, streaks, patterns, and growth in one recap, then sets up what's next. Get early access.")
  }, [])

  return (
    <MarketingLayout>
      <style>{`
        .feat-page-hero { padding: 32px 0 80px; }
        .feat-breadcrumb { font-size: 0.8rem; color: #b08090; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
        .feat-breadcrumb a { color: #b08090; text-decoration: none; }
        .feat-breadcrumb a:hover { color: #c2185b; }
        .feat-page-label { display: inline-block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin-bottom: 20px; }
        .feat-page-h1 { font-family: 'Fraunces', serif; font-size: clamp(2.2rem, 4.5vw, 3.4rem); font-weight: 700; color: #1a0a10; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 20px; }
        .feat-page-h1 em { font-style: italic; color: #c2185b; }
        .feat-page-sub { font-size: 1.1rem; color: #71717a; max-width: 560px; line-height: 1.65; margin: 0 0 40px; }
        .feat-page-cta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .mkt-btn-primary { display: inline-flex; align-items: center; padding: 14px 32px; background: #c2185b; color: #fff; border-radius: 100px; font-family: 'General Sans', sans-serif; font-size: 0.95rem; font-weight: 700; text-decoration: none; transition: background 0.15s, transform 0.1s; }
        .mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }
        .mkt-btn-ghost { display: inline-flex; align-items: center; padding: 14px 28px; border: 1.5px solid rgba(194,24,91,0.3); color: #c2185b; border-radius: 100px; font-family: 'General Sans', sans-serif; font-size: 0.95rem; font-weight: 600; text-decoration: none; }
        .mkt-btn-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
        .feat-page-divider { height: 1px; background: rgba(240,96,144,0.12); }
        .feat-page-section { padding: 80px 0; }
        .feat-block-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 960px; }
        .feat-block { padding: 28px; background: #fff; border: 1px solid #f06090; border-radius: 24px; transition: background 0.25s ease, border-color 0.25s ease; }
        .feat-block:hover { background: rgba(240,96,144,0.10); border-color: #f06090; }
        .feat-block-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .feat-block-icon { color: #c2185b; flex-shrink: 0; }
        .feat-block-h3 { font-family: 'Fraunces', serif; font-size: clamp(1.2rem, 2vw, 1.5rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.01em; margin: 0; }
        .feat-block-body { font-size: 1rem; color: #71717a; line-height: 1.75; margin: 0; }
        .feat-related { margin-top: 56px; padding-top: 32px; border-top: 1px solid rgba(240,96,144,0.12); max-width: 680px; }
        .feat-related-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin: 0 0 10px; }
        .feat-related-body { font-size: 0.95rem; color: #71717a; line-height: 1.6; margin: 0; }
        .feat-related-body a { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); }
        .feat-related-body a:hover { border-color: #c2185b; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        .feat-page-hero-grid { display: grid; grid-template-columns: 1.05fr 1fr; gap: 56px; align-items: center; }
        .feat-page-hero-grid > * { min-width: 0; }
        .feat-page-hero-img-wrap { width: 100%; }
        .feat-page-hero-img { width: 100%; height: auto; display: block; border-radius: 24px; object-fit: cover; box-shadow: 0 32px 80px rgba(194,24,91,0.16); }
        @media (max-width: 900px) {
          .feat-page-hero-grid { grid-template-columns: 1fr; gap: 40px; }
          .feat-page-hero-img-wrap { max-width: 100%; margin: 0; }
          .feat-page-hero-img { max-height: 55vh; border-radius: 20px; }
        }
        @media (max-width: 640px) { .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container feat-page-hero-grid">
          <div>
            <div className="feat-breadcrumb">
              <Link to="/features">Features</Link><span>/</span><span>Phase Review</span>
            </div>
            <span className="feat-page-label">Proof of follow-through</span>
            <h1 className="feat-page-h1">See who you<br /><em>became.</em></h1>
            <p className="feat-page-sub">
              At the end of every phase, Sage shows you the whole story, so the work finally becomes visible.
            </p>
            <div className="feat-page-cta-row">
              <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
              <Link to="/features" className="mkt-btn-ghost">All features</Link>
            </div>
          </div>
          <div className="feat-page-hero-img-wrap">
            <img src="/images/stat-mockup.jpg" alt="PHASR Phase Review — pattern insights, phase completion, and Sage's weekly note" className="feat-page-hero-img" />
          </div>
        </div>
      </section>

      <div className="feat-page-divider" />

      <section className="feat-page-section">
        <div className="mkt-container">
          <div className="feat-block-list">
            {BLOCKS.map(({ Icon, title, body }) => (
              <div className="feat-block" key={title}>
                <div className="feat-block-head">
                  <Icon size={20} strokeWidth={1.8} className="feat-block-icon" />
                  <h3 className="feat-block-h3">{title}</h3>
                </div>
                <p className="feat-block-body">{body}</p>
              </div>
            ))}
          </div>

          <div className="feat-related">
            <p className="feat-related-label">Related</p>
            <p className="feat-related-body">
              <Link to="/features/daily-streaks">Daily Streak</Link> is where the streaks it gathers come from. <Link to="/features/journal">Journal</Link> is where the entries it pulls from live.
            </p>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Your future self is<br /><em>already in there.</em></h2>
          <p className="feat-page-cta-sub">Start building your first phase.</p>
          <Link to="/login" className="mkt-btn-primary">Get early access</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
