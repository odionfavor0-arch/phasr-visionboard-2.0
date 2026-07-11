import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, BookOpen, Mail } from 'lucide-react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const ARTICLES = [
  {
    slug: 'why-vision-boards-never-become-reality',
    categories: ['VISION', 'IDENTITY'],
    headline: 'Why Most Vision Boards Never Become Reality',
    description:
      "Dreaming isn't the hard part. Following through is. Here's why most vision boards stop at inspiration, and how to build a system that keeps moving.",
    inspiredBy: 'PHASR Method',
    readTime: '7 MIN READ',
    image: '/images/blog-vision.jpg',
  },
  {
    slug: 'your-first-dream-job-starts-before-youre-hired',
    categories: ['CAREER', 'GROWTH'],
    headline: "Your First Dream Job Starts Before You're Hired",
    description:
      "Confidence isn't built after success. It's built through the small daily actions that shape your identity before anyone notices.",
    inspiredBy: 'PHASR Method',
    readTime: '6 MIN READ',
    image: '/images/blog-career.jpg',
  },
  {
    slug: 'the-conversation-with-yourself-changes-everything',
    categories: ['REFLECTION', 'SELF-AWARENESS'],
    headline: 'The Conversation With Yourself Changes Everything',
    description:
      "Your journal shouldn't just store your thoughts. It should reveal your patterns, challenge your blind spots, and help shape what comes next.",
    inspiredBy: 'PHASR Method',
    readTime: '8 MIN READ',
    image: '/images/blog-reflection.jpg',
  },
]

