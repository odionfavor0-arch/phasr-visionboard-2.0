import { useEffect } from 'react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const SECTIONS = [
  {
    title: 'What we collect',
    content: [
      'We collect the information you provide when you create an account (name, email address), and the data you create inside PHASR: your vision board, phase goals, daily check-ins, and journal entries.',
      'We also collect standard analytics data (pages visited, feature usage, device type) to improve the product. We do not sell this data. We do not use it to build advertising profiles.',
    ],
  },
  {
    title: 'How we use your data',
    content: [
      'Your data is used to:',
      { list: [
        'Operate your account and sync your progress',
        "Power Sage's coaching responses (Sage reads your board and journal only when you ask her to respond)",
        "Send product updates and announcements you've opted into",
        "Improve PHASR's features based on aggregate, anonymized usage patterns",
      ] },
      'We do not use your journal entries, vision board, or personal context to train AI models. We do not sell your data to third parties.',
    ],
  },
  {
    title: 'Sage and your personal content',
    content: [
      "Sage reads your journal entries only when you explicitly ask her to respond. This processing happens to generate your coaching response — it is not stored separately, indexed, or used to train models. Your journal is private. Sage's access to it is purposeful and bounded.",
    ],
  },
  {
    title: 'Data storage and security',
    content: [
      'Your data is stored securely via Supabase. We use industry-standard encryption in transit (HTTPS/TLS) and at rest. Access to user data is restricted to authorized personnel only and is logged.',
      'We retain your data as long as your account is active. If you delete your account, your data is permanently deleted within 30 days.',
    ],
  },
  {
    title: 'Your rights',
    content: [
      'You have the right to:',
      { list: [
        'Access all data we hold about you',
        'Export your data in a portable format',
        'Correct inaccurate data',
        'Delete your account and all associated data',
        'Opt out of non-essential communications',
      ] },
      'To exercise any of these rights, email privacy@myphasr.com. We respond within 5 business days.',
    ],
  },
  {
    title: 'Cookies',
    content: [
      'We use essential cookies for authentication and session management. We use analytics cookies (first-party only) to understand feature usage. We do not use third-party advertising cookies. You can disable cookies in your browser, but essential features (login, sync) will not function.',
    ],
  },
  {
    title: 'Third-party services',
    content: [
      'PHASR uses the following services that may process your data:',
      { list: [
        'Supabase (authentication and database)',
        'Groq (AI model for Sage coaching responses)',
        "Pinecone (vector search for Sage's knowledge retrieval)",
        'Vercel (hosting)',
      ] },
      'Each of these services has their own privacy policies and data processing agreements. We select providers that meet strong privacy standards.',
    ],
  },
  {
    title: 'Changes to this policy',
    content: [
      'If we make material changes to how we handle your data, we will notify you by email and update the date below. Continued use of PHASR after the effective date of changes constitutes acceptance.',
    ],
  },
  {
    title: 'Contact',
    content: [
      { contact: [
        { label: 'Privacy questions or requests', email: 'privacy@myphasr.com' },
        { label: 'General contact', email: 'hello@myphasr.com' },
      ] },
    ],
  },
]

const EFFECTIVE_DATE = 'June 2026'

const STYLES = `
.legal-hero {
  padding: 32px 0 48px;
  border-bottom: 1px solid rgba(240,96,144,0.12);
}
.legal-label {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 16px;
}
.legal-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.02em;
  margin: 0 0 10px;
  text-wrap: balance;
}
.legal-updated {
  font-size: 0.85rem;
  color: #b08090;
  margin: 0;
}
.legal-body { padding: 64px 0 100px; }
.legal-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 64px;
  align-items: start;
  max-width: 900px;
  margin: 0 auto;
}
.legal-toc {
  position: sticky;
  top: 100px;
}
.legal-toc-label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #b08090;
  margin: 0 0 14px;
}
.legal-toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.legal-toc-list a {
  font-size: 0.85rem;
  color: #71717a;
  text-decoration: none;
  line-height: 1.4;
  transition: color 0.15s;
}
.legal-toc-list a:hover { color: #c2185b; }
.legal-sections { display: flex; flex-direction: column; }
.legal-section {
  display: grid;
  grid-template-columns: 36px 1fr;
  gap: 20px;
  padding: 36px 0;
  border-bottom: 1px solid rgba(240,96,144,0.08);
  scroll-margin-top: 100px;
}
.legal-section:first-child { padding-top: 0; }
.legal-section:last-child { border-bottom: none; padding-bottom: 0; }
.legal-section-num {
  font-family: 'Fraunces', serif;
  font-size: 0.9rem;
  font-weight: 700;
  color: #f06090;
}
.legal-section-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.01em;
  margin: 0 0 14px;
}
.legal-section-body {
  font-size: 0.9rem;
  color: #71717a;
  line-height: 1.75;
  margin: 0 0 14px;
}
.legal-section-body:last-child { margin-bottom: 0; }
.legal-list {
  margin: 0 0 14px;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.legal-list:last-child { margin-bottom: 0; }
.legal-list li {
  font-size: 0.9rem;
  color: #71717a;
  line-height: 1.65;
}
.legal-list li::marker { color: #f06090; }
.legal-contact { display: flex; flex-direction: column; gap: 6px; }
.legal-contact-row { font-size: 0.9rem; color: #71717a; }
.legal-contact-row a { color: #c2185b; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(194,24,91,0.3); }
.legal-contact-row a:hover { border-color: #c2185b; }
@media (max-width: 760px) {
  .legal-layout { grid-template-columns: 1fr; gap: 32px; }
  .legal-toc { position: static; }
}
@media (max-width: 600px) { .legal-hero { padding: 80px 0 36px; } }
`

function SectionBody({ content }) {
  return content.map((block, i) => {
    if (typeof block === 'string') {
      return <p key={i} className="legal-section-body">{block}</p>
    }
    if (block.list) {
      return (
        <ul key={i} className="legal-list">
          {block.list.map((item) => <li key={item}>{item}</li>)}
        </ul>
      )
    }
    if (block.contact) {
      return (
        <div key={i} className="legal-contact">
          {block.contact.map(({ label, email }) => (
            <p key={email} className="legal-contact-row">{label}: <a href={`mailto:${email}`}>{email}</a></p>
          ))}
        </div>
      )
    }
    return null
  })
}

export default function PrivacyPage() {
  useEffect(() => { document.title = 'Privacy Policy — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="legal-hero">
        <div className="mkt-container-narrow">
          <span className="legal-label">Legal</span>
          <h1 className="legal-h1">Privacy Policy</h1>
          <p className="legal-updated">Effective {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <section className="legal-body">
        <div className="mkt-container legal-layout">
          <nav className="legal-toc" aria-label="Table of contents">
            <p className="legal-toc-label">On this page</p>
            <ol className="legal-toc-list">
              {SECTIONS.map(({ title }, i) => (
                <li key={title}><a href={`#section-${i}`}>{title}</a></li>
              ))}
            </ol>
          </nav>

          <div className="legal-sections">
            {SECTIONS.map(({ title, content }, i) => (
              <div key={title} id={`section-${i}`} className="legal-section">
                <div className="legal-section-num">{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <h2 className="legal-section-title">{title}</h2>
                  <SectionBody content={content} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
