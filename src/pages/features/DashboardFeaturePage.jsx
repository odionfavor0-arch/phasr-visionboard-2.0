import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, BookOpenCheck, Compass, Flag } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

export default function DashboardFeaturePage() {
  useEffect(() => { document.title = 'Phase Review — PHASR' }, [])

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
        .feat-page-section-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 16px; }
        .feat-page-section-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-section-body { font-size: 1rem; color: #71717a; line-height: 1.7; max-width: 600px; margin: 0 0 40px; }
        .feat-points { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .feat-point { padding: 28px; background: #fff; border: 1px solid #f06090; border-radius: 24px; transition: background 0.25s ease, border-color 0.25s ease; }
        .feat-point:hover { background: rgba(240,96,144,0.10); border-color: #f06090; }
        .feat-point-icon { margin-bottom: 10px; color: #c2185b; }
        .feat-point-title { font-size: 1rem; font-weight: 700; color: #1a0a10; margin-bottom: 6px; }
        .feat-point-body { font-size: 0.875rem; color: #71717a; line-height: 1.6; }
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
        @media (max-width: 640px) { .feat-points { grid-template-columns: 1fr; } .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container feat-page-hero-grid">
          <div>
            <div className="feat-breadcrumb">
              <Link to="/features">Features</Link><span>/</span><span>Phase Review</span>
            </div>
            <span className="feat-page-label">The end-of-phase moment</span>
            <h1 className="feat-page-h1">See who you<br /><em>became.</em></h1>
            <p className="feat-page-sub">
              When your phase ends, Sage puts together your Phase Review — a Wrapped-style recap of your wins, your patterns, your lessons, and what's next. The data isn't the goal. Your transformation is.
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
          <h2 className="feat-page-section-h2">Not a spreadsheet. A <em>recap.</em></h2>
          <p className="feat-page-section-body">
            Every phase ends with a moment built to feel earned — not a wall of numbers, but the story of what actually happened and who you were becoming while it did.
          </p>
          <div className="feat-points">
            <div className="feat-point">
              <div className="feat-point-icon"><TrendingUp size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Your wins</p>
              <p className="feat-point-body">The check-ins, the streaks, the days you showed up anyway. Phase Review pulls them together so you can actually see them.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Compass size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Your patterns</p>
              <p className="feat-point-body">Sage surfaces what your journal and streaks reveal — when you're consistent, when you stall, and why.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><BookOpenCheck size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Your lessons</p>
              <p className="feat-point-body">The reflections that mattered most, pulled from your journal and weekly check-ins across the whole phase.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Flag size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Your next phase</p>
              <p className="feat-point-body">Sage uses everything from this phase to help you set the next one — so you're never starting from zero again.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Your future self is<br /><em>already in there.</em></h2>
          <p className="feat-page-cta-sub">Join the waitlist and start building your first phase.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
