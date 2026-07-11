import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'

const FAQS = [
  {
    group: 'Getting started',
    items: [
      { q: 'Is PHASR free to use?', a: 'Yes. There\'s a free tier with one active phase, daily streaks, basic vision board, free-write journal, and 3 Sage sessions per month. Full features are available on the paid plan.' },
      { q: 'Do I need a credit card to join the waitlist?', a: 'No. Joining the waitlist is completely free and requires no payment information.' },
      { q: 'When does PHASR launch?', a: 'We\'re in pre-launch. Waitlist members get early access and the founding member pricing locked in — the lowest price we\'ll offer.' },
    ]
  },
  {
    group: 'Sage AI coach',
    items: [
      { q: 'Is Sage just a generic AI chatbot?', a: 'No. Sage reads your vision board, your streaks, and your journal to give guidance that\'s specific to you and where you are in your phase. She doesn\'t start from zero every session.' },
      { q: 'What does Sage do with my journal entries?', a: 'Sage reads your entries only when you ask her to respond. Your journal is never used to train models, never shared with third parties, and never visible to anyone else.' },
      { q: 'Can I use Sage without filling in a full vision board?', a: 'Yes. Sage works at whatever level of depth you bring. The more context you give her (board, streaks, journal), the more specific her guidance becomes — but she\'s useful from day one.' },
    ]
  },
  {
    group: 'Streaks & accountability',
    items: [
      { q: 'What happens if I miss a day?', a: 'Your streak resets — but PHASR is designed to make you want to come back, not feel punished. Missing a day doesn\'t erase your history. Sage will check in warmly, not guilt you.' },
      { q: 'What happens when my phase ends?', a: 'Sage puts together your Phase Review — a Wrapped-style recap of your wins, your patterns, and your lessons — then helps you set the next phase, so you never start from zero.' },
      { q: 'What are ranks and unlocks?', a: 'As your streak grows, features and milestones unlock — not as a punishment system, but as a reward for consistency.' },
    ]
  },
  {
    group: 'Privacy & data',
    items: [
      { q: 'Is my journal private?', a: 'Yes. Journal entries are private to you. Sage can read them only when you explicitly ask her to respond. We don\'t read, sell, or use your journal for advertising.' },
      { q: 'What data does PHASR store?', a: 'We store your account info, vision board, check-in records, and journal entries. Full details in our privacy policy.' },
      { q: 'Can I export or delete my data?', a: 'Yes. You can request a full data export or account deletion at any time by contacting support. We don\'t hold data hostage.' },
    ]
  },
]

const STYLES = `
.faq-hero {
  padding: 32px 0 60px;
  text-align: center;
}
.faq-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.faq-h1 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.faq-h1 em { font-style: italic; color: #c2185b; }
.faq-sub {
  font-size: 1rem;
  color: #71717a;
  max-width: 440px;
  margin: 0 auto;
  line-height: 1.65;
}
.faq-body {
  padding: 60px 0 100px;
}
.faq-group {
  margin-bottom: 56px;
}
.faq-group-title {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(240,96,144,0.15);
}
.faq-item {
  border-bottom: 1px solid rgba(240,96,144,0.1);
}
.faq-question {
  width: 100%;
  background: none;
  border: none;
  text-align: left;
  padding: 20px 0;
  font-family: 'Manrope', sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: #1a0a10;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  letter-spacing: -0.01em;
  line-height: 1.4;
}
.faq-question:hover { color: #c2185b; }
.faq-chevron {
  flex-shrink: 0;
  color: #c2185b;
  transition: transform 0.2s;
  font-size: 1.1rem;
}
.faq-chevron.open { transform: rotate(180deg); }
.faq-answer {
  font-size: 0.9rem;
  color: #71717a;
  line-height: 1.7;
  padding: 0 0 20px;
  max-width: 640px;
}
.faq-cta-strip {
  text-align: center;
  padding: 60px 0;
  border-top: 1px solid rgba(240,96,144,0.1);
}
.faq-cta-strip p {
  font-size: 0.95rem;
  color: #71717a;
  margin: 0 0 20px;
}
.mkt-btn-primary {
  display: inline-flex;
  align-items: center;
  padding: 14px 32px;
  background: #c2185b;
  color: #fff;
  border-radius: 100px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s, transform 0.1s;
}
.mkt-btn-primary:hover { background: #a8124e; transform: translateY(-1px); }
@media (max-width: 600px) { .faq-hero { padding: 80px 0 40px; } }
`

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="faq-item">
      <button className="faq-question" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        {q}
        <span className={`faq-chevron${open ? ' open' : ''}`}>▾</span>
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  )
}

export default function FAQPage() {
  useEffect(() => { document.title = 'FAQ — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="faq-hero">
        <div className="mkt-container">
          <span className="faq-label">Frequently asked</span>
          <h1 className="faq-h1">Questions worth<br /><em>answering honestly.</em></h1>
          <p className="faq-sub">Everything you want to know before you commit — including the stuff most apps hide in the fine print.</p>
        </div>
      </section>

      <section className="faq-body">
        <div className="mkt-container-narrow">
          {FAQS.map(({ group, items }) => (
            <div key={group} className="faq-group">
              <p className="faq-group-title">{group}</p>
              {items.map(({ q, a }) => <FAQItem key={q} q={q} a={a} />)}
            </div>
          ))}
        </div>
      </section>

      <section className="faq-cta-strip">
        <div className="mkt-container">
          <p>Still have a question? We're easy to reach.</p>
          <Link to="/contact" className="mkt-btn-primary">Contact us</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
