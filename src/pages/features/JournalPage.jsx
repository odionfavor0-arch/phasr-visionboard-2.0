import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PenLine, MessageSquare, CalendarDays, Search } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

const BLOCKS = [
  {
    Icon: PenLine,
    title: 'A blank page, made yours',
    body: 'Start with nothing and fill it however you want. Add photos, design the background, drop in stars and bullet points, make it something you actually want to open.',
  },
  {
    Icon: MessageSquare,
    title: 'Sage reads with you',
    body: "Write, and Sage writes back. She's a real companion in there, the one you can say the honest thing to when you wouldn't say it out loud yet.",
  },
  {
    Icon: CalendarDays,
    title: 'A weekly pause',
    body: "Once a week, Sage pulls your entries together and reflects them back, so you can see how far you've come and feel that every step counted.",
  },
  {
    Icon: Search,
    title: 'Reflection that shows your patterns',
    body: "Over time, the journal surfaces the loops you keep running, the ones you can't see from inside them. That's where the growth happens.",
  },
]

export default function JournalFeaturePage() {
  useEffect(() => {
    document.title = 'AI Journaling App That Reflects With You | PHASR'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'A journal you can design, write freely, and talk through with Sage. Weekly reflection surfaces the patterns you can\'t see. Get early access.')
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
        .feat-trust-note { background: rgba(194,24,91,0.05); border: 1px solid rgba(194,24,91,0.12); border-radius: 12px; padding: 20px 24px; font-size: 0.875rem; color: #71717a; line-height: 1.6; margin-top: 40px; max-width: 680px; }
        .feat-trust-note strong { color: #c2185b; }
        .feat-related { margin-top: 32px; padding-top: 32px; border-top: 1px solid rgba(240,96,144,0.12); max-width: 680px; }
        .feat-related-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin: 0 0 10px; }
        .feat-related-body { font-size: 0.95rem; color: #71717a; line-height: 1.6; margin: 0; }
        .feat-related-body a { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); }
        .feat-related-body a:hover { border-color: #c2185b; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        @media (max-width: 640px) { .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Journal</span>
          </div>
          <span className="feat-page-label">Clarity that leads to follow-through</span>
          <h1 className="feat-page-h1">A place to think <em>clearly.</em></h1>
          <p className="feat-page-sub">
            You can't build the life you want while your head is a mess. Journaling is where you sort it out.
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

          <div className="feat-trust-note">
            <strong>Your journal is private.</strong> Entries are never shared, never used for advertising, and never read by anyone except Sage — only when you ask her to respond. <Link to="/privacy" style={{ color: '#c2185b' }}>Privacy policy →</Link>
          </div>

          <div className="feat-related">
            <p className="feat-related-label">Related</p>
            <p className="feat-related-body">
              <Link to="/features/ai-coach">Sage</Link> is your companion in the journal. <Link to="/features/dashboard">Phase Review</Link> pulls reflection over a whole phase.
            </p>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Clarity is one<br /><em>honest page away.</em></h2>
          <p className="feat-page-cta-sub">Get access when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Get early access</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
