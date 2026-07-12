import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MarketingLayout from '../components/marketing/MarketingLayout'

const STYLES = `
.contact-hero {
  padding: 32px 0 60px;
}
.contact-label {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 20px;
}
.contact-h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(2.2rem, 4vw, 3.2rem);
  font-weight: 700;
  color: #1a0a10;
  line-height: 1.2;
  letter-spacing: -0.02em;
  margin: 0 0 16px;
}
.contact-h1 em { font-style: italic; color: #c2185b; }
.contact-sub {
  font-size: 1rem;
  color: #71717a;
  max-width: 480px;
  line-height: 1.65;
}
.contact-body {
  padding: 60px 0 100px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: start;
}
.contact-form-wrap {}
.contact-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.contact-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.contact-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #3d1020;
  letter-spacing: 0.01em;
}
.contact-input,
.contact-textarea {
  padding: 12px 16px;
  border: 1.5px solid rgba(240,96,144,0.2);
  border-radius: 10px;
  font-family: 'General Sans', sans-serif;
  font-size: 0.9rem;
  color: #1a0a10;
  background: #fff;
  transition: border-color 0.15s;
  outline: none;
}
.contact-input:focus,
.contact-textarea:focus {
  border-color: #c2185b;
}
.contact-textarea {
  resize: vertical;
  min-height: 140px;
}
.contact-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 14px 32px;
  background: #c2185b;
  color: #fff;
  border: none;
  border-radius: 100px;
  font-family: 'General Sans', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
  letter-spacing: -0.01em;
}
.contact-submit:hover { background: #a8124e; transform: translateY(-1px); }
.contact-submit:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.contact-success {
  padding: 20px 24px;
  background: rgba(194,24,91,0.05);
  border: 1px solid rgba(194,24,91,0.2);
  border-radius: 12px;
  font-size: 0.9rem;
  color: #c2185b;
  font-weight: 600;
}
.contact-info {}
.contact-info-item {
  margin-bottom: 32px;
}
.contact-info-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #c2185b;
  margin-bottom: 6px;
}
.contact-info-value {
  font-size: 0.9rem;
  color: #71717a;
  line-height: 1.6;
}
.contact-info-value a {
  color: #c2185b;
  text-decoration: none;
  font-weight: 500;
}
.contact-info-value a:hover { text-decoration: underline; }

@media (max-width: 768px) {
  .contact-body { grid-template-columns: 1fr; gap: 40px; }
  .contact-hero { padding: 80px 0 40px; }
}
`

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  useEffect(() => { document.title = 'Contact — PHASR' }, [])

  function handleSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  return (
    <MarketingLayout>
      <style>{STYLES}</style>

      <section className="contact-hero">
        <div className="mkt-container">
          <span className="contact-label">Get in touch</span>
          <h1 className="contact-h1">We're easy<br />to <em>reach.</em></h1>
          <p className="contact-sub">Questions, feedback, press inquiries, or just want to say hi — send it our way.</p>
        </div>
      </section>

      <section>
        <div className="mkt-container">
          <div className="contact-body">
            <div className="contact-form-wrap">
              {sent ? (
                <p className="contact-success">Message received. We'll get back to you within 1–2 business days.</p>
              ) : (
                <form className="contact-form" onSubmit={handleSubmit}>
                  <div className="contact-field">
                    <label className="contact-label">Your name</label>
                    <input
                      type="text"
                      className="contact-input"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      required
                      placeholder="Amara"
                    />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label">Email address</label>
                    <input
                      type="email"
                      className="contact-input"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      required
                      placeholder="amara@email.com"
                    />
                  </div>
                  <div className="contact-field">
                    <label className="contact-label">Message</label>
                    <textarea
                      className="contact-textarea"
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      placeholder="What's on your mind?"
                    />
                  </div>
                  <button type="submit" className="contact-submit">Send message</button>
                </form>
              )}
            </div>

            <div className="contact-info">
              <div className="contact-info-item">
                <p className="contact-info-label">Email</p>
                <p className="contact-info-value">
                  <a href="mailto:hello@myphasr.com">hello@myphasr.com</a>
                </p>
              </div>
              <div className="contact-info-item">
                <p className="contact-info-label">Response time</p>
                <p className="contact-info-value">We reply within 1–2 business days. Founders read every message.</p>
              </div>
              <div className="contact-info-item">
                <p className="contact-info-label">Press & partnerships</p>
                <p className="contact-info-value">
                  <a href="mailto:press@myphasr.com">press@myphasr.com</a>
                </p>
              </div>
              <div className="contact-info-item">
                <p className="contact-info-label">Quick answers</p>
                <p className="contact-info-value">
                  Check our <Link to="/faq" style={{ color: '#c2185b', fontWeight: 500, textDecoration: 'none' }}>FAQ</Link> — most questions are already there.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
