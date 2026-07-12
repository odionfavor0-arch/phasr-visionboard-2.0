import { useEffect } from 'react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const SECTIONS = [
  {
    title: 'What we collect',
    body: `We collect the information you provide when you create an account (name, email address), and the data you create inside PHASR: your vision board, phase goals, daily check-ins, and journal entries.

We also collect standard analytics data (pages visited, feature usage, device type) to improve the product. We do not sell this data. We do not use it to build advertising profiles.`,
  },
  {
    title: 'How we use your data',
    body: `Your data is used to:
— Operate your account and sync your progress
— Power Sage's coaching responses (Sage reads your board and journal only when you ask her to respond)
— Send product updates and announcements you've opted into
— Improve PHASR's features based on aggregate, anonymized usage patterns

We do not use your journal entries, vision board, or personal context to train AI models. We do not sell your data to third parties.`,
  },
  {
    title: 'Sage and your personal content',
    body: `Sage reads your journal entries only when you explicitly ask her to respond. This processing happens to generate your coaching response — it is not stored separately, indexed, or used to train models. Your journal is private. Sage's access to it is purposeful and bounded.`,
  },
  {
    title: 'Data storage and security',
    body: `Your data is stored securely via Supabase. We use industry-standard encryption in transit (HTTPS/TLS) and at rest. Access to user data is restricted to authorized personnel only and is logged.

We retain your data as long as your account is active. If you delete your account, your data is permanently deleted within 30 days.`,
  },
  {
    title: 'Your rights',
    body: `You have the right to:
— Access all data we hold about you
— Export your data in a portable format
— Correct inaccurate data
— Delete your account and all associated data
— Opt out of non-essential communications

To exercise any of these rights, email privacy@myphasr.com. We respond within 5 business days.`,
  },
  {
    title: 'Cookies',
    body: `We use essential cookies for authentication and session management. We use analytics cookies (first-party only) to understand feature usage. We do not use third-party advertising cookies. You can disable cookies in your browser, but essential features (login, sync) will not function.`,
  },
  {
    title: 'Third-party services',
    body: `PHASR uses the following services that may process your data:
— Supabase (authentication and database)
— Groq (AI model for Sage coaching responses)
— Pinecone (vector search for Sage's knowledge retrieval)
— Vercel (hosting)

Each of these services has their own privacy policies and data processing agreements. We select providers that meet strong privacy standards.`,
  },
  {
    title: 'Changes to this policy',
    body: `If we make material changes to how we handle your data, we will notify you by email and update the date below. Continued use of PHASR after the effective date of changes constitutes acceptance.`,
  },
  {
    title: 'Contact',
    body: `Privacy questions or requests: privacy@myphasr.com
General contact: hello@myphasr.com
Effective date: June 2026`,
  },
]

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
  margin: 0;
}
.legal-body {
  padding: 60px 0 100px;
}
.legal-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(240,96,144,0.08);
}
.legal-section:last-child {
  border-bottom: none;
}
.legal-section-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.01em;
  margin: 0 0 16px;
}
.legal-section-body {
  font-size: 0.875rem;
  color: #71717a;
  line-height: 1.8;
  white-space: pre-line;
}
@media (max-width: 600px) { .legal-hero { padding: 80px 0 36px; } }
`

export default function PrivacyPage() {
  useEffect(() => { document.title = 'Privacy Policy — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="legal-hero">
        <div className="mkt-container-narrow">
          <span className="legal-label">Legal</span>
          <h1 className="legal-h1">Privacy Policy</h1>
        </div>
      </section>

      <section className="legal-body">
        <div className="mkt-container-narrow">
          {SECTIONS.map(({ title, body }) => (
            <div key={title} className="legal-section">
              <h2 className="legal-section-title">{title}</h2>
              <p className="legal-section-body">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </MarketingLayout>
  )
}
