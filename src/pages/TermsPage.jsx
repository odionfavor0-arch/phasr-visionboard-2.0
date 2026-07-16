import { useEffect } from 'react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const SECTIONS = [
  {
    title: 'Acceptance of terms',
    content: [
      'By creating a PHASR account or using the PHASR service, you agree to these Terms of Service. If you do not agree, do not use the service.',
    ],
  },
  {
    title: 'Use of the service',
    content: [
      'PHASR is a personal goal-tracking and accountability platform. You may use it for personal, non-commercial purposes. You agree not to:',
      { list: [
        'Use the service to harass, harm, or abuse others',
        'Attempt to reverse-engineer or exploit the platform',
        'Create multiple accounts to circumvent access restrictions',
        'Share your account credentials with others',
      ] },
    ],
  },
  {
    title: 'Your content',
    content: [
      'You own the content you create in PHASR — your vision board and journal entries. Your journal entries are private and never shared.',
    ],
  },
  {
    title: 'Payments and subscriptions',
    content: [
      'Paid plans are billed monthly or annually as selected. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial periods, but may make exceptions at our discretion.',
    ],
  },
  {
    title: 'Limitation of liability',
    content: [
      "PHASR is provided ‘as is.’ We don't guarantee that the service will be available 100% of the time or that AI coaching responses will be accurate or appropriate for your specific situation. Sage is a coaching tool, not a licensed therapist or medical provider. We are not liable for outcomes resulting from actions taken based on Sage's guidance.",
    ],
  },
  {
    title: 'Termination',
    content: [
      'We may suspend or terminate accounts that violate these terms. You may delete your account at any time. Upon termination, your data is deleted within 30 days as described in our Privacy Policy.',
    ],
  },
  {
    title: 'Changes to terms',
    content: [
      'We may update these terms. If we make material changes, we will notify you by email. Continued use after notification constitutes acceptance of updated terms.',
    ],
  },
  {
    title: 'Contact',
    content: [
      { contact: [
        { label: 'Legal inquiries', email: 'legal@myphasr.com' },
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

export default function TermsPage() {
  useEffect(() => { document.title = 'Terms of Service — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="legal-hero">
        <div className="mkt-container-narrow">
          <span className="legal-label">Legal</span>
          <h1 className="legal-h1">Terms of Service</h1>
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
