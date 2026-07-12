import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, MessageSquare, CalendarDays, Search } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

export default function JournalFeaturePage() {
  useEffect(() => { document.title = 'Journal — PHASR' }, [])

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
        .feat-trust-note { background: rgba(194,24,91,0.05); border: 1px solid rgba(194,24,91,0.12); border-radius: 12px; padding: 20px 24px; font-size: 0.875rem; color: #71717a; line-height: 1.6; margin-top: 32px; }
        .feat-trust-note strong { color: #c2185b; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        @media (max-width: 640px) { .feat-points { grid-template-columns: 1fr; } .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Journal</span>
          </div>
          <span className="feat-page-label">The clarity layer</span>
          <h1 className="feat-page-h1">Write to think.<br /><em>Sage responds.</em></h1>
          <p className="feat-page-sub">
            Free-write or use guided templates across career, finance, mental health, and relationships. Sage reads what you write and reflects back what you're ready to hear — not what sounds nice.
          </p>
          <div className="feat-page-cta-row">
            <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
            <Link to="/features" className="mkt-btn-ghost">All features</Link>
          </div>
        </div>
      </section>

      <div className="feat-page-divider" />

      <section className="feat-page-section">
        <div className="mkt-container">
          <h2 className="feat-page-section-h2">More than a diary.<br /><em>A thinking tool.</em></h2>
          <p className="feat-page-section-body">
            The journal isn't just storage for your thoughts. It's connected to Sage, your weekly pulse, and your reflection sessions — so what you write actually shapes what happens next.
          </p>
          <div className="feat-points">
            <div className="feat-point">
              <div className="feat-point-icon"><PenLine size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Free write & templates</p>
              <p className="feat-point-body">Start with a blank page or pick from guided templates built around career, relationships, finances, mental health, and fitness.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><MessageSquare size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Sage reads & responds</p>
              <p className="feat-point-body">After you write, Sage can respond — not with affirmations, but with one honest observation and one question worth sitting with.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><CalendarDays size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Weekly pulse</p>
              <p className="feat-point-body">At the end of each week, a structured pulse entry helps you notice patterns across your mood, energy, progress, and blocks.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Search size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Reflection mode</p>
              <p className="feat-point-body">Once a month, Sage opens a deeper reflection session drawing from your journal entries, streak data, and board progress together.</p>
            </div>
          </div>

          <div className="feat-trust-note">
            <strong>Your journal is private.</strong> Entries are never shared, never used for advertising, and never read by anyone except Sage — only when you ask her to respond. <Link to="/privacy" style={{ color: '#c2185b' }}>Privacy policy →</Link>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Clarity is one<br /><em>honest page away.</em></h2>
          <p className="feat-page-cta-sub">Join the waitlist and get access when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
