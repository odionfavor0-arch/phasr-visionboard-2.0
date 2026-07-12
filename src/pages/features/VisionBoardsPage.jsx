import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Target, Layers, CalendarDays } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

export default function VisionBoardsPage() {
  useEffect(() => { document.title = 'Vision Boards — PHASR' }, [])

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
        .mkt-btn-ghost { display: inline-flex; align-items: center; padding: 14px 28px; border: 1.5px solid rgba(194,24,91,0.3); color: #c2185b; border-radius: 100px; font-family: 'General Sans', sans-serif; font-size: 0.95rem; font-weight: 600; text-decoration: none; transition: border-color 0.15s, background 0.15s; }
        .mkt-btn-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
        .feat-page-divider { height: 1px; background: rgba(240,96,144,0.12); margin: 0; }
        .feat-page-section { padding: 80px 0; }
        .feat-page-section-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin-bottom: 16px; }
        .feat-page-section-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.7rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 16px; }
        .feat-page-section-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-section-body { font-size: 1rem; color: #71717a; line-height: 1.7; max-width: 600px; margin: 0 0 40px; }
        .feat-points { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 8px; }
        .feat-point { padding: 28px; background: #fff; border: 1px solid #f06090; border-radius: 24px; transition: background 0.25s ease, border-color 0.25s ease; }
        .feat-point:hover { background: rgba(240,96,144,0.10); border-color: #f06090; }
        .feat-point-icon { margin-bottom: 10px; color: #c2185b; }
        .feat-point-title { font-size: 1rem; font-weight: 700; color: #1a0a10; letter-spacing: -0.01em; margin-bottom: 6px; }
        .feat-point-body { font-size: 0.875rem; color: #71717a; line-height: 1.6; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        .vb-showcase { padding: 0 0 60px; border-bottom: 1px solid rgba(240,96,144,0.1); }
        .vb-showcase-img { width: 100%; max-width: 960px; height: auto; display: block; margin: 0 auto; mix-blend-mode: multiply; }
        @media (max-width: 640px) { .feat-points { grid-template-columns: 1fr; } .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Vision Boards</span>
          </div>
          <span className="feat-page-label">Where it starts</span>
          <h1 className="feat-page-h1">The board that has<br />a <em>plan attached.</em></h1>
          <p className="feat-page-sub">
            You've made vision boards before. This one doesn't let you stop at pretty. Set your phase, break it into pillars, get AI-generated resources — and let it feed everything else in PHASR.
          </p>
          <div className="feat-page-cta-row">
            <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
            <Link to="/features" className="mkt-btn-ghost">All features</Link>
          </div>
        </div>
      </section>

      <section className="vb-showcase">
        <div className="mkt-container">
          <img
            src="/images/mockup-3.jpg"
            alt="PHASR app — vision board, daily streaks, home dashboard, and phase review"
            className="vb-showcase-img"
          />
        </div>
      </section>

      <div className="feat-page-divider" />

      <section className="feat-page-section">
        <div className="mkt-container">
          <p className="feat-page-section-label">What's different</p>
          <h2 className="feat-page-section-h2">Vision boards that <em>do something.</em></h2>
          <p className="feat-page-section-body">
            Pinterest boards stay theoretical. PHASR boards connect to your daily check-ins, your streak, your journal, and Sage — so your vision actually becomes a system.
          </p>
          <div className="feat-points">
            <div className="feat-point">
              <div className="feat-point-icon"><Target size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Phase-based goals</p>
              <p className="feat-point-body">One big goal becomes one monthly phase. Clear, bounded, achievable. Not a sprawling bucket list.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Layers size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Pillars & structure</p>
              <p className="feat-point-body">Break your phase into focus areas. Before/after vision uploads give your pillars an emotional anchor.</p>
            </div>
            <div className="feat-point">
              <p className="feat-point-title">AI-generated resources</p>
              <p className="feat-point-body">Sage generates tailored resources, activities, and non-negotiables for each pillar when you set up your board.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><CalendarDays size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Weekly plans</p>
              <p className="feat-point-body">Your board feeds your weekly focus. Each Monday you know exactly what this week is for — not just what the month is for.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Your best year starts<br />with one <em>clear phase.</em></h2>
          <p className="feat-page-cta-sub">Join the waitlist and be first when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
