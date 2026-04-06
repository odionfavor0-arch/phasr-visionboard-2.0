import { useEffect, useMemo, useState } from 'react'
import founderImg from '../assets/founder-favour.jpeg'

const faqItems = [
  {
    q: 'Is Phasr only for women?',
    a: "Phasr is built with women in mind. The design, the community, the positioning. But the system works for anyone serious about their goals. If that is you, you are welcome here.",
  },
  {
    q: 'How is this different from a regular vision board app?',
    a: "Most vision board apps let you add photos and quotes. Phasr turns your vision into a structured plan. Phases, weekly goals, daily tasks. It tracks whether you actually followed through. Sage, your AI coach, adjusts your plan based on your real behavior. It is the difference between a wish list and a system.",
  },
  {
    q: 'What is Sage and how does she work?',
    a: 'Sage is your AI life coach inside Phasr. She reads your vision board, your journal entries, and your streak data. She knows when you are consistent and when you are slipping. She adjusts her tone accordingly. She does not flatter you. She helps you win.',
  },
  {
    q: 'What happens if I miss a day or a week?',
    a: 'Your streak drops and the system notices. Miss one day and you get a warning. Miss two and your streak resets. But the system does not abandon you. It adjusts your weekly goal difficulty so you can rebuild from where you are, not from zero.',
  },
  {
    q: 'What are Show Up Rooms?',
    a: 'Show Up Rooms are small accountability groups. Six people, one focus area. Health. Wealth. Career. Relationships. Inner Life. Personal Growth. You see who showed up today. You can push others. They can push you. Nobody hides in these rooms.',
  },
  {
    q: 'Is it free to start?',
    a: "Yes. The free plan includes your vision board, journal, daily streaks, and one Show Up room. Pro unlocks Sage's full AI coaching, advanced analytics, unlimited phases, and more. Pro starts at $5 per month. The Coach plan is $24 per month for professionals managing client boards.",
  },
  {
    q: 'Can I use this for any goal, not just fitness or career?',
    a: 'Absolutely. Phasr works for any goal and any lifestyle. Health. Finance. Travel. Relationships. Creative projects. Personal growth. If you can define a before and after, the system can build you a plan.',
  },
  {
    q: 'When is the mobile app launching?',
    a: 'The web app is live now. The mobile app is in development and will follow after the web version is tested and stable. Sign up now to be first on the list when the app drops.',
  },
]

