import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flame, TrendingUp, RefreshCw, Trophy, CalendarDays, BarChart2 } from 'lucide-react'
import MarketingLayout from '../../components/marketing/MarketingLayout'

const BLOCKS = [
  {
    Icon: Flame,
    title: 'One prompt a day',
    body: 'Each morning you get one thing to do, sized to about 30 seconds to start. Small enough to beat the resistance, real enough to move the goal.',
  },
  {
    Icon: TrendingUp,
    title: 'It grows with you',
    body: 'Your daily actions get a little bigger each week, so you build capacity instead of burning out on day three.',
  },
  {
    Icon: RefreshCw,
    title: 'Momentum over completion',
    body: 'Miss a day and nothing resets to zero. This is consistency over time, the way real habits are built. Small actions, repeated, quietly become who you are.',
  },
  {
    Icon: Trophy,
    title: 'Unlocks that keep you going',
    body: 'Streaks and new features open up as you show up, so progress feels earned instead of handed to you.',
  },
  {
    Icon: CalendarDays,
    title: 'A weekly reset with Sage',
    body: 'Once a week, you and Sage look back at how it went and how you feel, then adjust the plan before the next week starts.',
  },
  {
    Icon: BarChart2,
    title: 'See it add up',
    body: 'A dashboard that shows every check-in, so two quiet weeks still look like the progress they were.',
  },
]

export default function DailyStreaksPage() {
  useEffect(() => {
    document.title = 'Habit Streak App Built On Momentum, Not Guilt | PHASR'
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', 'One 30-second action a day. Streaks that survive a bad week. PHASR builds real consistency with a daily check-in and a weekly reset. Get early access.')
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
        @media (max-width: 640px) { .feat-page-hero { padding: 80px 0 60px; } }
        .streak-showcase { padding: 0 0 80px; }
        .streak-showcase-img {
          width: 100%; max-width: 880px; height: auto; display: block;
          margin: 0 auto;
          border-radius: 20px;
          box-shadow: 0 30px 70px rgba(194,24,91,0.28);
        }
      `}</style>

      <section className="feat-page-hero">
        <div className="mkt-container">
          <div className="feat-breadcrumb">
            <Link to="/features">Features</Link><span>/</span><span>Daily Streaks</span>
          </div>
          <span className="feat-page-label">Follow-through, one day at a time</span>
          <h1 className="feat-page-h1">Momentum you can <em>actually feel.</em></h1>
          <p className="feat-page-sub">
            Big goals die in the gap between deciding and doing. Daily Streak closes it with one small thing a day.
          </p>
          <div className="feat-page-cta-row">
            <Link to="/login" className="mkt-btn-primary">Join the waitlist</Link>
            <Link to="/features" className="mkt-btn-ghost">All features</Link>
          </div>
        </div>
      </section>

      <section className="streak-showcase">
        <div className="mkt-container">
          <img
            src="/images/product-vision-dailystreak.png"
            alt="PHASR habit streak app — Vision Board and Daily Streaks screens, side by side"
            className="streak-showcase-img"
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
              <Link to="/features/vision-boards">Vision Board</Link> is where the actions come from. <Link to="/features/dashboard">Phase Review</Link> is where the streaks add up.
            </p>
          </div>
        </div>
      </section>

      <section className="feat-page-cta-section">
        <div className="mkt-container">
          <h2 className="feat-page-cta-h2">Day 1 is always<br /><em>today.</em></h2>
          <p className="feat-page-cta-sub">Start your first streak when PHASR opens.</p>
          <Link to="/login" className="mkt-btn-primary">Get early access</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
