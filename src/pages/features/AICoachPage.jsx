import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardList, MessageSquare, Map, Bell } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

const STYLES = `
.feat-page-hero {
  padding: 32px 0 80px;
}
.feat-breadcrumb {
  font-size: 0.8rem;
  color: #b08090;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.feat-breadcrumb a {
  color: #b08090;
  text-decoration: none;
}
.feat-breadcrumb a:hover { color: #c2185b; }
.feat-page-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.feat-page-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.2rem, 4.5vw, 3.4rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.feat-page-h1 em { font-style: italic; color: #c2185b; }
.feat-page-sub {
  font-size: 1.1rem;
  color: #71717a;
  max-width: 560px;
  line-height: 1.65;
  margin: 0 0 40px;
}
.feat-page-cta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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
.mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }
.mkt-btn-ghost {
  display: inline-flex;
  align-items: center;
  padding: 14px 28px;
  border: 1.5px solid rgba(194,24,91,0.3);
  color: #c2185b;
  border-radius: 100px;
  font-family: 'General Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}
.mkt-btn-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
.feat-page-divider {
  height: 1px;
  background: rgba(240,96,144,0.12);
  margin: 0;
}
.feat-page-section {
  padding: 80px 0;
}
.feat-page-section-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 16px;
}
.feat-page-section-h2 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.7rem, 3vw, 2.4rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.feat-page-section-h2 em { font-style: italic; color: #c2185b; }
.feat-page-section-body {
  font-size: 1rem;
  color: #71717a;
  line-height: 1.7;
  max-width: 600px;
  margin: 0 0 40px;
}
.feat-points {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
  margin-top: 8px;
}
.feat-point {
  padding: 28px 28px;
  background: #fff;
  border: 1px solid #f06090;
  border-radius: 24px;
  transition: background 0.25s ease, border-color 0.25s ease;
}
.feat-point:hover {
  background: rgba(240,96,144,0.10);
  border-color: #f06090;
}
.feat-point-icon {
  margin-bottom: 10px;
  color: #c2185b;
}
.feat-point-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.01em;
  margin-bottom: 6px;
}
.feat-point-body {
  font-size: 0.875rem;
  color: #71717a;
  line-height: 1.6;
}
.feat-trust-note {
  background: rgba(194,24,91,0.05);
  border: 1px solid rgba(194,24,91,0.12);
  border-radius: 12px;
  padding: 20px 24px;
  font-size: 0.875rem;
  color: #71717a;
  line-height: 1.6;
  margin-top: 32px;
}
.feat-trust-note strong { color: #c2185b; }
.feat-page-cta-section {
  padding: 80px 0;
  text-align: center;
  border-top: 1px solid rgba(240,96,144,0.1);
}
.feat-page-cta-h2 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
.feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }

@media (max-width: 640px) {
  .feat-points { grid-template-columns: 1fr; }
  .feat-page-hero { padding: 80px 0 60px; }
}
`

export default function AICoachPage() {
  useEffect(() => { document.title = 'Sage AI Coach — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link>
            <span>/</span>
            <span>Sage AI Coach</span>
          </div>
          <span className="feat-page-label">The differentiator</span>
          <h1 className="feat-page-h1">Not a chatbot.<br />A <em>companion.</em></h1>
          <p className="feat-page-sub">
            Sage is the AI coach inside PHASR. She knows your vision board, your streaks, your journal entries, and your weekly pulse — and she uses all of it to ask the one question that matters right now.
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
          <p className="feat-page-section-label">What Sage does</p>
          <h2 className="feat-page-section-h2">Guidance that knows <em>your context.</em></h2>
          <p className="feat-page-section-body">
            Generic AI coaching is everywhere. Sage is different because she doesn't start from zero every session. She knows where you are in your phase, how your streak looks, and what you wrote in your journal last week.
          </p>
          <div className="feat-points">
            <div className="feat-point">
              <div className="feat-point-icon"><ClipboardList size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Weekly reset</p>
              <p className="feat-point-body">Every week, Sage reviews your progress and helps you set a realistic, focused weekly goal — not a list, one clear thing.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><MessageSquare size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Journal responses</p>
              <p className="feat-point-body">Write in your journal and Sage responds — not with platitudes, but with a reflection based on what you actually wrote.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Map size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Pillar planning</p>
              <p className="feat-point-body">When you set up a new phase, Sage generates resources, activities, and non-negotiables tailored to your specific goal.</p>
            </div>
            <div className="feat-point">
              <div className="feat-point-icon"><Bell size={22} strokeWidth={1.8} /></div>
              <p className="feat-point-title">Nudges that land</p>
              <p className="feat-point-body">When your streak dips or you miss a check-in, Sage surfaces a warm, direct prompt — not a guilt trip.</p>
            </div>
          </div>

          <div className="feat-trust-note">
            <strong>Your data stays yours.</strong> Sage reads your journal and board to give you better guidance — your entries are never used to train models or shared with third parties. Read our <Link to="/privacy" style={{ color: '#c2185b' }}>privacy policy</Link>.
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Ready to meet <em>Sage?</em></h2>
          <p className="feat-page-cta-sub">Join the waitlist and be first to experience accountability that actually knows you.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