export default function BlogPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { document.title = 'Blog — PHASR' }, [])

  function handleSubscribe(e) {
    e.preventDefault()
    if (email.trim()) setSubmitted(true)
  }

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      {/* ── HERO ── */}
      <section className="bl-hero">
        <div className="bl-container bl-hero-inner">

          <div className="bl-hero-left">
            <span className="bl-eyebrow">THE BLOG</span>
            <h1 className="bl-hero-h1">
              The <em>Becoming</em><br />Library.
            </h1>
            <p className="bl-hero-sub">
              Original articles inspired by timeless ideas about identity,
              discipline, consistency, confidence, and personal growth.
              Every story helps you close the gap between vision and action.
            </p>
            <div className="bl-hero-tag">
              New articles every week
            </div>
          </div>

          <div className="bl-hero-right">
            <div className="bl-hero-img-wrap">
              <img src="/images/blog-hero.jpg" alt="Editorial lifestyle — books, mug, pen and dried flowers" className="bl-hero-img" />
            </div>
          </div>

        </div>
      </section>

      {/* ── FEATURED ARTICLES GRID ── */}
      <section className="bl-articles">
        <div className="bl-container">
          <div className="bl-grid">
            {ARTICLES.map((a) => (
              <Link key={a.slug} to={`/blog/${a.slug}`} className="bl-card">

                <div className="bl-card-img-wrap">
                  <img src={a.image} alt={a.headline} className="bl-card-img" />
                </div>

                <div className="bl-card-body">
                  <div className="bl-card-cats">
                    {a.categories.map((c, i) => (
                      <span key={c}>
                        <span className="bl-card-cat">{c}</span>
                        {i < a.categories.length - 1 && <span className="bl-card-cat-sep">·</span>}
                      </span>
                    ))}
                  </div>

                  <h2 className="bl-card-title">{a.headline}</h2>
                  <p className="bl-card-desc">{a.description}</p>
                </div>

                <div className="bl-card-footer">
                  <div className="bl-card-inspired">
                    <BookOpen size={13} className="bl-card-foot-icon" />
                    <div className="bl-card-inspired-text">
                      <span className="bl-card-inspired-label">INSPIRED BY</span>
                      <span className="bl-card-inspired-name">{a.inspiredBy}</span>
                    </div>
                  </div>

                  <div className="bl-card-time">
                    <Clock size={13} className="bl-card-time-icon" />
                    <span className="bl-card-time-text">{a.readTime}</span>
                  </div>

                  <div className="bl-card-arrow">
                    <ArrowRight size={15} strokeWidth={2.2} />
                  </div>
                </div>

              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMAIL SUBSCRIBE STRIP ── */}
      <section className="bl-subscribe-outer">
        <div className="bl-container">
          <div className="bl-subscribe">
            <div className="bl-subscribe-icon">
              <Mail size={22} />
            </div>
            <p className="bl-subscribe-text">
              Get new articles and growth insights straight to your inbox.
            </p>
            {submitted ? (
              <p className="bl-subscribe-thanks">You're in. See you in your inbox. ✦</p>
            ) : (
              <form className="bl-subscribe-form" onSubmit={handleSubscribe}>
                <input
                  type="email"
                  className="bl-subscribe-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" className="bl-subscribe-btn">
                  Join the waitlist →
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

    </MarketingLayout>
  )
}

/* ═══════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════ */
const STYLES = `
  .bl-container { max-width: 1120px; margin: 0 auto; padding: 0 32px; }

  /* ── EYEBROW ── */
  .bl-eyebrow {
    display: block;
    font-family: 'Manrope', sans-serif;
    font-size: 11px; font-weight: 700;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: #f06090; margin-bottom: 20px;
  }

  /* ─────────────────────────────────────────────────
     HERO
  ───────────────────────────────────────────────── */
  .bl-hero {
    background: #ffffff;
    padding: 80px 0 60px;
  }
  .bl-hero-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
    min-height: 440px;
  }
  .bl-hero-left { display: flex; flex-direction: column; max-width: 480px; }
  .bl-hero-h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(40px, 5vw, 64px);
    font-weight: 700;
    color: #3d1020;
    line-height: 1.1;
    letter-spacing: -0.025em;
    margin: 0 0 0;
    text-wrap: balance;
  }
  .bl-hero-h1 em {
    font-style: italic;
    color: #f06090;
  }
  .bl-hero-sub {
    font-family: 'Manrope', sans-serif;
    font-size: 17px;
    color: rgba(61,16,32,0.65);
    line-height: 1.7;
    margin: 20px 0 0;
    max-width: 420px;
  }
  .bl-hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: #E8C9D1;
    color: #c2185b;
    border-radius: 999px;
    padding: 8px 20px;
    font-family: 'Manrope', sans-serif;
    font-size: 13px;
    font-weight: 600;
    margin-top: 32px;
    width: fit-content;
  }

  /* Hero image right */
  .bl-hero-right { display: flex; align-items: center; justify-content: center; }
  .bl-hero-img-wrap { width: 100%; }
  .bl-hero-img {
    width: 100%; height: 420px;
    object-fit: cover; display: block;
    border-radius: 24px;
    box-shadow: 0 24px 64px rgba(61,16,32,0.12);
  }

  /* ─────────────────────────────────────────────────
     ARTICLES GRID
  ───────────────────────────────────────────────── */
  .bl-articles {
    background: #ffffff;
    padding: 60px 0 80px;
  }
  .bl-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 28px;
  }

  /* Card */
  .bl-card {
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    overflow: hidden;
    background: #ffffff;
    box-shadow: 0 4px 20px rgba(61,16,32,0.08);
    text-decoration: none;
    color: inherit;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .bl-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(61,16,32,0.14);
  }

  /* Image block */
  .bl-card-img-wrap {
    height: 260px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .bl-card-img {
    width: 100%; height: 100%;
    object-fit: cover; display: block;
    transition: transform 0.4s ease;
  }
  .bl-card:hover .bl-card-img {
    transform: scale(1.03);
  }

  /* Card body */
  .bl-card-body {
    padding: 24px 24px 0;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .bl-card-cats {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 12px;
  }
  .bl-card-cat {
    font-family: 'Manrope', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.12em; text-transform: uppercase;
    color: #f06090;
  }
  .bl-card-cat-sep {
    font-family: 'Manrope', sans-serif;
    font-size: 10px; color: rgba(240,96,144,0.5);
  }
  .bl-card-title {
    font-family: 'Fraunces', serif;
    font-size: 22px; font-weight: 700;
    color: #3d1020; line-height: 1.25;
    margin: 0 0 12px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .bl-card-desc {
    font-family: 'Manrope', sans-serif;
    font-size: 14px;
    color: rgba(61,16,32,0.65);
    line-height: 1.6;
    margin: 0 0 20px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    flex: 1;
  }

  /* Card footer */
  .bl-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    border-top: 1px solid rgba(240,96,144,0.12);
    gap: 8px;
  }
  .bl-card-inspired {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }
  .bl-card-foot-icon { color: #f06090; flex-shrink: 0; }
  .bl-card-inspired-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }
  .bl-card-inspired-label {
    font-family: 'Manrope', sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(61,16,32,0.4);
  }
  .bl-card-inspired-name {
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    color: rgba(61,16,32,0.7);
    font-weight: 500;
  }
  .bl-card-time {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }
  .bl-card-time-icon { color: rgba(61,16,32,0.4); }
  .bl-card-time-text {
    font-family: 'Manrope', sans-serif;
    font-size: 12px;
    color: rgba(61,16,32,0.5);
    font-weight: 500;
  }
  .bl-card-arrow {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: #f06090;
    display: flex; align-items: center; justify-content: center;
    color: #ffffff;
    flex-shrink: 0;
    transition: background 0.2s, transform 0.2s;
  }
  .bl-card:hover .bl-card-arrow {
    background: #c2185b;
    transform: scale(1.05);
  }

  /* ─────────────────────────────────────────────────
     SUBSCRIBE STRIP
  ───────────────────────────────────────────────── */
  .bl-subscribe-outer {
    padding: 0 0 80px;
    background: #ffffff;
  }
  .bl-subscribe {
    background: #fff8fa;
    border-radius: 24px;
    padding: 44px 48px;
    max-width: 780px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 28px;
    flex-wrap: wrap;
  }
  .bl-subscribe-icon {
    width: 48px; height: 48px;
    border-radius: 14px;
    background: rgba(240,96,144,0.10);
    display: flex; align-items: center; justify-content: center;
    color: #f06090;
    flex-shrink: 0;
  }
  .bl-subscribe-text {
    font-family: 'Manrope', sans-serif;
    font-size: 16px;
    color: #3d1020;
    line-height: 1.5;
    flex: 1;
    min-width: 200px;
  }
  .bl-subscribe-form {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    flex-wrap: wrap;
  }
  .bl-subscribe-input {
    border: 1px solid rgba(61,16,32,0.15);
    border-radius: 10px;
    padding: 12px 16px;
    font-family: 'Manrope', sans-serif;
    font-size: 14px;
    color: #3d1020;
    background: #ffffff;
    outline: none;
    width: 220px;
    transition: border-color 0.18s;
  }
  .bl-subscribe-input::placeholder { color: rgba(61,16,32,0.35); }
  .bl-subscribe-input:focus { border-color: rgba(240,96,144,0.5); }
  .bl-subscribe-btn {
    background: #c2185b;
    color: #ffffff;
    border: none;
    border-radius: 10px;
    padding: 12px 24px;
    font-family: 'Manrope', sans-serif;
    font-size: 14px; font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.18s;
  }
  .bl-subscribe-btn:hover { background: #a01548; }
  .bl-subscribe-thanks {
    font-family: 'Manrope', sans-serif;
    font-size: 15px;
    color: #c2185b;
    font-weight: 600;
  }

  /* ── Responsive ── */
  @media (max-width: 960px) {
    .bl-hero-inner { grid-template-columns: 1fr; gap: 40px; min-height: auto; }
    .bl-hero-right { display: none; }
    .bl-hero-left { max-width: 100%; }
    .bl-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 640px) {
    .bl-grid { grid-template-columns: 1fr; }
    .bl-hero { padding: 80px 0 48px; }
    .bl-subscribe { padding: 36px 28px; gap: 20px; flex-direction: column; align-items: flex-start; }
    .bl-subscribe-input { width: 100%; }
    .bl-subscribe-form { width: 100%; flex-direction: column; }
    .bl-subscribe-btn { width: 100%; text-align: center; }
  }
`
