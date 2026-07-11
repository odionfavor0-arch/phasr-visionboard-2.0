import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, Trophy, BarChart2, RefreshCw } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

export default function DailyStreaksPage() {
  useEffect(() => { document.title = 'Daily Streaks — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{`
        .feat-page-hero { padding: 32px 0 80px; }
        .feat-breadcrumb { font-size: 0.8rem; color: #b08090; margin-bottom: 24px; display: flex; align-items: center; gap: 8px; }
        .feat-breadcrumb a { color: #b08090; text-decoration: none; }
        .feat-breadcrumb a:hover { color: #c2185b; }
        .feat-page-label { display: inline-block; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin-bottom: 20px; }
        .feat-page-h1 { font-family: 'Playfair Display', serif; font-size: clamp(2.2rem, 4.5vw, 3.4rem); font-weight: 700; color: #1a0a10; line-height: 1.15; letter-spacing: -0.02em; margin: 0 0 20px; }
        .feat-page-h1 em { font-style: italic; color: #c2185b; }
        .feat-page-sub { font-size: 1.1rem; color: #71717a; max-width: 560px; line-height: 1.65; margin: 0 0 40px; }
        .feat-page-cta-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .mkt-btn-primary { display: inline-flex; align-items: center; padding: 14px 32px; background: #c2185b; color: #fff; border-radius: 100px; font-family: 'Manrope', sans-serif; font-size: 0.95rem; font-weight: 700; text-decoration: none; transition: background 0.15s, transform 0.1s; }
        .mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }
        .mkt-btn-ghost { display: inline-flex; align-items: center; padding: 14px 28px; border: 1.5px solid rgba(194,24,91,0.3); color: #c2185b; border-radius: 100px; font-family: 'Manrope', sans-serif; font-size: 0.95rem; font-weight: 600; text-decoration: none; transition: border-color 0.15s, background 0.15s; }
        .mkt-btn-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
        .feat-page-divider { height: 1px; background: rgba(240,96,144,0.12); margin: 0; }
        .feat-page-section { padding: 80px 0; }
        .feat-page-section-h2 { font-family: 'Playfair Display', serif; font-size: clamp(1.7rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 16px; }
        .feat-page-section-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-section-body { font-size: 1rem; color: #71717a; line-height: 1.7; max-width: 600px; margin: 0 0 40px; }
        .feat-points { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
        .feat-point { padding: 28px; background: #fff; border: 1px solid #f06090; border-radius: 24px; transition: background 0.25s ease, border-color 0.25s ease; }
        .feat-point:hover { background: rgba(240,96,144,0.10); border-color: #f06090; }
        .feat-point-icon { margin-bottom: 10px; color: #c2185b; }
        .feat-point-title { font-size: 1rem; font-weight: 700; color: #1a0a10; letter-spacing: -0.01em; margin-bottom: 6px; }
        .feat-point-body { font-size: 0.875rem; color: #71717a; line-height: 1.6; }
        .feat-philosophy { background: rgba(194,24,91,0.04); border-left: 3px solid #c2185b; border-radius: 0 12px 12px 0; padding: 24px 28px; margin-top: 40px; font-size: 1rem; color: #3d1020; line-height: 1.7; font-style: italic; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Playfair Display', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        @media (max-width: 640px) { .feat-points { grid-template-columns: 1fr; } .feat-page-hero { padding: 80px 0 60px; } }
        .streak-showcase { padding: 0 0 80px; }
        .streak-showcase-panel {
          background: linear-gradient(150deg, #ffe1eb 0%, #ffcfe0 100%);
          border-radius: 32px;
          padding: 56px 40px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .streak-showcase-img {
          width: 100%; max-width: 880px; height: auto; display: block;
          transform: rotate(-4deg);
          border-radius: 20px;
          box-shadow: 0 30px 70px rgba(194,24,91,0.28);
        }
        @media (max-width: 640px) {
          .streak-showcase-panel { padding: 32px 20px; border-radius: 24px; }
          .streak-showcase-img { transform: rotate(-3deg); }
        }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Daily Streaks</span>
          </div>
          <span className="feat-page-label">Momentum, not guilt</span>
          <h1 className="feat-page-h1">The streak that<br /><em>wants you back.</em></h1>
          <p className="feat-page-sub">
            One daily check-in. That's all it takes to keep your streak alive. No punishing resets, no shame loops — just a visible record of how many days you chose yourself.
          </p>
          <div className="feat-page-cta-row">
            <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
            <Link to="/features" className="mkt-btn-ghost">All features</Link>
          </div>
        </div>
      </section>

      <section className="streak-showcase">
        <div className="mkt-container">
          <div className="streak-showcase-panel">
            <img
              src="/images/product-vision-dailystreak.png"
              alt="PHASR Vision Board and Daily Streaks screens, side by side"
              className="streak-showcase-img"
            />
          </div>
        </div>
      </section>

      <div className="feat-page-divider" />

      <section className="feat-page-section">
        <div className="mkt-container">
          <h2 className="feat-page-section-h2">Built for <em>real life.</em></h2>
          <p className="feat-page-section-body">
            Most streak apps punish you for living. PHASR's streak system is designed to make showing up feel earned — not like avoiding a punishment.
          </p>
          <div className="feat-points">
            <div className="feat-point">
              <div className="feat-point-icon"><Flame size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Daily check-in</p>
              <p className="feat-point-body">One prompt each day: what did you move forward? Takes 60 seconds. Keeps your streak alive and your mind clear.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Trophy size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Ranks & unlocks</p>
              <p className="feat-point-body">As your streak grows, your rank rises. Features and recognition unlock with consistency.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><BarChart2 size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Streak history</p>
              <p className="feat-point-body">Your full streak timeline is visible on the dashboard. See the weeks that landed and what made them stick.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><RefreshCw size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Weekly reset with Sage</p>
              <p className="feat-point-body">Every Monday, Sage reviews the past week's streaks and helps you set a single, focused goal for the week ahead.</p>
            </div>
          </div>

          <p className="feat-philosophy">
            "Momentum over completion. A 6-day streak after a slip beats a 30-day streak you gave up on. PHASR is designed to make you want to come back — not dread opening the app."
          </p>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Day 1 is always<br /><em>today.</em></h2>
          <p className="feat-page-cta-sub">Join the waitlist and start your first streak when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