export default function OurStory({ onGetStarted }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)

  useEffect(() => {
    document.title = 'Phasr'
  }, [])

  const renderedFaq = useMemo(
    () =>
      faqItems.map((item, index) => {
        const open = openIndex === index
        return (
          <div
            key={item.q}
            className={`faq-item ${open ? 'open' : ''}`}
            onClick={() => setOpenIndex(open ? null : index)}
          >
            <div className="faq-q">
              <span className="faq-q-text">{item.q}</span>
              <div className="faq-icon">+</div>
            </div>
            <div className="faq-a">{item.a}</div>
          </div>
        )
      }),
    [openIndex],
  )

  return (
    <>
      <style>{styles}</style>

      <nav>
        <a href="/" className="logo">Phasr</a>
        <div className={`nav-links ${menuOpen ? 'nav-open' : ''}`}>
          <a href="/#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="/#how" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="/#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
          <a href="/story" className="active" onClick={() => setMenuOpen(false)}>Our Story</a>
          <button type="button" className="nav-cta" onClick={() => { setMenuOpen(false); onGetStarted?.() }}>
            Get started
          </button>
        </div>
        <button className="nav-hamburger" onClick={() => setMenuOpen(open => !open)} aria-label="Toggle menu">
          <span />
          <span />
          <span />
        </button>
      </nav>

      <div className="story-hero">
        <div className="story-left">
          <div className="story-label">Our Story</div>
          <h1 className="story-headline">
            Built for women<br />who are <em>done starting over.</em>
          </h1>

          <div className="story-text">
            <p>Every year starts the same. New plans. Clear goals. Everything mapped out. Then life happens, and by March, the vision board is a screenshot in your camera roll.</p>
            <p className="highlight">Not because you are lazy. Because you never had a system that holds when life gets unpredictable.</p>
            <p>Men have had that system for decades. Brotherhood. Accountability structures. Frameworks that outlast motivation. Women got Pinterest boards and told to manifest.</p>
            <p>Not because women are not serious. Because nobody built something serious for them.</p>
            <p className="big">So I built Phasr.</p>
            <p>Not a mood board. Not another app full of affirmations. A structured system that turns your vision into a plan, tracks every step, and holds you accountable even when life interrupts.</p>
            <p className="highlight">For women who finish what they start. Women who build in silence and show results.</p>
          </div>

          <div className="founder-block">
            <div>
              <div className="founder-name">Favour Odion</div>
              <div className="founder-title">Founder of Phasr</div>
            </div>
          </div>
        </div>

        <div className="story-right">
          <div className="story-photo-wrap">
            <img src={founderImg} alt="Favour Odion" />
          </div>
        </div>
      </div>

      <div className="faq-section" id="faq">
        <div className="faq-label">FAQ</div>
        <h2 className="faq-title">Questions we hear all the time</h2>
        <div className="faq-list">{renderedFaq}</div>
      </div>

      <div className="cta-strip">
        <div className="cta-inner">
          <div className="cta-text">
            <h3>Ready to stop starting over?</h3>
            <p>Your vision is waiting. Sage is ready. The room has a spot with your name on it.</p>
          </div>
          <button type="button" className="cta-btn" onClick={onGetStarted}>Start Building Free →</button>
        </div>
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  :root{
    --bg:#05050a;--bg2:#0d0d16;
    --pink:#f95f85;--pink2:#ff8fab;
    --text:#f0eeff;--muted:#8b85aa;
    --border:rgba(249,95,133,0.15);
  }
  html{scroll-behavior:smooth}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;overflow-x:hidden}

  nav{
    position:fixed;top:0;left:0;right:0;z-index:100;
    padding:1rem 2rem;display:flex;align-items:center;justify-content:space-between;
    background:rgba(5,5,10,0.92);backdrop-filter:blur(20px);
    border-bottom:1px solid var(--border);
  }
  .logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;background:linear-gradient(135deg,#f472a8,#ffd6e7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;text-decoration:none}
  .nav-links{display:flex;align-items:center;gap:1.5rem}
  .nav-links a{color:var(--muted);font-size:.88rem;text-decoration:none;transition:color .2s}
  .nav-links a:hover,.nav-links a.active{color:var(--text)}
  .nav-cta{padding:.45rem 1.1rem;border-radius:99px;background:var(--pink);color:#fff;font-weight:600;font-size:.82rem;border:none;cursor:pointer}
  .nav-hamburger{display:none;background:none;border:none;flex-direction:column;gap:5px;cursor:pointer}
  .nav-hamburger span{width:22px;height:2px;background:#fff;border-radius:2px}

  .story-hero{
    min-height:100vh;
    display:grid;
    grid-template-columns:1fr 1fr;
    position:relative;
    overflow:hidden;
  }
  @media(max-width:768px){
    .story-hero{grid-template-columns:1fr}
  }

  .story-left{
    padding:140px 60px 80px 80px;
    display:flex;flex-direction:column;justify-content:center;
    position:relative;z-index:1;
  }
  @media(max-width:768px){
    .story-left{padding:120px 24px 48px}
  }

  .story-label{
    font-size:.7rem;font-weight:700;letter-spacing:.18em;
    text-transform:uppercase;color:var(--pink);
    margin-bottom:20px;display:flex;align-items:center;gap:8px;
  }
  .story-label::before{content:none}

  .story-headline{
    font-family:'Playfair Display',serif;
    font-size:clamp(1.8rem,3.5vw,2.8rem);
    font-weight:700;line-height:1.2;
    margin-bottom:32px;color:var(--text);
  }
  .story-headline em{font-style:italic;color:var(--pink2)}

  .story-text{
    display:flex;flex-direction:column;gap:18px;
    font-size:1rem;color:var(--muted);line-height:1.75;
    max-width:100%;
  }
  .story-text p{transition:color .2s}
  .story-text .highlight{
    color:var(--text);font-weight:500;
    border-left:2px solid var(--pink);
    padding-left:16px;margin-left:-18px;
  }
  .story-text .big{
    font-family:'Playfair Display',serif;
    font-size:1.15rem;font-style:italic;
    color:var(--text);
  }

  .founder-block{
    display:flex;align-items:center;gap:14px;
    margin-top:40px;padding-top:32px;
    border-top:1px solid var(--border);
  }
  .founder-name{font-family:'Syne',sans-serif;font-size:.95rem;font-weight:700;color:var(--text)}
  .founder-title{font-size:.8rem;color:var(--muted);margin-top:2px}

  .story-right{
    position:relative;overflow:hidden;
    display:flex;align-items:center;justify-content:center;
  }
  @media(max-width:768px){
    .story-right{min-height:320px;order:-1}
  }
  .story-right::before{
    content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse 70% 70% at 50% 50%,rgba(249,95,133,0.12),transparent);
    z-index:1;pointer-events:none;
  }
  .story-photo-wrap{
    position:relative;z-index:2;
    width:100%;height:100%;
    display:flex;align-items:stretch;
  }
  .story-photo-wrap img{
    width:100%;height:100%;
    object-fit:cover;object-position:top center;
    display:block;
  }
  .story-photo-wrap::before{
    content:'';position:absolute;left:0;top:0;bottom:0;width:120px;
    background:linear-gradient(to right,var(--bg),transparent);
    z-index:3;
  }

  .faq-section{
    padding:100px 80px;
    max-width:none;margin:0 auto;width:100%;
  }
  @media(max-width:768px){
    .faq-section{padding:72px 24px}
  }
  .faq-label{
    font-size:.7rem;font-weight:700;letter-spacing:.18em;
    text-transform:uppercase;color:var(--pink);
    margin-bottom:16px;display:flex;align-items:center;gap:8px;
  }
  .faq-label::before{content:none}
  .faq-title{
    font-family:'Syne',sans-serif;font-size:clamp(1.6rem,3vw,2.4rem);
    font-weight:800;margin-bottom:56px;color:var(--text);
  }

  .faq-list{display:flex;flex-direction:column;gap:2px}
  .faq-item{
    border-top:1px solid var(--border);
    padding:22px 0;cursor:pointer;
    transition:all .2s;
  }
  .faq-item:last-child{border-bottom:1px solid var(--border)}
  .faq-q{
    display:flex;align-items:center;justify-content:space-between;gap:16px;
  }
  .faq-q-text{
    font-family:'Syne',sans-serif;font-size:1rem;font-weight:700;
    color:var(--text);line-height:1.35;
    transition:color .2s;
  }
  .faq-item:hover .faq-q-text{color:var(--pink2)}
  .faq-icon{
    width:28px;height:28px;border-radius:50%;
    border:1.5px solid var(--border);
    display:flex;align-items:center;justify-content:center;
    font-size:.9rem;color:var(--muted);flex-shrink:0;
    transition:all .2s;
  }
  .faq-item.open .faq-icon{
    background:var(--pink);border-color:var(--pink);color:#fff;transform:rotate(45deg);
  }
  .faq-a{
    max-height:0;overflow:hidden;
    transition:max-height .35s cubic-bezier(0.4,0,0.2,1),padding .2s;
    font-size:.93rem;color:var(--muted);line-height:1.75;
  }
  .faq-item.open .faq-a{
    max-height:300px;padding-top:14px;
  }
  .faq-a a{color:var(--pink2);text-decoration:none}

  .cta-strip{
    margin:0 auto 100px;max-width:900px;padding:0 80px;
  }
  @media(max-width:768px){.cta-strip{padding:0 24px}}
  .cta-inner{
    background:linear-gradient(135deg,rgba(249,95,133,0.12),rgba(249,95,133,0.04));
    border:1px solid var(--border);border-radius:20px;
    padding:48px 48px;display:flex;
    align-items:center;justify-content:space-between;
    flex-wrap:wrap;gap:24px;
  }
  .cta-text h3{
    font-family:'Syne',sans-serif;font-size:1.5rem;font-weight:800;
    margin-bottom:8px;
  }
  .cta-text p{color:var(--muted);font-size:.93rem}
  .cta-btn{
    padding:.85rem 2rem;border-radius:99px;border:none;
    background:linear-gradient(135deg,var(--pink),#e83d66);
    color:#fff;font-family:'Syne',sans-serif;font-size:.9rem;font-weight:700;
    cursor:pointer;white-space:nowrap;
    box-shadow:0 4px 20px rgba(249,95,133,0.3);
    transition:all .2s;text-decoration:none;display:inline-block;
  }
  .cta-btn:hover{transform:translateY(-2px)}

  @media(max-width:900px){
    nav{padding:1rem 1.4rem}
    .nav-links{display:none;position:absolute;left:0;right:0;top:100%;padding:1rem 1.4rem;background:rgba(5,5,10,0.96);border-bottom:1px solid var(--border);flex-direction:column;gap:0.9rem}
    .nav-links.nav-open{display:flex}
    .nav-hamburger{display:flex}
  }
`
