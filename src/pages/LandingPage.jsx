import { useState, useEffect, useRef } from "react";

const FEATURES = [
  { icon: "🧠", title: "AI Life Coach", desc: "Get personalized coaching, goal analysis and daily motivation powered by AI — available 24/7." },
  { icon: "📋", title: "Phased Planning", desc: "Break your year into phases. Q1 foundation, Q2 momentum, Q3 scale. Track every step." },
  { icon: "📸", title: "Before & After Tracking", desc: "Upload photos, document your transformation, and see how far you've come visually." },
  { icon: "✍️", title: "Fully Customisable", desc: "Add your own pillars, phases, goals and weekly non-negotiables. Your board, your rules." },
  { icon: "📊", title: "Progress Analytics", desc: "Weekly check-ins, completion rates and quarterly reviews to keep you accountable." },
  { icon: "🌍", title: "For Everyone", desc: "Fitness. Finance. Career. Travel. Relationships. Build a board for any goal, any lifestyle." },
];

const USECASES = [
  { emoji: "🏃", label: "Fitness & Health" },
  { emoji: "💰", label: "Finance & Wealth" },
  { emoji: "💼", label: "Career & Business" },
  { emoji: "✈️", label: "Travel & Adventure" },
  { emoji: "❤️", label: "Relationships" },
  { emoji: "🎨", label: "Creative Goals" },
  { emoji: "📚", label: "Personal Growth" },
  { emoji: "🧘", label: "Mindfulness" },
];

const PRICING = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    highlight: false,
    features: ["1 Vision Board", "3 Phases", "Basic Templates", "Weekly Check-ins", "Export as Image"],
    cta: "Get Started Free",
  },
  {
    name: "Pro",
    price: "$7",
    period: "per month",
    highlight: true,
    features: ["Unlimited Boards", "Unlimited Phases", "AI Life Coach", "AI Affirmations", "Cloud Sync", "Before/After Photos", "Advanced Analytics", "Priority Support"],
    cta: "Start 14-Day Free Trial",
  },
  {
    name: "Coach",
    price: "$24",
    period: "per month",
    highlight: false,
    features: ["Everything in Pro", "Up to 20 Client Boards", "Client Progress Dashboard", "Branded Boards", "Team Collaboration", "Dedicated Support"],
    cta: "Start Free Trial",
  },
];

const TESTIMONIALS = [
  { name: "Marcus T.", role: "Entrepreneur", text: "I hit every single Q1 goal I set. The phased approach is what makes this different from any other vision board tool.", avatar: "M" },
  { name: "Aisha K.", role: "Fitness Coach", text: "My clients use this to track their transformation journeys. The before/after feature alone is worth it.", avatar: "A" },
  { name: "James R.", role: "Digital Nomad", text: "Finally a goal tracker that doesn't feel like a spreadsheet. Beautiful, motivating and actually works.", avatar: "J" },
];

