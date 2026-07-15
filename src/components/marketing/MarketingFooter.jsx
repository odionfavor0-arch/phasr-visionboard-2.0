import { Link } from 'react-router-dom'
import phasrMark from '../../assets/phasr-logo-pink.png'

const STYLES = `
.mkt-footer {
  background: #1a0a10;
  color: #fff0f4;
  font-family: 'General Sans', sans-serif;
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
  font-family: 'Fraunces', serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: #fff0f4;
}
.mkt-footer-quote {
  font-family: 'Fraunces', serif;
  font-size: 0.95rem;
  font-style: italic;
  color: #f78fb0;
  line-height: 1.6;
  max-width: 240px;
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
  .mkt-footer-top { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .mkt-footer-brand { grid-column: 1 / -1; }
  .mkt-footer-col-title { font-size: 0.7rem; margin-bottom: 16px; }
  .mkt-footer-links { gap: 10px; }
  .mkt-footer-links a { font-size: 0.82rem; }
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

        <div className="mkt-footer-body">
          <div className="mkt-footer-inner">
            <div className="mkt-footer-top">
              <div className="mkt-footer-brand">
                <Link to="/" className="mkt-footer-logo">
                  <img src={phasrMark} alt="PHASR" />
                  <span className="mkt-footer-logo-text">PHASR</span>
                </Link>
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
