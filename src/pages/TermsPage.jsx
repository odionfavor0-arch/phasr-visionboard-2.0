import { useEffect } from 'react'
import MarketingLayout from '../components/marketing/MarketingLayout'

const SECTIONS = [
  {
    title: 'Acceptance of terms',
    body: 'By creating a PHASR account or using the PHASR service, you agree to these Terms of Service. If you do not agree, do not use the service.',
  },
  {
    title: 'Use of the service',
    body: `PHASR is a personal goal-tracking and accountability platform. You may use it for personal, non-commercial purposes. You agree not to:
— Use the service to harass, harm, or abuse others
— Attempt to reverse-engineer or exploit the platform
— Create multiple accounts to circumvent access restrictions
— Share your account credentials with others`,
  },
  {
    title: 'Your content',
    body: 'You own the content you create in PHASR — your vision board and journal entries. Your journal entries are private and never shared.',
  },
  {
    title: 'Payments and subscriptions',
    body: 'Paid plans are billed monthly or annually as selected. You may cancel at any time from your account settings. Cancellation takes effect at the end of the current billing period. We do not offer refunds for partial periods, but may make exceptions at our discretion.',
  },
  {
    title: 'Limitation of liability',
    body: "PHASR is provided 'as is.' We don't guarantee that the service will be available 100% of the time or that AI coaching responses will be accurate or appropriate for your specific situation. Sage is a coaching tool, not a licensed therapist or medical provider. We are not liable for outcomes resulting from actions taken based on Sage's guidance.",
  },
  {
    title: 'Termination',
    body: 'We may suspend or terminate accounts that violate these terms. You may delete your account at any time. Upon termination, your data is deleted within 30 days as described in our Privacy Policy.',
  },
  {
    title: 'Changes to terms',
    body: 'We may update these terms. If we make material changes, we will notify you by email. Continued use after notification constitutes acceptance of updated terms.',
  },
  {
    title: 'Contact',
    body: 'Legal inquiries: legal@myphasr.com\nEffective date: June 2026',
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
.legal-body { padding: 60px 0 100px; }
.legal-section {
  margin-bottom: 48px;
  padding-bottom: 48px;
  border-bottom: 1px solid rgba(240,96,144,0.08);
}
.legal-section:last-child { border-bottom: none; }
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

export default function TermsPage() {
  useEffect(() => { document.title = 'Terms of Service — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="legal-hero">
        <div className="mkt-container-narrow">
          <span className="legal-label">Legal</span>
          <h1 className="legal-h1">Terms of Service</h1>
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
