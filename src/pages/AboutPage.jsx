import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'

const STYLES = `
.about-hero {
  padding: 32px 0 80px;
}
.about-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.about-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 24px;
}
.about-h1 em { font-style: italic; color: #c2185b; }
.about-intro {
  font-size: 1.15rem;
  color: #3d1020;
  line-height: 1.75;
  max-width: 640px;
  margin: 0 0 60px;
  font-weight: 400;
}
.about-divider { height: 1px; background: rgba(240,96,144,0.12); margin: 0; }
.about-story {
  padding: 80px 0;
  max-width: 720px;
}
.about-story p {
  font-size: 1rem;
  color: #71717a;
  line-height: 1.8;
  margin: 0 0 24px;
}
.about-story p strong { color: #3d1020; }
.about-mission {
  padding: 80px 0;
  background: linear-gradient(135deg, #fff6f8 0%, #fdf0ff 60%, #f0f6ff 100%);
  border-top: 1px solid rgba(240,96,144,0.1);
  border-bottom: 1px solid rgba(240,96,144,0.1);
}
.about-mission-inner {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}
.about-mission-inner > * { min-width: 0; }
.about-mission-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 16px;
}
.about-mission-h2 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  line-height: 1.2;
  margin: 0 0 20px;
}
.about-mission-h2 em { font-style: italic; color: #c2185b; }
.about-mission-body {
  font-size: 0.95rem;
  color: #71717a;
  line-height: 1.75;
}
.about-values {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.about-value {
  padding: 20px 24px;
  background: rgba(255,255,255,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(240,96,144,0.15);
  border-radius: 24px;
  box-shadow: 0 8px 24px rgba(61,16,32,0.08);
}
.about-value-accent {
  width: 24px;
  height: 3px;
  border-radius: 100px;
  background: #f06090;
  margin-bottom: 10px;
}
.about-mission-img-wrap {
  position: relative;
  display: inline-block;
  width: 100%;
  margin-top: 36px;
}
.about-mission-img {
  width: 100%;
  max-width: 440px;
  height: auto;
  display: block;
  border-radius: 20px;
  box-shadow: 0 16px 48px rgba(61,16,32,0.10);
}
.about-phase-card {
  position: absolute;
  bottom: -20px;
  right: -10px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(240,96,144,0.18);
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: 0 8px 32px rgba(61,16,32,0.12), inset 0 1px 0 rgba(255,255,255,0.9);
  min-width: 190px;
  animation: about-float 5s ease-in-out infinite;
  z-index: 2;
}
@keyframes about-float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}
.about-phase-card-label {
  font-family: 'General Sans', sans-serif;
  font-size: 9px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  color: #f06090; margin-bottom: 6px;
}
.about-phase-card-title {
  font-family: 'Fraunces', serif;
  font-size: 15px; font-weight: 700;
  color: #3d1020; margin-bottom: 10px;
}
.about-phase-bar-track {
  height: 4px; background: rgba(240,96,144,0.18);
  border-radius: 100px; overflow: hidden; margin-bottom: 5px;
}
.about-phase-bar {
  height: 100%; width: 72%;
  background: linear-gradient(90deg, #f06090, #c2185b);
  border-radius: 100px;
}
.about-phase-meta {
  font-family: 'General Sans', sans-serif;
  font-size: 11px; color: #8a5060; margin-bottom: 8px;
}
.about-phase-pills { display: flex; gap: 5px; flex-wrap: wrap; }
.about-phase-pill {
  background: rgba(240,96,144,0.1); color: #c2185b;
  font-family: 'General Sans', sans-serif; font-size: 10px; font-weight: 600;
  padding: 3px 9px; border-radius: 100px;
  border: 1px solid rgba(194,24,91,0.15);
}
.about-value-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a0a10;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}
.about-value-body {
  font-size: 0.825rem;
  color: #71717a;
  line-height: 1.55;
}
.about-cta {
  padding: 80px 0;
  text-align: center;
}
.about-cta-h2 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 12px;
}
.about-cta-h2 em { font-style: italic; color: #c2185b; }
.about-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
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
}
.mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }

@media (max-width: 768px) {
  .about-mission-inner { grid-template-columns: 1fr; gap: 40px; }
  .about-hero { padding: 80px 0 60px; }
}
`

export default function AboutPage() {
  useEffect(() => { document.title = 'About — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="about-hero">
        <div className="mkt-container">
          <span className="about-label">Why we built this</span>
          <h1 className="about-h1">Built for the woman<br />who <em>knows what she wants</em><br />and keeps starting over.</h1>
          <p className="about-intro">
            PHASR exists because the gap between vision and follow-through is not a willpower problem. It's a systems problem. And most apps for women either ignore that or make it worse.
          </p>
        </div>
      </section>

      <div className="about-divider" />

      <section className="about-story">
        <div className="mkt-container">
          <p>
            <strong>The idea started with a journal entry.</strong> A vision board that was beautiful and useless. A habit tracker that made her feel guilty. A community that was all performance and no presence.
          </p>
          <p>
            She wasn't lazy. She wasn't uncommitted. She was over-equipped and under-structured. She had ten apps for ten different problems, none of them talking to each other, and none of them actually knowing what she was trying to build.
          </p>
          <p>
            <strong>PHASR was built to fix that.</strong> One system: vision board, Sage AI coach, daily streaks, journal, and phase review — designed to work together, not alongside each other.
          </p>
          <p>
            The name comes from the idea of phases. Life doesn't happen in annual goal cycles. It happens in focused, bounded chapters — phases — and when you treat your goals that way, everything becomes simpler. One phase. One focus. One reason to show up today.
          </p>
        </div>
      </section>

      <section className="about-mission">
        <div className="mkt-container">
          <div className="about-mission-inner">
            <div>
              <span className="about-mission-label">THE MISSION</span>
              <h2 className="about-mission-h2">Turn vision<br />into <em>structure.</em></h2>
              <p className="about-mission-body">
                We believe every ambitious woman deserves a system that actually knows her — one that connects her vision to her daily habits, her journal to her coaching, and her streaks to her consistency. That's what PHASR is building.
              </p>
              <div className="about-mission-img-wrap">
                <img
                  src="/images/mockup-3.jpg"
                  alt="PHASR app — vision board, streaks, journal, and phase review working together"
                  className="about-mission-img"
                />
                <div className="about-phase-card">
                  <div className="about-phase-card-label">JANUARY PHASE</div>
                  <div className="about-phase-card-title">Land the role</div>
                  <div className="about-phase-bar-track">
                    <div className="about-phase-bar" />
                  </div>
                  <div className="about-phase-meta">72% · 18 days in</div>
                  <div className="about-phase-pills">
                    <span className="about-phase-pill">Portfolio</span>
                    <span className="about-phase-pill">Interviews</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="about-values">
              {[
                { title: 'Recognition over persuasion', body: 'This app should feel like home before it feels like a pitch.' },
                { title: 'Structure over willpower', body: 'Follow-through is a systems problem, not a character flaw.' },
                { title: 'Presence over performance', body: 'A quiet streak means more than a loud highlight reel.' },
                { title: 'Momentum over completion', body: 'A 6-day streak after a slip beats a 30-day streak you abandoned.' },
              ].map(({ title, body }) => (
                <div key={title} className="about-value">
                  <div className="about-value-accent" />
                  <p className="about-value-title">{title}</p>
                  <p className="about-value-body">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="about-cta">
        <div className="mkt-container">
          <h2 className="about-cta-h2">This is for <em>her.</em><br />You know if that's you.</h2>
          <p className="about-cta-sub">Join the waitlist. Be first when we open.</p>
          <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