export default function LandingPage({ onGetStarted }) {
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeUseCase, setActiveUseCase] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUseCase(p => (p + 1) % USECASES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Outfit:wght@300;400;500;600&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #05050a;
          --bg2: #0d0d16;
          --bg3: #12121f;
          --accent: #e8407a;
          --accent2: #f472a8;
          --accent3: #fbb6ce;
          --gold: #ffd6e7;
          --text: #f0eeff;
          --muted: #8b85aa;
          --border: rgba(232,64,122,0.18);
          --glow: 0 0 40px rgba(232,64,122,0.25);
          --r: 16px;
          --t: 0.3s cubic-bezier(.4,0,.2,1);
        }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Outfit', sans-serif;
          background: var(--bg);
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* NAV */
        nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          padding: 1rem 2rem;
          display: flex; align-items: center; justify-content: space-between;
          transition: background var(--t), backdrop-filter var(--t), border-color var(--t);
          border-bottom: 1px solid transparent;
        }
        nav.scrolled {
          background: rgba(5,5,10,0.85);
          backdrop-filter: blur(20px);
          border-color: var(--border);
        }
        .nav-logo {
          font-family: 'Syne', sans-serif;
          font-weight: 800; font-size: 1.3rem;
          background: linear-gradient(135deg, #f472a8, #ffd6e7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          text-decoration: none;
        }
        .nav-links { display: flex; align-items: center; gap: 2rem; }
        .nav-links a {
          color: var(--muted); font-size: 0.9rem; text-decoration: none;
          transition: color var(--t);
        }
        .nav-links a:hover { color: var(--text); }
        .nav-cta {
          padding: 0.5rem 1.3rem; border-radius: 99px;
          background: var(--accent); color: #fff !important;
          font-weight: 600; font-size: 0.85rem;
          transition: all var(--t) !important;
        }
        .nav-cta:hover { background: var(--accent2) !important; transform: translateY(-1px); }

        @media (max-width: 640px) {
          .nav-links { display: none; }
        }

        /* HERO */
        .hero {
          min-height: 100vh;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          padding: 8rem 1.5rem 4rem;
          position: relative; overflow: hidden;
        }
        .hero-bg {
          position: absolute; inset: 0; z-index: 0;
          background:
            radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,64,122,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(244,114,168,0.10) 0%, transparent 50%),
            var(--bg);
        }
        .hero-grid {
          position: absolute; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(232,64,122,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,64,122,0.05) 1px, transparent 1px);
          background-size: 60px 60px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 70%);
        }
        .hero-content { position: relative; z-index: 1; max-width: 860px; }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 1rem; border-radius: 99px;
          border: 1px solid var(--border);
          background: rgba(232,64,122,0.08);
          font-size: 0.8rem; font-weight: 500; color: var(--accent3);
          margin-bottom: 1.8rem;
          animation: fadeUp 0.6s ease both;
        }
        .hero-badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent); animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(1.3)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

        .hero h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.8rem, 7vw, 5.5rem);
          font-weight: 800; line-height: 1.05;
          margin-bottom: 1.5rem;
          animation: fadeUp 0.6s 0.1s ease both;
        }
        .hero h1 span {
          background: linear-gradient(135deg, var(--accent2) 0%, var(--gold) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-sub {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          color: var(--muted); line-height: 1.7;
          max-width: 580px; margin: 0 auto 2.5rem;
          animation: fadeUp 0.6s 0.2s ease both;
        }
        .hero-form {
          display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;
          animation: fadeUp 0.6s 0.3s ease both;
        }
        .hero-input {
          padding: 0.8rem 1.4rem; border-radius: 99px;
          border: 1.5px solid var(--border);
          background: rgba(255,255,255,0.04);
          color: var(--text); font-size: 0.95rem;
          outline: none; width: 280px;
          transition: border-color var(--t), background var(--t);
          font-family: 'Outfit', sans-serif;
        }
        .hero-input:focus { border-color: var(--accent); background: rgba(232,64,122,0.08); }
        .hero-input::placeholder { color: var(--muted); }
        .btn-primary {
          padding: 0.8rem 2rem; border-radius: 99px; border: none;
          background: linear-gradient(135deg, var(--accent), #f472a8);
          color: #fff; font-size: 0.95rem; font-weight: 600;
          cursor: pointer; transition: all var(--t);
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 20px rgba(232,64,122,0.4);
        }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(232,64,122,0.5); }
        .hero-note {
          margin-top: 1rem; font-size: 0.8rem; color: var(--muted);
          animation: fadeUp 0.6s 0.4s ease both;
        }

        /* USE CASES TICKER */
        .usecase-strip {
          padding: 2rem 0; overflow: hidden;
          border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border);
          background: rgba(232,64,122,0.04);
        }
        .usecase-inner {
          display: flex; gap: 1.5rem;
          justify-content: center; flex-wrap: wrap;
          padding: 0 2rem;
        }
        .usecase-pill {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1.2rem; border-radius: 99px;
          border: 1px solid var(--border);
          font-size: 0.85rem; font-weight: 500; color: var(--muted);
          transition: all var(--t); cursor: default;
          background: transparent;
        }
        .usecase-pill.active {
          border-color: var(--accent);
          color: var(--accent3);
          background: rgba(232,64,122,0.12);
        }

        /* SECTIONS */
        section { padding: 6rem 1.5rem; }
        .section-inner { max-width: 1100px; margin: 0 auto; }
        .section-label {
          font-size: 0.78rem; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase;
          color: var(--accent2); margin-bottom: 1rem;
        }
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: clamp(1.8rem, 4vw, 2.8rem);
          font-weight: 700; line-height: 1.2;
          margin-bottom: 1rem;
        }
        .section-sub {
          color: var(--muted); font-size: 1rem; line-height: 1.7;
          max-width: 540px;
        }

        /* FEATURES GRID */
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.25rem; margin-top: 3.5rem;
        }
        @media(max-width:800px){ .features-grid { grid-template-columns: 1fr 1fr; } }
        @media(max-width:540px){ .features-grid { grid-template-columns: 1fr; } }

        .feature-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: var(--r);
          padding: 1.8rem;
          transition: all var(--t);
          cursor: default;
        }
        .feature-card:hover {
          border-color: rgba(124,92,252,0.4);
          background: var(--bg3);
          transform: translateY(-4px);
          box-shadow: var(--glow);
        }
        .feature-icon {
          font-size: 1.8rem; margin-bottom: 1rem; display: block;
        }
        .feature-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem; font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .feature-desc { font-size: 0.88rem; color: var(--muted); line-height: 1.6; }

        /* PHASES SECTION */
        .phases-section { background: var(--bg2); }
        .phases-grid {
          display: grid; grid-template-columns: repeat(4,1fr);
          gap: 1rem; margin-top: 3rem;
        }
        @media(max-width:700px){ .phases-grid { grid-template-columns: 1fr 1fr; } }
        .phase-card {
          border-radius: var(--r); padding: 1.5rem;
          border: 1px solid var(--border);
          position: relative; overflow: hidden;
        }
        .phase-card::before {
          content: attr(data-num);
          position: absolute; top: -10px; right: 10px;
          font-family: 'Syne', sans-serif;
          font-size: 5rem; font-weight: 800;
          color: rgba(232,64,122,0.07); line-height: 1;
          pointer-events: none;
        }
        .phase-card:nth-child(1) { background: linear-gradient(135deg, rgba(232,64,122,0.12), rgba(232,64,122,0.04)); }
        .phase-card:nth-child(2) { background: linear-gradient(135deg, rgba(244,114,168,0.12), rgba(244,114,168,0.04)); }
        .phase-card:nth-child(3) { background: linear-gradient(135deg, rgba(251,182,206,0.10), rgba(251,182,206,0.02)); }
        .phase-card:nth-child(4) { background: linear-gradient(135deg, rgba(255,182,193,0.10), rgba(255,182,193,0.02)); }
        .phase-num {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--accent2); margin-bottom: 0.5rem;
        }
        .phase-name {
          font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .phase-desc { font-size: 0.82rem; color: var(--muted); line-height: 1.5; }

        /* PRICING */
        .pricing-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1.25rem; margin-top: 3.5rem; align-items: start;
        }
        @media(max-width:700px){ .pricing-grid { grid-template-columns: 1fr; } }

        .pricing-card {
          background: var(--bg2); border-radius: var(--r);
          border: 1px solid var(--border);
          padding: 2rem; position: relative;
          transition: all var(--t);
        }
        .pricing-card.highlighted {
          background: linear-gradient(135deg, rgba(232,64,122,0.15), rgba(244,114,168,0.08));
          border-color: var(--accent);
          box-shadow: var(--glow);
          transform: scale(1.03);
        }
        .pricing-badge {
          position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
          background: var(--accent); color: #fff;
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.06em;
          padding: 0.25rem 1rem; border-radius: 99px; white-space: nowrap;
        }
        .pricing-name {
          font-family: 'Syne', sans-serif; font-size: 0.9rem;
          font-weight: 700; color: var(--muted); text-transform: uppercase;
          letter-spacing: 0.08em; margin-bottom: 1rem;
        }
        .pricing-price {
          font-family: 'Syne', sans-serif;
          font-size: 3rem; font-weight: 800; line-height: 1;
          margin-bottom: 0.3rem;
        }
        .pricing-period { font-size: 0.82rem; color: var(--muted); margin-bottom: 1.5rem; }
        .pricing-divider { height: 1px; background: var(--border); margin: 1.2rem 0; }
        .pricing-features { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; margin-bottom: 1.8rem; }
        .pricing-features li {
          font-size: 0.88rem; color: var(--muted);
          display: flex; align-items: center; gap: 0.5rem;
        }
        .pricing-features li::before { content: '✓'; color: var(--accent2); font-weight: 700; flex-shrink: 0; }
        .btn-outline {
          width: 100%; padding: 0.8rem; border-radius: 99px;
          border: 1.5px solid var(--border); background: transparent;
          color: var(--text); font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all var(--t);
          font-family: 'Outfit', sans-serif;
        }
        .btn-outline:hover { border-color: var(--accent); color: var(--accent3); }
        .btn-primary-full {
          width: 100%; padding: 0.8rem; border-radius: 99px; border: none;
          background: linear-gradient(135deg, var(--accent), #f472a8);
          color: #fff; font-size: 0.9rem; font-weight: 600;
          cursor: pointer; transition: all var(--t);
          font-family: 'Outfit', sans-serif;
          box-shadow: 0 4px 20px rgba(232,64,122,0.3);
        }
        .btn-primary-full:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(232,64,122,0.45); }

        /* TESTIMONIALS */
        .testimonials-grid {
          display: grid; grid-template-columns: repeat(3,1fr);
          gap: 1.25rem; margin-top: 3.5rem;
        }
        @media(max-width:700px){ .testimonials-grid { grid-template-columns: 1fr; } }
        .testimonial-card {
          background: var(--bg2); border-radius: var(--r);
          border: 1px solid var(--border); padding: 1.8rem;
        }
        .testimonial-text {
          font-size: 0.92rem; color: var(--text); line-height: 1.7;
          margin-bottom: 1.2rem; font-style: italic;
        }
        .testimonial-author { display: flex; align-items: center; gap: 0.75rem; }
        .testimonial-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), var(--accent2));
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.9rem; color: #fff; flex-shrink: 0;
        }
        .testimonial-name { font-weight: 600; font-size: 0.88rem; }
        .testimonial-role { font-size: 0.78rem; color: var(--muted); }

        /* CTA SECTION */
        .cta-section {
          text-align: center; padding: 7rem 1.5rem;
          position: relative; overflow: hidden;
        }
        .cta-section::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(ellipse 70% 60% at 50% 50%, rgba(232,64,122,0.15) 0%, transparent 60%);
        }
        .cta-section .section-inner { position: relative; z-index: 1; }
        .cta-section h2 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 800; margin-bottom: 1rem;
        }
        .cta-section p { color: var(--muted); font-size: 1.05rem; margin-bottom: 2.5rem; }

        /* FOOTER */
        footer {
          border-top: 1px solid var(--border);
          padding: 3rem 1.5rem; text-align: center;
        }
        .footer-inner { max-width: 1100px; margin: 0 auto; }
        .footer-logo {
          font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.2rem;
          background: linear-gradient(135deg, #f472a8, #ffd6e7);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: 1.5rem; display: block;
        }
        .footer-links {
          display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }
        .footer-links a { color: var(--muted); font-size: 0.85rem; text-decoration: none; transition: color var(--t); }
        .footer-links a:hover { color: var(--text); }
        .footer-copy { font-size: 0.8rem; color: var(--muted); }
      `}</style>

      {/* NAV */}
      <nav className={scrolled ? "scrolled" : ""}>
        <a href="#" className="nav-logo">Phasr</a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#" className="nav-cta" onClick={e => { e.preventDefault(); onGetStarted?.() }}>Get Started Free</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot" />
            AI-Powered Vision Board Platform
          </div>
          <h1>
            Visualize. Plan.<br />
            <span>Achieve Everything.</span>
          </h1>
          <p className="hero-sub">
            The most structured vision board platform on the internet. Set phased goals, track your transformation, and get AI coaching — for any goal, any lifestyle.
          </p>
          <div className="hero-form">
            <input
              className="hero-input"
              type="email"
              placeholder="Enter your email..."
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <button className="btn-primary" onClick={() => onGetStarted?.()}>Start For Free ???</button>
          </div>
          <p className="hero-note">Free forever · No credit card required · Cancel anytime</p>
        </div>
      </section>

      {/* USE CASES STRIP */}
      <div className="usecase-strip">
        <div className="usecase-inner">
          {USECASES.map((u, i) => (
            <div key={i} className={`usecase-pill ${activeUseCase === i ? "active" : ""}`}>
              <span>{u.emoji}</span> {u.label}
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <section id="features">
        <div className="section-inner">
          <p className="section-label">Everything you need</p>
          <h2 className="section-title">Built different.<br />Built to actually work.</h2>
          <p className="section-sub">Most vision board apps are just pretty pictures. Phasr combines AI intelligence, structured planning, and real accountability tools.</p>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div className="feature-card" key={i}>
                <span className="feature-icon">{f.icon}</span>
                <p className="feature-title">{f.title}</p>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — PHASES */}
      <section id="how" className="phases-section">
        <div className="section-inner">
          <p className="section-label">How it works</p>
          <h2 className="section-title">Your year in phases.<br />Your goals on track.</h2>
          <p className="section-sub">Break any big goal into quarterly phases. Each phase has its own pillars, actions, and review — so you always know exactly where you are.</p>
          <div className="phases-grid">
            {[
              { n: "01", name: "Foundation", desc: "Define your vision, set your pillars, and establish non-negotiable weekly habits." },
              { n: "02", name: "Momentum", desc: "Double down on what's working. Drop what isn't. Build unstoppable momentum." },
              { n: "03", name: "Scale", desc: "Accelerate results. Take bigger swings. Your habits are automatic now." },
              { n: "04", name: "Legacy", desc: "Reflect on your transformation. Document your achievement. Set the next vision." },
            ].map((p, i) => (
              <div className="phase-card" key={i} data-num={p.n}>
                <p className="phase-num">Phase {p.n}</p>
                <p className="phase-name">{p.name}</p>
                <p className="phase-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section>
        <div className="section-inner">
          <p className="section-label">Real results</p>
          <h2 className="section-title">People are actually<br />hitting their goals.</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div className="testimonial-card" key={i}>
                <p className="testimonial-text">"{t.text}"</p>
                <div className="testimonial-author">
                  <div className="testimonial-avatar">{t.avatar}</div>
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ background: "var(--bg2)" }}>
        <div className="section-inner">
          <p className="section-label">Pricing</p>
          <h2 className="section-title">Simple pricing.<br />Serious results.</h2>
          <p className="section-sub">Start free. Upgrade when you're ready to unlock AI coaching and unlimited boards.</p>
          <div className="pricing-grid">
            {PRICING.map((p, i) => (
              <div className={`pricing-card ${p.highlight ? "highlighted" : ""}`} key={i}>
                {p.highlight && <div className="pricing-badge">⭐ Most Popular</div>}
                <p className="pricing-name">{p.name}</p>
                <p className="pricing-price">{p.price}</p>
                <p className="pricing-period">{p.period}</p>
                <div className="pricing-divider" />
                <ul className="pricing-features">
                  {p.features.map((f, j) => <li key={j}>{f}</li>)}
                </ul>
                {p.highlight
                  ? <button className="btn-primary-full" onClick={() => onGetStarted?.()}>{p.cta}</button>
                  : <button className="btn-outline" onClick={() => onGetStarted?.()}>{p.cta}</button>
                }
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="section-inner">
          <h2>Your goals aren't going<br />to achieve themselves.</h2>
          <p>Join thousands building structured, AI-powered vision boards that actually work.</p>
          <button className="btn-primary" style={{ padding: "1rem 2.5rem", fontSize: "1rem" }} onClick={() => onGetStarted?.()}>
            Create Your Free Board →
          </button>
          <p style={{ marginTop: "1rem", fontSize: "0.8rem", color: "var(--muted)" }}>
            Free forever · No credit card · Takes 2 minutes
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <span className="footer-logo">Phasr</span>
          <div className="footer-links">
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Blog</a>
            <a href="#">About</a>
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
          </div>
          <p className="footer-copy">© 2025 Phasr. Built for achievers.</p>
        </div>
      </footer>
    </>
  );
}
