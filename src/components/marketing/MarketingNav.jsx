import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import phasrMark from '../../assets/phasr-logo-pink.png'

const NAV_LINKS = [
  { label: 'Features', to: '/features' },
  { label: 'How It Works', to: '/#how-it-works' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'About', to: '/about' },
]

function isLoggedIn() {
  try {
    const raw = localStorage.getItem('phasr_cached_user')
    if (!raw) return false
    const p = JSON.parse(raw)
    return Boolean(p && p.id)
  } catch { return false }
}

const STYLES = `
.mkt-nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 22px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background 0.35s, box-shadow 0.35s, padding 0.25s, backdrop-filter 0.35s;
  font-family: 'General Sans', sans-serif;
}
.mkt-nav.mkt-dark {
  background: transparent;
}
.mkt-nav.mkt-light {
  background: rgba(255,255,255,0.94);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 1px 0 rgba(240,96,144,0.1);
  padding: 14px 32px;
}
.mkt-nav-logo {
  display: flex; align-items: center; gap: 9px;
  text-decoration: none; color: inherit;
  flex-shrink: 0;
}
.mkt-nav-logo img { width: 28px; height: 28px; object-fit: contain; }
.mkt-nav-logo-text {
  font-family: 'Fraunces', serif;
  font-size: 1.15rem; font-weight: 700;
  letter-spacing: -0.01em;
  transition: color 0.35s;
}
.mkt-nav.mkt-dark .mkt-nav-logo-text { color: #ffffff; }
.mkt-nav.mkt-light .mkt-nav-logo-text { color: #3d1020; }

.mkt-nav-links {
  display: flex; align-items: center; gap: 28px;
  list-style: none; margin: 0; padding: 0;
}
.mkt-nav-link {
  font-size: 0.875rem; font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
  letter-spacing: -0.01em;
}
.mkt-nav.mkt-dark .mkt-nav-link { color: rgba(255,255,255,0.72); }
.mkt-nav.mkt-light .mkt-nav-link { color: #5a2030; }
.mkt-nav-link:hover { color: #f06090 !important; }
.mkt-nav-link.active { color: #c2185b !important; }

.mkt-nav-actions { display: flex; align-items: center; gap: 12px; }
.mkt-nav-cta {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 20px;
  background: #c2185b; color: #fff;
  border-radius: 12px;
  font-size: 0.875rem; font-weight: 600;
  letter-spacing: -0.01em;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
  white-space: nowrap;
}
.mkt-nav-cta:hover { background: #a8124e; transform: translateY(-1px); }
.mkt-nav-dashboard {
  display: inline-flex; align-items: center;
  padding: 9px 20px;
  border-radius: 12px;
  font-size: 0.875rem; font-weight: 600;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s, color 0.15s;
}
.mkt-nav.mkt-dark .mkt-nav-dashboard {
  border: 1.5px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.85);
}
.mkt-nav.mkt-dark .mkt-nav-dashboard:hover {
  border-color: rgba(255,255,255,0.6);
  background: rgba(255,255,255,0.08);
}
.mkt-nav.mkt-light .mkt-nav-dashboard {
  border: 1.5px solid rgba(194,24,91,0.3);
  color: #c2185b;
}
.mkt-nav.mkt-light .mkt-nav-dashboard:hover {
  border-color: #c2185b;
  background: rgba(194,24,91,0.05);
}
.mkt-nav-hamburger {
  display: none; background: none; border: none;
  cursor: pointer; padding: 4px;
  transition: color 0.3s;
}
.mkt-nav.mkt-dark .mkt-nav-hamburger { color: #ffffff; }
.mkt-nav.mkt-light .mkt-nav-hamburger { color: #3d1020; }

/* Mobile overlay */
.mkt-mobile-menu {
  position: fixed; inset: 0; z-index: 200;
  background: rgba(26,3,16,0.97);
  backdrop-filter: blur(24px);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 22px;
  font-family: 'General Sans', sans-serif;
}
.mkt-mobile-close {
  position: absolute; top: 24px; right: 28px;
  background: none; border: none; cursor: pointer;
  color: rgba(255,255,255,0.7); padding: 4px;
}
.mkt-mobile-close:hover { color: #ffffff; }
.mkt-mobile-link {
  font-size: 1.4rem; font-weight: 700;
  color: rgba(255,255,255,0.8);
  text-decoration: none; letter-spacing: -0.02em;
  transition: color 0.15s;
}
.mkt-mobile-link:hover { color: #f06090; }
.mkt-mobile-cta {
  margin-top: 8px; padding: 14px 36px;
  background: #c2185b; color: #fff;
  border-radius: 12px;
  font-size: 1rem; font-weight: 700;
  text-decoration: none; letter-spacing: -0.01em;
}
.mkt-mobile-cta:hover { background: #a8124e; }

@media (max-width: 860px) {
  .mkt-nav-links { display: none; }
  .mkt-nav-actions { display: none; }
  .mkt-nav-hamburger { display: flex; }
  .mkt-nav { padding: 18px 20px; }
  .mkt-nav.mkt-light { padding: 14px 20px; }
}
`

