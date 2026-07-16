import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Target, Sparkles, Layers, Image as ImageIcon } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

const BLOCKS = [
  {
    Icon: Compass,
    title: "Start with where you are and where you're going",
    body: "Add a before photo and an after photo. Tell Sage where you are right now, how you feel, and who you want to become. That's all she needs to build the rest.",
  },
  {
    Icon: Target,
    title: 'One goal becomes a full plan',
    body: "Your goal turns into a pillar: a structured path with phases, weekly non-negotiables, and daily activities. Every piece connects to an outcome, so there's always a reason behind today's task. The goal can be anything, a new job, a habit, a bucket-list thing.",
  },
  {
    Icon: Sparkles,
    title: 'Resources that actually fit you',
    body: "Sage skips the generic reading list. She pulls resources built on what has worked before, real research, and the right books for your specific goal. The things that move this goal forward, not a folder you'll never open.",
  },
  {
    Icon: Layers,
    title: 'Work more than one goal without losing the thread',
    body: 'Run one pillar or three at once. Keep them in separate phases or stack them into the same three months. If your brain runs in ten directions, you can finally watch all of them grow in one place.',
  },
  {
    Icon: ImageIcon,
    title: 'Take it off the screen',
    body: "Save your pillar as an image or print it. The printed version comes with your before and after, your resources, and a QR code. Scan it from your wall and you're back in your dashboard in a second. Your vision board finally does more than hang there.",
  },
]

export default function VisionBoardsPage() {
  useEffect(() => {
    document.title = 'AI Vision Board App That Builds Your Plan | PHASR'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'Turn your vision board into a real plan. PHASR reads your goal and builds phases, weekly actions, and daily steps to get you there. Get early access.')
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
        .mkt-btn-ghost { display: inline-flex; align-items: center; padding: 14px 28px; border: 1.5px solid rgba(194,24,91,0.3); color: #c2185b; border-radius: 100px; font-family: 'General Sans', sans-serif; font-size: 0.95rem; font-weight: 600; text-decoration: none; transition: border-color 0.15s, background 0.15s; }
        .mkt-btn-ghost:hover { border-color: #c2185b; background: rgba(194,24,91,0.05); }
        .feat-page-divider { height: 1px; background: rgba(240,96,144,0.12); margin: 0; }
        .feat-page-section { padding: 80px 0; }
        .feat-block-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; max-width: 960px; }
        .feat-block { padding: 28px; background: #fff; border: 1px solid #f06090; border-radius: 24px; transition: background 0.25s ease, border-color 0.25s ease; }
        .feat-block:hover { background: rgba(240,96,144,0.10); border-color: #f06090; }
        .feat-block-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
        .feat-block-icon { color: #c2185b; flex-shrink: 0; }
        .feat-block-h3 { font-family: 'Fraunces', serif; font-size: clamp(1.2rem, 2vw, 1.5rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.01em; margin: 0; }
        .feat-block-body { font-size: 1rem; color: #71717a; line-height: 1.75; margin: 0; }
        .feat-related { margin-top: 56px; padding-top: 32px; border-top: 1px solid rgba(240,96,144,0.12); max-width: 680px; }
        .feat-related-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #c2185b; margin: 0 0 10px; }
        .feat-related-body { font-size: 0.95rem; color: #71717a; line-height: 1.6; margin: 0; }
        .feat-related-body a { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); }
        .feat-related-body a:hover { border-color: #c2185b; }
        .feat-page-cta-section { padding: 80px 0; text-align: center; border-top: 1px solid rgba(240,96,144,0.1); }
        .feat-page-cta-h2 { font-family: 'Fraunces', serif; font-size: clamp(1.8rem, 3vw, 2.4rem); font-weight: 700; color: #1a0a10; letter-spacing: -0.02em; margin: 0 0 12px; }
        .feat-page-cta-h2 em { font-style: italic; color: #c2185b; }
        .feat-page-cta-sub { color: #71717a; font-size: 0.95rem; margin: 0 0 32px; }
        .vb-showcase { padding: 0 0 60px; border-bottom: 1px solid rgba(240,96,144,0.1); }
        .vb-showcase-img { width: 100%; max-width: 960px; height: auto; display: block; margin: 0 auto; mix-blend-mode: multiply; }
        @media (max-width: 640px) { .feat-page-hero { padding: 80px 0 60px; } }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Vision Boards</span>
          </div>
          <span className="feat-page-label">Vision, with follow-through</span>
          <h1 className="feat-page-h1">The vision board that <em>builds the plan for you.</em></h1>
          <p className="feat-page-sub">
            You've made vision boards before. Beautiful, hopeful, forgotten by spring. This one reads what you want and hands you the steps to get there.
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
            alt="PHASR digital vision board app — vision board, daily streaks, home dashboard, and phase review"
            className="vb-showcase-img"
          />
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

          <div className="feat-related">
            <p className="feat-related-label">Related</p>
            <p className="feat-related-body">
              <Link to="/features/ai-coach">Sage</Link> builds the plan. <Link to="/features/daily-streaks">Daily Streak</Link> turns it into daily action.
            </p>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Your best year starts<br />with one <em>clear phase.</em></h2>
          <p className="feat-page-cta-sub">Join the women getting early access when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Get early access</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
