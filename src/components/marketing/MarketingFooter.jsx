import { Link } from 'react-router-dom'
import phasrMark from '../../assets/phasr-mark.png'

const STYLES = `
.mkt-footer {
  background: #1a0a10;
  color: #fff0f4;
  font-family: 'Manrope', sans-serif;
}

/* ── GRADIENT CTA BANNER ── */
.mkt-footer-banner {
  background: linear-gradient(90deg, #c2185b 0%, #f06090 50%, #c2185b 100%);
  padding: 80px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0;
  position: relative;
  overflow: hidden;
}
.mkt-footer-banner::before {
  content: '';
  position: absolute; inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}
.mkt-banner-human {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 32px; position: relative; z-index: 1;
}
.mkt-banner-human-text {
  font-family: 'Manrope', sans-serif;
  font-size: 13px; color: rgba(255,255,255,0.75);
  font-weight: 500;
}
.mkt-footer-banner-headline {
  font-family: 'Fraunces', serif;
  font-size: clamp(32px, 4vw, 48px);
  font-weight: 700; color: #ffffff;
  line-height: 1.15; letter-spacing: -0.02em;
  margin: 0 0 12px;
  position: relative; z-index: 1;
}
.mkt-footer-banner-sub {
  font-family: 'Manrope', sans-serif;
  font-size: 18px; color: rgba(255,255,255,0.8);
  margin: 0 0 36px;
  position: relative; z-index: 1;
}
.mkt-footer-banner-btn {
  background: #ffffff;
  color: #c2185b;
  border: none;
  border-radius: 12px;
  padding: 16px 36px;
  font-family: 'Manrope', sans-serif;
  font-size: 16px; font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background 0.18s, transform 0.12s;
  white-space: nowrap;
  position: relative; z-index: 1;
  display: inline-block;
}
.mkt-footer-banner-btn:hover { background: #fff5f8; transform: translateY(-2px); }

@media (max-width: 560px) {
  .mkt-footer-banner { padding: 60px 24px; }
}

/* Main footer body */
.mkt-footer-body {
  padding: 80px 32px 0;
}
.mkt-footer-inner {
  max-width: 1100px;
  margin: 0 auto;
}
.mkt-footer-top {
  display: grid;
  grid-template-columns: 1.8fr 1fr 1fr 1fr;
  gap: 56px;
  padding-bottom: 64px;
  border-bottom: 1px solid rgba(240,96,144,0.14);
}

/* Brand column */
.mkt-footer-brand {}
.mkt-footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  text-decoration: none;
}
.mkt-footer-logo img {
  width: 36px;
  height: 36px;
  object-fit: contain;
  filter: brightness(1.2);
}
.mkt-footer-logo-text {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff0f4;
}
.mkt-footer-tagline {
  font-size: 0.9rem;
  color: #b08090;
  line-height: 1.7;
  max-width: 260px;
  margin-bottom: 28px;
}
.mkt-footer-quote {
  font-family: 'Playfair Display', serif;
  font-size: 0.95rem;
  font-style: italic;
  color: #f78fb0;
  line-height: 1.6;
  max-width: 240px;
  padding-top: 24px;
  border-top: 1px solid rgba(240,96,144,0.14);
}

/* Link columns */
.mkt-footer-col-title {
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #f06090;
  margin-bottom: 24px;
}
.mkt-footer-links {
  display: flex;
  flex-direction: column;
  gap: 14px;
  list-style: none;
  margin: 0;
  padding: 0;
}
.mkt-footer-links a {
  font-size: 0.9rem;
  color: #b08090;
  text-decoration: none;
  transition: color 0.15s;
  letter-spacing: -0.01em;
}
.mkt-footer-links a:hover { color: #fff0f4; }

/* Bottom bar */
.mkt-footer-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36px 0 48px;
  gap: 20px;
  flex-wrap: wrap;
}
.mkt-footer-copy {
  font-size: 0.82rem;
  color: #6a3040;
}
.mkt-footer-badges {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mkt-footer-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(240,96,144,0.08);
  border: 1px solid rgba(240,96,144,0.18);
  border-radius: 100px;
  padding: 6px 14px;
  font-size: 0.78rem;
  font-weight: 600;
  color: #b08090;
}
.mkt-footer-badge-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #f06090;
}
.mkt-footer-made {
  font-size: 0.82rem;
  color: #6a3040;
  font-style: italic;
}

@media (max-width: 900px) {
  .mkt-footer-body { padding: 60px 24px 0; }
  .mkt-footer-top {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .mkt-footer-brand {
    grid-column: 1 / -1;
  }
}
@media (max-width: 900px) {
  .mkt-footer-top {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
  .mkt-footer-brand { grid-column: 1 / -1; }
  .mkt-footer-body { padding: 60px 24px 0; }
}
@media (max-width: 560px) {
  .mkt-footer-top { grid-template-columns: 1fr; gap: 36px; }
  .mkt-footer-bottom {
    flex-direction: column; align-items: flex-start;
    gap: 12px; padding-bottom: 40px;
  }
  .mkt-footer-badges { flex-wrap: wrap; }
}
`

