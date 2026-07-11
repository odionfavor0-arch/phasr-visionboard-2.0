import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'

const TIERS = [
  {
    tier: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to set your first phase and see if PHASR fits your life.',
    features: [
      '1 active phase',
      'Daily check-ins & streak tracking',
      'Basic vision board',
      'Free-write journal',
    ],
    cta: 'Join the waitlist',
    ghost: true,
  },
  {
    tier: 'Starter',
    price: '$6',
    suffix: '/mo',
    founding: true,
    desc: 'For women who want Sage in the mix without the full commitment yet.',
    features: [
      '3 active phases',
      '10 Sage coaching sessions/month',
      'Full vision board',
      'Weekly reflection',
    ],
    cta: 'Join the waitlist',
    ghost: true,
  },
  {
    tier: 'Founding Member',
    price: '$12',
    suffix: '/mo',
    founding: true,
    featured: true,
    badge: 'Most popular',
    desc: 'Full access to every feature, Sage, Phase Review, and priority support.',
    features: [
      'Unlimited phases & pillars',
      'Full Sage AI coaching',
      'Journal with Sage responses',
      'Weekly pulse & reflection',
      'Full Phase Review',
      'Priority support',
    ],
    cta: 'Join the waitlist',
  },
  {
    tier: 'Annual',
    price: '$96',
    suffix: '/yr',
    founding: true,
    desc: 'Everything in Founding Member, paid annually — the lowest price we’ll ever offer.',
    features: [
      'Everything in Founding Member',
      'Best price, guaranteed',
      'Annual phase review with Sage',
      'Early access to new features',
    ],
    cta: 'Join the waitlist',
    ghost: true,
  },
]

const STYLES = `
.pricing-hero {
  padding: 32px 0 80px;
  text-align: center;
}
.pricing-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.pricing-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.4rem, 5vw, 3.6rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.15;
  letter-spacing: -0.02em;
  margin: 0 0 20px;
}
.pricing-h1 em { font-style: italic; color: #c2185b; }
.pricing-sub {
  font-size: 1.05rem;
  color: #71717a;
  max-width: 480px;
  margin: 0 auto 60px;
  line-height: 1.65;
}
.pricing-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 32px;
}
.pricing-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px) saturate(1.3);
  -webkit-backdrop-filter: blur(12px) saturate(1.3);
  border: 2px solid rgba(61, 16, 32, 0.08);
  border-radius: 24px;
  padding: 36px 28px;
  text-align: left;
  position: relative;
  box-shadow: 0 4px 20px rgba(61, 16, 32, 0.06);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}
.pricing-card:hover,
.pricing-card.selected {
  transform: translateY(-4px);
  border-color: #f06090;
  box-shadow: 0 16px 40px rgba(240, 96, 144, 0.16);
}
.pricing-card.featured {
  border-color: rgba(194, 24, 91, 0.28);
}
.pricing-card.featured:hover,
.pricing-card.featured.selected {
  border-color: #f06090;
}
.pricing-badge {
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: #c2185b;
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 4px 14px;
  border-radius: 100px;
  white-space: nowrap;
}
.pricing-tier {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 8px;
}
.pricing-price {
  font-family: 'Fraunces', serif;
  font-size: 2.4rem;
  font-weight: 700;
  color: #1a0a10;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 4px;
}
.pricing-price span {
  font-size: 1rem;
  font-weight: 500;
  color: #71717a;
  font-family: 'Manrope', sans-serif;
}
.pricing-period {
  font-size: 0.8rem;
  color: #b08090;
  margin-bottom: 10px;
}
.pricing-founding-tag {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  color: #c2185b;
  background: rgba(240, 96, 144, 0.1);
  border-radius: 100px;
  padding: 4px 10px;
  margin-bottom: 20px;
}
.pricing-desc {
  font-size: 0.85rem;
  color: #71717a;
  line-height: 1.6;
  margin-bottom: 24px;
  min-height: 52px;
}
.pricing-features {
  list-style: none;
  margin: 0 0 28px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pricing-features li {
  font-size: 0.85rem;
  color: #3d1020;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.pricing-features li::before {
  content: '✓';
  color: #c2185b;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}
.pricing-card-cta {
  display: block;
  text-align: center;
  padding: 13px 20px;
  background: #c2185b;
  color: #fff;
  border-radius: 100px;
  font-family: 'Manrope', sans-serif;
  font-size: 0.875rem;
  font-weight: 700;
  text-decoration: none;
  transition: background 0.15s;
}
.pricing-card-cta:hover { background: #a8124e; }
.pricing-card-cta.ghost {
  background: transparent;
  border: 1.5px solid rgba(194,24,91,0.3);
  color: #c2185b;
}
.pricing-card-cta.ghost:hover {
  border-color: #c2185b;
  background: rgba(194,24,91,0.04);
}
.pricing-note {
  text-align: center;
  font-size: 0.85rem;
  color: #b08090;
  padding-bottom: 40px;
}
.pricing-faq-strip {
  padding: 60px 0;
  border-top: 1px solid rgba(240,96,144,0.1);
  text-align: center;
}
.pricing-faq-strip p {
  font-size: 0.95rem;
  color: #71717a;
  margin: 0 0 16px;
}
.pricing-faq-strip a {
  color: #c2185b;
  font-weight: 600;
  text-decoration: none;
}
.pricing-faq-strip a:hover { text-decoration: underline; }

@media (max-width: 1000px) { .pricing-cards { grid-template-columns: 1fr 1fr; max-width: 640px; margin-left: auto; margin-right: auto; } }
@media (max-width: 640px) { .pricing-cards { grid-template-columns: 1fr; max-width: 420px; } .pricing-hero { padding: 80px 0 60px; } }
`

export default function PricingPage() {
  const [selected, setSelected] = useState(null)

  useEffect(() => { document.title = 'Pricing — PHASR' }, [])

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="pricing-hero">
        <div className="mkt-container">
          <span className="pricing-label">Founding member pricing</span>
          <h1 className="pricing-h1">Simple, honest<br /><em>pricing.</em></h1>
          <p className="pricing-sub">
            No tricks. No confusing tiers. Join now and your rate locks in for good — this is the cheapest PHASR will ever be.
          </p>

          <div className="pricing-cards">
            {TIERS.map((t, i) => (
              <div
                key={t.tier}
                className={`pricing-card${t.featured ? ' featured' : ''}${selected === i ? ' selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                {t.badge && <span className="pricing-badge">{t.badge}</span>}
                <p className="pricing-tier">{t.tier}</p>
                <p className="pricing-price">{t.price}{t.suffix && <span>{t.suffix}</span>}</p>
                <p className="pricing-period">{t.period || 'per member'}</p>
                {t.founding && <span className="pricing-founding-tag">Founding pricing — locked in when you join</span>}
                <p className="pricing-desc">{t.desc}</p>
                <ul className="pricing-features">
                  {t.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <Link to="/login" className={`pricing-card-cta${t.ghost ? ' ghost' : ''}`} onClick={(e) => e.stopPropagation()}>
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>

          <p className="pricing-note">No credit card required to join the waitlist. Cancel anytime after launch.</p>
        </div>
      </section>

      <section className="pricing-faq-strip">
        <div className="mkt-container-narrow">
          <p>Have questions about pricing, features, or what happens if you miss a few days?</p>
          <Link to="/faq">Read the FAQ →</Link>
        </div>
      </section>
    </MarketingLayout>
  )
}