export default function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeHash, setActiveHash] = useState('')
  const location = useLocation()
  const loggedIn = isLoggedIn()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', h, { passive: true })
    h()
    return () => window.removeEventListener('scroll', h)
  }, [])

  useEffect(() => { setMenuOpen(false) }, [location.pathname])

  // Scroll-spy: a hash nav link (e.g. "How It Works") only lights up when its
  // section is actually centered in the viewport — never on initial load.
  useEffect(() => {
    setActiveHash('')
    if (!isHome) return
    const hashIds = NAV_LINKS
      .filter(l => l.to.includes('#'))
      .map(l => l.to.split('#')[1])
    const observers = hashIds.map(id => {
      const el = document.getElementById(id)
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveHash(id) },
        { rootMargin: '-45% 0px -45% 0px', threshold: 0 }
      )
      obs.observe(el)
      return obs
    }).filter(Boolean)
    return () => observers.forEach(o => o.disconnect())
  }, [isHome, location.pathname])

  const dark = false // hero is white; nav is always light

  return (
    <>
      <style>{STYLES}</style>
      <header className={`mkt-nav ${dark ? 'mkt-dark' : 'mkt-light'}`}>
        <Link to="/" className="mkt-nav-logo">
          <img src={phasrMark} alt="PHASR" />
          <span className="mkt-nav-logo-text">PHASR</span>
        </Link>

        <nav aria-label="Main navigation">
          <ul className="mkt-nav-links">
            {NAV_LINKS.map(({ label, to }) => {
              const [basePath, hash] = to.split('#')
              const active = hash
                ? isHome && activeHash === hash
                : location.pathname === basePath
              return (
                <li key={to}>
                  <Link to={to} className={`mkt-nav-link${active ? ' active' : ''}`}>
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="mkt-nav-actions">
          {loggedIn
            ? <Link to="/dashboard" className="mkt-nav-dashboard">Open app</Link>
            : <Link to="/login" className="mkt-nav-cta">Join the waitlist</Link>
          }
        </div>

        <button className="mkt-nav-hamburger" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </header>

      {menuOpen && (
        <div className="mkt-mobile-menu" role="dialog" aria-modal="true">
          <button className="mkt-mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={24} />
          </button>
          {NAV_LINKS.map(({ label, to }) => (
            <Link key={to} to={to} className="mkt-mobile-link">{label}</Link>
          ))}
          {loggedIn
            ? <Link to="/dashboard" className="mkt-mobile-cta">Open app</Link>
            : <Link to="/login" className="mkt-mobile-cta">Join the waitlist</Link>
          }
        </div>
      )}
    </>
  )
}