export default function MarketingFooter({ onGetStarted }) {
  const year = new Date().getFullYear()
  return (
    <>
      <style>{STYLES}</style>
      <footer className="mkt-footer">

        <div className="mkt-footer-banner">
          <div className="mkt-banner-human">
            <span className="mkt-banner-human-text">Founding access · Locked-in pricing</span>
          </div>
          <h2 className="mkt-footer-banner-headline">Ready to follow through?</h2>
          <p className="mkt-footer-banner-sub">Your phase is waiting.</p>
          <Link to="/login" className="mkt-footer-banner-btn">Join the waitlist →</Link>
        </div>

        <div className="mkt-footer-body">
          <div className="mkt-footer-inner">
            <div className="mkt-footer-top">
              <div className="mkt-footer-brand">
                <Link to="/" className="mkt-footer-logo">
                  <img src={phasrMark} alt="PHASR" />
                  <span className="mkt-footer-logo-text">PHASR</span>
                </Link>
                <p className="mkt-footer-tagline">
                  Vision boards, Sage AI coaching, daily streaks, and journaling — built for women who actually follow through.
                </p>
                <p className="mkt-footer-quote">
                  "The vision was never the problem.<br />The follow-through was."
                </p>
              </div>

              <div>
                <p className="mkt-footer-col-title">Product</p>
                <ul className="mkt-footer-links">
                  <li><Link to="/features">All features</Link></li>
                  <li><Link to="/features/ai-coach">Sage AI coach</Link></li>
                  <li><Link to="/features/vision-boards">Vision boards</Link></li>
                  <li><Link to="/features/daily-streaks">Daily streaks</Link></li>
                  <li><Link to="/features/journal">Journal</Link></li>
                  <li><Link to="/features/dashboard">Phase Review</Link></li>
                  <li><Link to="/pricing">Pricing</Link></li>
                </ul>
              </div>

              <div>
                <p className="mkt-footer-col-title">Company</p>
                <ul className="mkt-footer-links">
                  <li><Link to="/about">About</Link></li>
                  <li><Link to="/blog">Blog</Link></li>
                  <li><Link to="/faq">FAQ</Link></li>
                  <li><Link to="/contact">Contact</Link></li>
                </ul>
              </div>

              <div>
                <p className="mkt-footer-col-title">Legal</p>
                <ul className="mkt-footer-links">
                  <li><Link to="/privacy">Privacy policy</Link></li>
                  <li><Link to="/terms">Terms of service</Link></li>
                </ul>
              </div>
            </div>

            <div className="mkt-footer-bottom">
              <span className="mkt-footer-copy">© {year} PHASR. All rights reserved.</span>
              <div className="mkt-footer-badges">
                <div className="mkt-footer-badge">
                  <div className="mkt-footer-badge-dot" />
                  For women, by women
                </div>
                <div className="mkt-footer-badge">
                  <div className="mkt-footer-badge-dot" />
                  Free tier forever
                </div>
              </div>
              <span className="mkt-footer-made">Made for women who are done starting over.</span>
            </div>
          </div>
        </div>

      </footer>
    </>
  )
}
